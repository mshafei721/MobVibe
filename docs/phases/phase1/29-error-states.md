# Phase 29: Error & Empty States

**Duration:** 2 days
**Dependencies:** [28]
**Status:** Not Started

## Objective

Provide friendly, helpful error messages for all failure scenarios and guide users through empty states with illustrations and actionable next steps.

## Key Tasks

### 1. Error State Design System
- [ ] Design error message components (banner, modal, inline)
- [ ] Create error illustration set (network, API, quota, etc.)
- [ ] Define error severity levels (info, warning, error, critical)
- [ ] Build reusable error UI components

### 2. Error Scenarios Coverage
- [ ] Network errors (offline, timeout, server down)
- [ ] API errors (rate limit, auth failure, invalid request)
- [ ] Execution errors (sandbox crash, timeout, memory limit)
- [ ] Usage limit errors (quota exceeded, tier restriction)
- [ ] Data errors (corrupted state, invalid input)
- [ ] Agent errors (Claude API down, token limit)

### 3. Empty State Design
- [ ] No sessions yet (new user onboarding)
- [ ] No session history
- [ ] No execution outputs yet
- [ ] No agent suggestions available
- [ ] Search/filter returns no results

### 4. Helpful Actions
- [ ] Retry mechanisms with exponential backoff
- [ ] Alternative actions (offline mode, cached data)
- [ ] Contact support/help center links
- [ ] Clear error resolution steps
- [ ] Contextual tips and suggestions

## Technical Implementation

### Error Component System
```typescript
// libs/ui/components/ErrorState.tsx
interface ErrorStateProps {
  type: ErrorType;
  title: string;
  message: string;
  illustration?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actions?: ErrorAction[];
  onRetry?: () => void;
  onDismiss?: () => void;
}

type ErrorType =
  | 'network'
  | 'api'
  | 'execution'
  | 'quota'
  | 'validation'
  | 'agent'
  | 'unknown';

interface ErrorAction {
  label: string;
  type: 'primary' | 'secondary';
  onPress: () => void;
}
```

### Empty State Component
```typescript
// libs/ui/components/EmptyState.tsx
interface EmptyStateProps {
  illustration: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    onPress: () => void;
  }>;
}
```

### Error Message Standards
```typescript
// libs/shared/constants/errorMessages.ts
export const ERROR_MESSAGES = {
  NETWORK_OFFLINE: {
    title: "You're offline",
    message: "Check your connection and try again. Your work is saved locally.",
    actions: ['retry', 'viewCached'],
  },
  API_RATE_LIMIT: {
    title: "Slow down a bit",
    message: "You've made too many requests. Wait a moment and try again.",
    actions: ['wait', 'learnMore'],
  },
  QUOTA_EXCEEDED: {
    title: "Monthly limit reached",
    message: "You've used all 3 sessions this month. Upgrade for more sessions.",
    actions: ['upgrade', 'viewHistory'],
  },
  EXECUTION_TIMEOUT: {
    title: "Code took too long",
    message: "Execution stopped after 30 seconds. Try optimizing your code.",
    actions: ['retry', 'viewCode', 'getTips'],
  },
  AGENT_UNAVAILABLE: {
    title: "Claude is temporarily unavailable",
    message: "Our AI service is down. You can still run code and view history.",
    actions: ['continueWithoutAgent', 'checkStatus'],
  },
};
```

## Error Scenarios & Solutions

### Network Errors
**Offline Mode**
- Message: "You're offline. Some features unavailable."
- Actions: View cached data, retry when connected
- Auto-retry when connection restored

**API Timeout**
- Message: "Request took too long. Try again?"
- Actions: Retry, check status page
- Exponential backoff for retries

### Execution Errors
**Sandbox Crash**
- Message: "Code execution failed. This might be a memory or syntax issue."
- Actions: Review code, view logs, get help
- Show last successful execution for context

**Timeout**
- Message: "Code ran too long (30s limit). Try breaking it into smaller parts."
- Actions: Optimize code, view tips, contact support
- Show execution time stats

### Usage Limit Errors
**Quota Exceeded**
- Message: "You've used all sessions this month. Upgrade for 50 sessions/month."
- Actions: Upgrade now, view pricing, see when resets
- Highlight value proposition for upgrade

**Token Limit**
- Message: "This session used too many tokens. Try shorter conversations."
- Actions: Start new session, view usage, optimize prompts
- Show token usage breakdown

## Empty State Scenarios

### New User
- Illustration: Welcome robot with code
- Title: "Welcome to MobVibe!"
- Description: "Create your first coding session with AI assistance"
- Primary Action: "Start First Session"
- Secondary: "Take Tour", "View Examples"

### No Session History
- Illustration: Empty folder
- Title: "No sessions yet"
- Description: "Your completed sessions will appear here"
- Primary Action: "Start New Session"

### No Execution Output
- Illustration: Waiting state
- Title: "No output yet"
- Description: "Run your code to see results here"
- Tip: "Tap the play button to execute"

### No Agent Suggestions
- Illustration: Thinking robot
- Title: "No suggestions available"
- Description: "Start coding and I'll provide helpful tips"
- Tip: "The AI assistant learns as you code"

### No Search Results
- Illustration: Magnifying glass
- Title: "No results found"
- Description: "Try different keywords or filters"
- Actions: "Clear filters", "View all sessions"

## Acceptance Criteria

- [x] All error scenarios have friendly messages
- [x] Error messages explain what happened and why
- [x] Every error offers actionable next steps
- [x] Illustrations match error context
- [x] Retry mechanisms work with smart backoff
- [x] Offline errors don't block saved work access
- [x] Empty states guide users to first action
- [x] Empty state illustrations are engaging
- [x] No technical jargon in user-facing messages
- [x] Support links contextual to error type

## Testing Strategy

### Error Coverage Tests
- Trigger each error scenario manually
- Verify correct message and actions appear
- Test retry mechanisms work
- Validate error logging captures context

### Empty State Tests
- New user sees onboarding empty states
- Each screen's empty state displays correctly
- Primary actions navigate properly
- Empty states don't flash during loading

### UX Testing
- Error messages understandable to non-technical users
- Actions resolve or explain error clearly
- No dead ends (always offer next step)
- Illustrations enhance clarity

## Risk Mitigation

**Generic Error Messages**
→ Map specific errors to user-friendly messages, avoid "Error 500"

**Missing Error Handlers**
→ Comprehensive error boundary, catch-all handler, logging

**Confusing Empty States**
→ User testing, clear call-to-action, progressive disclosure

**Error Fatigue**
→ Transient errors auto-dismiss, critical errors persist, smart notifications

## Success Metrics

- 100% error scenarios covered with friendly messages
- <2% support tickets about confusing errors
- 80% retry success rate after first failure
- Empty state primary actions clicked by 60% of users
- 95% error recovery without support contact

## Notes

- Error messages reviewed for tone (helpful, not blaming)
- Illustrations commissioned or from open-source library
- Error tracking sends anonymized data for monitoring
- A/B test error message variations for clarity
- Accessibility: Screen reader support for error states
