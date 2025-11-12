# Sentry Alert Configuration

This directory contains version-controlled Sentry alert rule configurations for MobVibe.

## Files

- **alert-rules.yaml**: Complete alert rule definitions (11 alert types)
- **README.md**: This file

## Alert Rules Overview

### P0 Critical Alerts (Immediate Response)

1. **Critical Errors - Production**
   - Trigger: `severity:critical` errors
   - Channels: Slack (@here) + Email
   - Response: < 5 minutes

2. **High User Impact**
   - Trigger: > 10 users affected in 15 minutes
   - Channels: Slack (@here) + Email
   - Response: < 5 minutes

### P1 High Priority Alerts (Urgent)

3. **Error Rate Spike**
   - Trigger: > 10% error increase in 5 minutes
   - Channels: Slack
   - Response: < 15 minutes

4. **High Error Volume**
   - Trigger: > 100 errors in 1 hour
   - Channels: Slack
   - Response: < 30 minutes

5. **Regression Alert**
   - Trigger: Resolved error returns
   - Channels: Slack + Email
   - Response: < 30 minutes

### P2 Medium Priority Alerts (Standard)

6. **New Error Type**
   - Trigger: First seen error fingerprint
   - Channels: Slack
   - Response: < 1 hour

7. **Authentication Error Spike**
   - Trigger: > 5 auth errors in 1 minute
   - Channels: Slack (#mobvibe-security) + Email
   - Response: < 15 minutes

8. **API Timeout Spike**
   - Trigger: > 10 timeouts in 5 minutes
   - Channels: Slack
   - Response: < 30 minutes

### Feature-Specific Alerts

9. **Asset Generation Failures**
   - Trigger: > 5 failures in 10 minutes
   - Channels: Slack (#mobvibe-assets)
   - Owner: Assets team

10. **Payment Processing Failures**
    - Trigger: Any payment error
    - Channels: Slack (@here) + Email (finance team)
    - Priority: P0

### Performance Alerts

11. **Slow Transactions**
    - Trigger: > 100 transactions > 3s in 5 minutes
    - Channels: Slack (#mobvibe-performance)
    - Owner: Performance team

## Setup Instructions

### Prerequisites

1. ✅ Sentry project created
2. ✅ Production DSN configured
3. ✅ Source maps working (T017)
4. ⏳ Slack workspace integration
5. ⏳ Email notifications configured

### Step 1: Configure Slack Integration

```bash
# 1. Create Slack channels
#    - #mobvibe-alerts (primary)
#    - #mobvibe-security (auth/security)
#    - #mobvibe-assets (asset generation)
#    - #mobvibe-performance (performance)

# 2. Install Sentry app in Slack
#    - Go to Slack App Directory
#    - Search "Sentry"
#    - Click "Add to Slack"

# 3. Connect Sentry to Slack
#    - Sentry → Settings → Integrations → Slack
#    - Add Workspace
#    - Authorize

# 4. Link channels
#    - In each channel: /sentry link
#    - Follow prompts
```

### Step 2: Create Alert Rules

Go to [Sentry Alerts](https://sentry.io/organizations/YOUR_ORG/alerts/) and create each alert rule using the configurations in `alert-rules.yaml`.

**For each alert**:
1. Click "Create Alert Rule"
2. Copy settings from `alert-rules.yaml`
3. Test the alert
4. Activate the rule

**Quick Setup Order** (by priority):
1. Critical Errors (P0) - Most important
2. High User Impact (P0)
3. Error Rate Spike (P1)
4. Regression Alert (P1)
5. New Error Type (P2)
6. Others as needed

### Step 3: Configure Email Alerts

```bash
# 1. Add team members to Sentry
#    - Sentry → Settings → Members
#    - Invite: team@example.com, oncall@example.com

# 2. Configure email preferences
#    - Each member: Settings → Notifications
#    - Enable: Issue Alerts, Workflow Notifications

# 3. Update alert rules with email actions
#    - Critical alerts → oncall@example.com
#    - Regressions → team@example.com
```

### Step 4: Test Alerts

```bash
# Run comprehensive test suite
npx ts-node scripts/test-sentry-alerts.ts

# Or test individually in your app
import { testCriticalAlert } from '@/scripts/test-sentry-alerts';
testCriticalAlert();
```

**Expected Results**:
- Slack notifications in appropriate channels
- Email alerts to configured addresses
- Events visible in Sentry dashboard with `test:true` tag

### Step 5: Clean Up Test Events

After testing:
1. Go to Sentry → Issues
2. Filter by `tag:test`
3. Select all test events
4. Mark as "Ignored"

## Alert Configuration

### Alert Thresholds by Traffic Level

**Low Traffic (< 1,000 DAU)**:
```yaml
error_rate_spike: 5% increase
high_volume: > 10 errors/hour
user_impact: > 5 users
```

**Medium Traffic (1,000 - 10,000 DAU)**:
```yaml
error_rate_spike: 10% increase
high_volume: > 100 errors/hour
user_impact: > 10 users
```

**High Traffic (> 10,000 DAU)**:
```yaml
error_rate_spike: 20% increase
high_volume: > 1000 errors/hour
user_impact: > 50 users
```

### Alert Frequency Settings

- **every_event**: No throttling (critical alerts only)
- **every_new_issue**: Once per unique error
- **every_regression**: Once when resolved error returns
- **X_minutes**: Maximum once per X minutes (prevent spam)

### Environment Filters

All production alerts should filter by:
```yaml
environment: production
```

This prevents dev/staging errors from triggering production alerts.

## Response Procedures

### P0 Critical (< 5 minutes)

1. **Acknowledge**: Click link, assign to self
2. **Assess**: Check frequency, users, deploys
3. **Respond**: Rollback/hotfix/monitor
4. **Resolve**: Fix deployed, verified, documented

### P1 High (< 15-30 minutes)

1. **Investigate**: Check timeline, error types, infrastructure
2. **Determine Severity**: Escalate to P0 if widespread
3. **Take Action**: Based on impact and severity

### P2 Medium (< 1 hour)

1. **Review**: Stack trace, context, frequency
2. **Categorize**: Severity level
3. **Create Ticket**: Appropriate priority in backlog

## Maintenance

### Weekly Review (30 minutes)

- [ ] Review alert effectiveness
- [ ] Adjust thresholds if needed
- [ ] Resolve/ignore stale issues
- [ ] Update team contacts

### Monthly Review (1 hour)

- [ ] Analyze response times (MTTA, MTTR)
- [ ] Review false positive rate (target < 20%)
- [ ] Update alert rules based on patterns
- [ ] Team training on new patterns

### Quarterly Audit (2 hours)

- [ ] Comprehensive alert audit
- [ ] Test all integrations
- [ ] Update documentation
- [ ] Stakeholder reporting

## Troubleshooting

### Alerts Not Triggering

1. ✅ Check DSN configured: `grep EXPO_PUBLIC_SENTRY_DSN .env.production`
2. ✅ Verify alert rule active in Sentry dashboard
3. ✅ Test with manual trigger: `scripts/test-sentry-alerts.ts`
4. ✅ Check integration connections: Slack status
5. ✅ Review alert conditions: Do they match the error?

### Too Many Alerts (Alert Fatigue)

1. **Calculate effectiveness**: `Actionable / Total` (target > 80%)
2. **Increase thresholds**: Adjust based on traffic
3. **Add filters**: Environment, tag filters
4. **Group similar issues**: Merge duplicates
5. **Implement schedules**: Different thresholds for after-hours

### Slack Notifications Not Working

1. ✅ Check Sentry app installed in Slack
2. ✅ Verify workspace connection in Sentry
3. ✅ Confirm channel permissions (invite @Sentry)
4. ✅ Test integration in Sentry dashboard
5. ✅ Re-authorize if needed

## Files Reference

```
D:/009_Projects_AI/Personal_Projects/MobVibe/
├── .sentry/
│   ├── README.md (this file)
│   └── alert-rules.yaml (alert configurations)
├── docs/
│   ├── SENTRY_SETUP.md (complete Sentry guide)
│   └── SENTRY_ALERTS_SETUP.md (detailed alert documentation)
└── scripts/
    └── test-sentry-alerts.ts (automated testing)
```

## Resources

- **Complete Documentation**: [docs/SENTRY_ALERTS_SETUP.md](../docs/SENTRY_ALERTS_SETUP.md)
- **Sentry Alerts Guide**: https://docs.sentry.io/product/alerts/
- **Slack Integration**: https://docs.sentry.io/product/integrations/notification-incidents/slack/
- **Test Script**: [scripts/test-sentry-alerts.ts](../scripts/test-sentry-alerts.ts)

## Checklist

### Setup
- [ ] Slack channels created
- [ ] Sentry app installed in Slack
- [ ] Workspace connected
- [ ] Team members added to Sentry
- [ ] 4 core alert rules created (Critical, Spike, New, Regression)
- [ ] Alerts tested successfully

### Post-Setup
- [ ] Team trained on response procedures
- [ ] On-call rotation established (if applicable)
- [ ] Weekly review scheduled
- [ ] Escalation procedures documented

---

**Status**: Configuration complete, ready for manual setup in Sentry dashboard
**Last Updated**: 2025-11-12
**Version**: 1.0.0
**Related Tasks**: T001 (Integration), T017 (Source Maps), T020 (Alerts)
