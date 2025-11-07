# 11-database-schema.md
---
phase_id: 11
title: Database Schema & Row-Level Security
duration_estimate: "2 days"
incremental_value: Data layer foundation for all backend operations
owners: [Backend Engineer, Database Architect]
dependencies: [Phase 0.5 Complete]
linked_phases_forward: [12]
docs_referenced: [Architecture, Implementation, Data Flow]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
ui_requirements:
  framework_plan: ./../../../.docs/ui/UI-FRAMEWORK-INTEGRATION-PLAN.md
  design_system: ./../../../.docs/design-system.md
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Supabase RLS best practices 2025", "PostgreSQL schema design mobile apps", "Database indexing strategies"]
    outputs: ["/docs/research/phase1/11/database-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md database section", "implementation.md schema", "data-flow.md"]
    outputs: ["/docs/context/phase1/11-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for creating schema with RLS policies"
    outputs: ["/docs/sequencing/phase1/11-schema-steps.md"]
acceptance_criteria:
  - All tables created with proper types and constraints
  - RLS policies enforce user isolation
  - Indexes optimize common queries
  - Migration files version-controlled
  - Schema validated with sample data
  - API queries tested (select, insert, update, delete)
---

## Objectives

1. **Create Database Schema** - All tables for MVP functionality
2. **Implement RLS Policies** - Row-level security for multi-tenant isolation
3. **Optimize Performance** - Indexes for common query patterns

## Scope

### In
- Core tables: profiles, projects, coding_sessions, coding_jobs, session_events
- RLS policies for all tables
- Indexes for performance
- Foreign key constraints
- Timestamp triggers (updated_at)
- Migration files (versioned)

### Out
- Complex views (defer to later)
- Full-text search (Phase 2)
- Partitioning (not needed at MVP scale)
- Stored procedures (use Edge Functions instead)

## Tasks

- [ ] **Use context7** to compile database context:
  - Include: architecture.md database architecture
  - Include: implementation.md schema definitions
  - Include: data-flow.md data requirements
  - Output: `/docs/context/phase1/11-context-bundle.md`

- [ ] **Use websearch** to research best practices:
  - Query: "Supabase RLS policies best practices 2025"
  - Query: "PostgreSQL schema design patterns mobile applications"
  - Query: "Database indexing strategies for real-time apps"
  - Output: `/docs/research/phase1/11/database-patterns.md`

- [ ] **Use sequentialthinking** to plan schema creation:
  - Define: Table creation order (dependencies)
  - Define: RLS policy strategy per table
  - Define: Index strategy
  - Output: `/docs/sequencing/phase1/11-schema-steps.md`

- [ ] **Create Profiles Table** (extends auth.users):
  ```sql
  -- supabase/migrations/001_create_profiles.sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
    sessions_used INTEGER DEFAULT 0,
    sessions_limit INTEGER DEFAULT 3,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- RLS Policies
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

  -- Indexes
  CREATE INDEX profiles_email_idx ON profiles(email);
  CREATE INDEX profiles_tier_idx ON profiles(tier);

  -- Trigger for updated_at
  CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ```

- [ ] **Create Projects Table**:
  ```sql
  -- supabase/migrations/002_create_projects.sql
  CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_id TEXT, -- for future template system
    expo_config JSONB,
    sandbox_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- RLS Policies
  ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

  -- Indexes
  CREATE INDEX projects_user_id_idx ON projects(user_id);
  CREATE INDEX projects_status_idx ON projects(status);
  CREATE INDEX projects_created_at_idx ON projects(created_at DESC);
  ```

- [ ] **Create Coding Sessions Table**:
  ```sql
  -- supabase/migrations/003_create_coding_sessions.sql
  CREATE TABLE coding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sandbox_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'failed', 'expired')),
    initial_prompt TEXT NOT NULL,
    eas_update_url TEXT,
    webview_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB, -- for session stats, file counts, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- RLS Policies
  ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own sessions"
    ON coding_sessions FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create sessions"
    ON coding_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own sessions"
    ON coding_sessions FOR UPDATE
    USING (auth.uid() = user_id);

  -- Indexes
  CREATE INDEX coding_sessions_user_id_idx ON coding_sessions(user_id);
  CREATE INDEX coding_sessions_project_id_idx ON coding_sessions(project_id);
  CREATE INDEX coding_sessions_status_idx ON coding_sessions(status);
  CREATE INDEX coding_sessions_expires_at_idx ON coding_sessions(expires_at);
  ```

- [ ] **Create Coding Jobs Table** (job queue):
  ```sql
  -- supabase/migrations/004_create_coding_jobs.sql
  CREATE TABLE coding_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 0, -- higher = higher priority
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- RLS Policies (worker service accesses via service role key)
  ALTER TABLE coding_jobs ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own jobs"
    ON coding_jobs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM coding_sessions
        WHERE coding_sessions.id = coding_jobs.session_id
        AND coding_sessions.user_id = auth.uid()
      )
    );

  -- Indexes
  CREATE INDEX coding_jobs_session_id_idx ON coding_jobs(session_id);
  CREATE INDEX coding_jobs_status_priority_idx ON coding_jobs(status, priority DESC);
  CREATE INDEX coding_jobs_created_at_idx ON coding_jobs(created_at);
  ```

- [ ] **Create Session Events Table** (real-time events):
  ```sql
  -- supabase/migrations/005_create_session_events.sql
  CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('thinking', 'terminal', 'file_change', 'preview_ready', 'completion', 'error')),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- RLS Policies
  ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can view own session events"
    ON session_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM coding_sessions
        WHERE coding_sessions.id = session_events.session_id
        AND coding_sessions.user_id = auth.uid()
      )
    );

  -- Indexes
  CREATE INDEX session_events_session_id_idx ON session_events(session_id);
  CREATE INDEX session_events_created_at_idx ON session_events(created_at DESC);
  ```

- [ ] **Create Helper Functions**:
  ```sql
  -- supabase/migrations/006_create_functions.sql

  -- Update updated_at timestamp
  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Auto-create profile on user signup
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Trigger on auth.users
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ```

- [ ] **Create Sample Data** (for testing):
  ```sql
  -- supabase/seed.sql
  -- Test user (use Supabase Auth to create)
  -- INSERT INTO profiles values will be auto-created via trigger

  -- Sample project
  INSERT INTO projects (id, user_id, name, description)
  VALUES (
    gen_random_uuid(),
    (SELECT id FROM profiles LIMIT 1),
    'Test Todo App',
    'A sample todo application for testing'
  );
  ```

- [ ] **Run Migrations**:
  ```bash
  # Local dev
  supabase db reset  # Reset local DB
  supabase db push   # Apply migrations

  # Verify
  supabase db inspect  # Check schema
  ```

- [ ] **Test RLS Policies**:
  - Create test user via Supabase Auth
  - Query as authenticated user (should see own data only)
  - Query as different user (should see nothing)
  - Test insert/update/delete with RLS
  - Verify service role can bypass RLS (for worker)

- [ ] **Create API Tests**:
  ```typescript
  // tests/database/profiles.test.ts
  describe('Profiles Table', () => {
    it('allows user to read own profile', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      expect(error).toBeNull()
      expect(data.id).toBe(userId)
    })

    it('prevents user from reading other profiles', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single()

      expect(data).toBeNull()
    })
  })
  ```

- [ ] **Document Schema**:
  - Create: `docs/backend/DATABASE.md`
  - Include: ER diagram (Mermaid)
  - Include: Table descriptions
  - Include: RLS policy explanations
  - Include: Index rationale

- [ ] **Update links-map** with database artifacts

## Artifacts & Paths

**Migrations:**
- `supabase/migrations/001_create_profiles.sql`
- `supabase/migrations/002_create_projects.sql`
- `supabase/migrations/003_create_coding_sessions.sql`
- `supabase/migrations/004_create_coding_jobs.sql`
- `supabase/migrations/005_create_session_events.sql`
- `supabase/migrations/006_create_functions.sql`

**Seed Data:**
- `supabase/seed.sql`

**Tests:**
- `tests/database/profiles.test.ts`
- `tests/database/projects.test.ts`
- `tests/database/sessions.test.ts`
- `tests/database/rls.test.ts`

**Docs:**
- `docs/backend/DATABASE.md` ⭐
- `/docs/research/phase1/11/database-patterns.md`
- `/docs/sequencing/phase1/11-schema-steps.md`

## Testing

### Phase-Only Tests
- All migrations run without errors
- Sample data inserts successfully
- RLS policies enforce user isolation
- Indexes created and used by queries
- Foreign key constraints work
- Triggers fire correctly

### Cross-Phase Compatibility
- Phase 12 Edge Functions will query these tables
- Phase 13 Job Queue will use coding_jobs table
- Phase 17 will use coding_sessions extensively

### Test Commands
```bash
# Run migrations
supabase db reset
supabase db push

# Verify schema
supabase db inspect

# Run tests
npm test -- tests/database/

# Check RLS
npm run test:rls
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| RLS policy too restrictive | Users can't access data | Test thoroughly, add service role bypass for admin |
| Missing indexes | Slow queries | Profile queries, add indexes based on slow query log |
| Schema changes needed later | Migration complexity | Use migrations, avoid direct schema changes |
| Foreign key cascades delete too much | Data loss | Be careful with ON DELETE CASCADE, test thoroughly |

## References

- [Architecture](./../../../../.docs/architecture.md) - Database architecture section
- [Implementation](./../../../../.docs/implementation.md) - Schema definitions
- [Data Flow](./../../../../.docs/data-flow.md) - Data requirements

## Handover

**Next Phase:** [12-edge-functions.md](./12-edge-functions.md) - Build Edge Functions for API endpoints

**Required Inputs Provided to Phase 12:**
- Database schema complete and tested
- RLS policies enforcing security
- Sample data for testing API queries

---

**Status:** Ready after Phase 0.5
**Estimated Time:** 2 days
**Blocking Issues:** None
