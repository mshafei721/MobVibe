# Phase 34: Production Deployment

**Duration:** 1.5 days
**Dependencies:** [33]
**Status:** Pending

## Objective

Deploy MobVibe MVP to production including mobile app distribution (TestFlight/Google Play beta), backend infrastructure (Fly.io), monitoring setup (Sentry), and launch coordination.

## Scope

### In Scope
- Mobile app deployment (EAS Build & Submit)
- Backend infrastructure deployment (Fly.io)
- Database migration & production setup (Supabase)
- Monitoring & alerting (Sentry, Fly.io metrics)
- Environment configuration (production secrets)
- Launch coordination & rollout plan

### Out of Scope
- Marketing website
- App Store optimization (ASO)
- User acquisition campaigns
- Beta user recruitment
- Post-launch feature development

## Technical Architecture

### Production Infrastructure
```yaml
Mobile Apps:
  Platform: Expo Application Services (EAS)
  iOS: TestFlight beta (100 users)
  Android: Google Play Internal Testing (100 users)
  Updates: EAS Update (OTA)

Backend:
  Platform: Fly.io (global edge deployment)
  Regions: Primary (US), Secondary (EU)
  Scaling: Auto-scale 1-3 instances
  Database: Supabase (managed PostgreSQL)

Services:
  CDN: Cloudflare (via Supabase)
  File Storage: Supabase Storage
  Code Execution: E2B Sandboxes
  Monitoring: Sentry, Fly.io metrics
  Logging: Fly.io logs, Supabase logs

Domains:
  API: api.mobvibe.app
  App: mobvibe.app (future web version)
```

### Deployment Pipeline
```yaml
Stages:
  1. Pre-deployment checks (tests, security scan)
  2. Build & package (EAS build)
  3. Infrastructure provisioning (Fly.io)
  4. Database migration (Supabase)
  5. Configuration deployment (secrets, env vars)
  6. Health checks & smoke tests
  7. Gradual rollout (canary → 100%)
  8. Post-deployment validation
```

## Implementation Plan

### 1. EAS Configuration & Mobile App Build (4 hours)
```json
// eas.json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    },
    "production-ios": {
      "extends": "production",
      "ios": {
        "bundleIdentifier": "com.mobvibe.app",
        "buildConfiguration": "Release"
      }
    },
    "production-android": {
      "extends": "production",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
        "track": "internal"
      }
    }
  },
  "update": {
    "production": {
      "channel": "production"
    }
  }
}
```

