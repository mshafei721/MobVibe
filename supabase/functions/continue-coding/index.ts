import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { ContinueCodingSchema } from '../_shared/validation.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { handleCorsPreflight } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCorsPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await validateAuth(req)

    const body = await req.json()
    const { sessionId, prompt } = ContinueCodingSchema.parse(body)

    const { data: session, error: sessionError } = await supabase
      .from('coding_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return errorResponse('Session not found or access denied', 404)
    }

    if (session.status === 'expired') {
      return errorResponse('Session has expired', 410)
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (expiresAt < now) {
      await supabase
        .from('coding_sessions')
        .update({ status: 'expired' })
        .eq('id', sessionId)

      return errorResponse('Session has expired', 410)
    }

    if (session.status === 'completed') {
      return errorResponse('Session already completed', 400)
    }

    if (session.status === 'failed') {
      return errorResponse('Cannot continue failed session', 400)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    const tierPriority: Record<string, number> = {
      free: 0,
      starter: 5,
      pro: 10,
      enterprise: 10
    }

    const priority = tierPriority[profile?.tier || 'free'] || 0

    const { data: job, error: jobError } = await supabase
      .from('coding_jobs')
      .insert({
        session_id: sessionId,
        prompt: prompt,
        status: 'pending',
        priority: priority
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return errorResponse('Failed to create job', 500)
    }

    return successResponse({
      jobId: job.id,
      sessionId: sessionId,
      status: 'pending'
    }, 201)

  } catch (error) {
    console.error('Error:', error)
    if (error.name === 'ZodError') {
      return errorResponse(error.issues[0].message, 400)
    }
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
