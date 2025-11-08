# Phase 12 Sequential Implementation Plan

## Overview
**Phase:** 12 - Edge Functions Foundation
**Duration:** 2 days (16 hours)
**Complexity:** Medium

## Implementation Steps

### Step 1: Setup Edge Functions Directory Structure
**Duration:** 15 minutes
**Risk:** Low

```bash
# Create Edge Functions
supabase functions new start-coding-session
supabase functions new continue-coding
supabase functions new get-session-status

# Create shared utilities directory
mkdir -p supabase/functions/_shared
```

**Validation:**
- Directory structure created
- Placeholder files exist for each function
- `_shared/` directory created

---

### Step 2: Create Shared CORS Utility
**Duration:** 10 minutes
**Risk:** Low

**File:** `supabase/functions/_shared/cors.ts`

**Purpose:** Centralize CORS headers configuration

**Implementation:**
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

export function handleCorsPreflightinclude(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}
```

**Validation:**
- File compiles without errors
- Exports corsHeaders object
- Exports handleCorsPreflight function

---

### Step 3: Create Shared Response Utilities
**Duration:** 15 minutes
**Risk:** Low

**File:** `supabase/functions/_shared/response.ts`

**Purpose:** Standard success/error response formatting

**Implementation:**
```typescript
import { corsHeaders } from './cors.ts'

export function successResponse(data: any, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}

export function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  })
}
```

**Validation:**
- Functions return Response objects
- Proper Content-Type header
- CORS headers included

---

### Step 4: Create Auth Validation Utility
**Duration:** 30 minutes
**Risk:** Medium (JWT validation critical)

**File:** `supabase/functions/_shared/auth.ts`

**Purpose:** Validate JWT tokens and return authenticated user

**Implementation:**
```typescript
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthContext {
  user: {
    id: string
    email?: string
  }
  supabase: SupabaseClient
}

export async function validateAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid or expired token')
  }

  return { user, supabase }
}
```

**Validation:**
- Function throws error on missing/invalid token
- Returns user object and authenticated Supabase client
- RLS policies work with returned client

**Test:**
```bash
# Create test with valid/invalid tokens
```

---

### Step 5: Create Input Validation Schemas
**Duration:** 20 minutes
**Risk:** Low

**File:** `supabase/functions/_shared/validation.ts`

**Purpose:** Zod schemas for request validation

**Implementation:**
```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const StartSessionSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt must be less than 5000 characters')
})

export const ContinueCodingSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt must be less than 5000 characters')
})

export const GetSessionStatusSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format')
})
```

**Validation:**
- Schemas validate UUID format
- String length constraints enforced
- Clear error messages

---

### Step 6: Implement start-coding-session Function
**Duration:** 2 hours
**Risk:** Medium (complex business logic)

**File:** `supabase/functions/start-coding-session/index.ts`

**Purpose:** Create new coding session and job

**Key Logic:**
1. Handle CORS preflight
2. Validate JWT authentication
3. Parse and validate request body
4. Check user tier and usage limits
5. Create coding_session record
6. Create coding_job record with priority
7. Increment sessions_used counter
8. Return session details

**Implementation:** (See full code in requirements doc)

**Validation:**
- Returns 201 with sessionId, jobId, expiresAt
- Enforces usage limits (403 when exceeded)
- Creates records in both tables
- Increments usage counter

---

### Step 7: Implement continue-coding Function
**Duration:** 1 hour
**Risk:** Low (simpler than start-coding-session)

**File:** `supabase/functions/continue-coding/index.ts`

**Purpose:** Add new prompt to existing session

**Key Logic:**
1. Handle CORS preflight
2. Validate JWT authentication
3. Parse and validate request body
4. Verify session exists and user owns it (via RLS)
5. Check session not expired
6. Create new coding_job record
7. Return job details

**Validation:**
- Returns 201 with jobId
- Returns 404 if session not found
- Returns 410 if session expired
- RLS prevents cross-user access

---

### Step 8: Implement get-session-status Function
**Duration:** 45 minutes
**Risk:** Low (read-only operation)

**File:** `supabase/functions/get-session-status/index.ts`

**Purpose:** Retrieve session details with events

**Key Logic:**
1. Handle CORS preflight
2. Validate JWT authentication
3. Extract sessionId from query params
4. Query session with related events (join)
5. RLS automatically filters to user's sessions
6. Return session with events array

**Validation:**
- Returns 200 with session details
- Returns 404 if session not found
- Includes nested events array
- RLS prevents cross-user access

---

### Step 9: Create Shared Utilities Unit Tests
**Duration:** 1 hour
**Risk:** Low

**Files:**
- `supabase/functions/_shared/auth-test/index.test.ts`
- `supabase/functions/_shared/validation-test/index.test.ts`

**Tests:**
- Auth: Valid token, invalid token, missing token
- Validation: Valid input, invalid UUIDs, string length violations

**Run with:**
```bash
deno test supabase/functions/_shared/
```

---

### Step 10: Create Integration Tests
**Duration:** 2 hours
**Risk:** Medium (requires Supabase local setup)

**File:** `tests/integration/edge-functions.test.ts`

**Test Cases:**
1. **start-coding-session**
   - Creates session with valid input
   - Rejects when limit reached
   - Validates input format
   - Requires authentication

2. **continue-coding**
   - Adds job to existing session
   - Rejects expired sessions
   - Validates session ownership

3. **get-session-status**
   - Returns session with events
   - Returns 404 for non-existent session
   - Enforces RLS

**Setup:**
```bash
# Ensure Supabase is running locally
supabase start