```yaml
# .github/workflows/deploy-production.yml
name: Production Deployment

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'production'
        type: choice
        options:
          - production
          - staging

jobs:
  pre-deployment-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Security scan
        run: |
          npm audit --audit-level=high
          npx snyk test --severity-threshold=high

      - name: Validate environment
        run: npm run validate:env

  build-ios:
    needs: pre-deployment-checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS app
        run: eas build --platform ios --profile production-ios --non-interactive

      - name: Submit to TestFlight
        run: eas submit --platform ios --latest --non-interactive

  build-android:
    needs: pre-deployment-checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build Android app
        run: eas build --platform android --profile production-android --non-interactive

      - name: Submit to Google Play
        run: eas submit --platform android --latest --non-interactive

  deploy-backend:
    needs: pre-deployment-checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Fly
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Run database migrations
        run: flyctl ssh console -C "npm run migrate:prod"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  post-deployment-validation:
    needs: [build-ios, build-android, deploy-backend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Health check
        run: |
          curl -f https://api.mobvibe.app/health || exit 1

      - name: Smoke tests
        run: npm run test:smoke

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'MobVibe production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Fly.io Backend Deployment (3 hours)
```toml
# fly.toml
app = "mobvibe-api"
primary_region = "iad" # US East

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
    force_https = true

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [services.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512

[metrics]
  port = 9091
  path = "/metrics"
```

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
```

```bash
# scripts/deploy/deploy-backend.sh
#!/bin/bash
set -e

echo "🚀 Deploying MobVibe backend to Fly.io..."

# Verify flyctl installed
if ! command -v flyctl &> /dev/null; then
  echo "Error: flyctl not installed"
  exit 1
fi

# Verify logged in
flyctl auth whoami || {
  echo "Error: Not logged into Fly.io"
  exit 1
}

# Set secrets
echo "Setting production secrets..."
flyctl secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  E2B_API_KEY="$E2B_API_KEY" \
  SENTRY_DSN="$SENTRY_DSN" \
  CLAUDE_API_KEY="$CLAUDE_API_KEY"

# Deploy
echo "Deploying application..."
flyctl deploy --remote-only --strategy rolling

# Run migrations
echo "Running database migrations..."
flyctl ssh console -C "npm run migrate:prod"

# Health check
echo "Waiting for health check..."
sleep 10
curl -f https://api.mobvibe.app/health || {
  echo "Health check failed!"
  exit 1
}

echo "✅ Deployment successful!"
```

### 3. Database Migration & Production Setup (2 hours)
```sql
-- supabase/migrations/production-setup.sql
-- Production-specific database setup

-- Enable Row Level Security on all tables
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE preview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create production indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_created
  ON coding_sessions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_session_created
  ON generated_code(session_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_preview_session_status
  ON preview_sessions(session_id, status, created_at DESC);

-- Setup database monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create read-only role for analytics
CREATE ROLE analytics_reader WITH LOGIN PASSWORD 'GENERATE_SECURE_PASSWORD';
GRANT CONNECT ON DATABASE postgres TO analytics_reader;
GRANT USAGE ON SCHEMA public TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;

-- Setup automated backups (Supabase handles this, but verify)
-- Retention: 7 days point-in-time recovery

-- Add production constraints
ALTER TABLE coding_sessions
  ADD CONSTRAINT sessions_title_length CHECK (length(title) <= 200);

ALTER TABLE generated_code
  ADD CONSTRAINT code_size_limit CHECK (length(code) <= 1000000); -- 1MB

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- Enable audit logging function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_sessions
  AFTER INSERT OR UPDATE OR DELETE ON coding_sessions
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_code
  AFTER INSERT OR UPDATE OR DELETE ON generated_code
  FOR EACH ROW EXECUTE FUNCTION log_audit();
```

```typescript
// scripts/deploy/migrate-production.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running production database migration...');

  const migrationFile = fs.readFileSync(
    path.join(__dirname, '../../supabase/migrations/production-setup.sql'),
    'utf-8'
  );

  try {
    // Run migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationFile
    });

    if (error) throw error;

    console.log('✅ Migration completed successfully');

    // Verify critical tables exist
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tableError) throw tableError;

    const requiredTables = [
      'coding_sessions',
      'generated_code',
      'preview_sessions',
      'user_settings',
      'audit_logs'
    ];

    const missingTables = requiredTables.filter(
      t => !tables.some(table => table.table_name === t)
    );

    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    console.log('✅ All required tables exist');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

### 4. Monitoring & Alerting Setup (2 hours)
```typescript
// src/utils/monitoring/sentry-config.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  tracesSampleRate: 1.0, // 100% in beta, reduce to 0.1 at scale
  profilesSampleRate: 1.0,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,

  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      tracePropagationTargets: ['api.mobvibe.app'],
    }),
  ],

  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['Authorization'];
      }
    }

    // Add user context (non-PII)
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    // Don't log sensitive breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.message?.includes('token')) {
      return null;
    }
    return breadcrumb;
  }
});
```

```typescript
// src/utils/monitoring/alerts.ts
import * as Sentry from '@sentry/react-native';

export const criticalAlert = (message: string, context?: Record<string, any>) => {
  Sentry.captureMessage(message, {
    level: 'error',
    tags: { priority: 'critical' },
    contexts: { details: context }
  });
};

