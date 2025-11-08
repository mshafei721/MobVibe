// Row Level Security (RLS) Enforcement Tests
// DEFERRED: Will be used when mobile app is implemented and Supabase is deployed

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to create authenticated Supabase client
 */
async function createAuthenticatedClient(email: string): Promise<SupabaseClient> {
  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'test-password-123',
  });

  if (error) throw error;
  return supabase;
}

describe('RLS Policy Enforcement', () => {
  let user1Client: SupabaseClient;
  let user2Client: SupabaseClient;

  beforeAll(async () => {
    // Create two authenticated clients for different users
    user1Client = await createAuthenticatedClient('user1@test.com');
    user2Client = await createAuthenticatedClient('user2@test.com');
  });

  afterAll(async () => {
    await user1Client.auth.signOut();
    await user2Client.auth.signOut();
  });

  describe('coding_sessions Table', () => {
    it('should prevent cross-user session access', async () => {
      // User1 creates a session
      const { data: session, error: createError } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'User1 Session' })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(session).toBeDefined();

      // User2 tries to read User1's session
      const { data: leakedData, error: readError } = await user2Client
        .from('coding_sessions')
        .select()
        .eq('id', session!.id);

      // RLS should filter out the session (returns empty array, not error)
      expect(leakedData).toEqual([]);
      expect(readError).toBeNull();
    });

    it('should prevent unauthorized session updates', async () => {
      const { data: session } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'Original Title' })
        .select()
        .single();

      // User2 tries to update User1's session
      const { error } = await user2Client
        .from('coding_sessions')
        .update({ title: 'Hacked Title' })
        .eq('id', session!.id);

      // Verify no update occurred
      const { data: updated } = await user1Client
        .from('coding_sessions')
        .select()
        .eq('id', session!.id)
        .single();

      expect(updated!.title).toBe('Original Title');
    });

    it('should prevent unauthorized session deletion', async () => {
      const { data: session } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'Session to Delete' })
        .select()
        .single();

      // User2 tries to delete User1's session
      await user2Client.from('coding_sessions').delete().eq('id', session!.id);

      // Verify session still exists
      const { data } = await user1Client
        .from('coding_sessions')
        .select()
        .eq('id', session!.id);

      expect(data).toHaveLength(1);
    });

    it('should reject session creation for another user', async () => {
      const { data: user2 } = await user2Client.auth.getUser();

      // User1 tries to create session for User2
      const { error } = await user1Client.from('coding_sessions').insert({
        user_id: user2.user!.id,
        title: 'Hacked Session',
      });

      // Should violate RLS policy
      expect(error).toBeDefined();
      expect(error?.message).toContain('row-level security');
    });
  });

  describe('coding_jobs Table', () => {
    it('should enforce RLS via session_id foreign key', async () => {
      // User1 creates session and job
      const { data: session } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'Session with Job' })
        .select()
        .single();

      const { data: job } = await user1Client
        .from('coding_jobs')
        .insert({
          session_id: session!.id,
          prompt: 'Test prompt',
          status: 'pending',
        })
        .select()
        .single();

      // User2 tries to access User1's job
      const { data: leakedJobs } = await user2Client
        .from('coding_jobs')
        .select()
        .eq('id', job!.id);

      expect(leakedJobs).toEqual([]);
    });
  });

  describe('session_events Table', () => {
    it('should enforce RLS on session events', async () => {
      const { data: session } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'Session with Events' })
        .select()
        .single();

      const { data: event } = await user1Client
        .from('session_events')
        .insert({
          session_id: session!.id,
          event_type: 'code_generated',
          event_data: { test: 'data' },
        })
        .select()
        .single();

      // User2 tries to access User1's event
      const { data: leakedEvents } = await user2Client
        .from('session_events')
        .select()
        .eq('id', event!.id);

      expect(leakedEvents).toEqual([]);
    });
  });

  describe('projects Table', () => {
    it('should prevent cross-user project access', async () => {
      const { data: project } = await user1Client
        .from('projects')
        .insert({ name: 'User1 Project' })
        .select()
        .single();

      // User2 tries to read User1's project
      const { data: leakedProjects } = await user2Client
        .from('projects')
        .select()
        .eq('id', project!.id);

      expect(leakedProjects).toEqual([]);
    });

    it('should prevent unauthorized project updates', async () => {
      const { data: project } = await user1Client
        .from('projects')
        .insert({ name: 'Original Name' })
        .select()
        .single();

      // User2 tries to update User1's project
      await user2Client
        .from('projects')
        .update({ name: 'Hacked Name' })
        .eq('id', project!.id);

      // Verify no update occurred
      const { data: updated } = await user1Client
        .from('projects')
        .select()
        .eq('id', project!.id)
        .single();

      expect(updated!.name).toBe('Original Name');
    });
  });

  describe('session_state_snapshots Table', () => {
    it('should enforce RLS on state snapshots', async () => {
      const { data: session } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'Session with Snapshot' })
        .select()
        .single();

      const { data: snapshot } = await user1Client
        .from('session_state_snapshots')
        .insert({
          session_id: session!.id,
          snapshot_data: { test: 'state' },
          file_count: 5,
          total_size: 1024,
        })
        .select()
        .single();

      // User2 tries to access User1's snapshot
      const { data: leakedSnapshots } = await user2Client
        .from('session_state_snapshots')
        .select()
        .eq('id', snapshot!.id);

      expect(leakedSnapshots).toEqual([]);
    });
  });

  describe('usage_tracking Table', () => {
    it('should prevent cross-user usage data access', async () => {
      const { data: usage } = await user1Client
        .from('usage_tracking')
        .insert({
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString(),
          sessions_created: 5,
          total_generations: 10,
        })
        .select()
        .single();

      // User2 tries to read User1's usage data
      const { data: leakedUsage } = await user2Client
        .from('usage_tracking')
        .select()
        .eq('id', usage!.id);

      expect(leakedUsage).toEqual([]);
    });
  });

  describe('onboarding_state Table', () => {
    it('should prevent cross-user onboarding state access', async () => {
      const { data: onboarding } = await user1Client
        .from('onboarding_state')
        .insert({
          welcome_completed: true,
          walkthrough_completed: false,
        })
        .select()
        .single();

      // User2 tries to read User1's onboarding state
      const { data: leakedOnboarding } = await user2Client
        .from('onboarding_state')
        .select()
        .eq('id', onboarding!.id);

      expect(leakedOnboarding).toEqual([]);
    });
  });

  describe('Anonymous Access', () => {
    it('should deny all access to anonymous users', async () => {
      const anonClient = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Try to read sessions without authentication
      const { data, error } = await anonClient.from('coding_sessions').select();

      expect(data).toEqual([]);
      expect(error).toBeNull(); // RLS filters silently
    });

    it('should reject anonymous session creation', async () => {
      const anonClient = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await anonClient
        .from('coding_sessions')
        .insert({ title: 'Anonymous Session' });

      expect(error).toBeDefined();
      expect(error?.message).toContain('row-level security');
    });
  });

  describe('Bulk Operations', () => {
    it('should filter bulk reads by user', async () => {
      // User1 creates 3 sessions
      await user1Client.from('coding_sessions').insert([
        { title: 'Session 1' },
        { title: 'Session 2' },
        { title: 'Session 3' },
      ]);

      // User2 creates 2 sessions
      await user2Client.from('coding_sessions').insert([
        { title: 'Other Session 1' },
        { title: 'Other Session 2' },
      ]);

      // User1 should only see their 3 sessions
      const { data: user1Sessions } = await user1Client
        .from('coding_sessions')
        .select();

      expect(user1Sessions!.length).toBe(3);

      // User2 should only see their 2 sessions
      const { data: user2Sessions } = await user2Client
        .from('coding_sessions')
        .select();

      expect(user2Sessions!.length).toBe(2);
    });

    it('should filter bulk updates by user', async () => {
      // User1 creates sessions
      await user1Client.from('coding_sessions').insert([
        { title: 'Session A' },
        { title: 'Session B' },
      ]);

      // User2 tries to bulk update all sessions
      await user2Client
        .from('coding_sessions')
        .update({ title: 'Hacked' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all

      // Verify User1's sessions unchanged
      const { data: user1Sessions } = await user1Client
        .from('coding_sessions')
        .select();

      expect(user1Sessions!.every((s) => s.title !== 'Hacked')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session ownership transfer attempts', async () => {
      const { data: session } = await user1Client
        .from('coding_sessions')
        .insert({ title: 'Transfer Test' })
        .select()
        .single();

      const { data: user2 } = await user2Client.auth.getUser();

      // User1 tries to transfer session to User2
      const { error } = await user1Client
        .from('coding_sessions')
        .update({ user_id: user2.user!.id })
        .eq('id', session!.id);

      // Should reject ownership transfer
      expect(error).toBeDefined();
    });

    it('should handle null user_id attempts', async () => {
      const { error } = await user1Client
        .from('coding_sessions')
        .insert({ user_id: null, title: 'Null User Session' });

      expect(error).toBeDefined();
    });
  });
});