# Run migrations from Phase 11
supabase db reset

# Run tests
npm test -- tests/integration/edge-functions.test.ts
```

---

### Step 11: Manual Testing with cURL
**Duration:** 30 minutes
**Risk:** Low

**Commands:**
```bash
# Start functions locally
supabase functions serve

# Get auth token (from Supabase Auth)
export TOKEN="<jwt-token>"

# Test start-coding-session
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<uuid>","prompt":"Build a todo app"}'

# Test continue-coding
curl -X POST http://localhost:54321/functions/v1/continue-coding \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<uuid>","prompt":"Add dark mode"}'

# Test get-session-status
curl http://localhost:54321/functions/v1/get-session-status?sessionId=<uuid> \
  -H "Authorization: Bearer $TOKEN"

# Test CORS preflight
curl -X OPTIONS http://localhost:54321/functions/v1/start-coding-session \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization" \
  -v
```

**Validation:**
- All endpoints return proper status codes
- CORS headers present in responses
- Error messages are clear
- Response formats match expectations

---

### Step 12: Create API Documentation
**Duration:** 2 hours
**Risk:** Low

**File:** `docs/backend/API.md`

**Sections:**
1. Overview & Base URL
2. Authentication
3. Endpoints:
   - `POST /start-coding-session`
   - `POST /continue-coding`
   - `GET /get-session-status`
4. Request/Response Examples
5. Error Codes
6. Rate Limiting
7. CORS Configuration
8. Testing Guide

**Format:** OpenAPI/Swagger style with code examples

---

### Step 13: Environment Configuration Documentation
**Duration:** 15 minutes
**Risk:** Low

**Update:** Project README or `.env.example`

**Document:**
```bash
# Supabase Configuration
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-anon-key>

# For Worker Service (Phase 13)
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
```

---

### Step 14: Deploy Functions (Optional for Phase 12)
**Duration:** 30 minutes
**Risk:** Low (if deploying)

**Commands:**
```bash
# Deploy all functions to Supabase
supabase functions deploy start-coding-session
supabase functions deploy continue-coding
supabase functions deploy get-session-status

# Verify deployment
supabase functions list

# Set secrets
supabase secrets set SUPABASE_URL=<production-url>
supabase secrets set SUPABASE_ANON_KEY=<production-key>
```

**Validation:**
- Functions appear in Supabase dashboard
- Functions respond to test requests
- Secrets are properly set

**Note:** Deployment may be deferred to later phase if not needed immediately

---

### Step 15: Update links-map.md
**Duration:** 10 minutes
**Risk:** Low

**Update:** `docs/phases/phase1/links-map.md`

**Add Phase 12 artifacts:**
- Edge Function files
- Integration tests
- API documentation
- Research & context docs

---

### Step 16: Verification & Phase Completion
**Duration:** 30 minutes
**Risk:** Low

**Checklist:**
- [ ] All 3 Edge Functions implemented and working
- [ ] Shared utilities (_shared/) created and tested
- [ ] JWT authentication validates tokens correctly
- [ ] Input validation rejects bad data
- [ ] CORS configured for mobile app
- [ ] Usage limits enforced (tier-based)
- [ ] Session expiration checked
- [ ] Integration tests pass
- [ ] Manual cURL tests successful
- [ ] API documentation complete
- [ ] Error handling returns proper status codes
- [ ] Response formats consistent

**Run:**
```bash
# Run all tests
npm test

