# Sentry Error Monitoring Setup

## Overview

Sentry is integrated into MobVibe for comprehensive error monitoring and performance tracking across development and production environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Integration Points](#integration-points)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Source Maps](#source-maps)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Create Sentry Project

1. Sign up or log in to [Sentry.io](https://sentry.io)
2. Create a new project:
   - Platform: React Native
   - Alert frequency: Choose your preference
   - Project name: `mobvibe` (or your preference)
3. Copy your DSN (Data Source Name)
   - Format: `https://[key]@[organization].ingest.sentry.io/[project-id]`

### 2. Configure Environment Variables

Add to `.env.production`:

```bash
# Sentry Configuration
EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=mobvibe
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

For development, add to `.env` (optional - errors will be console-logged only):

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
```

### 3. Get Sentry Auth Token

Required for source map uploads (see T017):

1. Go to [Sentry Settings > Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Create new token with scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Copy token to `SENTRY_AUTH_TOKEN` in `.env.production`

## Configuration

### SDK Configuration

Sentry is initialized in `app/_layout.tsx` with the following settings:

```typescript
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: Constants.expoConfig?.version || '1.0.0',
  dist: Constants.expoConfig?.ios?.buildNumber || '1',
  enableInExpoDevelopment: false,
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  beforeSend(event, hint) {
    // Filter configuration
  },
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      enableNativeFramesTracking: !__DEV__,
    }),
  ],
});
```

### Configuration Options

| Option | Development | Production | Description |
|--------|-------------|------------|-------------|
| `dsn` | Optional | Required | Sentry project DSN |
| `environment` | development | production | Environment name |
| `debug` | true | false | Enable debug logging |
| `tracesSampleRate` | 1.0 (100%) | 0.2 (20%) | Performance monitoring sample rate |
| `enableInExpoDevelopment` | false | false | Disable in Expo development |
| `enableNativeFramesTracking` | false | true | Track native frame rates |

### Filtering Events

Events are filtered by the `beforeSend` hook:

- Development: Only errors are sent (if DSN configured)
- Production: All events are sent
- If DSN is not configured: No events are sent (graceful degradation)

## Integration Points

### 1. App Initialization (app/_layout.tsx)

Sentry is initialized before any components render:

```typescript
// Location: Line 9-35
Sentry.init({ ... });
```

Errors during environment validation are captured:

```typescript
// Location: Line 48-53
Sentry.captureException(error, {
  tags: { category: 'env-validation' },
  extra: { context: 'app-startup' },
});
```

### 2. Error Boundary (components/ErrorBoundary.tsx)

React errors are automatically captured:

```typescript
// Location: Line 43-55
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
    tags: { errorBoundary: 'root' },
  });
}
```

### 3. Logger Utility (utils/logger.ts)

Programmatic error logging integrates with Sentry:

```typescript
// Location: Line 135-149
private reportError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      source: 'logger',
      environment: __DEV__ ? 'development' : 'production',
    },
  });
}
```

Usage:

```typescript
import { logger } from '@/utils/logger';

try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, { userId, operationId });
}
```

## Testing

### Test in Development

1. Add test DSN to `.env`:
   ```bash
   EXPO_PUBLIC_SENTRY_DSN=your-dsn-here
   ```

2. Add test error trigger:
   ```typescript
   import * as Sentry from '@sentry/react-native';

   // In a component or screen
   <Button onPress={() => {
     Sentry.captureException(new Error('Test Sentry Integration'));
   }}>
     Test Sentry
   </Button>
   ```

3. Trigger the error and check Sentry dashboard

### Test Error Boundary

```typescript
// Create a component that throws
const BrokenComponent = () => {
  throw new Error('Test Error Boundary');
};

// Use in your app
<BrokenComponent />
```

### Test Logger Integration

```typescript
import { logger } from '@/utils/logger';

logger.error('Test logger integration', new Error('Test error'), {
  testContext: 'value',
  userId: '123',
});
```

### Verify in Sentry Dashboard

1. Go to [Issues](https://sentry.io/organizations/your-org/issues/)
2. Check for test errors
3. Verify context data is attached
4. Check breadcrumbs and stack traces

## Production Deployment

### Pre-Deployment Checklist

- [ ] Sentry project created
- [ ] Production DSN added to `.env.production`
- [ ] Sentry auth token configured (for source maps)
- [ ] Release version matches app version
- [ ] Alerts configured in Sentry dashboard
- [ ] Team members invited to Sentry project
- [ ] Performance monitoring configured (sample rate)

### EAS Build Configuration

If using EAS Build, add secrets:

```bash
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value your-dsn --type string
eas secret:create --name SENTRY_ORG --value your-org --type string
eas secret:create --name SENTRY_PROJECT --value mobvibe --type string
eas secret:create --name SENTRY_AUTH_TOKEN --value your-token --type string
```

### Environment-Specific DSNs

For multiple environments, use different Sentry projects:

```bash
# .env.development
EXPO_PUBLIC_SENTRY_DSN=https://dev-key@org.ingest.sentry.io/dev-project

# .env.staging
EXPO_PUBLIC_SENTRY_DSN=https://staging-key@org.ingest.sentry.io/staging-project

# .env.production
EXPO_PUBLIC_SENTRY_DSN=https://prod-key@org.ingest.sentry.io/prod-project
```

## Source Maps

Source maps enable readable stack traces in production by mapping minified production code back to original source files. Without source maps, production errors will show obfuscated stack traces that are nearly impossible to debug.

### Overview

When you build your app for production, the JavaScript code is:
- Minified (reduced size)
- Bundled (combined files)
- Obfuscated (variable names shortened)

Source maps create a mapping between this production code and your original TypeScript/JavaScript files, making errors readable.

### Prerequisites

1. **Sentry SDK installed**: @sentry/react-native v7.6.0+ (includes source map support)
2. **Sentry project created**: In your Sentry organization
3. **Authentication token**: With required permissions

### Setup Steps

#### Step 1: Create Sentry Auth Token

1. Go to [Sentry Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Click "Create New Token"
3. Configure token:
   - **Name**: `MobVibe Source Maps Upload`
   - **Scopes**:
     - `project:read` - Read project information
     - `project:releases` - Create releases and upload source maps
     - `org:read` - Read organization information
4. Click "Create Token"
5. **Copy the token immediately** (you won't see it again)

#### Step 2: Configure sentry.properties

The `sentry.properties` file in the project root contains Sentry credentials:

```properties
# Sentry organization slug (from https://sentry.io/settings/)
defaults.org=YOUR_SENTRY_ORG_SLUG_HERE

# Sentry project slug
defaults.project=mobvibe

# Sentry instance URL
defaults.url=https://sentry.io/

# Authentication token (from Step 1)
auth.token=YOUR_SENTRY_AUTH_TOKEN_HERE
```

**Replace placeholders**:
- `YOUR_SENTRY_ORG_SLUG_HERE` → Your organization slug
- `YOUR_SENTRY_AUTH_TOKEN_HERE` → Token from Step 1

**Security**: This file is already in `.gitignore` - never commit it to Git!

#### Step 3: Configure EAS Secrets (Alternative to sentry.properties)

For team projects, use EAS secrets instead of local files:

```bash
# Create secrets (run once per project)
eas secret:create --scope project --name SENTRY_ORG --value "your-org-slug"
eas secret:create --scope project --name SENTRY_PROJECT --value "mobvibe"
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "your-token-here"
```

**List secrets** to verify:
```bash
eas secret:list
```

**EAS Build configuration** (already configured in `eas.json`):
```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_ORG": "$SENTRY_ORG",
        "SENTRY_PROJECT": "$SENTRY_PROJECT",
        "SENTRY_AUTH_TOKEN": "$SENTRY_AUTH_TOKEN"
      }
    }
  }
}
```

#### Step 4: Verify Expo Plugin Configuration

The Sentry Expo plugin is already configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "@sentry/react-native/expo",
        {
          "url": "https://sentry.io/"
        }
      ]
    ]
  }
}
```

This plugin automatically:
- Uploads source maps during EAS builds
- Associates source maps with release versions
- Configures proper release/dist identifiers

### How It Works

#### During Build

1. **EAS Build starts**: Reads Sentry configuration from environment
2. **App builds**: Metro bundler creates production JavaScript bundles
3. **Source maps generated**: Metro creates .map files alongside bundles
4. **Sentry plugin runs**: Uploads source maps to Sentry
5. **Release created**: Sentry associates source maps with app version

#### During Error Reporting

1. **Error occurs**: In production app on user device
2. **Sentry captures**: Minified stack trace with file/line numbers
3. **Sentry processes**: Applies source maps to de-minify stack trace
4. **Dashboard shows**: Original TypeScript files with readable code

### Testing Source Maps

#### Option 1: Test with Production Build

```bash
# Build for production (this uploads source maps)
eas build --platform android --profile production

# Monitor build logs for source map upload confirmation
# Look for: "Sentry: Source maps uploaded successfully"

# After build completes, test the app and trigger an error
# Check Sentry dashboard for readable stack traces
```

#### Option 2: Local Testing (Development)

Source maps work automatically in development - no upload needed. Test the error reporting flow:

```typescript
// Add to any screen for testing
import * as Sentry from '@sentry/react-native';

// Trigger test error
Sentry.captureException(new Error('Test source map - this should show readable stack trace'));

// Or use a throw to test Error Boundary
throw new Error('Test Error Boundary');
```

### Verifying Source Map Upload

#### Check Build Logs

During EAS build, look for Sentry plugin output:

```
[sentry-expo] Uploading source maps to Sentry...
[sentry-expo] Release: mobvibe@1.0.0
[sentry-expo] Dist: 1
[sentry-expo] ✓ Source maps uploaded successfully
[sentry-expo] ✓ Release finalized
```

#### Check Sentry Dashboard

1. Go to **Settings → Projects → mobvibe → Source Maps**
2. Find your release version (e.g., `mobvibe@1.0.0`)
3. Verify artifacts are listed:
   - `index.android.bundle` (or similar)
   - `index.android.bundle.map`
4. Check upload timestamp matches your build time

#### Test Error Stack Traces

1. Trigger an error in production build
2. Go to **Issues** in Sentry dashboard
3. Open the error event
4. Check stack trace shows:
   - ✅ Original file names (e.g., `src/hooks/useAssetLibrary.ts`)
   - ✅ Original line numbers
   - ✅ Readable code snippets
   - ✅ Function names

If you see minified code like `e.r.t()` instead, source maps aren't working.

### Release Versioning

Source maps are tied to specific release versions. Ensure consistency:

#### Release Version
Set in `app.json`:
```json
{
  "expo": {
    "version": "1.0.0"
  }
}
```

#### Distribution (Dist)
Build number, auto-incremented:
```json
{
  "expo": {
    "ios": {
      "buildNumber": "1"
    },
    "android": {
      "versionCode": 1
    }
  }
}
```

#### Sentry Configuration
In `app/_layout.tsx`:
```typescript
Sentry.init({
  release: Constants.expoConfig?.version || '1.0.0',
  dist: Constants.expoConfig?.ios?.buildNumber ||
        Constants.expoConfig?.android?.versionCode?.toString() || '1',
});
```

### Multiple Environments

For staging/preview environments, create separate Sentry projects:

```bash
# Development
EXPO_PUBLIC_SENTRY_DSN=https://key1@org.ingest.sentry.io/dev-project

# Staging/Preview
EXPO_PUBLIC_SENTRY_DSN=https://key2@org.ingest.sentry.io/staging-project

# Production
EXPO_PUBLIC_SENTRY_DSN=https://key3@org.ingest.sentry.io/prod-project
```

Configure separate EAS secrets:
```bash
eas secret:create --scope project --name SENTRY_PROJECT_PREVIEW --value "mobvibe-staging"
eas secret:create --scope project --name SENTRY_PROJECT_PRODUCTION --value "mobvibe"
```

### Configuration Files Summary

| File | Purpose | Committed to Git? |
|------|---------|------------------|
| `sentry.properties` | Local auth credentials | ❌ No (.gitignore) |
| `eas.json` | EAS build configuration | ✅ Yes |
| `app.json` | Expo/Sentry plugin config | ✅ Yes |
| `app/_layout.tsx` | Sentry SDK initialization | ✅ Yes |
| `.env.production` | Production DSN | ❌ No (.gitignore) |

### Troubleshooting

#### Source Maps Not Uploading

**Symptom**: Build succeeds but no source maps in Sentry dashboard

**Solutions**:
1. Check `sentry.properties` has correct credentials
2. Verify EAS secrets are set: `eas secret:list`
3. Check build logs for Sentry plugin errors
4. Ensure `@sentry/react-native` is v7.6.0+
5. Verify auth token has `project:releases` scope

#### Stack Traces Still Minified

**Symptom**: Errors appear in Sentry but code is unreadable

**Solutions**:
1. Verify source maps uploaded for exact release version
2. Check release/dist match between app and Sentry:
   ```typescript
   console.log('Release:', Constants.expoConfig?.version);
   console.log('Dist:', Constants.expoConfig?.android?.versionCode);
   ```
3. Rebuild app and re-upload source maps
4. Check source map files exist in Sentry dashboard

#### Auth Token Errors

**Symptom**: Build fails with "Authentication failed" or "401 Unauthorized"

**Solutions**:
1. Verify token hasn't expired
2. Check token has required scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
3. Recreate token if needed
4. Update `sentry.properties` or EAS secret

#### Wrong Organization/Project

**Symptom**: Upload succeeds but source maps appear in wrong project

**Solutions**:
1. Verify `SENTRY_ORG` matches your organization slug
2. Verify `SENTRY_PROJECT` matches your project slug
3. Check `sentry.properties` or EAS secrets
4. List Sentry projects: https://sentry.io/settings/projects/

#### Release Not Found

**Symptom**: Sentry shows "Release not found" for errors

**Solutions**:
1. Ensure app version matches uploaded release
2. Check `app.json` version and build numbers
3. Verify source maps uploaded for current version
4. Check release exists in Sentry dashboard

### Best Practices

1. **Use EAS Secrets** for team projects (vs local `sentry.properties`)
2. **Automate versioning** with `autoIncrement` in `eas.json`
3. **Test source maps** after each major release
4. **Monitor upload success** in build logs
5. **Keep tokens secure** - never commit to Git
6. **Rotate tokens periodically** (every 90 days)
7. **Use separate projects** for dev/staging/production
8. **Document token location** in team password manager

### Performance Considerations

- **Upload time**: Adds 30-60 seconds to build time
- **Storage**: ~2-5MB per release in Sentry
- **API calls**: One upload per build (within rate limits)
- **No runtime impact**: Source maps not downloaded to devices

### Security Considerations

- **Auth tokens**: Store in EAS secrets or password manager
- **Source maps**: Contain original code - keep Sentry project private
- **API access**: Limit token scopes to minimum required
- **Team access**: Use Sentry teams for access control

### Related Configuration

- **T001**: Complete Sentry Integration (prerequisite)
- **T020**: Setup Error Monitoring Alerts (depends on source maps)
- **EAS Build**: See `eas.json` for build configuration
- **Sentry SDK**: See `app/_layout.tsx` for initialization

### Additional Resources

- [Sentry Source Maps Guide](https://docs.sentry.io/platforms/react-native/sourcemaps/)
- [Expo Sentry Configuration](https://docs.expo.dev/guides/using-sentry/)
- [EAS Build Secrets](https://docs.expo.dev/build-reference/variables/)
- [Sentry CLI Reference](https://docs.sentry.io/product/cli/)

## Best Practices

### 1. Add Context to Errors

```typescript
Sentry.captureException(error, {
  tags: {
    feature: 'asset-generation',
    assetType: 'icon',
  },
  extra: {
    userId: user.id,
    projectId: project.id,
    prompt: sanitizedPrompt,
  },
  level: 'error',
});
```

### 2. Set User Context

```typescript
import * as Sentry from '@sentry/react-native';

// After authentication
Sentry.setUser({
  id: user.id,
  email: user.email, // Only if user consents
  username: user.username,
});

// On logout
Sentry.setUser(null);
```

### 3. Add Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to asset generation',
  level: 'info',
  data: {
    screen: 'AssetGeneration',
    timestamp: Date.now(),
  },
});
```

### 4. Filter Sensitive Data

Update `beforeSend` hook:

```typescript
beforeSend(event, hint) {
  // Remove sensitive data
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers?.['Authorization'];
  }

  // Filter PII from extra data
  if (event.extra) {
    event.extra = sanitizeSensitiveData(event.extra);
  }

  return event;
}
```

### 5. Performance Monitoring

Track custom operations:

```typescript
const transaction = Sentry.startTransaction({
  name: 'Asset Generation',
  op: 'task',
});

const span = transaction.startChild({
  op: 'http.client',
  description: 'Generate Icon API Call',
});

try {
  await generateIcon(prompt);
  span.setStatus('ok');
} catch (error) {
  span.setStatus('internal_error');
  throw error;
} finally {
  span.finish();
  transaction.finish();
}
```

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN Configuration**
   ```typescript
   console.log('Sentry DSN:', process.env.EXPO_PUBLIC_SENTRY_DSN);
   ```

2. **Verify Sentry is Initialized**
   ```typescript
   import * as Sentry from '@sentry/react-native';
   console.log('Sentry client:', Sentry.getCurrentHub().getClient());
   ```

3. **Check beforeSend Hook**
   - Ensure it's not filtering all events
   - Add logging to see what's being filtered

4. **Test with Manual Capture**
   ```typescript
   Sentry.captureMessage('Test message', 'info');
   ```

### Source Maps Not Working

See T017 documentation. Common issues:

- Auth token not configured
- Release version mismatch
- Build/dist mismatch
- Upload step not running

### Performance Impact

Monitor SDK performance:

1. Check bundle size impact: ~200KB
2. Monitor initialization time: <50ms
3. Adjust `tracesSampleRate` if needed
4. Disable in development: `enableInExpoDevelopment: false`

### Rate Limiting

If hitting rate limits:

1. Reduce `tracesSampleRate`
2. Add more aggressive filtering in `beforeSend`
3. Group similar errors
4. Upgrade Sentry plan

## Additional Resources

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Expo Sentry Configuration](https://docs.expo.dev/guides/using-sentry/)
- [Sentry Performance Monitoring](https://docs.sentry.io/platforms/react-native/performance/)
- [Sentry Error Tracking](https://docs.sentry.io/platforms/react-native/usage/)

## Related Tasks

- **T001**: Complete Sentry Integration - ✅ COMPLETE
- **T017**: Configure Sentry Source Maps - ✅ COMPLETE
- **T020**: Set Up Monitoring & Alerting System (depends on T001, T017)
- **T012**: Implement Proper Error Handling (uses T001)

## Support

For issues or questions:

1. Check [Sentry Status](https://status.sentry.io/)
2. Review [Sentry Docs](https://docs.sentry.io/)
3. Contact team lead or DevOps engineer
4. Open internal support ticket

---

Last Updated: 2025-11-12
Tasks:
- T001 - Complete Sentry Integration (✅ COMPLETE)
- T017 - Configure Sentry Source Maps (✅ COMPLETE)
Status: Production Ready
