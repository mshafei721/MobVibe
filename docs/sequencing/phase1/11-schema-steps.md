# Database Schema Implementation Steps - Phase 11

**Generated:** 2025-11-07
**Phase:** 11 - Database Schema & RLS
**Approach:** Sequential implementation with validation at each step

---

## Overview

**Goal:** Create complete database schema with RLS policies, indexes, and helper functions
**Duration:** 2 days
**Approach:** Bottom-up dependency order, test at each step

---

## Pre-Implementation Checklist

- [ ] Supabase local development environment running
- [ ] Supabase CLI installed and configured
- [ ] Git branch created: `phase-11-database-schema`
- [ ] supabase/ directory structure exists

---

## Step 1: Create Migration Directory Structure

### Actions
```bash
# Create migrations directory if not exists
mkdir -p supabase/migrations

# Create seed data directory
mkdir -p supabase/seed
```

### Validation
- Directory `supabase/migrations/` exists
- Directory `supabase/seed/` exists

### Duration: 5 minutes

---

## Step 2: Create Helper Functions (Migration 000)

### Why First
- Other migrations need update_updated_at() function
- Trigger function must exist before creating triggers
- User signup trigger needed before profiles table

### File: `supabase/migrations/000_create_functions.sql`

### SQL Content
```sql
-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Validation
- Function update_updated_at() created
- Function handle_new_user() created
- No syntax errors

### Duration: 15 minutes

---

## Step 3: Create Profiles Table (Migration 001)

### Why Next
- Base table for user data
- Referenced by all other user-owned tables
- Extends auth.users (requires auth schema)

### File: `supabase/migrations/001_create_profiles.sql`

### Implementation Order
1. Create table with columns and constraints
2. Enable RLS
3. Create RLS policies (SELECT, UPDATE)
4. Create indexes (email, tier)
5. Create updated_at trigger
6. Create auth.users trigger

### Key Decisions
- **Tier Column:** TEXT with CHECK constraint (enum-like)
- **Sessions Limit:** Default 3 for free tier
- **Email Unique:** Prevent duplicate accounts
- **Stripe ID:** Nullable (set when user subscribes)

### RLS Strategy
- Users can SELECT own profile (auth.uid() = id)
- Users can UPDATE own profile (auth.uid() = id)
- No INSERT policy (created via trigger)
- No DELETE policy (handled by Supabase Auth cascade)

### Validation
- Table profiles exists
- RLS enabled
- 2 policies created
- 2 indexes created
- 2 triggers created
- Test: Insert via auth.users trigger works

### Duration: 30 minutes

---

## Step 4: Create Projects Table (Migration 002)

### Dependencies
- profiles table (user_id foreign key)

### File: `supabase/migrations/002_create_projects.sql`

### Implementation Order
1. Create table with foreign key to profiles
2. Enable RLS
3. Create RLS policies (SELECT, INSERT, UPDATE, DELETE)
4. Create indexes (user_id, status, created_at DESC)
5. Create updated_at trigger

### Key Decisions
- **Template ID:** Nullable (future feature)
- **Expo Config:** JSONB for flexibility
- **Sandbox ID:** TEXT (Fly.io machine ID)
- **Status:** active|archived|deleted

### RLS Strategy
- Users can SELECT own projects (auth.uid() = user_id)
- Users can INSERT with own user_id (WITH CHECK)
- Users can UPDATE own projects
- Users can DELETE own projects (soft delete via status)

### Indexes Rationale
- user_id: Filter user's projects
- status: Filter active/archived
- created_at DESC: Recent projects first

### Validation
- Table projects exists
- 4 RLS policies created
- 3 indexes created
- Foreign key constraint enforced
- Test: Create project as user

### Duration: 30 minutes

---

## Step 5: Create Coding Sessions Table (Migration 003)

### Dependencies
- profiles table (user_id foreign key)
- projects table (project_id foreign key)

### File: `supabase/migrations/003_create_coding_sessions.sql`

### Implementation Order
1. Create table with foreign keys
2. Enable RLS
3. Create RLS policies (SELECT, INSERT, UPDATE)
4. Create indexes (user_id, project_id, status, expires_at)
5. Create updated_at trigger

### Key Decisions
- **Status:** pending|active|paused|completed|failed|expired
- **Expires At:** NOT NULL (required for cleanup)
- **Metadata:** JSONB (session stats, file counts)
- **URLs:** EAS update URL, WebView URL (set when ready)

### RLS Strategy
- Users can SELECT own sessions (via user_id)
- Users can INSERT with own user_id
- Users can UPDATE own sessions (for status changes)
- No DELETE (archive via status instead)

### Indexes Rationale
- user_id: User's sessions
- project_id: Project's sessions
- status: Active sessions
- expires_at: Cleanup expired sessions

### Validation
- Table coding_sessions exists
- 3 RLS policies created
- 4 indexes created
- Foreign keys enforced (cascades on project delete)
- Test: Create session for project

### Duration: 30 minutes

---

## Step 6: Create Coding Jobs Table (Migration 004)

### Dependencies
- coding_sessions table (session_id foreign key)

### File: `supabase/migrations/004_create_coding_jobs.sql`

### Implementation Order
1. Create table with foreign key to sessions
2. Enable RLS
3. Create RLS policy (SELECT only for users)
4. Create composite index (status, priority DESC)
5. Create index (session_id, created_at)
6. Create updated_at trigger

### Key Decisions
- **Status:** pending|processing|completed|failed
- **Priority:** INTEGER (higher = more important)
- **Retry Logic:** max_retries=3, retry_count tracker
- **Worker Access:** Service role bypasses RLS

### RLS Strategy
- Users can SELECT jobs for their sessions (subquery)
- No INSERT/UPDATE/DELETE for users
- Worker service uses service role key (bypasses RLS)

### Composite Index Strategy
- (status, priority DESC): Queue claiming
  - WHERE status = 'pending' ORDER BY priority DESC, created_at ASC
- session_id: Link jobs to sessions
- created_at: FIFO within priority

### Validation
- Table coding_jobs exists
- 1 RLS policy created (SELECT with subquery)
- 2 indexes created (composite + session_id)
- Test: User can view own job, not others' jobs

### Duration: 30 minutes

---

## Step 7: Create Session Events Table (Migration 005)

### Dependencies
- coding_sessions table (session_id foreign key)

### File: `supabase/migrations/005_create_session_events.sql`

### Implementation Order
1. Create table with foreign key to sessions
2. Enable RLS
3. Create RLS policy (SELECT only for users)
4. Create indexes (session_id, created_at DESC)

### Key Decisions
- **Event Types:** thinking|terminal|file_change|preview_ready|completion|error
- **Data:** JSONB (flexible event payload)
- **No updated_at:** Events are immutable (created_at only)
- **No user DELETE:** Events preserved for history

### RLS Strategy
- Users can SELECT events for their sessions (subquery)
- Worker inserts via service role (bypasses RLS)
- Realtime subscriptions use RLS (users see own events only)

### Indexes Rationale
- session_id: All events for session
- created_at DESC: Recent events first (real-time display)

### Partitioning Consideration
- For MVP: single table sufficient
- Phase 2: partition by created_at (monthly)

### Validation
- Table session_events exists
- 1 RLS policy created
- 2 indexes created
- Test: User can view own events, subscribe to Realtime

### Duration: 30 minutes

---

## Step 8: Create Auth Trigger (Migration 001 Addition)

### Why Separate Note
- Must happen after profiles table exists
- Links auth.users to profiles table

### Add to Migration 001
```sql
-- Trigger on auth.users (requires profiles table)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Validation
- Trigger exists on auth.users
- Test: Create user in Supabase Auth → profile auto-created

