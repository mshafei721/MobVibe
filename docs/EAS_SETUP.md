# EAS (Expo Application Services) Setup

Last updated: 2025-11-12
Status: PRODUCTION READY

## Overview

EAS Build is configured for building and submitting MobVibe to both Google Play Store and Apple App Store. This document covers the complete setup, configuration, and usage of EAS for production deployments.

## Project Information

- **Project Name**: @mido721/mobvibe
- **Project ID**: `e936e0d5-d68b-4fe2-a183-0309727ab4a5`
- **Dashboard**: https://expo.dev/accounts/mido721/projects/mobvibe
- **Owner**: mido721

## Configuration Files

### eas.json

Located at: `D:\009_Projects_AI\Personal_Projects\MobVibe\eas.json`

Three build profiles are configured:

#### 1. Development Profile
```json
{
  "developmentClient": true,
  "distribution": "internal",
  "ios": {
    "simulator": true
  },
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleDebug"
  },
  "env": {
    "NODE_ENV": "development"
  }
}
```

**Purpose**: Development builds with debug mode enabled for local testing.

**Usage**:
```bash
eas build --platform android --profile development
```

#### 2. Preview Profile
```json
{
  "distribution": "internal",
  "channel": "preview",
  "ios": {
    "simulator": false,
    "buildConfiguration": "Release"
  },
  "android": {
    "buildType": "apk"
  },
  "env": {
    "NODE_ENV": "preview"
  }
}
```

**Purpose**: Internal testing builds for QA and stakeholders.

**Usage**:
```bash
eas build --platform android --profile preview
```

#### 3. Production Profile
```json
{
  "distribution": "store",
  "channel": "production",
  "autoIncrement": true,
  "ios": {
    "buildConfiguration": "Release"
  },
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease"
  },
  "env": {
    "NODE_ENV": "production",
    "EXPO_PUBLIC_ENVIRONMENT": "production"
  }
}
```

**Purpose**: Production builds for app store submission.

**Features**:
- Auto-increments build numbers
- Optimized release builds
- Production environment variables
- Store-ready distribution

**Usage**:
```bash
eas build --platform android --profile production
```

### app.json

Bundle identifiers are configured in `app.json`:

```json
{
  "expo": {
    "name": "MobVibe",
    "slug": "mobvibe",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.mobvibe.app"
    },
    "android": {
      "package": "com.mobvibe.app"
    },
    "extra": {
      "eas": {
        "projectId": "e936e0d5-d68b-4fe2-a183-0309727ab4a5"
      }
    },
    "owner": "mido721"
  }
}
```

## Environment Variables

### Production Environment Variables

Environment variables are managed through EAS and stored securely on Expo's servers.

#### Currently Configured Variables

Run `eas env:list --environment production` to view:

| Variable | Visibility | Description |
|----------|------------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Sensitive | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Sensitive | Supabase anonymous key |
| `EXPO_PUBLIC_API_URL` | Sensitive | Backend API URL (Fly.io) |
| `EXPO_PUBLIC_APP_NAME` | Plain text | Application name |
| `EXPO_PUBLIC_APP_SCHEME` | Plain text | Deep linking scheme |
| `NODE_ENV` | Plain text | Set to "production" |
| `EXPO_PUBLIC_ENVIRONMENT` | Plain text | Set to "production" |

#### Adding New Environment Variables

```bash
# Syntax
eas env:create <environment> \
  --name <VARIABLE_NAME> \
  --value "<variable-value>" \
  --visibility <plaintext|sensitive|secret> \
  --scope project \
  --non-interactive

# Example: Add a new API key
eas env:create production \
  --name EXPO_PUBLIC_NEW_API_KEY \
  --value "your-api-key-here" \
  --visibility sensitive \
  --scope project \
  --non-interactive
```

#### Variable Visibility Guidelines

- **plaintext**: Non-sensitive configuration (app names, URLs)
- **sensitive**: API keys visible in compiled app (client-side secrets)
- **secret**: Server-side secrets (NOT for `EXPO_PUBLIC_*` variables)

**Important**: Variables prefixed with `EXPO_PUBLIC_` are bundled into the JavaScript and visible in the compiled app. Never use "secret" visibility for these variables.

#### Updating Environment Variables

```bash
# Update a variable
eas env:update --name EXPO_PUBLIC_API_URL --value "new-value" --environment production
```

#### Deleting Environment Variables

```bash
# Delete a variable
eas env:delete --name VARIABLE_NAME --environment production
```

### Local Environment Files

For local development, environment variables are stored in:

- `.env.development` - Development environment
- `.env.preview` - Preview environment
- `.env.production` - Production environment (reference only, use EAS env for builds)

**Note**: These files are NOT uploaded to EAS builds. Use `eas env:create` to configure variables for cloud builds.

## Building for Production

### Prerequisites

1. **EAS CLI installed**:
   ```bash
   npm install -g eas-cli
   ```

2. **Logged into Expo account**:
   ```bash
   eas login
   # Verify: eas whoami
   ```

3. **Environment variables configured**:
   ```bash
   eas env:list --environment production
   ```

### Build Commands

#### Android Production Build

```bash
# Build Android APK for production
eas build --platform android --profile production

# Build Android App Bundle (AAB) for Play Store
eas build --platform android --profile production --build-type app-bundle
```

**Note**: First build typically takes 15-30 minutes. Subsequent builds are faster due to caching.

#### iOS Production Build

```bash
# Build iOS for App Store
eas build --platform ios --profile production
```

**Requirements**:
- Apple Developer account
- App Store Connect app created
- iOS certificates and provisioning profiles (managed by EAS)

#### Build Both Platforms

```bash
eas build --platform all --profile production
```

### Build Options

