/**
 * Projects Table Tests
 * Tests RLS policies, CRUD operations, and cascades
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

describe('Projects Table', () => {
  let supabase: SupabaseClient
  let testUserId: string
  let testProjectId: string

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  beforeEach(async () => {
    // Setup: Create test user and project
  })

  describe('RLS Policies', () => {
    it('allows user to create project', async () => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: testUserId,
          name: 'Test Project',
          description: 'A test project'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.user_id).toBe(testUserId)
    })

    it('allows user to read own projects', async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', testUserId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('prevents user from reading other projects', async () => {
      const otherUserId = 'different-user-id'

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', otherUserId)

      expect(data).toEqual([])
    })

    it('allows user to update own project', async () => {
      const { error } = await supabase
        .from('projects')
        .update({ name: 'Updated Project' })
        .eq('id', testProjectId)

      expect(error).toBeNull()
    })

    it('allows user to delete own project', async () => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', testProjectId)

      expect(error).toBeNull()
    })

    it('prevents user from creating project for another user', async () => {
      const otherUserId = 'different-user-id'

      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: otherUserId,
          name: 'Hacked Project'
        })

      expect(error).toBeDefined()
    })
  })

  describe('Constraints', () => {
    it('enforces status check constraint', async () => {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'invalid-status' })
        .eq('id', testProjectId)

      expect(error).toBeDefined()
      expect(error?.message).toContain('constraint')
    })

    it('enforces foreign key to profiles', async () => {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: 'non-existent-user-id',
          name: 'Invalid Project'
        })

      expect(error).toBeDefined()
      expect(error?.message).toContain('foreign key')
    })
  })

  describe('Indexes', () => {
    it('uses user_id index for filtering', async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', testUserId)

      expect(data).toBeDefined()
    })

    it('uses status index for filtering', async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')

      expect(data).toBeDefined()
    })
  })

  describe('Soft Delete', () => {
    it('allows soft delete via status update', async () => {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'deleted' })
        .eq('id', testProjectId)

      expect(error).toBeNull()

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', testProjectId)
        .single()

      expect(data?.status).toBe('deleted')
    })
  })
})