export const performanceAlert = (metric: string, value: number, threshold: number) => {
  if (value > threshold) {
    Sentry.captureMessage(`Performance threshold exceeded: ${metric}`, {
      level: 'warning',
      tags: { metric, performance: 'degraded' },
      contexts: {
        performance: { metric, value, threshold }
      }
    });
  }
};

// Usage
// criticalAlert('Sandbox initialization failed', { sandboxId, error });
// performanceAlert('session_load_time', 6000, 5000);
```

### 5. Production Environment Configuration (2 hours)
```bash
# .env.production (template - actual values in secrets management)
# Mobile App
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_API_URL=https://api.mobvibe.app
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID

# Backend (Fly.io secrets)
NODE_ENV=production
PORT=8080
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
E2B_API_KEY=YOUR_E2B_API_KEY
CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY
SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID

# Rate Limiting
RATE_LIMIT_GENERATION=10 # per minute
RATE_LIMIT_API=100 # per minute
RATE_LIMIT_WINDOW=60000 # 1 minute in ms

# Feature Flags
ENABLE_CODE_GENERATION=true
ENABLE_PREVIEW_SANDBOX=true
ENABLE_ANALYTICS=true
```

### 6. Launch Checklist & Go-Live (2 hours)

## Production Launch Checklist

### Pre-Launch (1 week before)
```yaml
Infrastructure:
  - [ ] Fly.io app provisioned & tested
  - [ ] Supabase production database configured
  - [ ] All environment variables set
  - [ ] SSL certificates configured
  - [ ] DNS records configured (api.mobvibe.app)
  - [ ] CDN enabled & tested
  - [ ] Backups configured & tested

Mobile Apps:
  - [ ] App Store Connect setup complete
  - [ ] Google Play Console setup complete
  - [ ] App metadata (title, description, screenshots)
  - [ ] Privacy policy published
  - [ ] Terms of service published
  - [ ] TestFlight/Internal Testing builds uploaded

Security:
  - [ ] Security audit completed (Phase 33)
  - [ ] No high/critical vulnerabilities
  - [ ] RLS policies verified
  - [ ] Secrets rotated for production
  - [ ] Rate limiting configured
  - [ ] CORS policies configured

Monitoring:
  - [ ] Sentry configured for mobile & backend
  - [ ] Fly.io metrics dashboard configured
  - [ ] Alert rules configured (Slack/PagerDuty)
  - [ ] Error tracking tested
  - [ ] Performance monitoring tested

Testing:
  - [ ] E2E tests passing (Phase 31)
  - [ ] Performance targets met (Phase 32)
  - [ ] Smoke tests passing
  - [ ] Load testing completed
  - [ ] Manual QA completed

Documentation:
  - [ ] API documentation complete
  - [ ] User guide/help docs ready
  - [ ] Support process documented
  - [ ] Incident response plan ready
  - [ ] Rollback procedure documented
```

### Launch Day
```yaml
T-2 hours:
  - [ ] Final health checks on all systems
  - [ ] Verify monitoring & alerts working
  - [ ] Team on standby
  - [ ] Rollback plan reviewed

T-1 hour:
  - [ ] Create database snapshot
  - [ ] Deploy backend to Fly.io
  - [ ] Verify API health endpoint
  - [ ] Run smoke tests

T-0 (Go-Live):
  - [ ] Submit iOS build to TestFlight
  - [ ] Submit Android build to Internal Testing
  - [ ] Verify builds appear in stores
  - [ ] Test download & installation
  - [ ] Verify end-to-end user flow

T+1 hour:
  - [ ] Monitor error rates
  - [ ] Check performance metrics
  - [ ] Verify user registrations working
  - [ ] Monitor database performance
  - [ ] Check API response times

T+4 hours:
  - [ ] First metrics review (users, sessions, errors)
  - [ ] Address any critical issues
  - [ ] Document issues & resolutions
  - [ ] Team debrief
```

### Post-Launch (First Week)
```yaml
Daily:
  - [ ] Review error logs (Sentry)
  - [ ] Check performance metrics
  - [ ] Monitor user feedback
  - [ ] Track key metrics (DAU, retention)
  - [ ] Prioritize bug fixes

