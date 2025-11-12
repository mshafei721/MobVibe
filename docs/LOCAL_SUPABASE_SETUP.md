# Local Supabase Setup Guide

This guide helps you set up local Supabase for running integration tests.

## Prerequisites

- ✓ Docker Desktop installed and running
- ✓ Node.js and npm installed
- ✓ Git repository cloned

## Quick Start

```bash
# 1. Start local Supabase (first time will pull Docker images)
npm run supabase:start

# 2. Run integration tests
npm run test:integration

# 3. Stop Supabase when done
npm run supabase:stop
```

## Manual Setup

### 1. Initialize Supabase (First Time Only)

```bash
npx supabase init
```

This creates `supabase/config.toml` with local configuration.

### 2. Start Supabase Services

```bash
npx supabase start
```

This starts:
- PostgreSQL database (port 54322)
- API Gateway (port 54321)
- Studio UI (port 54323)
- Auth service
- Realtime service
- Storage service

**First run takes 2-5 minutes** to pull Docker images (~2GB).

### 3. View Credentials

After starting, you'll see:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJh...
service_role key: eyJh...
```

### 4. Apply Migrations

Migrations are auto-applied on start, but you can manually run:

```bash
npx supabase db reset
```

### 5. Seed Test Data

```bash
npx supabase db seed
```

## Running Tests

### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific test suite
npm test -- tests/database/profiles.test.ts
```

### Unit Tests Only
```bash
npm test -- --testPathIgnorePatterns=tests/
```

## Troubleshooting

### Docker Not Running
```
Error: Cannot connect to the Docker daemon
```
**Solution:** Start Docker Desktop

### Port Already in Use
```
Error: port 54321 already allocated
```
**Solution:** Stop existing Supabase instance
```bash
npx supabase stop
npx supabase start
```

### Database Connection Failed
```bash
# Reset and restart
npx supabase db reset
npx supabase start
```

### Clear All Data
```bash
# Stop and remove volumes
npx supabase stop --no-backup
npx supabase start
```

## Useful Commands

```bash
# Check status
npx supabase status

# View logs
npx supabase logs

# Open Studio UI
npx supabase studio

# Stop services
npx supabase stop

# Database shell
npx supabase db shell
```

## Test Environment Variables

Tests automatically use `.env.test` which points to:
- `SUPABASE_URL=http://localhost:54321`
- `SUPABASE_ANON_KEY=<from supabase start>`

## Database Schema

Our schema includes:
- `profiles` - User profiles with RLS
- `projects` - User projects
- `sessions` - Coding sessions
- `coding_jobs` - Job queue for background tasks
- Edge functions for AI integration

## CI/CD Integration

For GitHub Actions:
```yaml
- name: Start Supabase
  run: |
    npx supabase start
    npx supabase db reset

- name: Run Integration Tests
  run: npm run test:integration
```

## Next Steps

1. ✓ Start Supabase: `npm run supabase:start`
2. ✓ Run tests: `npm run test:integration`
3. ✓ Open Studio: http://localhost:54323
4. ✓ View API docs: http://localhost:54321/rest/v1/

## Support

- Supabase Docs: https://supabase.com/docs/guides/cli
- Local Development: https://supabase.com/docs/guides/cli/local-development
- Issues: https://github.com/supabase/supabase/issues
