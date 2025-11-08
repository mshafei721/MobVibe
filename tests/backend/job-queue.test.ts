/**
 * Job Queue Unit Tests
 * Tests job claiming, retry logic, and queue statistics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { JobQueue } from '../../backend/worker/src/queue/JobQueue'

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

describe('Job Queue', () => {
  let supabase: SupabaseClient
  let queue: JobQueue
  let testUserId: string
  let testProjectId: string
  let testSessionId: string

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
    queue = new JobQueue()
  })

  beforeEach(async () => {
    // Setup: Create test user, project, and session
    // In actual implementation, this would create real test data
  })

  afterAll(async () => {
    await queue.cleanup()
  })

  describe('claimNextJob', () => {
    it('returns null when no jobs available', async () => {
      const job = await queue.claimNextJob()
      expect(job).toBeNull()
    })

    it('claims highest priority job first', async () => {
      // Create low priority job
      const { data: lowPriorityJob } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Low priority test',
          priority: 0,
          status: 'pending'
        })
        .select()
        .single()

      // Create high priority job
      const { data: highPriorityJob } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'High priority test',
          priority: 10,
          status: 'pending'
        })
        .select()
        .single()

      // Claim next job - should be high priority
      const claimed = await queue.claimNextJob()

      expect(claimed).not.toBeNull()
      expect(claimed!.job_id).toBe(highPriorityJob.id)
      expect(claimed!.priority).toBe(10)

      // Verify status changed to processing
      const { data: job } = await supabase
        .from('coding_jobs')
        .select('status')
        .eq('id', highPriorityJob.id)
        .single()

      expect(job!.status).toBe('processing')
    })

    it('uses FIFO within same priority', async () => {
      const now = new Date()

      // Create older job
      const { data: olderJob } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Older job',
          priority: 5,
          status: 'pending',
          created_at: new Date(now.getTime() - 60000).toISOString()
        })
        .select()
        .single()

      // Create newer job
      const { data: newerJob } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Newer job',
          priority: 5,
          status: 'pending',
          created_at: now.toISOString()
        })
        .select()
        .single()

      // Claim - should get older job
      const claimed = await queue.claimNextJob()

      expect(claimed!.job_id).toBe(olderJob.id)
    })

    it('skips already claimed jobs (concurrent workers)', async () => {
      // Create two jobs
      const { data: job1 } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Job 1',
          priority: 5,
          status: 'pending'
        })
        .select()
        .single()

      const { data: job2 } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Job 2',
          priority: 5,
          status: 'pending'
        })
        .select()
        .single()

      // Worker 1 claims
      const claimed1 = await queue.claimNextJob()

      // Worker 2 claims (should skip locked job and get second)
      const queue2 = new JobQueue()
      const claimed2 = await queue2.claimNextJob()

      expect(claimed1!.job_id).not.toBe(claimed2!.job_id)

      await queue2.cleanup()
    })
  })

  describe('completeJob', () => {
    it('marks job as completed', async () => {
      const { data: job } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Test job',
          status: 'pending'
        })
        .select()
        .single()

      const claimed = await queue.claimNextJob()
      expect(claimed!.job_id).toBe(job.id)

      await queue.completeJob(job.id)

      const { data: completed } = await supabase
        .from('coding_jobs')
        .select('status, completed_at')
        .eq('id', job.id)
        .single()

      expect(completed!.status).toBe('completed')
      expect(completed!.completed_at).not.toBeNull()
    })
  })

  describe('failJob', () => {
    it('retries job on first failure', async () => {
      const { data: job } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Test job',
          status: 'pending',
          retry_count: 0,
          max_retries: 3
        })
        .select()
        .single()

      const claimed = await queue.claimNextJob()
      const willRetry = await queue.failJob(claimed!.job_id, 'Test error')

      expect(willRetry).toBe(true)

      const { data: failed } = await supabase
        .from('coding_jobs')
        .select('status, retry_count, error_message')
        .eq('id', job.id)
        .single()

      expect(failed!.status).toBe('pending')
      expect(failed!.retry_count).toBe(1)
      expect(failed!.error_message).toBe('Test error')
    })

    it('moves to DLQ after max retries', async () => {
      const { data: job } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Test job',
          status: 'pending',
          retry_count: 2,
          max_retries: 3
        })
        .select()
        .single()

      const claimed = await queue.claimNextJob()
      const willRetry = await queue.failJob(claimed!.job_id, 'Final error')

      expect(willRetry).toBe(false)

      const { data: failed } = await supabase
        .from('coding_jobs')
        .select('status, retry_count, completed_at')
        .eq('id', job.id)
        .single()

      expect(failed!.status).toBe('failed')
      expect(failed!.retry_count).toBe(3)
      expect(failed!.completed_at).not.toBeNull()
    })

    it('marks session as failed when job enters DLQ', async () => {
      const { data: job } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: testSessionId,
          prompt: 'Test job',
          status: 'pending',
          retry_count: 2,
          max_retries: 3
        })
        .select()
        .single()

      const claimed = await queue.claimNextJob()
      await queue.failJob(claimed!.job_id, 'Fatal error')

      const { data: session } = await supabase
        .from('coding_sessions')
        .select('status, error_message')
        .eq('id', testSessionId)
        .single()

      expect(session!.status).toBe('failed')
      expect(session!.error_message).toBe('Fatal error')
    })
  })

  describe('getQueueStats', () => {
    beforeEach(async () => {
      // Clear all jobs
      await supabase.from('coding_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    })

    it('returns accurate statistics', async () => {
      // Create jobs in various states
      await supabase.from('coding_jobs').insert([
        { session_id: testSessionId, prompt: 'Pending 1', status: 'pending' },
        { session_id: testSessionId, prompt: 'Pending 2', status: 'pending' },
        { session_id: testSessionId, prompt: 'Processing 1', status: 'processing' },
        { session_id: testSessionId, prompt: 'Completed 1', status: 'completed' },
        { session_id: testSessionId, prompt: 'Completed 2', status: 'completed' },
        { session_id: testSessionId, prompt: 'Completed 3', status: 'completed' },
        { session_id: testSessionId, prompt: 'Failed 1', status: 'failed' }
      ])

      const stats = await queue.getQueueStats()

      expect(stats).not.toBeNull()
      expect(stats!.pending_count).toBe(2)
      expect(stats!.processing_count).toBe(1)
      expect(stats!.completed_count).toBe(3)
      expect(stats!.failed_count).toBe(1)
    })

    it('returns oldest pending age', async () => {
      const oneMinuteAgo = new Date(Date.now() - 60000)

      await supabase.from('coding_jobs').insert({
        session_id: testSessionId,
        prompt: 'Old pending job',
        status: 'pending',
        created_at: oneMinuteAgo.toISOString()
      })

      const stats = await queue.getQueueStats()

      expect(stats!.oldest_pending_age).not.toBeNull()
      // Age should be around 1 minute
      expect(stats!.oldest_pending_age).toContain('00:01')
    })

    it('returns null oldest_pending_age when no pending jobs', async () => {
      await supabase.from('coding_jobs').insert({
        session_id: testSessionId,
        prompt: 'Completed job',
        status: 'completed'
      })

      const stats = await queue.getQueueStats()

      expect(stats!.oldest_pending_age).toBeNull()
    })
  })

  describe('subscribeToNewJobs', () => {
    it('receives notification on new job INSERT', (done) => {
      const unsubscribe = queue.subscribeToNewJobs((job) => {
        expect(job).toBeDefined()
        expect(job.status).toBe('pending')
        unsubscribe()
        done()
      })

      // Insert job after subscribing
      setTimeout(async () => {
        await supabase.from('coding_jobs').insert({
          session_id: testSessionId,
          prompt: 'Realtime test job',
          status: 'pending'
        })
      }, 1000)
    }, 10000) // 10 second timeout for Realtime

    it('does not receive notification for non-pending jobs', (done) => {
      let notificationReceived = false

      const unsubscribe = queue.subscribeToNewJobs(() => {
        notificationReceived = true
      })

      // Insert completed job
      setTimeout(async () => {
        await supabase.from('coding_jobs').insert({
          session_id: testSessionId,
          prompt: 'Completed job',
          status: 'completed'
        })

        // Wait and check
        setTimeout(() => {
          expect(notificationReceived).toBe(false)
          unsubscribe()
          done()
        }, 2000)
      }, 1000)
    }, 15000)
  })
})