Week 1 Review:
  - [ ] Stability assessment (crash-free rate >99%)
  - [ ] Performance assessment (meet targets)
  - [ ] User feedback analysis
  - [ ] Feature usage analytics
  - [ ] Decision: expand beta or iterate
```

## Rollout Strategy

### Phased Beta Rollout
```yaml
Phase 1 (Day 1-3): Internal Testing
  - Audience: Team & friends (10 users)
  - Focus: Critical bug detection
  - Success: No blockers, <1% crash rate

Phase 2 (Day 4-7): Limited Beta
  - Audience: Invited testers (50 users)
  - Focus: UX validation, load testing
  - Success: >90% task completion, <5% error rate

Phase 3 (Day 8-14): Open Beta
  - Audience: Public signups (100 users)
  - Focus: Scale testing, feedback collection
  - Success: >95% uptime, <3% error rate

Phase 4 (Day 15+): Expand & Iterate
  - Audience: Gradual expansion (500+ users)
  - Focus: Feature refinement, optimization
  - Success: Product-market fit signals
```

## Monitoring & Metrics

### Key Performance Indicators (KPIs)
```yaml
Technical Health:
  - Uptime: >99% (target: 99.5%)
  - Crash-free rate: >99% (target: 99.5%)
  - API p95 latency: <500ms
  - Session start time: <5s
  - Error rate: <2%

User Engagement:
  - Daily Active Users (DAU)
  - Session duration (target: >5min)
  - Sessions per user (target: >3/week)
  - Code generations per session (target: >2)
  - Preview runs per session (target: >1)

Product Success:
  - Day 1 retention (target: >40%)
  - Day 7 retention (target: >20%)
  - Task completion rate (target: >80%)
  - Time to first code generation (target: <2min)
  - User satisfaction (target: >4/5)
```

## Acceptance Criteria

- [ ] Mobile apps deployed to TestFlight & Google Play Internal Testing
- [ ] Backend deployed to Fly.io (multi-region)
- [ ] Database migrated to production Supabase
- [ ] All secrets configured securely
- [ ] Monitoring active (Sentry, Fly.io)
- [ ] Health checks passing
- [ ] Smoke tests passing in production
- [ ] SSL/HTTPS configured
- [ ] Launch checklist 100% complete
- [ ] Team trained on incident response

## Risk Management

### Technical Risks
```yaml
Deployment Failure:
  Impact: HIGH
  Mitigation: Staged rollout, automated rollback, comprehensive testing

Performance Degradation:
  Impact: MEDIUM
  Mitigation: Load testing, auto-scaling, performance monitoring

Security Incident:
  Impact: HIGH
  Mitigation: Security audit (Phase 33), monitoring, incident response plan

Third-Party Service Outage:
  Impact: HIGH
  Mitigation: Graceful degradation, status monitoring, backup plans
```

## Dependencies

### External Services
- Expo Application Services (EAS)
- Fly.io (hosting)
- Supabase (database, auth, storage)
- E2B (code execution)
- Sentry (monitoring)
- App Store Connect / Google Play Console

### Internal
- Phase 33 (security audit) complete
- All features tested & validated
- Documentation complete

## Success Metrics

```yaml
Launch Success:
  - Apps live in TestFlight & Google Play: 100%
  - Backend uptime first 24h: >99%
  - Critical bugs: 0
  - User onboarding success rate: >80%

First Week:
  - Crash-free rate: >99%
  - DAU: >50 users
  - Day 1 retention: >40%
  - Task completion rate: >70%
```

## Documentation Deliverables

- Deployment runbook
- Infrastructure architecture diagram
- Monitoring & alerting guide
- Incident response playbook
- Rollback procedures
- Post-launch metrics dashboard
- User support documentation

## Next Steps

→ **Phase 1 Complete!**
→ Monitor metrics & user feedback
→ Begin Phase 2 planning (advanced features)
→ Iterate based on beta user feedback
