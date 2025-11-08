# Database Schema Context Bundle - Phase 11

**Generated:** 2025-11-07
**Phase:** 11 - Database Schema & RLS
**Purpose:** Compiled context for database implementation

---

## Project Context: MobVibe

**Vision:** Mobile-first AI-powered code generation platform
**Core Flow:** User prompt → Claude generates code → Live preview
**Stack:** React Native + Expo + Supabase + Claude Agent SDK

---

## Database Requirements

### Core Tables Needed

**1. Profiles** (extends auth.users)
- User account information
- Tier and usage tracking
- Stripe integration
- Multi-tenant isolation

**2. Projects**
- User projects management
- Expo configuration storage
- Sandbox tracking
- Status management

**3. Coding Sessions**
- Active coding session state
- Timeout/expiration handling
- Preview URLs (EAS updates, WebView)
- Session lifecycle management

**4. Coding Jobs**
- Job queue for worker processing
- Priority-based claiming
- Retry logic
- Status tracking

**5. Session Events**
- Real-time event streaming
- Multiple event types (thinking, terminal, file_change, etc.)
- Mobile client subscriptions
- Event history

---

## Architecture Patterns

### Multi-Tenant Security

**Row-Level Security (RLS):**
- Every table protected by RLS policies
- User isolation via auth.uid()
- Service role bypass for worker operations
- Subquery patterns for related table access

### Real-Time Requirements

**Performance Needs:**
- Millisecond-level index updates
- WebSocket event streaming
- Job queue with priority claiming
- Session state synchronization

### Mobile-First Design

**Considerations:**
- Offline-capable data structure
- Efficient sync patterns
- Minimal payload sizes
- Battery-conscious query patterns

---

## Data Flow Patterns

### User Session Flow

```
User Creates Project
  ↓
Project Row Created (RLS: user_id isolation)
  ↓
User Starts Coding Session
  ↓
Session Row Created (linked to project)
  ↓
Job Created in Queue
  ↓
Worker Claims Job
  ↓
Events Stream (session_events table)
  ↓
Mobile Client Subscribes (RLS: user sees own sessions)
  ↓
Preview Ready (EAS update URL stored)
```

### Job Queue Flow

```
Edge Function Creates Job
  ↓
Job Inserted (status: pending)
  ↓
Worker Polls Queue (ORDER BY priority DESC, created_at ASC)
  ↓
Worker Claims Job (status: processing)
  ↓
Claude Agent Executes
  ↓
Job Completed/Failed (updated status)
  ↓
Session Updated (webview_url, eas_update_url)
```

### Real-Time Event Flow

```
Worker Generates Event
  ↓
Insert into session_events
  ↓
Realtime Broadcast (Supabase)
  ↓
Mobile Client Receives (WebSocket)
  ↓
UI Updates (terminal output, thinking indicator, etc.)
```

---

## Security Requirements

### Authentication & Authorization

**User Isolation:**
- RLS policies enforce user_id checks
- No cross-user data access
- Auth via Supabase Auth (JWT)

**Service Role Access:**
- Worker service uses service role key
- Bypasses RLS for job processing
- Admin operations

**Data Protection:**
- Sensitive data in separate columns
- Private schemas for internal operations
- No PII exposure in logs/events

---

## Performance Requirements

### Query Patterns

**Common Queries:**
- User's projects (by user_id)
- Active sessions (by user_id, status)
- Pending jobs (by status, priority)
- Recent events (by session_id, created_at DESC)

**Index Strategy:**
- All foreign keys indexed (user_id, project_id, session_id)
- Composite indexes for queue (status, priority DESC)
- Time-based indexes for event streaming
- Email/tier indexes for lookups

### Scale Targets

**MVP Scale:**
- 1,000 users
- 10,000 sessions
- 100,000 events
- Real-time requirements: <100ms query time

**Growth Planning:**
- Partitioning strategy for events table
- Archive old sessions/events
- Monitor slow query log

---

## Integration Points

### Supabase Services

**Auth:**
- Profiles auto-created on signup (trigger)
- JWT contains user_id for RLS

**Storage:**
- Project files stored in Storage
- File paths referenced in session metadata

**Realtime:**
- WebSocket subscriptions to session_events
- Broadcast updates to mobile clients

### External Services

**Fly.io:**
- Sandbox IDs stored in projects/sessions
- Worker manages sandbox lifecycle

**Anthropic Claude:**
- Job processing via Agent SDK
- No direct database access

**Stripe:**
- Customer IDs in profiles table
- Tier management for rate limiting

---

## Migration Strategy

### Versioned Migrations

**Approach:**
- Sequential numbered migrations (001, 002, 003, ...)
- Each migration idempotent
- Rollback strategy documented

**Order:**
1. Profiles (extends auth.users)
2. Projects (references profiles)
3. Coding Sessions (references projects)
4. Coding Jobs (references sessions)
5. Session Events (references sessions)
6. Helper Functions & Triggers

### Testing Strategy

**Per-Migration:**
- Migration runs without errors
- Sample data inserts successfully
- RLS policies tested
- Foreign keys enforced

**Cumulative:**
- All migrations run together
- Cross-table queries work
- Indexes used by query planner

---

## Risk Mitigation

### Identified Risks

**1. RLS Performance:**
- **Risk:** Complex RLS policies slow queries
- **Mitigation:** Index all RLS columns, use simple auth.uid() checks, add explicit filters

**2. Job Queue Contention:**
- **Risk:** Multiple workers claim same job
- **Mitigation:** Use transactions, add claimed_at timestamp, worker_id column

**3. Event Table Growth:**
- **Risk:** Millions of events slow queries
- **Mitigation:** Partition by created_at, archive old events, index session_id

**4. Schema Changes:**
- **Risk:** Breaking changes after launch
- **Mitigation:** Versioned migrations, backward-compatible changes, test thoroughly

---

## Success Criteria

### Phase 11 Complete When:

**Database:**
- ✅ All 5 tables created with proper types
- ✅ RLS policies enforce user isolation
- ✅ Indexes optimize common queries
- ✅ Foreign keys maintain referential integrity
- ✅ Triggers auto-update timestamps

**Testing:**
- ✅ Migration files run cleanly
- ✅ Sample data inserts successfully
- ✅ RLS tested with multiple users
- ✅ Query performance validated
- ✅ Service role bypass works

**Documentation:**
- ✅ DATABASE.md created with ER diagram
- ✅ RLS policies explained
- ✅ Index rationale documented
- ✅ Migration strategy clear

---

## Dependencies

**Prerequisites:**
- Phase 0.5 complete (UI framework)
- Supabase project created
- Local Supabase dev environment

**Blocks:**
- Phase 12: Edge Functions (needs tables)
- Phase 13: Job Queue (needs coding_jobs table)
- Phase 17: Session Lifecycle (needs sessions table)

---

## Research References

**Supabase RLS Best Practices:**
- Index all RLS columns (100x+ improvement)
- Wrap functions in SELECT for caching
- Optimize join patterns (user_id subqueries)
- Add explicit filters (don't rely only on RLS)

**PostgreSQL Schema Design:**
- Multi-schema approach for organization
- Separate sensitive data
- Query patterns drive design
- Partition large tables

**Indexing Strategies:**
- Index frequently queried fields
- Composite indexes for common queries
- Trade-off: faster reads, slower writes
- Plan indexes before launch

---

**Status:** Context Compilation Complete
**Next:** Use sequentialthinking to plan step-by-step implementation
