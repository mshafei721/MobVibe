# Phase 31: End-to-End Testing Suite

**Duration:** 2 days
**Dependencies:** [30]
**Status:** Pending

## Objective

Implement comprehensive E2E testing covering full user journeys from prompt input to code preview, integrated into CI/CD pipeline.

## Scope

### In Scope
- Detox E2E test framework setup
- Critical user flow tests (auth, session, preview)
- CI/CD integration (GitHub Actions)
- Test coverage reporting
- Mobile device simulation (iOS/Android)

### Out of Scope
- Manual QA testing
- Load testing
- Security testing (Phase 33)
- Performance benchmarking (Phase 32)

## Technical Architecture

### Test Framework Stack
```yaml
Framework: Detox (React Native E2E)
Test Runner: Jest
CI: GitHub Actions
Devices: iOS Simulator, Android Emulator
Coverage: Jest coverage reporter
```

### Test Scenarios
```yaml
Authentication Flow:
  - User signup → verification → profile setup
  - User login → session restore → home screen
  - Logout → session cleanup

Core Development Flow:
  - Create session → enter prompt → generate code
  - View code → syntax highlighting → scroll/search
  - Run preview → sandbox start → output display
  - Error handling → display → recovery

Session Management:
  - List sessions → pagination → search/filter
  - Resume session → restore state → continue work
  - Delete session → confirmation → cleanup
```

## Implementation Plan

### 1. Detox Setup (4 hours)
```bash
# Install Detox
npm install --save-dev detox jest

# Configure Detox
# .detoxrc.js
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MobVibe.app',
      build: 'xcodebuild -workspace ios/MobVibe.xcworkspace -scheme MobVibe -configuration Debug -sdk iphonesimulator'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15 Pro' }
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};
```

### 2. Authentication Tests (3 hours)
```typescript
// e2e/auth.test.ts
describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should complete signup flow', async () => {
    await element(by.id('signup-button')).tap();
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('confirm-password-input')).typeText('Password123!');
    await element(by.id('signup-submit')).tap();

    // Verify email verification screen
    await waitFor(element(by.id('verify-email-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should login and restore session', async () => {
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('existing@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('login-submit')).tap();

    // Verify home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify sessions loaded
    await waitFor(element(by.id('session-list')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should logout and clear session', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('existing@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('login-submit')).tap();

    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();

    // Verify redirected to auth screen
    await waitFor(element(by.id('auth-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });
});
```

### 3. Core Development Flow Tests (4 hours)
```typescript
// e2e/development-flow.test.ts
describe('Core Development Flow', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    // Login helper
    await loginUser('test@example.com', 'Password123!');
  });

  it('should create session and generate code', async () => {
    // Create new session
    await element(by.id('new-session-button')).tap();

    // Enter prompt
    await element(by.id('prompt-input')).typeText('Create a React counter component');
    await element(by.id('generate-button')).tap();

    // Wait for generation
    await waitFor(element(by.id('code-editor')))
      .toBeVisible()
      .withTimeout(10000);

    // Verify code present
    await expect(element(by.id('code-editor'))).toHaveText(/function|const/);
  });

  it('should run code preview', async () => {
    // Navigate to existing session with code
    await element(by.id('session-list')).atIndex(0).tap();

    // Run preview
    await element(by.id('run-preview-button')).tap();

    // Wait for sandbox initialization
    await waitFor(element(by.id('preview-output')))
      .toBeVisible()
      .withTimeout(15000);

    // Verify preview content
    await expect(element(by.id('preview-output'))).toBeVisible();
  });

  it('should handle generation errors gracefully', async () => {
    await element(by.id('new-session-button')).tap();

    // Enter invalid prompt (too short)
    await element(by.id('prompt-input')).typeText('hi');
    await element(by.id('generate-button')).tap();

    // Verify error message
    await waitFor(element(by.id('error-message')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('error-message')))
      .toHaveText(/Please provide a more detailed prompt/);
  });

  it('should search and filter code', async () => {
    await element(by.id('session-list')).atIndex(0).tap();

    // Open search
    await element(by.id('search-button')).tap();
    await element(by.id('search-input')).typeText('function');

    // Verify search results highlighted
    await waitFor(element(by.id('search-result-0')))
      .toBeVisible()
      .withTimeout(2000);
  });
});
```

