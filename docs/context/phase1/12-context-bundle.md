# Phase 12 Context Bundle - Edge Functions

## Project Context

**Project:** MobVibe - Mobile coding platform powered by Claude Code
**Phase:** 12 - Edge Functions Foundation
**Goal:** Create API endpoints for session management and job creation

## Phase 12 Scope

### Objectives
1. Create 3 core Edge Functions for session management
2. Implement JWT authentication validation
3. Validate input with Zod schemas
4. Configure CORS for React Native mobile app
5. Handle errors with proper HTTP status codes

### Edge Functions to Build
1. **start-coding-session** - Create new session + job
2. **continue-coding** - Add prompt to existing session
3. **get-session-status** - Retrieve session details with events

## Database Schema Context (From Phase 11)

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  sessions_used INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Users can only read/update their own profile
**Usage:** Check tier limits before creating sessions

### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Users can only CRUD their own projects
**Usage:** Validate project ownership before creating session

### Coding Sessions Table
```sql
CREATE TABLE coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'failed', 'expired')),
  initial_prompt TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Users can only read/create their own sessions
**Usage:** Core entity for coding session lifecycle
**Expiration:** Default 30 minutes from creation

### Coding Jobs Table
```sql
CREATE TABLE coding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Users can view jobs for their own sessions (subquery)
**Usage:** Priority-based job queue (higher priority = processed first)
**Pro Users:** Get priority 10, free users get priority 0

### Session Events Table
```sql
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('thinking', 'terminal', 'file_change', 'preview_ready', 'completion', 'error')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Users can view events for their own sessions
**Usage:** Real-time event streaming via Supabase Realtime
**Event Types:** thinking, terminal, file_change, preview_ready, completion, error

## API Data Flows

### Start Coding Session Flow
```
Mobile Client
  ↓ POST /functions/v1/start-coding-session
  ↓ Headers: Authorization: Bearer <jwt>
  ↓ Body: { projectId, prompt }
  ↓
Edge Function
  ↓ 1. Validate JWT → Extract user
  ↓ 2. Validate input with Zod
  ↓ 3. Check profile tier + usage limits
  ↓ 4. Create coding_session record
  ↓ 5. Create coding_job record (with priority)
  ↓ 6. Increment profile.sessions_used
  ↓ 7. Return { sessionId, jobId, expiresAt }
  ↓
Mobile Client
  → Subscribe to session events via Realtime
```

### Continue Coding Flow
```
Mobile Client
  ↓ POST /functions/v1/continue-coding
  ↓ Headers: Authorization: Bearer <jwt>
  ↓ Body: { sessionId, prompt }
  ↓
Edge Function
  ↓ 1. Validate JWT → Extract user
  ↓ 2. Validate input with Zod
  ↓ 3. Verify session ownership (RLS)
  ↓ 4. Check session not expired
  ↓ 5. Create new coding_job record
  ↓ 6. Return { jobId }
  ↓
Mobile Client
  → Continue listening to session events
```

### Get Session Status Flow
```
Mobile Client
  ↓ GET /functions/v1/get-session-status?sessionId=<id>
  ↓ Headers: Authorization: Bearer <jwt>
  ↓
Edge Function
  ↓ 1. Validate JWT → Extract user
  ↓ 2. Extract sessionId from query param
  ↓ 3. Query session with events (join)
  ↓ 4. Verify ownership via RLS
  ↓ 5. Return session with latest events
  ↓
Mobile Client
  → Display session status + events