```bash
# Local build (requires Android Studio / Xcode installed)
eas build --platform android --profile production --local

# Clear cache and rebuild
eas build --platform android --profile production --clear-cache

# Specific build version
eas build --platform android --profile production --auto-submit
```

### Monitoring Builds

1. **View build status**:
   ```bash
   eas build:list
   ```

2. **View specific build details**:
   ```bash
   eas build:view [BUILD_ID]
   ```

3. **Build logs**:
   - Web dashboard: https://expo.dev/accounts/mido721/projects/mobvibe/builds
   - CLI: `eas build:view [BUILD_ID]`

4. **Download build artifact**:
   ```bash
   eas build:download [BUILD_ID]
   ```

## Submitting to Stores

### Google Play Store

#### Prerequisites

1. Create app in Google Play Console
2. Generate service account key JSON
3. Place at `./secrets/google-play-service-account.json`
4. Grant access to Play Console API

#### Submit Command

```bash
# Submit latest production build
eas submit --platform android --latest

# Submit specific build
eas submit --platform android --id [BUILD_ID]

# Submit with specific track
eas submit --platform android --latest --track internal
```

**Available tracks**:
- `internal` - Internal testing
- `alpha` - Closed testing
- `beta` - Open testing
- `production` - Production release

### Apple App Store

#### Prerequisites

1. Apple Developer account
2. App created in App Store Connect
3. Environment variables set:
   - `APPLE_ID` - Your Apple ID email
   - `ASC_APP_ID` - App Store Connect app ID
   - `APPLE_TEAM_ID` - Apple Developer Team ID

#### Submit Command

```bash
# Submit latest iOS build
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id [BUILD_ID]
```

#### Managing iOS Credentials

```bash
# View credentials
eas credentials

# Update credentials
eas credentials --platform ios
```

## CI/CD Integration

### GitHub Actions

Example workflow for automated builds:

```yaml
name: EAS Build

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
```

**Required GitHub Secrets**:
- `EXPO_TOKEN` - Get from `D:\009_Projects_AI\Personal_Projects\MobVibe\.env.production`

## Troubleshooting

### Common Issues

#### Build Fails: Missing Environment Variables

**Symptom**: Build fails with "undefined is not an object"

**Solution**:
```bash
# Verify all variables are set
eas env:list --environment production --include-sensitive

# Add missing variables
eas env:create production --name MISSING_VAR --value "value"
```

#### Build Fails: Invalid Credentials

**Symptom**: "No valid credentials found"

**Solution**:
```bash
# For iOS
eas credentials --platform ios

# For Android
eas credentials --platform android
```

#### Build Fails: Gradle Error (Android)

**Symptom**: "Gradle build failed"

**Solutions**:
1. Clear cache: `eas build --platform android --profile production --clear-cache`
2. Check `android/build.gradle` for syntax errors
3. Verify SDK versions in `app.json`

#### Build Succeeds but App Crashes

**Symptom**: Build completes but app crashes on launch

**Solutions**:
1. Check Sentry for error logs
2. Verify environment variables in build
3. Test with development build first
4. Check native module compatibility

### Getting Help

1. **Build logs**: Check full logs in web dashboard
2. **EAS status**: https://status.expo.dev/
3. **Community**: https://forums.expo.dev/
4. **Documentation**: https://docs.expo.dev/eas/

### Debug Commands

```bash
# Validate configuration
eas config --platform android --profile production

# Check project status
eas project:info

# View recent builds
eas build:list --limit 10

# Cancel running build
eas build:cancel [BUILD_ID]
```

## Version Management

### Build Number Auto-Increment

The production profile has `autoIncrement: true`, which automatically increments the build number on each build.

**Current version**: Check `app.json` for `version` field.

### Updating App Version

```json
// app.json
{
  "expo": {
    "version": "1.0.0"  // Update this for new releases
  }
}
```

**Commit the change before building**:
```bash
git add app.json
git commit -m "chore: Bump version to 1.1.0"
eas build --platform all --profile production
```

## Security Best Practices

### Secrets Management

1. **Never commit** `.env.production` with real secrets
2. **Use EAS environment variables** for all sensitive data
3. **Rotate keys** periodically
4. **Use different keys** for development/production
5. **Enable 2FA** on Expo account

### Code Signing

- **iOS**: Managed by EAS (auto-generated/renewed)
- **Android**: Keystore managed by EAS
- **Backup**: Download and store credentials securely

```bash
# Download Android keystore
eas credentials --platform android
```

### Access Control

- **Project access**: Manage at https://expo.dev/accounts/mido721/projects/mobvibe/settings
- **Team members**: Add via Expo dashboard
- **CI/CD tokens**: Use scoped tokens, rotate regularly

## Additional Resources

### Official Documentation

- [EAS Build Overview](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Environment Variables](https://docs.expo.dev/eas/environment-variables/)
- [Managing Credentials](https://docs.expo.dev/app-signing/managed-credentials/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)

### Related Documentation

- `docs/SENTRY_SETUP.md` - Error monitoring configuration
- `docs/DEPLOYMENT_CHECKLIST_ASSETS.md` - Pre-deployment checklist
- `docs/PRODUCTION_READINESS.md` - Production readiness guide

### Quick Reference

```bash
# Login
eas login

# Build production
eas build --platform android --profile production

# Submit to store
eas submit --platform android --latest

# View builds
eas build:list

# Manage environment variables
eas env:list --environment production

# View project info
eas project:info

# Check configuration
eas config --platform android --profile production
```

## Support

For issues related to EAS configuration in MobVibe:
1. Check this documentation
2. Review build logs in Expo dashboard
3. Check related docs in `docs/` folder
4. Verify environment variables are set correctly

---

**Last Reviewed**: 2025-11-12
**Configuration Version**: 1.0.0
**EAS CLI Version**: 16.26.0+