### 4. Session Management Tests (3 hours)
```typescript
// e2e/session-management.test.ts
describe('Session Management', () => {
  beforeEach(async () => {
    await device.launchApp({ newInstance: true });
    await loginUser('test@example.com', 'Password123!');
  });

  it('should list and paginate sessions', async () => {
    // Verify session list visible
    await waitFor(element(by.id('session-list')))
      .toBeVisible()
      .withTimeout(3000);

    // Scroll to bottom (trigger pagination)
    await element(by.id('session-list')).scrollTo('bottom');

    // Wait for next page load
    await waitFor(element(by.id('session-item-10')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should search sessions', async () => {
    await element(by.id('search-sessions-input')).typeText('counter');

    // Wait for filtered results
    await waitFor(element(by.id('session-item-0')))
      .toBeVisible()
      .withTimeout(2000);

    // Verify filtered count
    await expect(element(by.id('session-count'))).toHaveText(/Found \d+ sessions/);
  });

  it('should resume session and restore state', async () => {
    // Tap existing session
    await element(by.id('session-list')).atIndex(0).tap();

    // Verify code loaded
    await waitFor(element(by.id('code-editor')))
      .toBeVisible()
      .withTimeout(3000);

    // Verify session metadata restored
    await expect(element(by.id('session-title'))).toBeVisible();
    await expect(element(by.id('last-modified'))).toBeVisible();
  });

  it('should delete session with confirmation', async () => {
    // Long press session
    await element(by.id('session-item-0')).longPress();

    // Tap delete
    await element(by.id('delete-option')).tap();

    // Confirm deletion
    await element(by.id('confirm-delete')).tap();

    // Verify session removed
    await waitFor(element(by.id('session-item-0')))
      .not.toBeVisible()
      .withTimeout(2000);
  });
});
```

### 5. CI/CD Integration (4 hours)
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  ios-e2e:
    runs-on: macos-13
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Detox CLI
        run: npm install -g detox-cli

      - name: Install iOS dependencies
        run: cd ios && pod install

      - name: Build iOS app
        run: detox build --configuration ios.sim.debug

      - name: Run iOS E2E tests
        run: detox test --configuration ios.sim.debug --record-logs all

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: ios-test-artifacts
          path: |
            e2e/artifacts/**/*
            coverage/

  android-e2e:
    runs-on: macos-13
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm ci

      - name: Install Detox CLI
        run: npm install -g detox-cli

      - name: Build Android app
        run: detox build --configuration android.emu.debug

      - name: Run Android E2E tests
        run: detox test --configuration android.emu.debug --record-logs all

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: android-test-artifacts
          path: |
            e2e/artifacts/**/*
            coverage/
```

### 6. Test Utilities & Helpers (2 hours)
```typescript
// e2e/helpers/auth.ts
export const loginUser = async (email: string, password: string) => {
  await element(by.id('login-button')).tap();
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-submit')).tap();

  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
};

export const createSession = async (prompt: string) => {
  await element(by.id('new-session-button')).tap();
  await element(by.id('prompt-input')).typeText(prompt);
  await element(by.id('generate-button')).tap();

  await waitFor(element(by.id('code-editor')))
    .toBeVisible()
    .withTimeout(10000);
};

// e2e/helpers/matchers.ts
export const customMatchers = {
  toHaveLoadedCode: async (element: any) => {
    const attributes = await element.getAttributes();
    const hasText = attributes.text && attributes.text.length > 0;
    return {
      pass: hasText,
      message: hasText
        ? 'Code editor has content'
        : 'Code editor is empty'
    };
  }
};

// e2e/helpers/cleanup.ts
export const cleanupTestData = async () => {
  // Clean up test sessions/data after tests
  await device.sendToHome();
  await device.launchApp({ delete: true });
};
```

## Testing Strategy

### Coverage Requirements
```yaml
Target Coverage: >80%
Critical Paths: 100% (auth, session, preview)
Edge Cases: Error handling, network failures, timeouts
Performance: Monitor test execution time (<5min total)
```

### Test Organization
```yaml
Structure:
  e2e/
    auth.test.ts           # Authentication flows
    development-flow.test.ts # Core development features
    session-management.test.ts # Session CRUD
    helpers/
      auth.ts              # Auth utilities
      matchers.ts          # Custom matchers
      cleanup.ts           # Test cleanup
    config.json           # Jest configuration
```

## Acceptance Criteria

- [ ] Detox configured for iOS & Android
- [ ] Authentication flow tests pass (signup, login, logout)
- [ ] Core development flow tests pass (prompt→code→preview)
- [ ] Session management tests pass (list, resume, delete)
- [ ] CI pipeline runs E2E tests on PR
- [ ] Test coverage >80% on critical paths
- [ ] Test execution time <5 minutes
- [ ] Test artifacts captured on failure
- [ ] Documentation for running tests locally

## Risk Management

### Technical Risks
```yaml
Flaky Tests:
  Impact: HIGH
  Mitigation: Proper waits, retry logic, stable selectors

CI Performance:
  Impact: MEDIUM
  Mitigation: Parallel execution, caching, optimized builds

Device Fragmentation:
  Impact: MEDIUM
  Mitigation: Test on representative devices, matrix testing
```

## Dependencies

### External
- Detox (v20.x)
- Jest (v29.x)
- GitHub Actions runners (macOS)
- iOS Simulator / Android Emulator

### Internal
- Phase 30 (Testing Infrastructure) complete
- Stable API endpoints
- Test environment configuration

## Success Metrics

```yaml
Test Reliability: <2% flaky test rate
Coverage: >80% critical path coverage
Performance: <5min total execution time
CI Integration: 100% PR runs
Documentation: Complete setup & troubleshooting guide
```

## Documentation Deliverables

- E2E test setup guide
- Writing new E2E tests guide
- Troubleshooting flaky tests
- CI/CD integration documentation
- Test coverage reports

## Next Steps

→ **Phase 32:** Performance Optimization & Benchmarking
