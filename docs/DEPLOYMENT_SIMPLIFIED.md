# MobVibe Simplified Deployment Guide

**Optimized for cost and simplicity**
Estimated monthly cost: **$30-65** (70% cheaper than original $150-200/month plan)

---

## 🎯 Overview

This deployment strategy consolidates services and uses free tiers wherever possible while maintaining production quality.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile Apps                          │
│  iOS (TestFlight) + Android (Internal Testing)          │
│           Built with GitHub Actions (Free)               │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              Fly.io (~$10-15/month)                      │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  Backend Worker  │  │  Code Sandboxes              ││
│  │  (512MB, 1 vCPU) │  │  (Fly.io Machines API)       ││
│  │                  │  │  Scale to zero               ││
│  └──────────────────┘  └──────────────────────────────┘│
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│          Supabase Free Tier ($0/month)                   │
│  • 500MB Database  • 1GB Storage  • 2GB Bandwidth       │
│  • Unlimited Auth  • Row-Level Security                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│      GlitchTip Free Tier ($0/month)                      │
│  • 1,000 errors/month  • Sentry-compatible              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│        Anthropic API (~$20-50/month)                     │
│  Pay-as-you-go pricing (unavoidable)                    │
└─────────────────────────────────────────────────────────┘
```

### Key Benefits

✅ **70% cost reduction** ($85-155/month savings)
✅ **3 paid services** instead of 7
✅ **Simplified management** - fewer dashboards to monitor
✅ **Production-ready** - all services are battle-tested
✅ **Easy to scale** - upgrade individual services as needed

---

## 📋 Prerequisites

### Required Accounts

1. **Fly.io** (https://fly.io)
   - Cost: ~$10-15/month
   - Hosts: Backend worker + code sandboxes (replaces E2B!)
   - Credit card required

2. **Supabase** (https://supabase.com)
   - Cost: $0 (free tier)
   - Provides: Database, Auth, Storage
   - Limits: 500MB DB, 1GB storage, 2GB bandwidth

3. **Anthropic** (https://console.anthropic.com)
   - Cost: ~$20-50/month usage-based
   - Required for Claude API
   - Pay-as-you-go

4. **GitHub** (https://github.com)
   - Cost: $0 (Actions free for public repos)
   - Used for: CI/CD builds

5. **GlitchTip** (https://glitchtip.com) OR Sentry
   - Cost: $0 (free tier: 1k errors/month)
   - Monitoring and error tracking
   - Sentry-compatible API

6. **Apple Developer** ($99/year) + **Google Play** ($25 one-time)
   - Required for app store distribution
   - Only needed when submitting to stores

### Required Tools

```bash
# Node.js 18+
node --version

# Fly.io CLI
curl -L https://fly.io/install.sh | sh

# EAS CLI
npm install -g eas-cli

# Git
git --version
```

---

## 🚀 Quick Start (Automated)

Use the automated deployment script:

```bash
# Make script executable
chmod +x scripts/deploy/deploy-simplified.sh

# Run deployment
./scripts/deploy/deploy-simplified.sh
```

The script will:
1. Check prerequisites
2. Login to Fly.io
3. Collect configuration (API keys, URLs)
4. Create Fly.io app
5. Set secrets
6. Deploy backend
7. Run health checks
8. Configure mobile environment
9. Provide next steps

---

## 📖 Manual Deployment (Step-by-Step)

### Step 1: Fly.io Setup

```bash
# Login to Fly.io
flyctl auth login

# Create app
cd backend/worker
flyctl apps create mobvibe-api --org personal

# Set secrets
flyctl secrets set \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  ANTHROPIC_API_KEY="your-anthropic-api-key" \
  FLY_API_TOKEN="$(flyctl auth token)" \
  FLY_REGION="sjc"

# Deploy
flyctl deploy

# Check status
flyctl status
flyctl logs
```

### Step 2: Supabase Configuration

Your Supabase project should already be set up from development. Verify:

```sql
-- Check database size (should be < 500MB for free tier)
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table counts
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Step 3: Mobile Environment

Create `.env` file in project root:

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API
EXPO_PUBLIC_API_URL=https://mobvibe-api.fly.dev

# Monitoring
EXPO_PUBLIC_SENTRY_DSN=https://your-glitchtip-or-sentry-dsn

# Environment
EXPO_PUBLIC_ENVIRONMENT=production
```

### Step 4: GitHub Actions Setup

Add these secrets to your GitHub repository:
**Settings > Secrets and variables > Actions > New repository secret**

Required secrets:
```
EXPO_TOKEN                      # Get with: eas whoami
EXPO_PUBLIC_SUPABASE_URL        # Your Supabase URL
EXPO_PUBLIC_SUPABASE_ANON_KEY   # Your Supabase anon key
EXPO_PUBLIC_API_URL             # Your Fly.io app URL
EXPO_PUBLIC_SENTRY_DSN          # GlitchTip or Sentry DSN
FLY_API_TOKEN                   # Get with: flyctl auth token
```

### Step 5: Build Mobile Apps

**Option A: Automated (GitHub Actions)**
```bash
git add .
git commit -m "Deploy to production"
git push origin main

