# GitHub Secrets Setup - MobVibe

Add these 7 secrets to enable automated mobile app builds via GitHub Actions.

## Where to Add Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings → Secrets and variables → Actions**
3. Click: **New repository secret**
4. Add each secret below

## Required Secrets

### 1. EXPO_TOKEN
**Value:**
```
spSdwtbmn8VavY3Dx4hfmHPIfrrBFjxDpK5S7q-v
```

---

### 2. EXPO_PUBLIC_SUPABASE_URL
**Value:**
```
https://vdmvgxuieblknmvxesop.supabase.co
```

---

### 3. EXPO_PUBLIC_SUPABASE_ANON_KEY
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbXZneHVpZWJsa25tdnhlc29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzAxMzYsImV4cCI6MjA3ODQ0NjEzNn0.csLIhNcPG5Kmb3Aaapfo6zH5qqCCLHuYxmIlruys3Gg
```

---

### 4. SUPABASE_SERVICE_ROLE_KEY
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbXZneHVpZWJsa25tdnhlc29wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg3MDEzNiwiZXhwIjoyMDc4NDQ2MTM2fQ.A5SR4gNVo0o2sH1V0hkwDwNPj7Q1WfIKQNwEQQwdFEI
```

---

### 5. EXPO_PUBLIC_API_URL
**Value:**
```
https://mobvibe-api-divine-silence-9977.fly.dev
```

---

### 6. FLY_API_TOKEN
**Value:**
```
fm2_lJPECAAAAAAACvnyxBA6PM2to1bLO4kDkwh7kmmEwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABR6ax8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDxdOQIwQ0rbwiToryuzjY1Gq6WSLfP195z/WEVyu6TZGv+LJ6DCDZKOWshy26zX7+AH4XMD/3qy2AAS1xTETgggGzjyR6PRwfk2f41e9o4HXZrLmFyyD4/qaLQGTbAB4Xx/3ceV3WAoEkLXn8J6Te0vtA4LlvXaNnlMFQhf3U7UsEl+xlH+M5q7TZRUXcQgmeEy7CUiCMDeClc+q2gfvs0V4xwhKZGJYxe+UH5rjrE=,fm2_lJPETgggGzjyR6PRwfk2f41e9o4HXZrLmFyyD4/qaLQGTbAB4Xx/3ceV3WAoEkLXn8J6Te0vtA4LlvXaNnlMFQhf3U7UsEl+xlH+M5q7TZRUXcQQcv9cM8VnaG5cBYyK2nGK3MO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZYEks5pE08xzmkTUacXzgATq3cKkc4AE6t3xCAx+PHK8XKIEkUa0sCAko5e7u7QK6aq1b5EEUKZR9gKAg==,fo1_E9spPnbNIq4MGOYlMYoca_b0VbJ0lTU0BGXQVcepxuY
```

---

### 7. ANTHROPIC_API_KEY
**Value:**
```
<YOUR_ANTHROPIC_API_KEY_FROM_.ENV.PRODUCTION>
```

---

## Verification

After adding all 7 secrets:

1. Go to: **Settings → Secrets and variables → Actions**
2. Verify all 7 secrets are listed (values will be hidden)
3. Test by pushing a commit to trigger GitHub Actions

## Next Steps After Setup

1. **Test Mobile Build:**
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```

2. **Monitor Backend:**
   - Dashboard: https://fly.io/apps/mobvibe-api-divine-silence-9977/monitoring
   - Logs: `flyctl logs --app mobvibe-api-divine-silence-9977`

3. **Backup Credentials:**
   - Store `.env.production` in password manager
   - Keep this file secure (NOT in Git)

---

**⚠️ SECURITY WARNING:**
- Never commit this file to Git
- Never share these secrets publicly
- Rotate keys immediately if exposed
