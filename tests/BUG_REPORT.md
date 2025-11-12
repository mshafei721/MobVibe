# Bug Report & Test Findings

## Overview
This document tracks bugs discovered during test implementation and execution.

## Bug Tracking Format
```markdown
### BUG-XXX: Title
- **Priority**: Critical | High | Medium | Low
- **Category**: UI | Backend | API | Performance | Security
- **Status**: Open | In Progress | Fixed | Wont Fix
- **Found In**: Component/File name
- **Test Case**: Test that found the bug
- **Reproduction Steps**: How to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Fix Required**: Proposed solution
- **Assigned To**: Developer name
- **Date Found**: YYYY-MM-DD
- **Date Fixed**: YYYY-MM-DD
```

---

## Critical Bugs

### BUG-001: Preview URL Not Updating in Real-time
- **Priority**: High
- **Category**: API | Real-time
- **Status**: Open
- **Found In**: `hooks/usePreviewUrl.ts`
- **Test Case**: `PreviewScreen.test.tsx` - should update when preview URL changes
- **Reproduction Steps**:
  1. Create a coding session
  2. Wait for code generation
  3. Preview URL should update automatically via Realtime
  4. Sometimes the update is not received
- **Expected Behavior**: Preview URL updates automatically when backend sets it
- **Actual Behavior**: Preview URL remains null until manual refresh
- **Fix Required**:
  - Check Supabase Realtime subscription in `usePreviewUrl`
  - Verify RLS policies allow real-time updates
  - Add reconnection logic for dropped subscriptions
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

---

## High Priority Bugs

### BUG-002: Session State Not Persisting on iOS
- **Priority**: High
- **Category**: UI | State Management
- **Status**: Open
- **Found In**: `store/sessionStore.ts`
- **Test Case**: `05-session-persistence.test.ts` - should persist session state across app restarts
- **Reproduction Steps**:
  1. Create a session on iOS
  2. Terminate app (swipe up)
  3. Reopen app
  4. Session state is not restored
- **Expected Behavior**: Session state persists in AsyncStorage and restores on app launch
- **Actual Behavior**: Session state is lost, user sees empty state
- **Fix Required**:
  - Investigate AsyncStorage write failures on iOS
  - Add error logging to persistence middleware
  - Test with large session objects (potential storage limit issue)
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

### BUG-003: Network Error Recovery Not Working
- **Priority**: High
- **Category**: API | Error Handling
- **Status**: Open
- **Found In**: `services/api/apiClient.ts`
- **Test Case**: `06-error-recovery.test.ts` - should handle network timeout gracefully
- **Reproduction Steps**:
  1. Start session creation
  2. Disconnect network
  3. Tap retry button
  4. Error persists even after network restored
- **Expected Behavior**: Retry button should attempt request again
- **Actual Behavior**: Retry button does nothing or shows same error
- **Fix Required**:
  - Implement proper retry logic with exponential backoff
  - Clear error state before retry
  - Check network connectivity before retry
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

---

## Medium Priority Bugs

### BUG-004: WebView Preview Not Loading on Android
- **Priority**: Medium
- **Category**: UI | WebView
- **Status**: Open
- **Found In**: `components/preview/WebViewPreview.tsx`
- **Test Case**: `PreviewScreen.test.tsx` - should render WebView when preview URL available
- **Reproduction Steps**:
  1. Create session and wait for preview URL
  2. Navigate to preview tab
  3. WebView shows blank screen on Android
- **Expected Behavior**: WebView loads preview URL
- **Actual Behavior**: Blank screen, no error shown
- **Fix Required**:
  - Check Android WebView permissions
  - Verify URL scheme is supported
  - Add error boundary for WebView failures
  - Enable JavaScript explicitly
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

### BUG-005: Asset Generation Times Out Frequently
- **Priority**: Medium
- **Category**: API | Performance
- **Status**: Open
- **Found In**: `e2e/04-asset-generation.test.ts`
- **Test Case**: should generate icon from prompt
- **Reproduction Steps**:
  1. Navigate to assets tab
  2. Generate icon with any prompt
  3. Request times out after 15 seconds
- **Expected Behavior**: Icon generates within 15 seconds
- **Actual Behavior**: Timeout error shown
- **Fix Required**:
  - Increase timeout for asset generation (30s recommended)
  - Add progress indicator showing generation status
  - Implement polling mechanism instead of single long request
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

### BUG-006: Session List Not Showing Pagination
- **Priority**: Medium
- **Category**: UI | Pagination
- **Status**: Open
- **Found In**: `e2e/03-session-management.test.ts`
- **Test Case**: should list and paginate sessions
- **Reproduction Steps**:
  1. Create 20+ sessions
  2. Scroll to bottom of session list
  3. More sessions should load
  4. No pagination occurs