# Builds trigger automatically
# Check progress: https://github.com/your-username/MobVibe/actions
```

**Option B: Manual (Local)**
```bash
# Login to Expo
eas login

# Build iOS
eas build --platform ios --profile production --local

# Build Android
eas build --platform android --profile production --local
```

### Step 6: Submit to Stores (Optional)

```bash
# Submit iOS to TestFlight
eas submit --platform ios --latest

# Submit Android to Internal Testing
eas submit --platform android --latest --track internal
```

---

## 💰 Cost Breakdown

| Service | Tier | Monthly Cost | Purpose |
|---------|------|--------------|---------|
| **Fly.io** | Hobby (512MB) | $10-15 | Backend worker + sandboxes |
| **Supabase** | Free | $0 | Database + Auth + Storage |
| **Anthropic** | Pay-as-you-go | $20-50 | Claude API (usage-based) |
| **GitHub Actions** | Free | $0 | CI/CD builds |
| **GlitchTip** | Free | $0 | Error monitoring (1k/month) |
| **Apple Developer** | Annual | $8.25/mo | TestFlight distribution |
| **Google Play** | One-time | ~$2/mo* | Internal testing |
| **Total** | | **$40-75/mo** | |

*Amortized over 12 months

### Comparison

- **Original Plan**: $150-200/month (7 services)
- **Simplified Plan**: $40-75/month (3-4 paid services)
- **Savings**: $75-160/month (60-75% reduction)

---

## 📊 Free Tier Limits

### When to Upgrade

**Supabase Free → Pro ($25/month)**
- Database > 500MB
- Storage > 1GB
- Bandwidth > 2GB/month
- Typically: After 10,000+ sessions or 500+ active users

**GlitchTip Free → Paid ($15/month)**
- Errors > 1,000/month
- Need > 90 days retention
- Typically: Only if high error rate or large scale

**Fly.io Hobby → Paid**
- Consistent usage > $5/month
- Need autoscaling
- Typically: After 100+ concurrent users

### Monitoring Free Tier Usage

```bash
# Supabase database size
SELECT pg_size_pretty(pg_database_size(current_database()));

# Fly.io billing
flyctl billing show

# GlitchTip usage
# Check dashboard: https://app.glitchtip.com/org/usage
```

---

## 🔍 Troubleshooting

### Backend Issues

```bash
# Check logs
flyctl logs --app mobvibe-api

# SSH into container
flyctl ssh console --app mobvibe-api

# Check health
curl https://mobvibe-api.fly.dev/health

# Restart app
flyctl apps restart mobvibe-api
```

### Build Issues

```bash
# Check GitHub Actions logs
# Go to: https://github.com/your-username/MobVibe/actions

# Manual build with logs
eas build --platform ios --profile production --local --verbose
```

### Sandbox Issues

Fly.io Machines are used instead of E2B. Check:

```bash
# List all machines
flyctl machines list --app mobvibe-sandboxes

# Check specific machine
flyctl machines status <machine-id> --app mobvibe-sandboxes

# SSH into sandbox machine
flyctl ssh console <machine-id> --app mobvibe-sandboxes
```

---

## 🔐 Security Checklist

- [ ] All secrets stored in Fly.io secrets (not env vars)
- [ ] GitHub secrets configured (not in code)
- [ ] Supabase RLS policies enabled
- [ ] HTTPS enforced (Fly.io auto-configures)
- [ ] Non-root user in Docker container
- [ ] API rate limiting configured
- [ ] Error monitoring active (GlitchTip/Sentry)
- [ ] Database backups enabled (Supabase auto-backups)

---

## 📚 Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Fly.io Machines API](https://fly.io/docs/machines/api/)
- [Supabase Free Tier](https://supabase.com/pricing)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Free Tier](https://github.com/features/actions)
- [GlitchTip Documentation](https://glitchtip.com/documentation)

---

## 🎉 Success Metrics

After deployment, monitor these KPIs:

**Technical Health:**
- Uptime > 99%
- API p95 latency < 500ms
- Error rate < 2%
- Crash-free rate > 99%

**Cost Management:**
- Stay within Supabase free tier (< 500MB DB)
- Stay within GlitchTip free tier (< 1k errors/month)
- Fly.io costs < $15/month
- Anthropic costs < $50/month

**User Experience:**
- Session start time < 5s
- Code generation < 10s
- Preview generation < 15s

---

## 🚨 Common Pitfalls

1. **Forgetting to set FLY_API_TOKEN** → Sandboxes won't start
2. **Using wrong Supabase key** → Use service role key for backend, anon key for frontend
3. **Not setting GitHub secrets** → Builds will fail
4. **Exceeding Supabase free tier** → Monitor database size regularly
5. **Local builds running out of memory** → Use GitHub Actions instead

---

## 📞 Support

If you encounter issues:

1. Check logs: `flyctl logs --app mobvibe-api`
2. Check GitHub Actions tab for build failures
3. Verify all secrets are set correctly
4. Review the troubleshooting section above

---

**Next**: After successful deployment, see `docs/MONITORING.md` for observability setup.
