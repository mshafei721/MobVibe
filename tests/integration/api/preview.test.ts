/**
 * Preview API Integration Tests
 * Tests preview URL generation and real-time updates
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

describe('Preview API Integration', () => {
  let supabase: SupabaseClient;
  let authToken: string;
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  });

  beforeEach(async () => {
    // Setup: Create test user and session
    const { data: authData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    authToken = authData.session?.access_token || '';
    testUserId = authData.user?.id || '';

    // Create test session
    const { data: session } = await supabase
      .from('coding_sessions')
      .insert({
        user_id: testUserId,
        project_id: 'test-project-id',
        initial_prompt: 'Test preview session',
        status: 'active',
      })
      .select()
      .single();

    testSessionId = session?.id || '';
  });

  describe('Preview URL Generation', () => {
    it('should generate preview URL for active session', async () => {
      const { data, error } = await supabase
        .from('coding_sessions')
        .select('preview_url, preview_status')
        .eq('id', testSessionId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Preview URL may not be generated yet for new session
      if (data.preview_url) {
        expect(data.preview_url).toMatch(/^https?:\/\//);
        expect(data.preview_status).toBe('ready');
      } else {
        expect(data.preview_status).toMatch(/^(pending|starting)$/);
      }
    });

    it('should update preview status to starting', async () => {
      // Update session to starting
      const { error } = await supabase
        .from('coding_sessions')
        .update({ preview_status: 'starting' })
        .eq('id', testSessionId);

      expect(error).toBeNull();

      // Verify update
      const { data } = await supabase
        .from('coding_sessions')
        .select('preview_status')
        .eq('id', testSessionId)
        .single();

      expect(data?.preview_status).toBe('starting');
    });

    it('should set preview URL when ready', async () => {
      const testPreviewUrl = 'https://preview.example.com/test-session';

      // Update with preview URL
      const { error } = await supabase
        .from('coding_sessions')
        .update({
          preview_url: testPreviewUrl,
          preview_status: 'ready',
        })
        .eq('id', testSessionId);

      expect(error).toBeNull();

      // Verify URL set
      const { data } = await supabase
        .from('coding_sessions')
        .select('preview_url, preview_status')
        .eq('id', testSessionId)
        .single();

      expect(data?.preview_url).toBe(testPreviewUrl);
      expect(data?.preview_status).toBe('ready');
    });

    it('should handle preview generation failure', async () => {
      // Update to failed state
      const { error } = await supabase
        .from('coding_sessions')
        .update({ preview_status: 'failed' })
        .eq('id', testSessionId);

      expect(error).toBeNull();

      // Verify failed state
      const { data } = await supabase
        .from('coding_sessions')
        .select('preview_status')
        .eq('id', testSessionId)
        .single();

      expect(data?.preview_status).toBe('failed');
    });
  });

  describe('Real-time Preview Updates', () => {
    it('should subscribe to preview URL changes', async (done) => {
      let receivedUpdate = false;

      // Subscribe to changes
      const channel = supabase
        .channel(`session:${testSessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'coding_sessions',
            filter: `id=eq.${testSessionId}`,
          },
          (payload) => {
            const newData = payload.new as any;
            if (newData.preview_url) {
              receivedUpdate = true;
              expect(newData.preview_url).toMatch(/^https?:\/\//);
              channel.unsubscribe();
              done();
            }
          }
        )
        .subscribe();

      // Trigger update
      await supabase
        .from('coding_sessions')
        .update({
          preview_url: 'https://preview.example.com/updated',
          preview_status: 'ready',
        })
        .eq('id', testSessionId);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!receivedUpdate) {
          channel.unsubscribe();
          done(new Error('Did not receive real-time update'));
        }
      }, 5000);
    });

    it('should receive preview status updates', async (done) => {
      const statusUpdates: string[] = [];

      const channel = supabase
        .channel(`session:${testSessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'coding_sessions',
            filter: `id=eq.${testSessionId}`,
          },
          (payload) => {
            const newData = payload.new as any;
            if (newData.preview_status) {
              statusUpdates.push(newData.preview_status);

              if (newData.preview_status === 'ready') {
                expect(statusUpdates).toContain('starting');
                expect(statusUpdates).toContain('ready');
                channel.unsubscribe();
                done();
              }
            }
          }
        )
        .subscribe();

      // Simulate status progression
      await supabase
        .from('coding_sessions')
        .update({ preview_status: 'starting' })
        .eq('id', testSessionId);

      setTimeout(async () => {
        await supabase
          .from('coding_sessions')
          .update({ preview_status: 'ready' })
          .eq('id', testSessionId);
      }, 1000);

      setTimeout(() => {
        channel.unsubscribe();
        done(new Error('Did not complete status progression'));
      }, 5000);
    });
  });

  describe('Preview URL Validation', () => {
    it('should accept valid preview URLs', async () => {
      const validUrls = [
        'https://preview.example.com/session-123',
        'http://localhost:3000/preview',
        'https://stackblitz.com/@user/project',
      ];

      for (const url of validUrls) {
        const { error } = await supabase
          .from('coding_sessions')
          .update({ preview_url: url })
          .eq('id', testSessionId);

        expect(error).toBeNull();
      }
    });

    it('should handle null preview URL', async () => {
      const { error } = await supabase
        .from('coding_sessions')
        .update({ preview_url: null })
        .eq('id', testSessionId);

      expect(error).toBeNull();

      const { data } = await supabase
        .from('coding_sessions')
        .select('preview_url')
        .eq('id', testSessionId)
        .single();

      expect(data?.preview_url).toBeNull();
    });
  });

  describe('Preview Lifecycle', () => {
    it('should transition through preview states', async () => {
      const states = ['pending', 'starting', 'ready'];

      for (const state of states) {
        const { error } = await supabase
          .from('coding_sessions')
          .update({ preview_status: state })
          .eq('id', testSessionId);

        expect(error).toBeNull();

        const { data } = await supabase
          .from('coding_sessions')
          .select('preview_status')
          .eq('id', testSessionId)
          .single();

        expect(data?.preview_status).toBe(state);
      }
    });

    it('should handle preview refresh', async () => {
      // Set initial preview
      await supabase
        .from('coding_sessions')
        .update({
          preview_url: 'https://preview.example.com/v1',
          preview_status: 'ready',
        })
        .eq('id', testSessionId);

      // Refresh preview (set to refreshing, then update URL)
      await supabase
        .from('coding_sessions')
        .update({ preview_status: 'refreshing' })
        .eq('id', testSessionId);

      const { data: refreshingData } = await supabase
        .from('coding_sessions')
        .select('preview_status')
        .eq('id', testSessionId)
        .single();

      expect(refreshingData?.preview_status).toBe('refreshing');

      // Complete refresh
      await supabase
        .from('coding_sessions')
        .update({
          preview_url: 'https://preview.example.com/v2',
          preview_status: 'ready',
        })
        .eq('id', testSessionId);

      const { data: readyData } = await supabase
        .from('coding_sessions')
        .select('preview_url, preview_status')
        .eq('id', testSessionId)
        .single();

      expect(readyData?.preview_url).toBe('https://preview.example.com/v2');
      expect(readyData?.preview_status).toBe('ready');
    });

    it('should stop preview when session stopped', async () => {
      // Set preview
      await supabase
        .from('coding_sessions')
        .update({
          preview_url: 'https://preview.example.com/test',
          preview_status: 'ready',
        })
        .eq('id', testSessionId);

      // Stop session
      await supabase
        .from('coding_sessions')
        .update({
          status: 'stopped',
          preview_status: 'stopped',
        })
        .eq('id', testSessionId);

      const { data } = await supabase
        .from('coding_sessions')
        .select('status, preview_status')
        .eq('id', testSessionId)
        .single();

      expect(data?.status).toBe('stopped');
      expect(data?.preview_status).toBe('stopped');
    });
  });

  afterEach(async () => {
    // Cleanup
    if (testSessionId) {
      await supabase
        .from('coding_sessions')
        .delete()
        .eq('id', testSessionId);
    }
  });
});
