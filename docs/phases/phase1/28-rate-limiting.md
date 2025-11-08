# Phase 28: Rate Limiting & Usage Tracking

**Duration:** 2 days
**Dependencies:** [27]
**Status:** Not Started

## Objective

Enforce tier-based usage limits (3 sessions/month for free tier), provide usage visibility through dashboard, and warn users before hitting quotas.

## Key Tasks

### 1. Usage Tracking System
- [ ] Implement session counter per user/tier
- [ ] Track token usage per session
- [ ] Build usage data storage (local + backend sync)
- [ ] Add usage reset mechanism (monthly cycle)

### 2. Rate Limiting Enforcement
- [ ] Define tier limits (Free: 3/month, Pro: 50/month, Unlimited)
- [ ] Block session start when limit reached
- [ ] Implement graceful degradation (view-only mode)
- [ ] Add override mechanism for testing/support

### 3. Usage Dashboard UI
- [ ] Build usage overview screen
- [ ] Show sessions remaining this month
- [ ] Display token usage breakdown
- [ ] Add usage history chart (last 6 months)

### 4. Quota Warnings
- [ ] Warning at 80% usage (1 session left for free)
- [ ] Final warning at 100% with upgrade prompt
- [ ] In-app notifications for quota status
- [ ] Email alerts for approaching limits (backend)

## Technical Implementation

### Usage Data Model
```typescript
interface UsageData {
  userId: string;
  tier: 'free' | 'pro' | 'unlimited';
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    sessionsUsed: number;
    sessionsLimit: number;
    tokensUsed: number;
    tokensLimit?: number;
  };
  history: PeriodUsage[];
}

interface PeriodUsage {
  period: string; // "2024-11"
  sessions: number;
  tokens: number;
}
```

### Rate Limiting Logic
```typescript
// libs/usage/services/RateLimitService.ts
class RateLimitService {
  canStartSession(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    remaining: number;
  }>;

  recordSession(userId: string, metadata: SessionMetadata): Promise<void>;

  getUsageStats(userId: string): Promise<UsageData>;

  shouldWarnUser(userId: string): Promise<{
    warn: boolean;
    threshold: number;
  }>;
}
```

### Storage Strategy
```typescript
// Local cache for quick checks
AsyncStorage: current period usage

// Backend sync
POST /api/usage/record → Log session usage
GET /api/usage/stats → Fetch usage data
POST /api/usage/reset → Manual reset (admin)
```

## Tier Configuration

### Free Tier
- 3 sessions per month
- No token limit (reasonable default: 10k tokens/session)
- View session history
- Basic support

### Pro Tier ($9.99/month)
- 50 sessions per month
- 100k tokens per session
- Priority execution
- Email support

### Unlimited Tier ($29.99/month)
- Unlimited sessions
- Unlimited tokens
- Dedicated resources
- Priority support + SLA

## Acceptance Criteria

- [x] Free users limited to 3 sessions per month
- [x] Session start blocked when limit reached
- [x] Usage dashboard shows accurate counts
- [x] Users see remaining sessions prominently
- [x] Warning appears at 80% usage (1 session left)
- [x] Final warning with upgrade prompt at 100%
- [x] Usage resets automatically on monthly cycle
- [x] Token usage tracked per session
- [x] Historical usage data visible (6 months)
- [x] Graceful error messages for limit exceeded

## Testing Strategy

### Functional Tests
- Session counter increments correctly
- Limits enforced per tier
- Usage resets on period end
- Dashboard displays accurate data
- Warnings trigger at correct thresholds

### Edge Cases
- Multiple simultaneous sessions (race condition)
- Usage data sync failure (offline mode)
- Period boundary edge cases (timezone handling)
- Tier upgrade mid-period (pro-rate limits)
- Manual usage reset by admin

### Integration Tests
- Backend sync keeps local data accurate
- Offline usage tracked and synced later
- Cross-device usage consistency

## Risk Mitigation

**Offline Tracking**
→ Local storage primary, sync when online, conflict resolution

**Sync Failures**
→ Retry mechanism, queue failed syncs, user notification

**Abuse Prevention**
→ Device fingerprinting, suspicious pattern detection, manual review

**User Frustration**
→ Clear limit communication, easy upgrade path, grace period (1 extra session)

## Success Metrics

- 100% accurate session counting
- <100ms usage check latency
- Zero false limit blocks
- 95% backend sync success rate
- <5% user complaints about limits
- 20% conversion rate on upgrade prompts

## Notes

- Consider soft limits (warnings) vs hard limits (blocks)
- Grace period for accidental over-usage (1 session)
- Usage data privacy: stored securely, not shared
- Future: Token-based pricing model
- Admin dashboard for usage analytics and support
