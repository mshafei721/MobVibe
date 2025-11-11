# Quick Start: Deploy MobVibe in 30 Minutes

**Total time**: ~30 minutes
**Total cost**: $30-65/month (70% cheaper than alternatives)

---

## 🎯 What You'll Deploy

- ✅ Backend API on Fly.io (replaces E2B for sandboxes)
- ✅ Database on Supabase (free tier)
- ✅ Mobile apps via GitHub Actions (free builds)
- ✅ Error monitoring with GlitchTip (free tier)

## ⚡ Prerequisites (5 minutes)

Create these accounts (all have free tiers or trials):

1. **Fly.io** → https://fly.io/app/sign-up
2. **Supabase** → https://supabase.com/dashboard (already have)
3. **GlitchTip** → https://glitchtip.com/register (or use Sentry)
4. **GitHub** → https://github.com (for Actions CI/CD)

Install tools:
```bash
# Fly.io CLI
curl -L https://fly.io/install.sh | sh

# EAS CLI (if not installed)
npm install -g eas-cli
```

## 🚀 Deploy in 3 Commands (15 minutes)

### Step 1: Run Automated Script

```bash
chmod +x scripts/deploy/deploy-simplified.sh
./scripts/deploy/deploy-simplified.sh
```

The script will prompt you for:
- Supabase URL and keys
- Anthropic API key
- Fly.io app name
- GlitchTip DSN (optional)

### Step 2: Configure GitHub Secrets (5 minutes)

Go to: **GitHub repo → Settings → Secrets → Actions → New repository secret**

Add these 6 secrets:
```
EXPO_TOKEN                      (run: eas whoami)
EXPO_PUBLIC_SUPABASE_URL        (from Supabase dashboard)
EXPO_PUBLIC_SUPABASE_ANON_KEY   (from Supabase dashboard)
EXPO_PUBLIC_API_URL             (https://mobvibe-api.fly.dev)
EXPO_PUBLIC_SENTRY_DSN          (from GlitchTip dashboard)
FLY_API_TOKEN                   (run: flyctl auth token)
```

### Step 3: Trigger Build (5 minutes)

```bash
git add .
git commit -m "feat: production deployment"
git push origin main
```

GitHub Actions will:
- Run tests and security checks
- Build iOS and Android apps
- Deploy backend to Fly.io
- Run health checks

**Check progress**: https://github.com/YOUR_USERNAME/MobVibe/actions

---

## ✅ Verify Deployment (5 minutes)

### Backend Health
```bash
curl https://mobvibe-api.fly.dev/health
# Expected: {"status":"ok","timestamp":"..."}
```

### View Logs
```bash
flyctl logs --app mobvibe-api
```

### Check Build Status
- Go to GitHub Actions tab
- Verify all checks passed ✅
- Download artifacts (iOS/Android builds)

---

## 📱 Optional: Submit to Stores

### iOS TestFlight
```bash
eas submit --platform ios --latest
```

### Android Internal Testing
```bash
eas submit --platform android --latest --track internal
```

---

## 💰 Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Fly.io (backend + sandboxes) | $10-15 |
| Anthropic API (usage) | $20-50 |
| Supabase (free tier) | $0 |
| GitHub Actions (free) | $0 |
| GlitchTip (free tier) | $0 |
| **Total** | **$30-65** |

vs Original: $150-200/month ❌
**You save**: $85-170/month ✅

---

## 🔍 Troubleshooting

### "flyctl: command not found"
```bash
# Restart terminal after installing Fly.io CLI
# Or add to PATH manually:
export PATH="$HOME/.fly/bin:$PATH"
```

### Build failing in GitHub Actions
```bash
# Check you added all 6 GitHub secrets
# Verify secrets don't have trailing spaces
```

### Backend health check fails
```bash
# Check logs
flyctl logs --app mobvibe-api

# Verify secrets are set
flyctl secrets list --app mobvibe-api
```

### "API key invalid" errors
```bash
# Make sure using SERVICE_ROLE_KEY for backend
# Make sure using ANON_KEY for frontend
```

---

## 📚 Next Steps

1. **Monitor free tier limits**
   - Supabase: Max 500MB database
   - GlitchTip: Max 1,000 errors/month
   - Check usage: See `docs/DEPLOYMENT_SIMPLIFIED.md`

2. **Test mobile apps**
   - Download builds from GitHub Actions artifacts
   - Install on physical device
   - Test end-to-end flows

3. **Setup monitoring**
   - Check GlitchTip dashboard for errors
   - Monitor Fly.io metrics
   - Review Supabase analytics

4. **Invite beta testers**
   - TestFlight: Up to 100 testers
   - Google Play Internal: Up to 100 testers

---

## 🎉 You're Done!

Your MobVibe app is now deployed and running on production infrastructure for ~$30-65/month.

**Useful commands**:
```bash
# View backend logs
flyctl logs --app mobvibe-api

# Check app status
flyctl status --app mobvibe-api

# SSH into container
flyctl ssh console --app mobvibe-api

# Trigger new build
git push origin main
```

Need more details? See **docs/DEPLOYMENT_SIMPLIFIED.md** for comprehensive guide.