### Duration: 10 minutes

---

## Step 9: Create Seed Data

### File: `supabase/seed.sql`

### Purpose
- Test data for development
- Validate foreign keys and constraints
- Enable API testing

### Content
```sql
-- Test user created via Supabase Auth dashboard
-- Profile auto-created via trigger

-- Sample project
INSERT INTO projects (id, user_id, name, description)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  'Test Todo App',
  'A sample todo application for testing'
);

-- Sample session
INSERT INTO coding_sessions (
  id, user_id, project_id,
  initial_prompt, expires_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM projects LIMIT 1),
  'Build a todo app with React',
  NOW() + INTERVAL '1 hour'
);

-- Sample job
INSERT INTO coding_jobs (session_id, prompt)
VALUES (
  (SELECT id FROM coding_sessions LIMIT 1),
  'Build a todo app with React'
);

-- Sample events
INSERT INTO session_events (session_id, event_type, data)
VALUES
  (
    (SELECT id FROM coding_sessions LIMIT 1),
    'thinking',
    '{"message": "Planning the todo app structure..."}'::jsonb
  ),
  (
    (SELECT id FROM coding_sessions LIMIT 1),
    'terminal',
    '{"command": "npm install", "output": "Installing dependencies..."}'::jsonb
  );
```

### Validation
- All seed inserts succeed
- Foreign keys link correctly
- Data visible via Supabase dashboard

