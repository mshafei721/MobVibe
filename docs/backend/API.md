# MobVibe Edge Functions API Documentation

## Overview

The MobVibe API provides Edge Functions for managing coding sessions powered by Claude Code. All API endpoints are deployed as Supabase Edge Functions running on Deno Deploy.

**Base URL (Local):** `http://localhost:54321/functions/v1`
**Base URL (Production):** `https://<project-ref>.supabase.co/functions/v1`

**Version:** 1.0.0
**Last Updated:** 2025

---

## Authentication

All API endpoints require authentication via Supabase JWT tokens.

### Authentication Header

```http
Authorization: Bearer <jwt-token>
```

### Obtaining a Token

Tokens are issued by Supabase Auth when users sign up or log in:

```typescript
// React Native example
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

const token = session.access_token
```

### Token Validation

- Tokens are validated using `supabase.auth.getUser()`
- Row-Level Security (RLS) policies automatically filter data based on authenticated user
- Invalid or expired tokens return `401 Unauthorized`

---

## CORS Configuration

All endpoints support CORS for mobile applications:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

**Preflight Requests:** All endpoints respond to `OPTIONS` requests for CORS preflight.

---

## Rate Limiting

Rate limiting is enforced at the Supabase platform level:

- **Free Tier:** 500 requests/day
- **Starter Tier:** 10,000 requests/day
- **Pro Tier:** 100,000 requests/day
- **Enterprise Tier:** Custom limits

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9987
X-RateLimit-Reset: 1735689600
```

---

## Response Format

All API endpoints return JSON responses in a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Usage limit exceeded, insufficient permissions |
| 404 | Not Found | Resource not found |
| 410 | Gone | Resource expired |
| 500 | Internal Server Error | Unexpected server error |

---

## Endpoints

### 1. Start Coding Session

Create a new coding session and job in the queue.

**Endpoint:** `POST /start-coding-session`

**Request Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "projectId": "uuid",
  "prompt": "string (10-5000 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "jobId": "660e8400-e29b-41d4-a716-446655440001",
    "expiresAt": "2025-01-01T13:30:00.000Z",
    "status": "pending"
  }
}
```

**Error Responses:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | "Invalid project ID format" | projectId not a valid UUID |
| 400 | "Prompt must be at least 10 characters" | prompt too short |
| 400 | "Prompt must be less than 5000 characters" | prompt too long |
| 401 | "Invalid or expired token" | Invalid JWT token |
| 403 | "Session limit reached for your tier" | User exceeded tier limit |
| 404 | "Project not found or access denied" | Project doesn't exist or user doesn't own it |
| 500 | "Failed to create session" | Database error |

**Example Request:**

```bash
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "Build a todo app with React Native and TypeScript"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "660e8400-e29b-41d4-a716-446655440002",
    "jobId": "770e8400-e29b-41d4-a716-446655440003",
    "expiresAt": "2025-01-01T13:30:00.000Z",
    "status": "pending"
  }
}
```

**Business Logic:**

1. Validates JWT token and extracts user
2. Validates input with Zod schema
3. Checks user's profile for tier and usage limits
4. Verifies project exists and user owns it
5. Creates `coding_sessions` record with 30-minute expiration
6. Creates `coding_jobs` record with tier-based priority:
   - Free: 0
   - Starter: 5
   - Pro: 10
   - Enterprise: 10
7. Increments user's `sessions_used` counter
8. Returns session and job IDs

**Session Expiration:**
- Default: 30 minutes from creation
- Sessions expire automatically and cannot be used after expiration

**Priority-Based Processing:**
- Pro and Enterprise users get priority 10 (processed first)
- Starter users get priority 5
- Free users get priority 0 (processed last)

---

### 2. Continue Coding

Add a new prompt to an existing coding session.

**Endpoint:** `POST /continue-coding`

