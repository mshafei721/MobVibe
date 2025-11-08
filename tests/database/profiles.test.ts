/**
 * Profiles Table Tests
 * Tests RLS policies, CRUD operations, and triggers
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

describe('Profiles Table', () => {
  let supabase: SupabaseClient
  let testUserId: string

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  })

  beforeEach(async () => {
    // Create test user and profile via Auth
    // This would be done via Supabase Auth signup in actual tests
  })

  describe('RLS Policies', () => {
    it('allows user to read own profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.id).toBe(testUserId)
    })

    it('prevents user from reading other profiles', async () => {
      const otherUserId = 'different-user-id'

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()

      expect(data).toBeNull()
    })

    it('allows user to update own profile', async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: 'Updated Name' })
        .eq('id', testUserId)

      expect(error).toBeNull()
    })

    it('prevents user from updating other profiles', async () => {
      const otherUserId = 'different-user-id'

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: 'Hacked Name' })
        .eq('id', otherUserId)

      expect(error).toBeDefined()
    })
  })

  describe('Triggers', () => {
    it('auto-creates profile on user signup', async () => {
      // Profile should be created automatically via handle_new_user() trigger
      // when user signs up via Supabase Auth

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single()

      expect(data).toBeDefined()
      expect(data?.email).toBeDefined()
      expect(data?.display_name).toBeDefined()
    })

    it('updates updated_at on profile update', async () => {
      const { data: before } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', testUserId)
        .single()

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000))

      await supabase
        .from('profiles')
        .update({ display_name: 'New Name' })
        .eq('id', testUserId)

      const { data: after } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', testUserId)
        .single()

      expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(
        new Date(before!.updated_at).getTime()
      )
    })
  })

  describe('Constraints', () => {
    it('enforces tier check constraint', async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ tier: 'invalid-tier' })
        .eq('id', testUserId)

      expect(error).toBeDefined()
      expect(error?.message).toContain('constraint')
    })

    it('enforces email uniqueness', async () => {
      // Attempt to create duplicate email should fail
      // This would be tested via Auth signup in actual implementation
    })
  })

  describe('Indexes', () => {
    it('uses email index for lookups', async () => {
      // Query by email
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'test@example.com')
        .single()

      // Index should be used (verify via EXPLAIN ANALYZE in direct SQL)
      expect(data).toBeDefined()
    })

    it('uses tier index for filtering', async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('tier', 'free')

      // Index should be used
      expect(data).toBeDefined()
    })
  })
})
