# Sentry Source Maps - Quick Start Guide

**For**: Developers setting up Sentry source maps for the first time
**Time**: 5-10 minutes
**Prerequisites**: Sentry account with mobvibe project

## TL;DR

Source maps make production error stack traces readable. You need to:
1. Get a Sentry auth token
2. Configure either EAS secrets OR sentry.properties
3. Build with EAS (source maps upload automatically)

## Quick Setup (Choose One)

### Option A: EAS Secrets (Recommended for Teams)

```bash
# 1. Create auth token at: https://sentry.io/settings/account/api/auth-tokens/
#    Scopes: project:read, project:releases, org:read

# 2. Get your organization slug from: https://sentry.io/settings/

# 3. Set EAS secrets
eas secret:create --scope project --name SENTRY_ORG --value "your-org-slug"
eas secret:create --scope project --name SENTRY_PROJECT --value "mobvibe"
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "your-token-here"

# 4. Verify
eas secret:list

# 5. Build
eas build --platform android --profile production
```

### Option B: Local sentry.properties (For Individual Developers)

```bash
# 1. Create auth token (same as above)

# 2. Edit sentry.properties in project root:
defaults.org=your-org-slug
defaults.project=mobvibe
defaults.url=https://sentry.io/
auth.token=your-auth-token-here

# 3. Build
eas build --platform android --profile production
```

## Verification

### Check Build Logs

Look for this in your EAS build logs:

```
[sentry-expo] Uploading source maps to Sentry...
[sentry-expo] Release: mobvibe@1.0.0
[sentry-expo] ✓ Source maps uploaded successfully
```

### Check Sentry Dashboard

1. Go to https://sentry.io
2. Navigate to: **Settings → Projects → mobvibe → Source Maps**
3. Find release version (e.g., `mobvibe@1.0.0`)
4. Verify artifacts are listed

### Test Error Stack Traces

1. Trigger an error in your production build
2. Check Sentry Issues dashboard
3. Stack trace should show:
   - Original file names (e.g., `src/hooks/useAssetLibrary.ts`)
   - Line numbers matching your code
   - Readable code snippets

## Common Issues

| Problem | Solution |
|---------|----------|
| "Authentication failed" | Check auth token hasn't expired, verify scopes |
| Source maps not showing | Verify release version matches app version |
| Still seeing minified code | Rebuild app, check release version consistency |
| Build fails at upload step | Check organization/project slugs are correct |

## What Files Were Changed?

- `eas.json` - Added Sentry env vars to production build
- `app.json` - Sentry plugin already configured
- `sentry.properties` - Created (you need to edit this)
- `.gitignore` - Updated to exclude sentry.properties
- `docs/SENTRY_SETUP.md` - Full documentation

## Security Notes

- **Never commit** `sentry.properties` (already in .gitignore)
- **Store tokens** in password manager
- **Use EAS secrets** for team projects
- **Rotate tokens** every 90 days

## Need Help?

- **Full Documentation**: See `docs/SENTRY_SETUP.md` (Source Maps section)
- **Implementation Details**: See `docs/T017_SOURCE_MAPS_IMPLEMENTATION.md`
- **Sentry Docs**: https://docs.sentry.io/platforms/react-native/sourcemaps/

## Files Reference

```
D:\009_Projects_AI\Personal_Projects\MobVibe\
├── sentry.properties (edit this with your credentials)
├── eas.json (already configured)
└── docs/
    ├── SENTRY_SETUP.md (complete guide)
    ├── T017_SOURCE_MAPS_IMPLEMENTATION.md (implementation details)
    └── SENTRY_QUICKSTART.md (this file)
```

---

**Status**: Configuration complete, ready for credentials
**Last Updated**: 2025-11-12
**Related Tasks**: T001 (Sentry Integration), T017 (Source Maps)
