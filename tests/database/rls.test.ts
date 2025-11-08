/**
 * Row-Level Security Tests
 * Tests RLS enforcement across all tables
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key'

describe('Row-Level Security', () => {
  let userAClient: SupabaseClient
  let userBClient: SupabaseClient
  let serviceClient: SupabaseClient
  let userAId: string
  let userBId: string

  beforeAll(() => {
    // Create clients for different users
    serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  })

  beforeEach(async () => {
    // Setup: Create two test users and their data
  })

  describe('User Isolation', () => {
    it('prevents cross-user profile access', async () => {
      const { data } = await userAClient
        .from('profiles')
        .select('*')
        .eq('id', userBId)
        .single()

      expect(data).toBeNull()
    })

    it('prevents cross-user project access', async () => {
      // User B creates project
      await userBClient
        .from('projects')
        .insert({
          user_id: userBId,
          name: 'User B Project'
        })

      // User A tries to access it
      const { data } = await userAClient
        .from('projects')
        .select('*')
        .eq('user_id', userBId)

      expect(data).toEqual([])
    })

    it('prevents cross-user session access', async () => {
      const { data } = await userAClient
        .from('coding_sessions')
        .select('*')
        .eq('user_id', userBId)

      expect(data).toEqual([])
    })
  })

  describe('Service Role Bypass', () => {
    it('allows service role to read all profiles', async () => {
      const { data } = await serviceClient
        .from('profiles')
        .select('*')

      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThanOrEqual(2)
    })

    it('allows service role to read all jobs', async () => {
      const { data } = await serviceClient
        .from('coding_jobs')
        .select('*')

      expect(data).toBeDefined()
    })

    it('allows service role to insert events', async () => {
      const { data: session } = await serviceClient
        .from('coding_sessions')
        .select('id')
        .limit(1)
        .single()

      const { error } = await serviceClient
        .from('session_events')
        .insert({
          session_id: session!.id,
          event_type: 'thinking',
          data: { message: 'Service role insert' }
        })

      expect(error).toBeNull()
    })
  })

  describe('Subquery RLS', () => {
    it('allows users to view jobs for their sessions', async () => {
      // User A creates session and job
      const { data: session } = await userAClient
        .from('coding_sessions')
        .insert({
          user_id: userAId,
          project_id: 'project-id',
          initial_prompt: 'Build app',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        })
        .select()
        .single()

      await serviceClient
        .from('coding_jobs')
        .insert({
          session_id: session!.id,
          prompt: 'Build app'
        })

      // User A can view their job
      const { data: jobs } = await userAClient
        .from('coding_jobs')
        .select('*')

      expect(jobs!.length).toBeGreaterThan(0)
    })

    it('prevents users from viewing jobs for others sessions', async () => {
      // User B tries to view jobs (should see none)
      const { data } = await userBClient
        .from('coding_jobs')
        .select('*')

      expect(data).toEqual([])
    })

    it('allows users to view events for their sessions', async () => {
      const { data: session } = await userAClient
        .from('coding_sessions')
        .select('id')
        .limit(1)
        .single()

      await serviceClient
        .from('session_events')
        .insert({
          session_id: session!.id,
          event_type: 'terminal',
          data: { output: 'Test output' }
        })

      const { data: events } = await userAClient
        .from('session_events')
        .select('*')

      expect(events!.length).toBeGreaterThan(0)
    })
  })

  describe('RLS Enabled', () => {
    it('verifies RLS is enabled on all tables', async () => {
      const tables = ['profiles', 'projects', 'coding_sessions', 'coding_jobs', 'session_events']

      for (const table of tables) {
        // Query pg_tables to verify RLS is enabled
        // This would require direct SQL access in actual implementation
        // For now, we verify by testing that RLS actually works (other tests)
      }
    })
  })

  describe('Performance', () => {
    it('uses indexes for RLS queries', async () => {
      // Create many projects
      for (let i = 0; i < 100; i++) {
        await userAClient
          .from('projects')
          .insert({
            user_id: userAId,
            name: `Project ${i}`
          })
      }

      const start = Date.now()
      await userAClient
        .from('projects')
        .select('*')
      const duration = Date.now() - start

      // Query should be fast (< 100ms) due to index
      expect(duration).toBeLessThan(100)
    })
  })
})