- **Expected Behavior**: Infinite scroll loads more sessions
- **Actual Behavior**: Only first 10 sessions shown
- **Fix Required**:
  - Implement pagination in session list component
  - Add loading indicator at list bottom
  - Use `react-query` or similar for pagination management
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

---

## Low Priority Bugs

### BUG-007: Search Sessions Debounce Not Working
- **Priority**: Low
- **Category**: UI | Performance
- **Status**: Open
- **Found In**: Session search input
- **Test Case**: Manual testing
- **Reproduction Steps**:
  1. Type quickly in session search
  2. API request sent for every keystroke
- **Expected Behavior**: Search debounced (wait 300ms after typing stops)
- **Actual Behavior**: Immediate search on every keystroke
- **Fix Required**:
  - Add debounce to search input (use `lodash.debounce` or `use-debounce` hook)
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

### BUG-008: Accessibility Labels Missing on Some Buttons
- **Priority**: Low
- **Category**: UI | Accessibility
- **Status**: Open
- **Found In**: Various components
- **Test Case**: Accessibility audit
- **Reproduction Steps**:
  1. Enable screen reader
  2. Navigate through app
  3. Some buttons have generic labels like "Button"
- **Expected Behavior**: All interactive elements have descriptive labels
- **Actual Behavior**: Some elements have missing or generic labels
- **Fix Required**:
  - Audit all touchable components
  - Add descriptive `accessibilityLabel` props
  - Add `accessibilityHint` where helpful
- **Assigned To**: TBD
- **Date Found**: 2025-11-11
- **Date Fixed**: -

---

## Fixed Bugs

### BUG-XXX: Example Fixed Bug
- **Priority**: High
- **Category**: API
- **Status**: Fixed
- **Found In**: `services/api/sessions.ts`
- **Test Case**: Integration test
- **Reproduction Steps**: [...]
- **Expected Behavior**: [...]
- **Actual Behavior**: [...]
- **Fix Applied**: [...]
- **Assigned To**: Developer Name
- **Date Found**: 2025-01-01
- **Date Fixed**: 2025-01-02

---

## Won't Fix

### BUG-XXX: Example Won't Fix
- **Priority**: Low
- **Category**: UI
- **Status**: Wont Fix
- **Reason**: Intended behavior / Out of scope / Design decision
- **Date Closed**: 2025-01-03

---

## Test Infrastructure Issues

### ISSUE-001: E2E Tests Flaky on CI
- **Category**: Testing Infrastructure
- **Status**: Open
- **Description**: E2E tests pass locally but fail intermittently on CI
- **Symptoms**:
  - Random timeouts
  - Element not found errors
  - Screenshot shows element exists
- **Potential Causes**:
  - CI environment slower than local
  - Network latency differences
  - Race conditions in async operations
- **Investigation Steps**:
  - [ ] Increase timeouts on CI specifically
  - [ ] Add more explicit waits
  - [ ] Check for network-dependent operations
  - [ ] Enable Detox synchronization debugging
- **Date Found**: 2025-11-11

### ISSUE-002: Jest Coverage Report Incomplete
- **Category**: Testing Infrastructure
- **Status**: Open
- **Description**: Coverage report missing some files
- **Symptoms**:
  - Some files show 0% coverage despite having tests
  - Coverage report excludes certain directories
- **Potential Causes**:
  - Jest configuration issue
  - Files not matching `collectCoverageFrom` pattern
  - Transform issues with certain file types
- **Investigation Steps**:
  - [ ] Review `jest.config.js` collectCoverageFrom patterns
  - [ ] Check if files are being transformed correctly
  - [ ] Verify file imports in tests
- **Date Found**: 2025-11-11

---

## Bug Statistics

### By Priority
- Critical: 0
- High: 3
- Medium: 3
- Low: 2
- **Total Open**: 8

### By Category
- UI: 4
- API: 3
- Performance: 1
- Accessibility: 1
- State Management: 1
- Error Handling: 1
- Real-time: 1
- WebView: 1

### By Status
- Open: 8
- In Progress: 0
- Fixed: 0
- Wont Fix: 0

---

## Bug Review Process

### Weekly Review
1. Triage new bugs
2. Assign priorities
3. Assign developers
4. Update status
5. Close resolved bugs

### Bug Priority Guidelines
- **Critical**: App crash, data loss, security vulnerability
- **High**: Major feature broken, bad UX, blocks testing
- **Medium**: Minor feature issue, workaround exists
- **Low**: Cosmetic, nice-to-have, edge case

---

**Last Updated**: 2025-11-11
**Next Review**: TBD
