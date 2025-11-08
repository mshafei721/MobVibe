import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import { Job, QueueStats } from '../types'
import { logger } from '../utils/logger'
import { config } from '../config'

export class JobQueue {
  private supabase: SupabaseClient
  private channel: RealtimeChannel | null = null

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    logger.info('JobQueue initialized with service role')
  }

  /**
   * Claim the next highest priority pending job atomically
   */
  async claimNextJob(): Promise<Job | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('claim_next_job')

      if (error) {
        logger.error({ error }, 'Error claiming job')
        throw error
      }

      if (!data || data.length === 0) {
        return null
      }

      const job = data[0] as Job
      logger.debug({ jobId: job.job_id, sessionId: job.session_id }, 'Job claimed successfully')
      return job
    } catch (error) {
      logger.error({ error }, 'Failed to claim job')
      throw error
    }
  }

  /**
   * Mark a job as completed
   */
  async completeJob(jobId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .rpc('complete_job', { job_id_param: jobId })

      if (error) {
        logger.error({ jobId, error }, 'Error completing job')
        throw error
      }

      logger.debug({ jobId }, 'Job completed successfully')
    } catch (error) {
      logger.error({ jobId, error }, 'Failed to complete job')
      throw error
    }
  }

  /**
   * Mark a job as failed and handle retry logic
   * Returns true if job will retry, false if moved to DLQ
   */
  async failJob(jobId: string, errorMessage: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('fail_job', {
          job_id_param: jobId,
          error_msg: errorMessage
        })

      if (error) {
        logger.error({ jobId, errorMessage, error }, 'Error failing job')
        throw error
      }

      const willRetry = data as boolean
      logger.debug({ jobId, willRetry }, willRetry ? 'Job will retry' : 'Job moved to DLQ')
      return willRetry
    } catch (error) {
      logger.error({ jobId, errorMessage, error }, 'Failed to fail job')
      throw error
    }
  }

  /**
   * Subscribe to new job notifications via Realtime
   */
  subscribeToNewJobs(callback: (job: any) => void): () => void {
    this.channel = this.supabase
      .channel('new_jobs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'coding_jobs',
          filter: 'status=eq.pending'
        },
        (payload) => {
          logger.debug({ jobId: payload.new.id }, 'New job notification received')
          callback(payload.new)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to new jobs via Realtime')
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Realtime subscription error')
        } else if (status === 'TIMED_OUT') {
          logger.error('Realtime subscription timed out')
        }
      })

    // Return unsubscribe function
    return () => {
      if (this.channel) {
        this.supabase.removeChannel(this.channel)
        this.channel = null
        logger.info('Unsubscribed from new jobs')
      }
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<QueueStats | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_queue_stats')

      if (error) {
        logger.error({ error }, 'Error getting queue stats')
        throw error
      }

      if (!data || data.length === 0) {
        return null
      }

      return data[0] as QueueStats
    } catch (error) {
      logger.error({ error }, 'Failed to get queue stats')
      throw error
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}