```

## Security Requirements

### JWT Validation
- Extract Bearer token from Authorization header
- Use Supabase client with anon key to validate token
- Call `supabase.auth.getUser(token)` to verify
- Return user object if valid, throw error if invalid
- RLS policies automatically use authenticated user context

### Input Validation
- Use Zod schemas for all request bodies
- Validate UUIDs are properly formatted
- Validate prompt length (min 10, max 5000 chars)
- Return 400 Bad Request for validation errors

### Authorization
- JWT validation ensures user is authenticated
- RLS policies enforce data access boundaries
- Functions only access data user owns via RLS
- Service role key NOT used (use anon key + user JWT)

### CORS Configuration
- Allow all origins during development (`'*'`)
- Restrict to specific mobile app domain in production
- Allow headers: `authorization, x-client-info, apikey, content-type`
- Handle OPTIONS preflight requests

## Error Handling Strategy

### HTTP Status Codes
- `200 OK` - Successful GET request
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Validation errors, malformed input
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Usage limit exceeded, quota reached
- `404 Not Found` - Session/project not found
- `410 Gone` - Session expired
- `500 Internal Server Error` - Unexpected errors

### Error Response Format
```typescript
{
  success: false,
  error: "Human-readable error message"
}
```

### Success Response Format
```typescript
{
  success: true,
  data: { /* response payload */ }
}
```

## Performance Considerations

### Edge Function Limits
- **Timeout:** 150 seconds max (keep under 5s for good UX)
- **Memory:** 512MB-1GB depending on plan
- **Request Size:** 2MB max
- **Response Size:** 2MB max

### Optimization Strategies
- Keep functions lightweight and fast
- Reuse Supabase client instances when possible
- Use database indexes for RLS queries (already created in Phase 11)
- Return early on validation errors
- Delegate long-running work to worker service

### Cold Start Mitigation
- Use "fat functions" pattern (combine related endpoints if needed)
- Keep dependencies minimal
- Leverage persistent storage (97% faster cold starts)

## Tier-Based Behavior

### Free Tier
- `sessions_limit: 3`
- Job priority: `0` (processed after paid users)
- Standard session duration: 30 minutes

### Starter Tier
- `sessions_limit: 10`
- Job priority: `5`
- Standard session duration: 30 minutes

### Pro Tier
- `sessions_limit: 50`
- Job priority: `10` (highest priority)
- Standard session duration: 60 minutes

### Enterprise Tier
- `sessions_limit: unlimited (999)`
- Job priority: `10`
- Standard session duration: 120 minutes
- Dedicated support

## Integration Points

### Supabase Auth
- Uses existing auth.users table
- JWT tokens issued by Supabase Auth
- Functions validate tokens via `getUser()` API

### Supabase Database
- All queries use anon key + user JWT
- RLS policies automatically filter results
- Foreign keys maintain referential integrity

### Supabase Realtime
- Mobile clients subscribe to `session_events` table
- Real-time updates as worker service emits events
- WebSocket connection managed by Supabase

### Worker Service (Phase 13+)
- Polls `coding_jobs` table for pending jobs
- Claims jobs and updates status to `in_progress`
- Emits events to `session_events` as work progresses
- Updates job status to `completed` or `failed`

## Testing Strategy

### Unit Tests (Deno Test Runner)
- Test shared utilities: `auth.ts`, `validation.ts`, `response.ts`
- Mock Supabase client responses
- Test error conditions (missing token, invalid input)

### Integration Tests (Jest + Supabase Client)
- Test full request/response cycle
- Use real Supabase local instance
- Test RLS enforcement
- Test tier limits and quota checking
- Test session expiration logic

### Manual Testing (cURL)
- Smoke test each endpoint locally
- Verify CORS headers
- Test error responses
- Validate response formats

## Environment Variables

```bash
# Supabase
SUPABASE_URL=http://localhost:54321  # or production URL
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>  # for worker service only

# Edge Functions use:
# - SUPABASE_URL (auto-injected by Supabase)
# - SUPABASE_ANON_KEY (auto-injected by Supabase)
```

## Shared Utilities Structure

```
supabase/functions/
├── _shared/
│   ├── auth.ts           # JWT validation
│   ├── validation.ts     # Zod schemas
│   ├── response.ts       # Success/error responses
│   └── cors.ts           # CORS headers
├── start-coding-session/
│   └── index.ts
├── continue-coding/
│   └── index.ts
└── get-session-status/
    └── index.ts
```

## Key Takeaways

1. **Functions are thin API layer** - Create records, validate input, return fast
2. **RLS handles authorization** - No need to manually filter data
3. **Worker service does heavy lifting** - Functions just create jobs
4. **Real-time via Supabase** - Mobile subscribes to events table
5. **Tier-based priorities** - Pro users get faster processing
6. **Session expiration** - 30-minute default, cleanup via worker
7. **Fast response times** - Target <5s, delegate long work to workers

## References
- Phase 11: Database Schema & RLS
- Phase 13: Job Queue & Worker Service (next)
- Supabase Edge Functions Docs
- Deno Deploy Documentation
