# Sentry Error Monitoring Alerts Setup

Complete guide for configuring production error alerts in MobVibe.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Alert Types](#alert-types)
- [Slack Integration Setup](#slack-integration-setup)
- [Email Alert Setup](#email-alert-setup)
- [Alert Thresholds](#alert-thresholds)
- [Testing Alerts](#testing-alerts)
- [Alert Response Procedures](#alert-response-procedures)
- [Alert Fatigue Prevention](#alert-fatigue-prevention)
- [Monitoring Dashboard](#monitoring-dashboard)
- [Integration with Other Tools](#integration-with-other-tools)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before configuring alerts, ensure you have:

1. ✅ Sentry project created (mobvibe)
2. ✅ T001: Sentry integration complete
3. ✅ T017: Source maps configured
4. ⏳ Production DSN configured in `.env.production`
5. ⏳ First production deployment with errors captured

## Alert Types

### 1. Critical Error Alerts (Immediate)

**Trigger**: Any error tagged as `critical` or `fatal`
**Channels**: Slack + Email + SMS (optional)
**Response Time**: < 5 minutes

#### Configuration Steps

1. Go to Sentry dashboard: **Alerts → Create Alert Rule**
2. Configure conditions:
   - **When**: `event.level` equals `error`
   - **And**: `event.tags.severity` equals `critical`
   - **Environment**: `production`
3. Configure actions:
   - Send Slack notification to `#mobvibe-alerts`
   - Send email to `team@example.com`
   - (Optional) Send SMS via Sentry integrations
4. Set notification settings:
   - **Alert name**: "Critical Errors - Production"
   - **Action interval**: Every event (no throttling)
   - **Environment**: production

#### Example Configuration (YAML)

```yaml
name: "Critical Errors - Production"
conditions:
  - type: event.level
    value: error
  - type: event.tags
    key: severity
    value: critical
  - type: event.environment
    value: production
actions:
  - type: slack
    channel: "#mobvibe-alerts"
    message: "@here Critical error in production!"
  - type: email
    recipients:
      - oncall@example.com
frequency: every_event
```

### 2. Error Rate Spike Alerts

**Trigger**: Error rate > 10% increase in 5 minutes
**Channels**: Slack
**Response Time**: < 15 minutes

#### Configuration Steps

1. Go to Sentry dashboard: **Alerts → Create Alert Rule**
2. Configure conditions:
   - **When**: Error count is more than `10`
   - **In**: Last `5 minutes`
   - **Compared to**: Previous `5 minutes`
   - **Environment**: `production`
3. Configure actions:
   - Send Slack notification to `#mobvibe-alerts`
4. Set notification settings:
   - **Alert name**: "Error Rate Spike"
   - **Action interval**: 5 minutes (prevent spam)

#### Example Configuration (YAML)

```yaml
name: "Error Rate Spike"
conditions:
  - type: event_frequency
    value: 10
    interval: 5m
    comparison_interval: 5m
  - type: event.environment
    value: production
actions:
  - type: slack
    channel: "#mobvibe-alerts"
frequency: 5_minutes
```

### 3. New Error Type Alerts

**Trigger**: First occurrence of a new error fingerprint
**Channels**: Slack
**Response Time**: < 1 hour

#### Configuration Steps

1. Go to Sentry dashboard: **Alerts → Create Alert Rule**
2. Configure conditions:
   - **When**: First seen
   - **Environment**: `production`
3. Configure actions:
   - Send Slack notification to `#mobvibe-alerts`
4. Set notification settings:
   - **Alert name**: "New Error Type"
   - **Action interval**: Every new issue

#### Example Configuration (YAML)

```yaml
name: "New Error Type"
conditions:
  - type: first_seen
  - type: event.environment
    value: production
actions:
  - type: slack
    channel: "#mobvibe-alerts"
frequency: every_new_issue
```

### 4. Regression Alerts

**Trigger**: Resolved error reoccurs
**Channels**: Slack + Email
**Response Time**: < 30 minutes

#### Configuration Steps

1. Go to Sentry dashboard: **Alerts → Create Alert Rule**
2. Configure conditions:
   - **When**: Issue changes state from `resolved` to `unresolved`
   - **Environment**: `production`
3. Configure actions:
   - Send Slack notification to `#mobvibe-alerts`
   - Send email to `team@example.com`
4. Set notification settings:
   - **Alert name**: "Regression Alert"
   - **Action interval**: Every regression

#### Example Configuration (YAML)

```yaml
name: "Regression Alert"
conditions:
  - type: state_change
    from: resolved
    to: unresolved
  - type: event.environment
    value: production
actions:
  - type: slack
    channel: "#mobvibe-alerts"
  - type: email
    recipients:
      - team@example.com
frequency: every_regression
```

## Slack Integration Setup

### Step 1: Install Sentry App in Slack

1. Go to [Slack App Directory](https://slack.com/apps)
2. Search for "Sentry"
3. Click "Add to Slack"
4. Select your workspace
5. Click "Allow" to authorize the app

### Step 2: Create Alert Channel

1. In Slack, create a new channel: `#mobvibe-alerts`
2. Add team members who should receive alerts
3. Set channel description: "Production error alerts from Sentry"

### Step 3: Connect Sentry to Slack

1. In Sentry: **Settings → Integrations → Slack**
2. Click "Add Workspace"
3. Select your Slack workspace
4. Authorize Sentry to access Slack
5. Select default channel: `#mobvibe-alerts`

### Step 4: Configure Channel-Specific Alerts

1. In Slack channel `#mobvibe-alerts`, type: `/sentry link`
2. Follow the prompts to link the Sentry project
3. Configure notification preferences:
   - **Issues**: All production errors
   - **Deployments**: Release notifications
   - **Comments**: Team discussions on errors

### Step 5: Test Slack Integration

```bash
# In Sentry dashboard
Settings → Integrations → Slack → Test Integration
```

You should see a test message in `#mobvibe-alerts`.

## Email Alert Setup

### Step 1: Add Team Members

1. Sentry → **Settings → Members**
2. Click "Invite Member"
3. Add email addresses:
   - `team@example.com` (all alerts)
   - `oncall@example.com` (critical only)
   - `dev@example.com` (new errors)
4. Set appropriate roles:
   - Admin: Full access
   - Member: Standard access
   - Billing: Billing management only

### Step 2: Configure Email Preferences

Each team member should configure their preferences:

1. Click profile icon → **User Settings → Notifications**
2. Configure preferences:
   - **Issue Alerts**: Enabled (production errors)
   - **Workflow Notifications**: Enabled (state changes)
   - **Weekly Reports**: Enabled (summary emails)
   - **Deploy Notifications**: Enabled (release updates)
3. Set email frequency:
   - **Immediate**: Critical errors
   - **Daily Digest**: Non-critical issues
   - **Weekly Summary**: Performance trends

### Step 3: Create Email Alert Rules

For team-wide alerts:

1. Sentry → **Alerts → Create Alert Rule**
2. Set action: "Send email to team@example.com"
3. Apply to relevant conditions (critical errors, regressions)
4. Test email delivery

### Step 4: Set Up Alert Routing

Create different rules for different severity levels:

```yaml
Critical Errors:
  - Email: oncall@example.com (immediate)
  - Slack: #mobvibe-alerts (@here mention)

High Priority:
  - Email: team@example.com
  - Slack: #mobvibe-alerts

Medium Priority:
  - Slack: #mobvibe-alerts
  - Email: Daily digest

Low Priority:
  - Weekly summary email
```

## Alert Thresholds

### Recommended Thresholds

| Alert Type | Threshold | Window | Priority | Response Time |
|------------|-----------|--------|----------|---------------|
| Critical Error | 1 occurrence | Immediate | P0 | < 5 minutes |
| Error Rate Spike | 10% increase | 5 minutes | P1 | < 15 minutes |
| High Error Volume | > 100 errors | 1 hour | P1 | < 30 minutes |
| New Error Type | First seen | Immediate | P2 | < 1 hour |
| Regression | State change | Immediate | P1 | < 30 minutes |
| User Impact | > 10 users affected | 15 minutes | P0 | < 5 minutes |

### Adjusting Thresholds by Traffic Level

#### Low Traffic Apps (< 1,000 DAU)

```yaml
Critical Error: 1 error
Error Rate Spike: 5% increase in 5 minutes
High Volume: > 10 errors/hour
User Impact: > 5 users affected
```

#### Medium Traffic Apps (1,000 - 10,000 DAU)

```yaml
Critical Error: 1 error
Error Rate Spike: 10% increase in 5 minutes
High Volume: > 100 errors/hour
User Impact: > 10 users affected
```

#### High Traffic Apps (> 10,000 DAU)

```yaml
Critical Error: 1 error
Error Rate Spike: 20% increase in 5 minutes
High Volume: > 1000 errors/hour
User Impact: > 50 users affected
```

### Dynamic Threshold Adjustment

Review and adjust thresholds monthly based on:

1. **False Positive Rate**: If > 20%, increase thresholds
2. **Missed Issues**: If critical errors slipped through, decrease thresholds
3. **Team Capacity**: Adjust based on on-call availability
4. **Application Changes**: After major releases, monitor and adjust

## Testing Alerts

### Test Script Location

All alert tests are available in `scripts/test-sentry-alerts.ts`.

### Test 1: Critical Error Alert

```typescript
import { testCriticalAlert } from '@/scripts/test-sentry-alerts';

// Trigger test
testCriticalAlert();

// Expected result:
// - Slack notification in #mobvibe-alerts within 1 minute
// - Email to oncall@example.com within 5 minutes
// - Alert marked as "test" in Sentry dashboard
```

**Expected Notifications**:
- Slack: "@here Critical error in production!"
- Email subject: "[MobVibe] Critical Error: TEST: Critical error alert"
- SMS (if configured): "Critical production error in MobVibe"

### Test 2: Error Rate Spike

```typescript
import { testErrorSpike } from '@/scripts/test-sentry-alerts';

// Trigger test
testErrorSpike();

// Expected result:
// - Slack notification about spike within 5 minutes
// - Shows "20 errors in 5 minutes" in alert
```

**Expected Notifications**:
- Slack: "Error rate spike detected: 20 errors in 5 minutes"

### Test 3: New Error Type

```typescript
import { testNewErrorType } from '@/scripts/test-sentry-alerts';

// Trigger test
testNewErrorType();

// Expected result:
// - Slack notification about new error type
// - Links to new issue in Sentry
```

**Expected Notifications**:
- Slack: "New error type detected: TEST: Unique error - [timestamp]"

### Test 4: Complete Test Suite

```typescript
import { runAllTests } from '@/scripts/test-sentry-alerts';

// Run all tests
runAllTests();

// Expected result:
// - All 3 types of alerts triggered
// - Results logged to console
// - Confirmation messages in Slack
```

### Manual Testing Procedure

1. **Prepare Environment**:
   ```bash
   # Ensure production DSN is configured
   grep EXPO_PUBLIC_SENTRY_DSN .env.production
   ```

2. **Run Tests**:
   ```bash
   # Option 1: Run test script
   npx ts-node scripts/test-sentry-alerts.ts

   # Option 2: Add test button in app
   # See scripts/test-sentry-alerts.ts for usage
   ```

3. **Verify Results**:
   - Check `#mobvibe-alerts` in Slack (within 5 minutes)
   - Check email inbox for alert emails
   - Check Sentry dashboard for test events
   - Verify all alerts tagged with `test: true`

4. **Clean Up**:
   ```bash
   # In Sentry dashboard:
   # - Filter by tag: test:true
   # - Bulk select test events
   # - Mark as "Ignored" or delete
   ```

## Alert Response Procedures

### Critical Error Response (P0)

#### 1. Acknowledge (< 5 minutes)

- Click Sentry link in Slack/Email
- Assign issue to yourself
- Update status: "Investigating"
- Post acknowledgment in `#mobvibe-alerts`:
  ```
  🔴 Acknowledged. Investigating now.
  ```

#### 2. Assess Impact (< 10 minutes)

Check the following in Sentry:

- **Error Frequency**: How often is it occurring?
- **Affected Users**: How many users impacted?
- **Recent Deployments**: Was there a recent release?
- **Stack Trace**: What's the root cause?
- **Breadcrumbs**: What actions led to the error?

Create initial assessment:
```
🔍 Assessment:
- Frequency: 50 errors/minute
- Users: 25 affected (out of 500 active)
- Cause: API timeout in asset generation
- Recent deploy: v1.2.0 (2 hours ago)
```

#### 3. Respond (< 30 minutes)

Choose response based on assessment:

**Widespread Impact (> 10% users)**:
```bash
# Rollback deployment
eas update --branch production --message "Rollback due to critical error"

# Notify team
Post in #mobvibe-alerts: "🔄 Rolling back to v1.1.5"
```

**Isolated Impact (< 5% users)**:
```bash
# Create hotfix branch
git checkout -b hotfix/critical-error-fix

# Implement fix
# Test fix
# Deploy hotfix
eas build --platform all --profile production
```

**Transient Issue**:
```bash
# Monitor for 15 minutes
# If resolves itself, document in post-mortem
# If persists, escalate to full response
```

#### 4. Resolve (< 2 hours)

- Deploy fix or rollback
- Verify error is resolved in Sentry
- Monitor for 30 minutes post-fix
- Mark issue as "Resolved" in Sentry
- Update stakeholders

**Resolution Template**:
```
✅ Resolved

Fix: [Description]
Deploy: v1.2.1
Verified: No new errors in 30 minutes
Affected users: 25
Downtime: 45 minutes
Root cause: [Brief explanation]

Post-mortem: [Link to document]
```

### Error Rate Spike Response (P1)

#### 1. Investigate (< 5 minutes)

- Check deployment timeline: Recent deploy?
- Review error types: All same error or varied?
- Check infrastructure: Supabase status, API health
- Review user reports: Any complaints?

#### 2. Determine Severity

**High Severity** (> 50% error rate increase):
- Treat as P0 critical error
- Follow critical response procedure
- Consider immediate rollback

**Medium Severity** (10-50% increase):
- Monitor for 10 minutes
- Prepare rollback plan
- Investigate root cause

**Low Severity** (< 10% increase):
- Log for investigation
- Add to sprint backlog
- Monitor trends

#### 3. Take Action

Based on severity:
- Rollback if necessary
- Deploy hotfix
- Monitor and document

### New Error Type Response (P2)

#### 1. Review Error Details (< 15 minutes)

- Read error message and stack trace
- Check affected users and frequency
- Review breadcrumbs for context
- Determine error category (auth, API, UI, etc.)

#### 2. Categorize Severity

**Critical** (data loss, security, payment):
- Escalate to P0
- Follow critical response procedure

**High** (feature broken, crashes):
- Create ticket in current sprint
- Assign to responsible team member
- Set due date: End of sprint

**Medium** (degraded UX, non-critical feature):
- Create ticket in backlog
- Prioritize in next sprint planning

**Low** (edge case, cosmetic):
- Create ticket in backlog
- Fix when time permits

#### 3. Create Ticket

```markdown
Title: [Severity] [Category] Brief description

Description:
- Sentry issue: [link]
- First seen: [timestamp]
- Affected users: [count]
- Frequency: [rate]
- Root cause: [analysis]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]

Expected: [Expected behavior]
Actual: [Actual behavior]

Stack Trace: [Paste from Sentry]

Context:
- Environment: production
- Version: 1.2.0
- Platform: iOS/Android
```

## Alert Fatigue Prevention

### Noise Reduction Strategies

#### 1. Filter Test and Development Errors

```javascript
// In app/_layout.tsx beforeSend hook
beforeSend(event, hint) {
  // Filter by environment
  if (event.environment !== 'production') {
    return null; // Don't send non-production errors
  }

  // Filter test errors (unless explicitly testing alerts)
  if (event.tags?.test === 'true' && !event.tags?.alert_test) {
    return null;
  }

  return event;
}
```

#### 2. Group Similar Errors

Use Sentry fingerprinting to group related errors:

```javascript
beforeSend(event, hint) {
  // Group all timeout errors together
  if (event.message?.includes('timeout')) {
    event.fingerprint = ['timeout-error'];
  }

  // Group by error type + file
  if (event.exception?.values?.[0]) {
    const error = event.exception.values[0];
    event.fingerprint = [error.type, error.value, event.culprit];
  }

  return event;
}
```

In Sentry dashboard:
- Go to issue → "Merge Issues"
- Select similar issues
- Click "Merge" to combine

#### 3. Ignore Known Issues

For errors you can't fix immediately:

1. Go to issue in Sentry
2. Click "Ignore"
3. Select reason:
   - Until next release
   - Until it happens again
   - Forever (with note)
4. Add comment explaining why

Example: Low-priority third-party SDK error
```
Ignoring until SDK update in Q2 2025.
Tracking in ticket: MOBVIBE-123
Affects < 1% of users, no workaround available.
```

#### 4. Adjust Alert Thresholds

Review alert performance weekly:

```yaml
Week 1: 50 alerts → 10 actionable (20% useful)
Action: Increase error rate threshold from 10% to 15%

Week 2: 35 alerts → 15 actionable (43% useful)
Action: Add environment filter, exclude staging

Week 3: 20 alerts → 18 actionable (90% useful)
Action: Thresholds optimized ✓
```

#### 5. Use Issue Owners (Sentry Teams)

Auto-assign alerts to responsible teams:

1. Sentry → **Settings → Issue Owners**
2. Create ownership rules:
   ```
   # Asset generation errors → Asset team
   path:src/hooks/useAssetLibrary.ts team:asset-team
   path:components/assets/* team:asset-team

   # Authentication errors → Auth team
   path:src/hooks/useAuth.ts team:auth-team
   path:components/auth/* team:auth-team
   ```

3. Configure team-specific alerts:
   ```yaml
   Asset Team Alerts:
     - Slack: #team-assets
     - Email: assets@example.com

   Auth Team Alerts:
     - Slack: #team-auth
     - Email: auth@example.com
   ```

#### 6. Set Up Alert Schedules

Different alert sensitivity for different times:

```yaml
Business Hours (9am-6pm):
  - All alerts enabled
  - Response time: < 30 minutes

After Hours (6pm-9am):
  - Only P0 critical alerts
  - Response time: < 2 hours
  - On-call rotation

Weekends:
  - Only P0 critical alerts
  - Increased thresholds (2x normal)
  - On-call rotation
```

## Monitoring Dashboard

### Key Metrics to Track

#### 1. Error Rate
- Errors per minute/hour
- Trend over time (daily, weekly, monthly)
- Comparison to previous period

#### 2. User Impact
- Percentage of sessions with errors
- Number of affected users
- Error rate by user segment

#### 3. Critical Errors
- Count of P0 issues
- Time to resolution
- Frequency of critical alerts

#### 4. Resolution Time
- Mean Time To Resolution (MTTR)
- Mean Time To Acknowledge (MTTA)
- Response time SLA adherence

#### 5. Regression Rate
- Percentage of resolved issues returning
- Time between resolution and regression
- Most common regressions

### Sentry Dashboard Setup

#### Step 1: Create Custom Dashboard

1. Sentry → **Dashboards → Create Dashboard**
2. Name: "MobVibe Production Monitoring"
3. Add widgets (see below)

#### Step 2: Add Dashboard Widgets

**Widget 1: Event Volume**
```yaml
Type: Line Chart
Title: "Error Volume (Last 24 Hours)"
Query: event.type:error environment:production
Display: Last 24 hours
```

**Widget 2: Error Rate**
```yaml
Type: Line Chart
Title: "Error Rate (%)"
Query: event.type:error environment:production
Display: Percentage of sessions
```

**Widget 3: Top 10 Errors**
```yaml
Type: Table
Title: "Most Frequent Errors"
Query: event.type:error environment:production
Columns: Issue, Count, Users, Last Seen
Sort by: Count (descending)
Limit: 10
```

**Widget 4: Affected Users**
```yaml
Type: Big Number
Title: "Affected Users (Last Hour)"
Query: event.type:error environment:production
Display: Unique users
Time range: 1 hour
```

**Widget 5: MTTR**
```yaml
Type: Big Number
Title: "Mean Time To Resolution"
Query: is:resolved environment:production
Display: Average time from creation to resolution
Time range: Last 30 days
```

**Widget 6: Critical Errors**
```yaml
Type: Table
Title: "Critical Errors (Unresolved)"
Query: event.tags.severity:critical is:unresolved environment:production
Columns: Issue, Users, Frequency, First Seen
```

**Widget 7: Platform Breakdown**
```yaml
Type: Pie Chart
Title: "Errors by Platform"
Query: event.type:error environment:production
Group by: platform.name
```

**Widget 8: Release Comparison**
```yaml
Type: Line Chart
Title: "Error Rate by Release"
Query: event.type:error environment:production
Group by: release
Display: Last 7 releases
```

#### Step 3: Configure Dashboard Permissions

1. Set dashboard as default for team
2. Share with stakeholders (view-only)
3. Pin to Slack channel for visibility

## Integration with Other Tools

### PagerDuty Integration (Optional)

For 24/7 on-call rotation and escalation:

#### Step 1: Install PagerDuty Integration

1. Sentry → **Settings → Integrations → PagerDuty**
2. Click "Add Installation"
3. Connect PagerDuty account
4. Select service: "MobVibe Production"

#### Step 2: Configure Escalation Policy

In PagerDuty:
1. Create escalation policy:
   ```
   Level 1: Primary On-Call (5 min)
   Level 2: Secondary On-Call (15 min)
   Level 3: Engineering Manager (30 min)
   ```

2. Create service: "MobVibe Production Alerts"
3. Link to Sentry integration

#### Step 3: Create Alert Rules with PagerDuty

```yaml
Critical Errors → PagerDuty:
  Service: MobVibe Production Alerts
  Severity: Critical
  Auto-escalate: Yes

Error Rate Spike → PagerDuty:
  Service: MobVibe Production Alerts
  Severity: High
  Auto-escalate: After 15 minutes
```

### Jira Integration (Optional)

For automatic ticket creation:

#### Step 1: Connect Jira

1. Sentry → **Settings → Integrations → Jira**
2. Click "Add Installation"
3. Connect Jira instance
4. Select project: "MOBVIBE"

#### Step 2: Configure Auto-Create Rules

```yaml
New Error Types:
  - Create Jira ticket
  - Project: MOBVIBE
  - Issue Type: Bug
  - Priority: Map from Sentry severity
  - Assignee: Auto-assign by issue owner
  - Labels: sentry, auto-created

High-Frequency Errors (> 100 occurrences):
  - Create Jira ticket
  - Priority: High
  - Sprint: Current sprint
```

#### Step 3: Link Issues

- Link Sentry issues to existing Jira tickets
- Track resolution in both systems
- Sync status changes

### Datadog Integration (Optional)

For infrastructure correlation:

1. Connect Datadog to Sentry
2. Correlate errors with:
   - API response times
   - Database query performance
   - Server CPU/memory usage
   - Network latency
3. Create combined dashboards

## Maintenance

### Weekly Review

**Every Monday** (30 minutes):

1. Review alert effectiveness:
   ```
   - Total alerts: [count]
   - Actionable alerts: [count]
   - False positives: [count]
   - Missed issues: [count]
   ```

2. Adjust thresholds if needed
3. Resolve or ignore stale issues
4. Update team contact information
5. Review on-call rotation

### Monthly Review

**First Monday of Month** (1 hour):

1. Analyze alert response times:
   ```
   - MTTA (Mean Time To Acknowledge): [time]
   - MTTR (Mean Time To Resolution): [time]
   - SLA adherence: [percentage]
   ```

2. Review false positive rate:
   ```
   Target: < 20%
   Current: [percentage]
   Action: [If > 20%, adjust thresholds]
   ```

3. Update alert rules based on patterns:
   ```
   - New alert types needed: [list]
   - Deprecated alert types: [list]
   - Threshold adjustments: [list]
   ```

4. Team training:
   - Review new error types
   - Share learnings from incidents
   - Update runbooks

### Quarterly Review

**First Week of Quarter** (2 hours):

1. Comprehensive alert audit:
   - Review all alert rules
   - Test all integrations
   - Verify team access
   - Update documentation

2. Stakeholder report:
   ```markdown
   # Q[X] Error Monitoring Report

   ## Summary
   - Total errors: [count]
   - Critical incidents: [count]
   - Mean resolution time: [time]
   - User impact: [percentage]

   ## Trends
   - Error rate: [trend]
   - Most common errors: [list]
   - Platform breakdown: [data]

   ## Improvements
   - Alert accuracy: +X%
   - Response time: -X minutes
   - False positives: -X%

   ## Action Items
   1. [Item 1]
   2. [Item 2]
   ```

3. Budget review:
   - Sentry quota usage
   - Integration costs
   - Team capacity

## Troubleshooting

### Alerts Not Triggering

#### Symptom
Expected alerts not appearing in Slack or email.

#### Checklist

1. **Verify Sentry DSN configured**:
   ```bash
   grep EXPO_PUBLIC_SENTRY_DSN .env.production
   ```
   Should return: `EXPO_PUBLIC_SENTRY_DSN=https://...`

2. **Verify production environment set**:
   ```typescript
   console.log('Sentry env:', process.env.NODE_ENV);
   // Should be 'production'
   ```

3. **Confirm alert rule is active**:
   - Sentry → Alerts → [Rule name]
   - Status should be "Active" (not "Disabled")

4. **Test with manual error trigger**:
   ```typescript
   import { testCriticalAlert } from '@/scripts/test-sentry-alerts';
   testCriticalAlert();
   ```

5. **Check integration connections**:
   - Sentry → Settings → Integrations
   - Verify Slack shows "Connected"
   - Test integration button

6. **Review alert conditions**:
   - Ensure error matches all conditions
   - Check environment filter
   - Verify tag filters

#### Solution

If alerts still not working:
```bash
# Re-authorize Slack integration
Sentry → Settings → Integrations → Slack → Reconnect

# Verify webhook is active
Sentry → Settings → Developer Settings → Webhooks
# Should show active webhook for Slack

# Check Sentry status
https://status.sentry.io/
```

### Too Many Alerts (Alert Fatigue)

#### Symptom
Receiving excessive alerts, many are not actionable.

#### Analysis

Calculate alert effectiveness:
```
Actionable alerts / Total alerts = Effectiveness %

Target: > 80%
If < 50%: Immediate action needed
If 50-80%: Adjust thresholds
If > 80%: Good state
```

#### Solutions

1. **Increase alert thresholds**:
   ```yaml
   Before: Error rate > 10% in 5 minutes
   After:  Error rate > 20% in 5 minutes
   ```

2. **Add environment filters**:
   ```yaml
   Before: All environments
   After:  Only production
   ```

3. **Group similar issues**:
   - Merge duplicate issues in Sentry
   - Configure fingerprinting rules
   - Set up issue owners

4. **Implement alert schedules**:
   ```yaml
   Business Hours: All alerts
   After Hours: Only P0 critical
   Weekends: Only P0, increased thresholds
   ```

5. **Ignore non-critical errors**:
   ```yaml
   Known Issues:
     - Third-party SDK errors → Ignore until SDK update
     - Edge case errors (< 0.1% users) → Ignore
     - Non-blocking UI errors → Daily digest
   ```

6. **Implement rate limiting**:
   ```yaml
   Before: Alert on every error
   After:  Alert max once per 5 minutes per issue
   ```

### Slack Notifications Not Working

#### Symptom
Sentry alerts configured, but no messages in Slack.

#### Checklist

1. **Check Slack app installed**:
   - Slack → Apps → Search "Sentry"
   - Should show "Added" status

2. **Verify workspace connection**:
   - Sentry → Settings → Integrations → Slack
   - Should show your workspace name
   - Status: "Connected"

3. **Confirm channel permissions**:
   - Slack → #mobvibe-alerts → Settings
   - Check that Sentry app has permission to post
   - Invite Sentry app if needed: `/invite @Sentry`

4. **Test integration**:
   - Sentry → Settings → Integrations → Slack
   - Click "Test Integration"
   - Check if test message appears in Slack

5. **Verify alert rule channel**:
   - Sentry → Alerts → [Rule name]
   - Check action: "Send Slack notification to #mobvibe-alerts"
   - Ensure channel name is correct

#### Solution

If still not working:

```bash
# Step 1: Disconnect and reconnect Slack
Sentry → Settings → Integrations → Slack → Disconnect
Then: Add Workspace (re-authorize)

# Step 2: Re-link channel
In Slack: /sentry link
Follow prompts to re-link project

# Step 3: Verify permissions
Slack → App Management → Sentry → Permissions
Ensure these scopes are enabled:
- chat:write
- channels:read
- groups:read

# Step 4: Check Slack API status
https://status.slack.com/
```

### Email Notifications Not Arriving

#### Symptom
Alert rules configured with email actions, but no emails received.

#### Checklist

1. **Check email in Sentry account**:
   - Sentry → User Settings → Account Details
   - Verify email is correct
   - Check "Email verified" status

2. **Verify notification preferences**:
   - Sentry → User Settings → Notifications
   - Ensure "Issue Alerts" is enabled
   - Check frequency setting (Immediate vs Digest)

3. **Check spam folder**:
   - Search for emails from `@sentry.io`
   - Add to safe senders if in spam

4. **Verify alert rule email action**:
   - Sentry → Alerts → [Rule name]
   - Check action includes correct email address
   - Ensure action is enabled (not commented out)

5. **Check alert rule environment**:
   - Verify environment filter matches (production)
   - Confirm error is being captured in correct environment

#### Solution

If still not receiving emails:

```bash
# Step 1: Re-verify email address
Sentry → User Settings → Account Details → Resend Verification

# Step 2: Test email notifications
Sentry → User Settings → Notifications → Send Test Email

# Step 3: Check email provider settings
- Add noreply@sentry.io to contacts
- Check firewall/spam filters
- Verify email forwarding rules

# Step 4: Contact Sentry support
If all else fails: support@sentry.io
Include: Organization name, project name, email address
```

### Wrong Alert Frequency

#### Symptom
Alerts triggering too often or not often enough.

#### Analysis

Review alert history:
```
Last 7 days:
- Critical alerts: [count] (Expected: [count])
- Rate spike alerts: [count] (Expected: [count])
- New error alerts: [count] (Expected: [count])
```

#### Solutions

**Too Many Alerts**:
```yaml
# Increase interval between alerts
Before: Action interval: Every event
After:  Action interval: Every 5 minutes

# Increase threshold
Before: Error count > 10 in 5 minutes
After:  Error count > 50 in 5 minutes

# Add alert grouping
Before: Alert on each error individually
After:  Alert on error groups (same fingerprint)
```

**Too Few Alerts**:
```yaml
# Decrease threshold
Before: Error count > 100 in 5 minutes
After:  Error count > 10 in 5 minutes

# Remove filters that are too restrictive
Before: Error AND tag:critical AND users > 50
After:  Error AND tag:critical

# Enable more alert types
Before: Only critical errors
After:  Critical + High priority errors
```

## Resources

### Documentation

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Slack Integration Guide](https://docs.sentry.io/product/integrations/notification-incidents/slack/)
- [Email Alert Configuration](https://docs.sentry.io/product/alerts/notifications/)
- [Alert Best Practices](https://docs.sentry.io/product/alerts-notifications/best-practices/)
- [PagerDuty Integration](https://docs.sentry.io/product/integrations/pagerduty/)
- [Jira Integration](https://docs.sentry.io/product/integrations/issue-tracking/jira/)

### Related MobVibe Documentation

- [Sentry Setup Guide](./SENTRY_SETUP.md) - Complete integration guide
- [Sentry Quickstart](./SENTRY_QUICKSTART.md) - Quick reference
- [Test Script](../scripts/test-sentry-alerts.ts) - Alert testing utilities

### Support

- **Sentry Status**: [status.sentry.io](https://status.sentry.io/)
- **Sentry Support**: support@sentry.io
- **Slack Support**: [slack.com/help](https://slack.com/help)
- **Team Lead**: Contact for escalation procedures

---

## Setup Checklist

Use this checklist to track alert configuration progress:

### Prerequisites
- [ ] Sentry project created
- [ ] Production DSN configured in `.env.production`
- [ ] Source maps working (T017 complete)
- [ ] First production deployment with errors

### Slack Integration
- [ ] Slack workspace has Sentry app installed
- [ ] Channel `#mobvibe-alerts` created
- [ ] Team members added to channel
- [ ] Sentry connected to Slack workspace
- [ ] Channel linked to Sentry project (`/sentry link`)
- [ ] Test message sent successfully

### Email Configuration
- [ ] Team members added to Sentry
- [ ] Email addresses verified
- [ ] Notification preferences configured
- [ ] Test emails sent successfully

### Alert Rules
- [ ] Critical error alert rule created
- [ ] Error rate spike alert created
- [ ] New error type alert created
- [ ] Regression alert created
- [ ] All rules tested and verified

### Testing
- [ ] Critical alert test passed
- [ ] Error spike test passed
- [ ] New error type test passed
- [ ] All alerts received in expected channels
- [ ] Test events cleaned up in Sentry

### Documentation
- [ ] Team trained on alert handling
- [ ] Response procedures documented
- [ ] On-call rotation established (if applicable)
- [ ] Escalation procedures defined

### Maintenance
- [ ] Weekly review scheduled
- [ ] Monthly review scheduled
- [ ] Quarterly audit scheduled
- [ ] Alert effectiveness metrics defined

---

**Document Status**: Complete
**Last Updated**: 2025-11-12
**Related Tasks**: T001 (Sentry Integration), T017 (Source Maps), T020 (Alert Setup)
**Version**: 1.0.0