### Duration: 15 minutes

---

## Step 10: Run Migrations Locally

### Commands
```bash
# Reset local database (drops all data)
supabase db reset

# Push migrations (applies all in order)
supabase db push

# Inspect schema
supabase db inspect

# Check RLS policies
supabase db inspect --schema public
```

### Validation
- All migrations run without errors
- Tables appear in Supabase dashboard
- RLS policies shown in dashboard
- Indexes created (check query plans)

### Duration: 10 minutes

---

## Step 11: Test RLS Policies

### Test Cases

#### Test 1: User Isolation
```typescript
// User A creates project
const { data: projectA } = await supabaseA
  .from('projects')
  .insert({ user_id: userA.id, name: 'Project A' })
  .select()
  .single()

// User B tries to read Project A
const { data: projectB } = await supabaseB
  .from('projects')
  .select()
  .eq('id', projectA.id)

// Expect: data is null (RLS blocked)
```

#### Test 2: Own Data Access
```typescript
// User A reads own profile
const { data, error } = await supabaseA
  .from('profiles')
  .select('*')
  .eq('id', userA.id)
  .single()

// Expect: data returned, no error
```

#### Test 3: Service Role Bypass
```typescript
// Service role reads all jobs
const { data } = await supabaseService
  .from('coding_jobs')
  .select('*')

// Expect: all jobs returned (RLS bypassed)
```

### Validation
- User isolation works (users see only own data)
- Service role bypasses RLS
- Subquery RLS works (jobs, events via sessions)

### Duration: 30 minutes

---

## Step 12: Performance Testing

### Query Plans

```sql
-- Explain query for user's projects
EXPLAIN ANALYZE
SELECT * FROM projects
WHERE user_id = '<uuid>'
AND status = 'active';

-- Should use: Index Scan on projects_user_id_idx

-- Explain job queue claiming
EXPLAIN ANALYZE
SELECT * FROM coding_jobs
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC
LIMIT 1;

-- Should use: Index Scan on coding_jobs_status_priority_idx
```

### Validation
- Indexes used by query planner
- Query times < 10ms for common queries
- No sequential scans on large tables

### Duration: 20 minutes

---

## Step 13: Create Database Documentation

### File: `docs/backend/DATABASE.md`

### Content Sections
1. **Overview** - Schema purpose and design
2. **ER Diagram** - Mermaid diagram of tables
3. **Tables** - Each table description, columns, constraints
4. **RLS Policies** - Security model explanation
5. **Indexes** - Performance optimization rationale
6. **Triggers & Functions** - Auto-update logic
7. **Seed Data** - Development data setup
8. **Testing** - How to test schema
9. **Migrations** - How to apply/rollback

