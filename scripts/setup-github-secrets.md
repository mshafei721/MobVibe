# GitHub Secrets Setup Guide

Complete these steps to configure GitHub Actions for automated builds.

## Add These 7 Secrets

Go to: **https://github.com/YOUR_USERNAME/MobVibe/settings/secrets/actions/new**

### 1. EXPO_TOKEN
```
spSdwtbmn8VavY3Dx4hfmHPIfrrBFjxDpK5S7q-v
```

### 2. EXPO_PUBLIC_SUPABASE_URL
```
https://vdmvgxuieblknmvxesop.supabase.co
```

### 3. EXPO_PUBLIC_SUPABASE_ANON_KEY
```
[Get from: https://supabase.com/dashboard → Project → Settings → API → anon/public key]
```

### 4. EXPO_PUBLIC_API_URL
```
https://mobvibe-api-divine-silence-9977.fly.dev
```

### 5. FLY_API_TOKEN
```
[Run command: flyctl auth token]
```

### 6. ANTHROPIC_API_KEY
```
<YOUR_ANTHROPIC_API_KEY_FROM_.ENV.PRODUCTION>
```

### 7. SUPABASE_SERVICE_ROLE_KEY
```
[Get from: https://supabase.com/dashboard → Project → Settings → API → service_role key]
```

## Quick Commands to Get Missing Values

```powershell
# Get Fly.io token
flyctl auth token

# Get Supabase keys (if you don't have them)
# Go to: https://supabase.com/dashboard
# Select your project → Settings → API
# Copy both anon/public and service_role keys
```

## Verification

After adding all secrets, verify by going to:
**Settings → Secrets and variables → Actions**

You should see all 7 secrets listed (values are hidden).
