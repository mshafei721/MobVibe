import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { handleCorsPreflight } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResponse = handleCorsPreflight(req)
  if (corsResponse) return corsResponse

  try {
    const { user, supabase } = await validateAuth(req)

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')

    if (!sessionId) {
      return errorResponse('sessionId query parameter is required', 400)
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return errorResponse('Invalid session ID format', 400)
    }

    const { data: session, error: sessionError } = await supabase
      .from('coding_sessions')
      .select(`
        *,
        session_events (
          id,
          event_type,
          data,
          created_at
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { foreignTable: 'session_events', ascending: false })
      .single()

    if (sessionError || !session) {
      return errorResponse('Session not found or access denied', 404)
    }

    const now = new Date()
    const expiresAt = new Date(session.expires_at)
    if (session.status !== 'expired' && expiresAt < now) {
      await supabase
        .from('coding_sessions')
        .update({ status: 'expired' })
        .eq('id', sessionId)

      session.status = 'expired'
    }

    return successResponse({
      id: session.id,
      projectId: session.project_id,
      status: session.status,
      initialPrompt: session.initial_prompt,
      expiresAt: session.expires_at,
      startedAt: session.started_at,
      completedAt: session.completed_at,
      errorMessage: session.error_message,
      metadata: session.metadata,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      events: session.session_events || []
    })

  } catch (error) {
    console.error('Error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})