**Request Headers:**
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionId": "uuid",
  "prompt": "string (10-5000 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "jobId": "880e8400-e29b-41d4-a716-446655440004",
    "sessionId": "660e8400-e29b-41d4-a716-446655440002",
    "status": "pending"
  }
}
```

**Error Responses:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | "Invalid session ID format" | sessionId not a valid UUID |
| 400 | "Prompt must be at least 10 characters" | prompt too short |
| 400 | "Session already completed" | Cannot continue completed session |
| 400 | "Cannot continue failed session" | Session failed |
| 401 | "Invalid or expired token" | Invalid JWT token |
| 404 | "Session not found or access denied" | Session doesn't exist or user doesn't own it |
| 410 | "Session has expired" | Session expired |
| 500 | "Failed to create job" | Database error |

**Example Request:**

```bash
curl -X POST http://localhost:54321/functions/v1/continue-coding \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "660e8400-e29b-41d4-a716-446655440002",
    "prompt": "Add dark mode support with theme toggle"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "990e8400-e29b-41d4-a716-446655440005",
    "sessionId": "660e8400-e29b-41d4-a716-446655440002",
    "status": "pending"
  }
}
```

**Business Logic:**

1. Validates JWT token and extracts user
2. Validates input with Zod schema
3. Verifies session exists and user owns it (via RLS)
4. Checks session is not expired:
   - If `expires_at < now`, updates status to `expired` and returns 410
   - If `status === 'expired'`, returns 410
5. Checks session is not completed or failed
6. Creates new `coding_jobs` record with tier-based priority
7. Returns job ID

**Session Status Checks:**
- `pending` or `active` → Allowed
- `paused` → Allowed
- `completed` → Rejected (400)
- `failed` → Rejected (400)
- `expired` → Rejected (410)

---

### 3. Get Session Status

Retrieve details about a coding session including all events.

**Endpoint:** `GET /get-session-status`

**Request Headers:**
```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `sessionId` (required) - UUID of the session

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "initialPrompt": "Build a todo app with React Native",
    "expiresAt": "2025-01-01T13:30:00.000Z",
    "startedAt": "2025-01-01T13:05:23.000Z",
    "completedAt": null,
    "errorMessage": null,
    "metadata": {
      "files_created": 12,
      "lines_of_code": 450
    },
    "createdAt": "2025-01-01T13:00:00.000Z",
    "updatedAt": "2025-01-01T13:05:23.000Z",
    "events": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440006",
        "event_type": "thinking",
        "data": {
          "message": "Analyzing requirements and planning architecture..."
        },
        "created_at": "2025-01-01T13:00:15.000Z"
      },
      {
        "id": "bb0e8400-e29b-41d4-a716-446655440007",
        "event_type": "terminal",
        "data": {
          "output": "npm install @supabase/supabase-js"
        },
        "created_at": "2025-01-01T13:02:30.000Z"
      },
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440008",
        "event_type": "file_change",
        "data": {
          "path": "App.tsx",
          "operation": "create"
        },
        "created_at": "2025-01-01T13:03:45.000Z"
      },
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440009",
        "event_type": "preview_ready",
        "data": {
          "url": "https://preview.mobvibe.app/session-xyz"
        },
        "created_at": "2025-01-01T13:05:20.000Z"
      }
    ]
  }
}
```

**Error Responses:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | "sessionId query parameter is required" | Missing sessionId |
| 400 | "Invalid session ID format" | sessionId not a valid UUID |
| 401 | "Invalid or expired token" | Invalid JWT token |
| 404 | "Session not found or access denied" | Session doesn't exist or user doesn't own it |
| 500 | "Internal server error" | Database error |

**Example Request:**

```bash
curl http://localhost:54321/functions/v1/get-session-status?sessionId=660e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer eyJhbGciOi..."
```

**Business Logic:**

1. Validates JWT token and extracts user
2. Extracts `sessionId` from query parameter
3. Validates sessionId is a valid UUID
4. Queries `coding_sessions` with join to `session_events`
5. RLS automatically filters to user's sessions
6. Orders events by `created_at DESC` (newest first)
7. Auto-marks session as expired if `expires_at < now`
8. Returns session details with nested events array

**Event Types:**

| Type | Description | Data Schema |
|------|-------------|-------------|
| `thinking` | Claude's thought process | `{ message: string }` |
| `terminal` | Terminal command output | `{ output: string, command?: string }` |
| `file_change` | File created/modified | `{ path: string, operation: 'create'\|'update'\|'delete' }` |
| `preview_ready` | Preview URL available | `{ url: string }` |
| `completion` | Session completed | `{ summary: string, files_modified: number }` |
| `error` | Error occurred | `{ message: string, code?: string }` |

---

## Tier-Based Behavior

### Session Limits

| Tier | Sessions/Month | Priority | Expiration |
|------|----------------|----------|------------|
| Free | 3 | 0 | 30 min |
| Starter | 10 | 5 | 30 min |
| Pro | 50 | 10 | 60 min |
| Enterprise | Unlimited | 10 | 120 min |

### Priority Processing

Jobs are processed by the worker service in priority order:
1. Priority 10 (Pro, Enterprise) - processed first
2. Priority 5 (Starter)
3. Priority 0 (Free) - processed last

Within the same priority, jobs are processed FIFO (first in, first out).

---

## Real-Time Events

Mobile clients should subscribe to the `session_events` table using Supabase Realtime to receive live updates.

### Subscription Example

```typescript
// React Native example
const subscription = supabase
  .channel('session-events')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'session_events',
      filter: `session_id=eq.${sessionId}`
    },
    (payload) => {
      console.log('New event:', payload.new)
      // Update UI with new event
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

---

## Error Handling

### Client-Side Error Handling

```typescript
async function startCodingSession(projectId: string, prompt: string) {
  try {
    const response = await fetch(`${functionsUrl}/start-coding-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectId, prompt })
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle HTTP errors
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    if (!data.success) {
      // Handle API errors
      throw new Error(data.error)
    }

    return data.data
  } catch (error) {
    // Handle network errors
    console.error('Failed to start session:', error)
    throw error
  }
}
```

### Common Error Scenarios

**401 Unauthorized**
- Cause: Token expired
- Solution: Refresh token via `supabase.auth.refreshSession()`

**403 Forbidden**
- Cause: Usage limit exceeded
- Solution: Upgrade tier or wait for limit reset

**410 Gone**
- Cause: Session expired
- Solution: Start a new session

**500 Internal Server Error**
- Cause: Database or server issue
- Solution: Retry with exponential backoff, contact support if persists

---

## Testing

### Local Testing Setup

1. **Start Supabase locally:**
```bash
supabase start
```

2. **Apply database migrations:**
```bash
supabase db reset
```

3. **Start Edge Functions:**
```bash
supabase functions serve
```

4. **Create test user:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})
```

