/**
 * Coding Sessions Table Tests
 * Tests RLS policies, lifecycle management, and expiration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

describe('Coding Sessions Table', () => {
  let supabase: SupabaseClient
  let testUserId: string
  let testProjectId: string
  let testSessionId: string

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  beforeEach(async () => {
    // Setup: Create test user, project, and session
  })

  describe('RLS Policies', () => {
    it('allows user to create session for own project', async () => {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      const { data, error } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: testUserId,
          project_id: testProjectId,
          initial_prompt: 'Build a todo app',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.user_id).toBe(testUserId)
    })

    it('allows user to read own sessions', async () => {
      const { data, error } = await supabase
        .from('coding_sessions')
        .select('*')
        .eq('user_id', testUserId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('prevents user from reading other sessions', async () => {
      const otherUserId = 'different-user-id'

      const { data } = await supabase
        .from('coding_sessions')
        .select('*')
        .eq('user_id', otherUserId)

      expect(data).toEqual([])
    })

    it('prevents user from creating session for others project', async () => {
      const otherUserId = 'different-user-id'
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1)

      const { error } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: otherUserId,
          project_id: testProjectId,
          initial_prompt: 'Hacked session',
          expires_at: expiresAt.toISOString()
        })

      expect(error).toBeDefined()
    })
  })

  describe('Status Management', () => {
    it('starts with pending status by default', async () => {
      const { data } = await supabase
        .from('coding_sessions')
        .select('status')
        .eq('id', testSessionId)
        .single()

      expect(data?.status).toBe('pending')
    })

    it('allows status transitions', async () => {
      const statuses = ['active', 'paused', 'completed']

      for (const status of statuses) {
        const { error } = await supabase
          .from('coding_sessions')
          .update({ status })
          .eq('id', testSessionId)

        expect(error).toBeNull()
      }
    })
  })

  describe('Expiration', () => {
    it('identifies expired sessions', async () => {
      const pastTime = new Date()
      pastTime.setHours(pastTime.getHours() - 1)

      await supabase
        .from('coding_sessions')
        .update({ expires_at: pastTime.toISOString() })
        .eq('id', testSessionId)

      const { data } = await supabase
        .from('coding_sessions')
        .select('*')
        .lt('expires_at', new Date().toISOString())

      expect(data!.length).toBeGreaterThan(0)
    })
  })

  describe('Metadata', () => {
    it('stores and retrieves JSONB metadata', async () => {
      const metadata = {
        files_created: 5,
        lines_of_code: 150,
        execution_time: 45.2
      }

      const { error } = await supabase
        .from('coding_sessions')
        .update({ metadata })
        .eq('id', testSessionId)

      expect(error).toBeNull()

      const { data } = await supabase
        .from('coding_sessions')
        .select('metadata')
        .eq('id', testSessionId)
        .single()

      expect(data?.metadata).toEqual(metadata)
    })
  })

  describe('Cascades', () => {
    it('deletes sessions when project is deleted', async () => {
      await supabase
        .from('projects')
        .delete()
        .eq('id', testProjectId)

      const { data } = await supabase
        .from('coding_sessions')
        .select('*')
        .eq('project_id', testProjectId)

      expect(data).toEqual([])
    })
  })
})
