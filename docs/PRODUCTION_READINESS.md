# Production Readiness Checklist

Complete pre-launch checklist for MobVibe production deployment.

## Table of Contents

1. [Code Quality](#code-quality)
2. [Security](#security)
3. [Error Tracking](#error-tracking)
4. [Configuration](#configuration)
5. [App Store Preparation](#app-store-preparation)
6. [Performance Verification](#performance-verification)
7. [Final Checks](#final-checks)

---

## Code Quality

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code with Prettier
npm run format
```

**Checklist:**
- [ ] All ESLint errors fixed
- [ ] All ESLint warnings addressed
- [ ] Code formatted with Prettier
- [ ] No unused imports
- [ ] No commented-out code
- [ ] No `console.log` statements in production code

### TypeScript

```bash
# Type check
npx tsc --noEmit
```

**Checklist:**
- [ ] No TypeScript errors
- [ ] All `any` types justified and documented
- [ ] Proper interfaces for all data structures
- [ ] Return types specified for public functions
- [ ] No implicit `any` types

### Code Review

**Checklist:**
- [ ] All PRs reviewed and approved
- [ ] Code follows project conventions
- [ ] Complex logic documented
- [ ] Functions are single-responsibility
- [ ] No magic numbers or strings
- [ ] Proper error handling everywhere

---

## Security

### Environment Variables

**Development (`.env`):**
```env
# DO NOT commit to Git
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
ANTHROPIC_API_KEY=sk-...
```

**Production (`.env.production`):**
```env
# Managed via EAS Secrets or CI/CD
API_URL=https://api.mobvibe.com
WS_URL=wss://api.mobvibe.com
ANTHROPIC_API_KEY=sk-prod-...
SENTRY_DSN=https://...
```

**Checklist:**
- [ ] All secrets in environment variables (not hardcoded)
- [ ] `.env` file in `.gitignore`
- [ ] Production secrets in EAS Secrets
- [ ] API keys rotated for production
- [ ] Separate development and production keys

### API Security

```typescript
// src/api/client.ts
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

// Always use HTTPS in production
if (__DEV__ === false && !API_URL.startsWith('https://')) {
  throw new Error('Production API must use HTTPS');
}
```

**Checklist:**
- [ ] HTTPS enforced in production
- [ ] API authentication implemented
- [ ] Request timeout configured
- [ ] Rate limiting in place
- [ ] CORS properly configured
- [ ] SQL injection prevention
- [ ] XSS prevention

### Data Security

**Checklist:**
- [ ] Sensitive data encrypted at rest
- [ ] User tokens stored securely (SecureStore)
- [ ] PII handled according to privacy policy
- [ ] Data deletion implemented
- [ ] Backup strategy in place

### Dependency Security

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

**Checklist:**
- [ ] No critical vulnerabilities
- [ ] High-severity vulnerabilities addressed
- [ ] Dependencies up to date
- [ ] License compliance verified

---

## Error Tracking

### Sentry Configuration

**Installation:**
```bash
npm install --save @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

**Configuration (`sentry.config.ts`):**
```typescript
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDsn,
  environment: __DEV__ ? 'development' : 'production',
  enableInExpoDevelopment: false,
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  beforeSend(event) {
    // Strip sensitive data
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
    }
    return event;
  },
});
```

**Usage:**
```typescript
import * as Sentry from '@sentry/react-native';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'PreviewScreen',
      action: 'loadPreview',
    },
    extra: {
      userId: user?.id,
      sessionId: session?.id,
    },
  });
  // Handle error...
}
```

**Checklist:**
- [ ] Sentry initialized
- [ ] DSN configured
- [ ] Source maps uploaded
- [ ] Error boundaries implemented
- [ ] Sensitive data stripped from reports
- [ ] User context added to errors
- [ ] Performance monitoring enabled
- [ ] Release tracking configured

### Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react-native';
import { View, Text, Button } from 'react-native';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong</Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export default Sentry.wrap(ErrorBoundary);
```

**Checklist:**
- [ ] Error boundaries at app root
- [ ] Error boundaries at screen level
- [ ] Graceful error recovery
- [ ] User-friendly error messages
- [ ] Retry mechanisms implemented

---

## Configuration

### App Configuration

**`app.json` / `app.config.ts`:**
```typescript
export default {
  expo: {
    name: "MobVibe",
    slug: "mobvibe",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mobvibe.app",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Used to scan QR codes for app preview",
        NSMicrophoneUsageDescription: "Used for voice input"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      package: "com.mobvibe.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "your-project-id"
      },
      apiUrl: process.env.API_URL,
      wsUrl: process.env.WS_URL,
      sentryDsn: process.env.SENTRY_DSN,
    },
    plugins: [
      "@sentry/react-native",
      "expo-router"
    ]
  }
};
```

**Checklist:**
- [ ] App name and slug configured
- [ ] Version and build number set
- [ ] Bundle identifier (iOS) configured
- [ ] Package name (Android) configured
- [ ] Icons and splash screen added
- [ ] Permissions properly declared
- [ ] Privacy descriptions added
- [ ] EAS project ID configured

### EAS Configuration

**`eas.json`:**
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging-api.mobvibe.com"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.mobvibe.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

**Checklist:**
- [ ] EAS CLI installed
- [ ] Build profiles configured
- [ ] Submit profiles configured
- [ ] Credentials configured
- [ ] Environment variables set

---

## App Store Preparation

### iOS (TestFlight)

**Assets:**
- [ ] App icon (1024x1024 PNG, no alpha)
- [ ] Screenshots (all device sizes)
- [ ] App preview video (optional)

**App Store Connect:**
- [ ] Apple Developer account
- [ ] App created in App Store Connect
- [ ] Bundle ID registered
- [ ] Certificates and profiles configured
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] App description
- [ ] Keywords
- [ ] Category selected

**Build & Submit:**
```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest
```

### Android (Play Internal Testing)

**Assets:**
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (phone + tablet)

**Google Play Console:**
- [ ] Google Play Developer account
- [ ] App created
- [ ] Package name registered
- [ ] Signing key configured
- [ ] Privacy policy URL
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Category selected
- [ ] Content rating questionnaire

**Build & Submit:**
```bash
# Build for Android
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android --latest
```

### Screenshots

**iOS Devices:**
- iPhone 15 Pro Max (6.7")
- iPhone 15 Pro (6.1")
- iPhone SE (4.7")
- iPad Pro 12.9"

**Android Devices:**
- Pixel 7 Pro (6.7")
- Pixel 7 (6.3")
- Tablet (10")

**Screenshot Guidelines:**
- Show key features
- Use actual app content
- No UI chrome (status bars OK)
- Consistent across platforms
- Localized if supporting multiple languages

---

## Performance Verification

### Performance Budget

Run performance checks:
```bash
# Bundle size analysis
node scripts/analyze-bundle.js

# Performance profiling
npm run profile
```

**Targets:**
- [ ] Bundle size <20MB
- [ ] App startup <3s
- [ ] Memory usage <200MB
- [ ] Frame rate 60fps
- [ ] API response <500ms
- [ ] WebView load <3s

### Testing

**Device Testing:**
- [ ] iOS 15+ devices
- [ ] Android 10+ devices
- [ ] Low-end device (2GB RAM)
- [ ] High-end device (8GB RAM)
- [ ] Tablet devices
- [ ] Different screen sizes

**Network Testing:**
- [ ] WiFi
- [ ] 4G/LTE
- [ ] 3G (slow connection)
- [ ] Offline mode
- [ ] Airplane mode transitions

**Load Testing:**
- [ ] Multiple concurrent sessions
- [ ] Large datasets
- [ ] Memory leak testing
- [ ] Long-running sessions

---

## Final Checks

### Pre-Launch Checklist

**Code:**
- [ ] All features complete
- [ ] All bugs fixed
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation updated

**Quality:**
- [ ] Performance targets met
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] No console errors
- [ ] No memory leaks
- [ ] Crash-free rate >99%

**Security:**
- [ ] Security audit passed
- [ ] Secrets secured
- [ ] HTTPS enforced
- [ ] Dependencies audited
- [ ] Privacy policy compliant

**Assets:**
- [ ] All assets optimized
- [ ] Icons in all sizes
- [ ] Splash screens
- [ ] Screenshots ready
- [ ] App Store assets ready

**Configuration:**
- [ ] Environment variables set
- [ ] Error tracking configured
- [ ] Analytics integrated
- [ ] Feature flags ready
- [ ] A/B testing ready

**App Store:**
- [ ] App Store listing complete
- [ ] Privacy policy published
- [ ] Support page live
- [ ] Terms of service published
- [ ] Contact information correct

**Monitoring:**
- [ ] Sentry configured
- [ ] Analytics tracking
- [ ] Performance monitoring
- [ ] Crash reporting
- [ ] Error alerting

### Launch Day

**Before Launch:**
1. Final build and test
2. Submit to stores
3. Monitor submission status
4. Prepare support channels
5. Brief support team

**During Launch:**
1. Monitor error rates
2. Watch crash reports
3. Check performance metrics
4. Monitor user feedback
5. Be ready for hotfixes

**After Launch:**
1. Collect user feedback
2. Monitor analytics
3. Track key metrics
4. Plan iterations
5. Celebrate! 🎉

---

## Post-Launch Monitoring

### Key Metrics

**Performance:**
- App startup time
- Screen render time
- API response times
- WebView load times
- Frame rate consistency

**Stability:**
- Crash-free rate
- Error rate
- API error rate
- Timeout rate
- ANR rate (Android)

**Engagement:**
- Daily active users
- Session duration
- Feature adoption
- Retention rate
- Churn rate

**Business:**
- Sign-ups
- Conversion rate
- Revenue
- LTV
- CAC

### Alerting

Configure alerts for:
- Crash rate >1%
- Error rate >5%
- API response time >1s
- App startup time >5s
- Memory usage >300MB

---

## Support Resources

### Documentation
- [Performance Guide](./PERFORMANCE_OPTIMIZATION.md)
- [Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
- [Main README](../README.md)

### Tools
- [Sentry](https://sentry.io) - Error tracking
- [EAS](https://expo.dev/eas) - Build and submit
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

### Community
- Discord: [Join Community](https://discord.gg/mobvibe)
- GitHub: [Issues](https://github.com/yourusername/mobvibe/issues)
- Email: support@mobvibe.com

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
**Status**: Production Ready ✅