### Validation
- Documentation complete and accurate
- ER diagram renders in Markdown viewer
- Examples provided for common operations

### Duration: 1 hour

---

## Step 14: Create Database Tests

### Test Files

#### `tests/database/profiles.test.ts`
- User can read own profile
- User cannot read other profiles
- User can update own profile
- User cannot update other profiles
- Profile auto-created on signup

#### `tests/database/projects.test.ts`
- User can create project
- User can read own projects
- User cannot read other projects
- User can update own project
- User can soft-delete project

#### `tests/database/sessions.test.ts`
- User can create session for own project
- User can read own sessions
- User cannot create session for others' projects
- Expired sessions identifiable

#### `tests/database/rls.test.ts`
- RLS enabled on all tables
- User isolation works
- Service role bypasses RLS
- Subquery RLS works (jobs, events)

### Test Framework
- Jest or Vitest
- @supabase/supabase-js client
- Multiple test users with different credentials

### Validation
- All tests pass
- Coverage > 80%
- RLS policies thoroughly tested

### Duration: 2 hours

---

## Step 15: Update Links Map

### File: `docs/phases/phase1/links-map.md`

### Updates Needed
- Mark Phase 11 as complete
- Add database artifacts to "Code Artifacts" section
- Update "Forward Links" with delivered outputs
- Tag git commit: `phase-1-11-complete`

### Validation
- Links map reflects Phase 11 completion
- Next phase (12) can reference database artifacts

### Duration: 10 minutes

---

## Post-Implementation Checklist

- [ ] All 6 migrations created and run successfully
- [ ] All tables created with proper schema
- [ ] RLS enabled and policies working
- [ ] Indexes created and used by queries
- [ ] Seed data loads successfully
- [ ] Database tests pass (all 4 test files)
- [ ] DATABASE.md documentation complete
- [ ] Performance validated (query plans)
- [ ] Git commit with changes
- [ ] Phase 11 marked complete in links-map.md

---

## Rollback Plan

### If Issues Discovered

**Rollback Commands:**
```bash
# Reset database
supabase db reset

# Apply migrations up to previous phase
supabase db push --include-migrations <previous-migration>

# Or fully rollback
git checkout HEAD~1  # Previous commit
supabase db reset
supabase db push
```

**Safe Rollback:**
- Migrations are versioned (001, 002, etc.)
- Can apply subset of migrations
- Seed data separate from schema
- No production data at this phase (local only)

---

## Success Metrics

### Phase 11 Complete When:

**Functional:**
- ✅ All tables created and tested
- ✅ RLS policies enforce security
- ✅ Foreign keys maintain integrity
- ✅ Seed data validates schema

**Performance:**
- ✅ Indexes used by common queries
- ✅ Query times < 10ms
- ✅ No sequential scans

**Quality:**
- ✅ All database tests pass
- ✅ Documentation complete
- ✅ Code reviewed and committed

**Handover:**
- ✅ Ready for Phase 12 (Edge Functions)
- ✅ Schema stable and versioned
- ✅ RLS patterns established

---

## Total Duration Breakdown

| Step | Task | Duration |
|------|------|----------|
| 1 | Directory structure | 5 min |
| 2 | Helper functions | 15 min |
| 3 | Profiles table | 30 min |
| 4 | Projects table | 30 min |
| 5 | Coding sessions table | 30 min |
| 6 | Coding jobs table | 30 min |
| 7 | Session events table | 30 min |
| 8 | Auth trigger | 10 min |
| 9 | Seed data | 15 min |
| 10 | Run migrations | 10 min |
| 11 | Test RLS | 30 min |
| 12 | Performance testing | 20 min |
| 13 | Documentation | 1 hour |
| 14 | Database tests | 2 hours |
| 15 | Update links map | 10 min |

**Total:** ~6 hours (actual time)
**Estimate:** 2 days (includes breaks, review, fixes)

---

**Status:** Planning Complete
**Next Action:** Execute Step 1 (Create directory structure)
