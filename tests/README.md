# MobVibe Test Suite

Comprehensive test automation for the MobVibe mobile app.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests (iOS)
npm run e2e:test
```

## Test Structure

```
tests/
├── integration/          # API and database integration tests
│   ├── api/
│   │   └── preview.test.ts
│   ├── edge-functions.test.ts
│   └── database/
├── components/           # Component tests
│   └── preview/
│       └── PreviewScreen.test.tsx
├── BUG_REPORT.md        # Bug tracking
├── TEST_IMPLEMENTATION_SUMMARY.md
└── README.md            # This file

e2e/                     # End-to-end tests
├── helpers/             # Test utilities
│   ├── auth.ts
│   ├── session.ts
│   └── project.ts
├── 01-auth-flow.test.ts
├── 02-development-flow.test.ts
├── 03-session-management.test.ts
├── 04-asset-generation.test.ts
├── 05-session-persistence.test.ts
└── 06-error-recovery.test.ts
```

## Test Categories

### 1. Unit Tests
Test individual functions and components in isolation.

```bash
npm run test:unit
```

**Coverage**: `src/`, `components/`, `hooks/`, `store/`, `services/`

### 2. Integration Tests
Test interactions between components, APIs, and database.

```bash
npm run test:integration
```

**Coverage**: API endpoints, database operations, real-time updates

### 3. E2E Tests
Test complete user flows from UI to backend.

```bash
# iOS
npm run e2e:build:ios
npm run e2e:test:ios

# Android
npm run e2e:build:android
npm run e2e:test:android
```

**Coverage**: Authentication, sessions, preview, assets, persistence

## Writing Tests

### Unit Test Example
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/src/ui/primitives';

describe('Button Component', () => {
  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button onPress={mockOnPress}>Click Me</Button>
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Example
```typescript
import { createClient } from '@supabase/supabase-js';

describe('Session API', () => {
  let supabase;

  beforeAll(() => {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  });

  it('should create session', async () => {
    const { data, error } = await supabase
      .from('coding_sessions')
      .insert({ /* ... */ })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### E2E Test Example
```typescript
import { device, element, by, waitFor } from 'detox';

describe('Auth Flow', () => {
  it('should login successfully', async () => {
    await element(by.id('login-button')).tap();
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-submit')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Test Helpers

### Authentication
```typescript
import { loginUser, signupUser, logoutUser } from './e2e/helpers/auth';

await loginUser('test@example.com', 'password');
await signupUser('new@example.com', 'password');
await logoutUser();
```

### Session Management
```typescript
import { createSession, resumeSession } from './e2e/helpers/session';

await createSession('Build a todo app');
await resumeSession(0);
```

## Coverage Requirements

| Category | Threshold |
|----------|-----------|
| Global | 80% |
| App Layer | 85% |
| Services | 90% |

## CI/CD Integration

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`
- Manual workflow dispatch

### GitHub Actions Workflows
- `unit-tests.yml`: Unit and integration tests
- `e2e-tests.yml`: End-to-end tests (iOS & Android)

## Debugging Tests

### Local Debugging
```bash
# Run specific test file
npm test -- PreviewScreen.test.tsx

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# E2E with verbose logging
detox test --configuration ios.sim.debug --loglevel trace
```

### VS Code Debugging
1. Set breakpoint in test file
2. Press F5 to start debugging
3. Use Debug Console for inspection

## Common Issues

### Tests Failing Locally

**Problem**: Tests pass in CI but fail locally
**Solution**:
- Clear jest cache: `npx jest --clearCache`
- Delete node_modules and reinstall
- Check environment variables

### E2E Tests Flaky

**Problem**: E2E tests fail intermittently
**Solution**:
- Increase timeouts
- Add explicit waits with `waitFor()`
- Check for race conditions
- Use Detox synchronization

### Mock Not Working

**Problem**: Mock not being applied
**Solution**:
- Verify mock path matches import path
- Clear jest cache
- Check mock is defined before test runs
- Use `jest.clearAllMocks()` in `beforeEach`

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` for setup
- Clean up in `afterEach`
- Don't rely on test execution order

### 2. Descriptive Names
```typescript
// Good
it('should display error when email is invalid', () => {});

// Bad
it('test email validation', () => {});
```

### 3. Arrange-Act-Assert
```typescript
it('should increment counter', () => {
  // Arrange
  const { getByRole } = render(<Counter />);

  // Act
  fireEvent.press(getByRole('button'));

  // Assert
  expect(getByText('Count: 1')).toBeTruthy();
});
```

### 4. Async Operations
```typescript
// Always await async operations
await waitFor(() => {
  expect(element).toBeVisible();
});

// Don't forget async/await
it('should load data', async () => {
  await fetchData();
  // assertions
});
```

### 5. Accessibility
```typescript
// Use semantic queries
getByRole('button')
getByLabelText('Username')

// Avoid
getByTestId('submit-btn') // Only when semantic query not possible
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Bug Reporting

Found a bug? Report it in `tests/BUG_REPORT.md`:

1. Create new entry with BUG-XXX ID
2. Fill in all required fields
3. Set priority and category
4. Link to failing test case
5. Propose a fix

## Support

For test-related questions:
1. Check this README
2. Review `TEST_IMPLEMENTATION_SUMMARY.md`
3. Check existing test examples
4. Ask in team chat

---

**Last Updated**: 2025-11-11
**Maintainer**: Test Automation Team
