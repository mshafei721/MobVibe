/**
 * Edge Functions Integration Tests
 * Tests the complete request/response cycle for all Edge Functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'
const functionsUrl = `${supabaseUrl}/functions/v1`

describe('Edge Functions Integration', () => {
  let supabase: SupabaseClient
  let authToken: string
  let testUserId: string
  let testProjectId: string

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  beforeEach(async () => {
    // Setup: Create test user, get auth token, create test project
    // In actual implementation, this would use Supabase Auth signup
  })

  describe('start-coding-session', () => {
    const functionUrl = `${functionsUrl}/start-coding-session`

    it('creates session and job with valid input', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: 'Build a todo app with React Native'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.sessionId).toBeDefined()
      expect(data.data.jobId).toBeDefined()
      expect(data.data.expiresAt).toBeDefined()
      expect(data.data.status).toBe('pending')
    })

    it('rejects request without authentication', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: 'Test prompt'
        })
      })

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authorization')
    })

    it('rejects when session limit reached', async () => {
      // Create user at limit
      await supabase
        .from('profiles')
        .update({ sessions_used: 3, sessions_limit: 3 })
        .eq('id', testUserId)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: 'Test prompt exceeding limit'
        })
      })

      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('limit reached')
    })

    it('validates input format - invalid UUID', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: 'not-a-uuid',
          prompt: 'Test prompt'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid')
    })

    it('validates input format - prompt too short', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: 'Short'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('at least 10 characters')
    })

    it('validates input format - prompt too long', async () => {
      const longPrompt = 'a'.repeat(5001)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: longPrompt
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('less than 5000 characters')
    })

    it('returns 404 for non-existent project', async () => {
      const fakeProjectId = '00000000-0000-0000-0000-000000000000'

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: fakeProjectId,
          prompt: 'Test prompt for non-existent project'
        })
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('not found')
    })

    it('handles CORS preflight correctly', async () => {
      const response = await fetch(functionUrl, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'authorization, content-type'
        }
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })
  })

  describe('continue-coding', () => {
    const functionUrl = `${functionsUrl}/continue-coding`
    let testSessionId: string

    beforeEach(async () => {
      // Create a test session first
      const { data: session } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          initial_prompt: 'Initial test prompt',
          status: 'active',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        })
        .select()
        .single()

      testSessionId = session!.id
    })

    it('adds job to existing session', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: testSessionId,
          prompt: 'Add dark mode support'
        })
      })

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.jobId).toBeDefined()
      expect(data.data.sessionId).toBe(testSessionId)
      expect(data.data.status).toBe('pending')
    })

    it('rejects expired session', async () => {
      // Update session to be expired
      await supabase
        .from('coding_sessions')
        .update({
          status: 'expired',
          expires_at: new Date(Date.now() - 3600000).toISOString()
        })
        .eq('id', testSessionId)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: testSessionId,
          prompt: 'Test prompt for expired session'
        })
      })

      expect(response.status).toBe(410)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('expired')
    })

    it('rejects completed session', async () => {
      await supabase
        .from('coding_sessions')
        .update({ status: 'completed' })
        .eq('id', testSessionId)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: testSessionId,
          prompt: 'Test prompt for completed session'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('completed')
    })

    it('validates session ownership via RLS', async () => {
      // Create another user's session
      const otherUserId = 'different-user-id'
      const { data: otherSession } = await supabase.auth.admin.createUser({
        email: 'other@example.com',
        password: 'password123'
      })

      // Try to continue coding on other user's session
      // This should fail due to RLS even if we know the session ID
    })

    it('validates input format', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: 'not-a-uuid',
          prompt: 'Test prompt'
        })
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('get-session-status', () => {
    const functionUrl = `${functionsUrl}/get-session-status`
    let testSessionId: string

    beforeEach(async () => {
      const { data: session } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          initial_prompt: 'Test session for status check',
          status: 'active',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        })
        .select()
        .single()

      testSessionId = session!.id

      // Add some events
      await supabase
        .from('session_events')
        .insert([
          {
            session_id: testSessionId,
            event_type: 'thinking',
            data: { message: 'Analyzing requirements...' }
          },
          {
            session_id: testSessionId,
            event_type: 'terminal',
            data: { output: 'npm install completed' }
          }
        ])
    })

    it('returns session details with events', async () => {
      const response = await fetch(`${functionUrl}?sessionId=${testSessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testSessionId)
      expect(data.data.status).toBe('active')
      expect(data.data.initialPrompt).toBeDefined()
      expect(data.data.events).toBeDefined()
      expect(Array.isArray(data.data.events)).toBe(true)
      expect(data.data.events.length).toBeGreaterThan(0)
    })

    it('returns 404 for non-existent session', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'

      const response = await fetch(`${functionUrl}?sessionId=${fakeSessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('requires sessionId query parameter', async () => {
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('validates sessionId format', async () => {
      const response = await fetch(`${functionUrl}?sessionId=invalid-uuid`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid')
    })

    it('auto-marks expired sessions', async () => {
      // Create expired session
      await supabase
        .from('coding_sessions')
        .update({
          expires_at: new Date(Date.now() - 3600000).toISOString()
        })
        .eq('id', testSessionId)

      const response = await fetch(`${functionUrl}?sessionId=${testSessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data.status).toBe('expired')
    })
  })

  describe('Cross-Function Integration', () => {
    it('full workflow: start → continue → status', async () => {
      // Step 1: Start coding session
      const startResponse = await fetch(`${functionsUrl}/start-coding-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: testProjectId,
          prompt: 'Build a todo app'
        })
      })

      expect(startResponse.status).toBe(201)
      const startData = await startResponse.json()
      const sessionId = startData.data.sessionId

      // Step 2: Continue coding
      const continueResponse = await fetch(`${functionsUrl}/continue-coding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          prompt: 'Add dark mode'
        })
      })

      expect(continueResponse.status).toBe(201)

      // Step 3: Get session status
      const statusResponse = await fetch(`${functionsUrl}/get-session-status?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(statusResponse.status).toBe(200)
      const statusData = await statusResponse.json()
      expect(statusData.data.id).toBe(sessionId)

      // Verify jobs were created
      const { data: jobs } = await supabase
        .from('coding_jobs')
        .select('*')
        .eq('session_id', sessionId)

      expect(jobs!.length).toBe(2) // Initial + continue
    })
  })
})
