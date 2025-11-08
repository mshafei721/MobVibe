import { createClient, SupabaseClient } from '@supabase/supabase-js'
import config from '../config'
import logger from '../utils/logger'

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean
  reason?: string
  sessionsRemaining: number
  sessionsUsed: number
  sessionsLimit: number
  tier: string
  usagePercentage: number
}

/**
 * Usage statistics for current period
 */
export interface UsageStats {
  tier: string
  periodStart: Date
  periodEnd: Date
  sessionsUsed: number
  sessionsLimit: number
  tokensUsed: number
  tokensLimit: number
  usagePercentage: number
}

/**
 * Usage history entry
 */
export interface UsageHistoryEntry {
  period: string // "YYYY-MM"
  sessions: number
  tokens: number
}

/**
 * Warning threshold result
 */
export interface WarningCheck {
  shouldWarn: boolean
  threshold: number // 80, 100
  message?: string
}

/**
 * Tier configuration
 */
export interface TierConfig {
  tier: 'free' | 'pro' | 'unlimited'
  sessionsPerMonth: number
  tokensPerSession: number
  priceMonthly: number
}

/**
 * Manages rate limiting and usage tracking for subscription tiers.
 * Enforces session limits, tracks token usage, and provides usage statistics.
 */
export class RateLimitManager {
  private supabase: SupabaseClient
  private readonly WARNING_THRESHOLD = 0.8 // 80%
  private readonly GRACE_SESSIONS = 0 // No grace period for now

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  /**
   * Check if user can start a new session based on tier limits
   */
  async canStartSession(userId: string): Promise<RateLimitCheckResult> {
    try {
      logger.info({ userId }, 'Checking rate limit for user')

      const { data, error } = await this.supabase.rpc('can_start_session', {
        p_user_id: userId,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No rate limit data returned')
      }

      const result = data[0]

      const usagePercentage =
        result.sessions_limit === -1
          ? 0
          : Math.round((result.sessions_used / result.sessions_limit) * 100)

      logger.info(
        {
          userId,
          allowed: result.allowed,
          sessionsUsed: result.sessions_used,
          sessionsLimit: result.sessions_limit,
          tier: result.tier,
        },
        'Rate limit check complete'
      )

      return {
        allowed: result.allowed,
        reason: result.reason || undefined,
        sessionsRemaining: result.sessions_remaining,
        sessionsUsed: result.sessions_used,
        sessionsLimit: result.sessions_limit,
        tier: result.tier,
        usagePercentage,
      }
    } catch (error) {
      logger.error({ userId, error }, 'Failed to check rate limit')
      throw error
    }
  }

  /**
   * Record session usage (called when session completes)
   * Note: This is also handled automatically by database trigger
   */
  async recordSessionUsage(
    sessionId: string,
    tokensUsed: number = 0,
    durationSeconds: number = 0
  ): Promise<void> {
    try {
      logger.info({ sessionId, tokensUsed, durationSeconds }, 'Recording session usage')

      const { error } = await this.supabase.rpc('record_session_usage', {
        p_session_id: sessionId,
        p_tokens_used: tokensUsed,
        p_duration_seconds: durationSeconds,
      })

      if (error) {
        throw error
      }

      logger.info({ sessionId }, 'Session usage recorded')
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to record session usage')
      throw error
    }
  }

  /**
   * Get usage statistics for a user's current period
   */
  async getUsageStats(userId: string): Promise<UsageStats> {
    try {
      logger.info({ userId }, 'Fetching usage statistics')

      const { data, error } = await this.supabase.rpc('get_usage_stats', {
        p_user_id: userId,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No usage stats returned')
      }

      const stats = data[0]

      logger.info({ userId, stats }, 'Usage statistics fetched')

      return {
        tier: stats.tier,
        periodStart: new Date(stats.period_start),
        periodEnd: new Date(stats.period_end),
        sessionsUsed: Number(stats.sessions_used),
        sessionsLimit: Number(stats.sessions_limit),
        tokensUsed: Number(stats.tokens_used),
        tokensLimit: Number(stats.tokens_limit),
        usagePercentage: Number(stats.usage_percentage),
      }
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch usage statistics')
      throw error
    }
  }

  /**
   * Get usage history for last N months
   */
  async getUsageHistory(userId: string, months: number = 6): Promise<UsageHistoryEntry[]> {
    try {
      logger.info({ userId, months }, 'Fetching usage history')

      const { data, error } = await this.supabase.rpc('get_usage_history', {
        p_user_id: userId,
        p_months: months,
      })

      if (error) {
        throw error
      }

      const history: UsageHistoryEntry[] = (data || []).map((entry: any) => ({
        period: entry.period,
        sessions: Number(entry.sessions),
        tokens: Number(entry.tokens),
      }))

      logger.info({ userId, count: history.length }, 'Usage history fetched')

      return history
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch usage history')
      throw error
    }
  }

  /**
   * Check if user should be warned about approaching quota limit
   */
  async shouldWarnUser(userId: string): Promise<WarningCheck> {
    try {
      const stats = await this.getUsageStats(userId)

      // Unlimited tier never warns
      if (stats.tier === 'unlimited' || stats.sessionsLimit === -1) {
        return {
          shouldWarn: false,
          threshold: 0,
        }
      }

      const usagePercentage = stats.usagePercentage / 100

      // At 100% - final warning
      if (usagePercentage >= 1.0) {
        return {
          shouldWarn: true,
          threshold: 100,
          message: `You've reached your monthly limit of ${stats.sessionsLimit} sessions. Upgrade to continue coding.`,
        }
      }

      // At 80% - approaching limit warning
      if (usagePercentage >= this.WARNING_THRESHOLD) {
        const remaining = stats.sessionsLimit - stats.sessionsUsed
        return {
          shouldWarn: true,
          threshold: 80,
          message: `You have ${remaining} session${remaining === 1 ? '' : 's'} remaining this month.`,
        }
      }

      return {
        shouldWarn: false,
        threshold: 0,
      }
    } catch (error) {
      logger.error({ userId, error }, 'Failed to check warning threshold')
      throw error
    }
  }

  /**
   * Get tier configurations
   */
  async getTierConfigs(): Promise<TierConfig[]> {
    try {
      logger.info('Fetching tier configurations')

      const { data, error } = await this.supabase
        .from('tier_limits')
        .select('*')
        .order('price_monthly', { ascending: true })

      if (error) {
        throw error
      }

      const configs: TierConfig[] = (data || []).map((row: any) => ({
        tier: row.tier,
        sessionsPerMonth: Number(row.sessions_per_month),
        tokensPerSession: Number(row.tokens_per_session),
        priceMonthly: Number(row.price_monthly),
      }))

      logger.info({ count: configs.length }, 'Tier configurations fetched')

      return configs
    } catch (error) {
      logger.error({ error }, 'Failed to fetch tier configurations')
      throw error
    }
  }

  /**
   * Update user tier (admin operation)
   */
  async updateUserTier(
    userId: string,
    tier: 'free' | 'pro' | 'unlimited'
  ): Promise<void> {
    try {
      logger.info({ userId, tier }, 'Updating user tier')

      const { error } = await this.supabase
        .from('profiles')
        .update({ tier })
        .eq('id', userId)

      if (error) {
        throw error
      }

      logger.info({ userId, tier }, 'User tier updated')
    } catch (error) {
      logger.error({ userId, tier, error }, 'Failed to update user tier')
      throw error
    }
  }

  /**
   * Get detailed session usage breakdown
   */
  async getSessionUsageDetails(userId: string, limit: number = 30): Promise<any[]> {
    try {
      logger.info({ userId, limit }, 'Fetching session usage details')

      const { data, error } = await this.supabase
        .from('session_usage')
        .select(
          `
          id,
          session_id,
          tokens_used,
          duration_seconds,
          created_at,
          coding_sessions (
            initial_prompt,
            status
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      logger.info({ userId, count: data?.length || 0 }, 'Session usage details fetched')

      return data || []
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch session usage details')
      throw error
    }
  }

  /**
   * Check if user has exceeded token limit for current session
   * Note: Currently not enforced, just for monitoring
   */
  async checkTokenLimit(userId: string, tokensUsed: number): Promise<boolean> {
    try {
      const stats = await this.getUsageStats(userId)

      // Unlimited tier has no token limit
      if (stats.tier === 'unlimited' || stats.tokensLimit === -1) {
        return false
      }

      return tokensUsed > stats.tokensLimit
    } catch (error) {
      logger.error({ userId, tokensUsed, error }, 'Failed to check token limit')
      return false
    }
  }
}