5. **Get auth token:**
```typescript
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
})

const token = session.access_token
```

### Manual Testing with cURL

**Test authentication:**
```bash
# Should return 401
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Content-Type: application/json" \
  -d '{"projectId":"uuid","prompt":"test"}'

# Should succeed
export TOKEN="your-jwt-token"
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"uuid","prompt":"Build a todo app"}'
```

**Test validation:**
```bash
# Invalid UUID - should return 400
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"not-a-uuid","prompt":"test prompt here"}'

# Prompt too short - should return 400
curl -X POST http://localhost:54321/functions/v1/start-coding-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"uuid","prompt":"short"}'
```

**Test CORS:**
```bash
curl -X OPTIONS http://localhost:54321/functions/v1/start-coding-session \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, content-type" \
  -v
```

### Integration Tests

Run the full integration test suite:

```bash
npm test -- tests/integration/edge-functions.test.ts
```

---

## Performance Considerations

### Function Execution Time

- Target: <5 seconds per request
- Timeout: 150 seconds max (Supabase limit)
- Current average: ~1-2 seconds

### Optimization Strategies

1. **Database Queries**
   - Use indexes for RLS columns (already created)
   - Minimize joins (only fetch necessary data)
   - Use `select()` to limit returned columns

2. **Cold Starts**
   - Functions use "fat function" pattern (combined related logic)
   - Persistent storage enabled (97% faster cold starts)
   - Minimal dependencies