# Start functions locally and verify
supabase functions serve

# Check function logs for errors
supabase functions logs <function-name>
```

---

## Total Duration Summary

| Step | Task | Duration |
|------|------|----------|
| 1 | Directory setup | 15 min |
| 2 | CORS utility | 10 min |
| 3 | Response utilities | 15 min |
| 4 | Auth validation | 30 min |
| 5 | Input validation | 20 min |
| 6 | start-coding-session | 2 hours |
| 7 | continue-coding | 1 hour |
| 8 | get-session-status | 45 min |
| 9 | Unit tests | 1 hour |
| 10 | Integration tests | 2 hours |
| 11 | Manual testing | 30 min |
| 12 | API documentation | 2 hours |
| 13 | Environment docs | 15 min |
| 14 | Deployment (optional) | 30 min |
| 15 | Update links-map | 10 min |
| 16 | Verification | 30 min |
| **Total** | | **~12 hours** |

**With Buffer (2 days):** Accounts for debugging, revisions, breaks

---

## Dependencies

**Required Before Starting:**
- Phase 11 database schema applied
- Supabase local development environment setup
- Database migrations run successfully
- Test user accounts created in Supabase Auth

**Outputs to Phase 13:**
- Edge Functions creating jobs in `coding_jobs` table
- Sessions properly created with expiration times
- Worker service can poll jobs table for pending work

---

## Risk Mitigation

### JWT Validation Issues
- **Risk:** Auth tokens not validating correctly
- **Mitigation:** Test with real Supabase Auth tokens, check environment variables

### RLS Policy Conflicts
- **Risk:** Functions can't access data due to RLS
- **Mitigation:** Use anon key + user JWT (not service key), test with multiple users

### CORS Errors
- **Risk:** Mobile app blocked by CORS policy
- **Mitigation:** Test OPTIONS preflight, verify headers in response, use wildcard during development

### Usage Limit Edge Cases
- **Risk:** Race conditions when checking limits
- **Mitigation:** Use database transactions, consider advisory locks for critical sections

### Session Expiration Logic
- **Risk:** Expired sessions not properly rejected
- **Mitigation:** Check `expires_at` timestamp in all session operations

---

## Testing Strategy

### Unit Tests (Deno)
- Test shared utilities in isolation
- Mock external dependencies
- Fast feedback loop

### Integration Tests (Jest + Supabase)
- Test full request/response cycle
- Use real database (local instance)
- Verify RLS enforcement

### Manual Tests (cURL)
- Smoke test each endpoint
- Verify error responses
- Check CORS headers

### Load Tests (Future)
- Artillery or k6 for load testing
- Verify performance under load
- Check cold start times

---

## Success Criteria

1. ✅ All 3 Edge Functions implemented and deployed locally
2. ✅ Auth validation works with Supabase JWT tokens
3. ✅ Input validation catches malformed requests
4. ✅ CORS configured correctly for React Native app
5. ✅ Error handling returns proper HTTP status codes
6. ✅ Usage limits enforced based on user tier
7. ✅ Session expiration checked before operations
8. ✅ Integration tests pass consistently
9. ✅ API documentation complete and accurate
10. ✅ Manual cURL tests successful

---

## Next Phase Handoff

**Phase 13: Job Queue & Worker Service**

**Inputs Provided:**
- `coding_jobs` table populated with pending jobs
- `coding_sessions` table with active sessions
- Job priority field for tier-based processing

**Worker Service Will:**
- Poll `coding_jobs` for pending jobs
- Claim jobs and update status
- Execute Claude Code operations
- Emit events to `session_events` table
- Update job status to completed/failed
