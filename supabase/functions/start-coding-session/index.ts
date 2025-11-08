import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { StartSessionSchema } from '../_shared/validation.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { handleCorsPreflight } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCorsPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await validateAuth(req)

    const body = await req.json()
    const { projectId, prompt } = StartSessionSchema.parse(body)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tier, sessions_used, sessions_limit')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return errorResponse('Profile not found', 404)
    }

    if (profile.sessions_used >= profile.sessions_limit) {
      return errorResponse('Session limit reached for your tier', 403)
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return errorResponse('Project not found or access denied', 404)
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const { data: session, error: sessionError } = await supabase
      .from('coding_sessions')
      .insert({
        user_id: user.id,
        project_id: projectId,
        initial_prompt: prompt,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return errorResponse('Failed to create session', 500)
    }

    const tierPriority: Record<string, number> = {
      free: 0,
      starter: 5,
      pro: 10,
      enterprise: 10
    }

    const priority = tierPriority[profile.tier] || 0

    const { data: job, error: jobError } = await supabase
      .from('coding_jobs')
      .insert({
        session_id: session.id,
        prompt: prompt,
        status: 'pending',
        priority: priority
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      await supabase
        .from('coding_sessions')
        .delete()
        .eq('id', session.id)
      return errorResponse('Failed to create job', 500)
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ sessions_used: profile.sessions_used + 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
    }

    return successResponse({
      sessionId: session.id,
      jobId: job.id,
      expiresAt: session.expires_at,
      status: session.status
    }, 201)

  } catch (error) {
    console.error('Error:', error)
    if (error.name === 'ZodError') {
      return errorResponse(error.issues[0].message, 400)
    }
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