3. **Connection Pooling**
   - Supabase client reused within request
   - Connection pooling handled by Supabase

### Monitoring

Monitor function performance in Supabase Dashboard:
- Invocation count
- Average execution time
- Error rate
- Memory usage

---

## Security Best Practices

### API Keys

**Never expose service role key in client apps:**
- ✅ Use anon key + user JWT in mobile app
- ❌ Do NOT use service role key in client
- ✅ Service role key only for worker service

### Input Validation

All inputs are validated:
- UUIDs validated with regex
- String lengths enforced
- Data types checked with Zod

### Rate Limiting

Implement client-side rate limiting to avoid hitting limits:

```typescript
class RateLimiter {
  private requests: number[] = []
  private limit = 100 // requests
  private window = 60000 // 1 minute

  async throttle() {
    const now = Date.now()
    this.requests = this.requests.filter(time => time > now - this.window)

    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0]
      const waitTime = this.window - (now - oldestRequest)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.requests.push(now)
  }
}
```

### Token Refresh

Implement automatic token refresh:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed:', session?.access_token)
    // Update stored token
  }
})
```

---

## Deployment

### Deploy Functions to Supabase

```bash
# Deploy all functions
supabase functions deploy start-coding-session
supabase functions deploy continue-coding
supabase functions deploy get-session-status

# Verify deployment
supabase functions list

# View logs
supabase functions logs start-coding-session --tail
```

### Environment Variables

Functions automatically receive:
- `SUPABASE_URL` - Project URL
- `SUPABASE_ANON_KEY` - Anon key for client operations

No additional environment variables needed.

---

## Troubleshooting

### Common Issues

**Issue:** "Invalid or expired token"
- **Cause:** JWT token expired or malformed
- **Solution:** Refresh token via `supabase.auth.refreshSession()`

**Issue:** "Session limit reached"
- **Cause:** User exceeded tier limit
- **Solution:** Upgrade tier or wait for monthly reset

**Issue:** "Session not found"
- **Cause:** RLS preventing access or session doesn't exist
- **Solution:** Verify user owns the project/session

**Issue:** "CORS error in mobile app"
- **Cause:** Missing or incorrect CORS headers
- **Solution:** Verify OPTIONS preflight is handled, check allowed origins

**Issue:** "Function timeout"
- **Cause:** Database query or operation taking too long
- **Solution:** Optimize queries, add indexes, reduce operation scope

### Debug Mode

Enable detailed logging:

```typescript
// In Edge Function
console.log('Request body:', body)
console.log('User ID:', user.id)
console.log('Query result:', data)
```

View logs in real-time:

```bash
supabase functions logs <function-name> --tail
```

---

## Changelog

### Version 1.0.0 (2025-01-01)

**Initial Release:**
- `POST /start-coding-session` - Create new session
- `POST /continue-coding` - Add prompt to session
- `GET /get-session-status` - Retrieve session details
- JWT authentication
- Input validation with Zod
- CORS support
- Tier-based rate limiting
- Real-time events support

---

## Support

For issues or questions:

- **Documentation:** [MobVibe Docs](./DATABASE.md)
- **GitHub Issues:** Create an issue in the project repository
- **Email:** support@mobvibe.app (for Enterprise customers)

---

**API Version:** 1.0.0
**Last Updated:** 2025-01-01
**Status:** Production-ready
