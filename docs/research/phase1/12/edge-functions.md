# Edge Functions Research - Phase 12

## Supabase Edge Functions Best Practices 2025

### Architecture & Design
- **Fat Functions Over Many Small Functions** - Minimize cold starts by creating fewer, larger functions that combine related functionality
- **Design for Cold Starts** - Keep operations short-lived and idempotent, delegate long-running jobs to background workers
- **Connection Strategy** - Treat Postgres as remote pooled service, use serverless-friendly drivers
- **Performance** - Persistent storage and optimizations achieved 97% faster cold starts in 2025

### Code Organization
- **Shared Code** - Store common code in `_shared/` folder (underscore prefix)
  - Supabase clients
  - CORS headers
  - Auth validation
  - Response helpers
- **Naming** - Use hyphens for function names (most URL-friendly)
- **Testing** - Create `[function-name]-test/` folders for unit tests

### Security Best Practices
- **Credentials** - Store in Supabase project secrets, access via environment variables
- **JWT Validation** - Gateway validates Supabase JWTs before function execution
- **Rate Limiting** - Centralized security checks at gateway level
- **Auth Pattern** - Extract and validate Bearer token from Authorization header

### Development Workflow
- **Hot Reloading** - Functions run at `http://localhost:54321/functions/v1/[name]`
- **Consistency** - Supabase CLI uses Edge Runtime for dev/prod parity
- **Instant Changes** - Save file → changes appear immediately

### Testing & Monitoring
- **Built-in Test Runner** - Deno has native test runner for JS/TS
- **Observability** - Invocations emit logs and metrics
- **Integration** - Dashboard monitoring + downstream tools (Sentry)
- **Structured Logging** - Use info, warn, error, debug helpers correlated with traces

## Deno Serverless Error Handling Patterns

### 1. Basic Try-Catch Pattern
```typescript
try {
  // Function logic
} catch (err) {
  return new Response(`Internal Server Error\n\n${err.message}`, {
    status: 500
  })
}
```

### 2. Request Validation
```typescript
try {
  const body = await req.json()
} catch {
  return new Response('could not parse body', { status: 500 })
}
```

### 3. Production-Ready Error Response
```typescript
return new Response(JSON.stringify({
  error: message,
  requestId: crypto.randomUUID(),
  timestamp: new Date().toISOString()
}), {
  status: 500,
  headers: {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
    'X-Processing-Time': `${Date.now() - startTime}ms`
  }
})
```

### 4. Memory Limitations
- **Deno Deploy Memory Limit** - Exceeding causes "Memory limit exceeded, terminated"
- **Debugging** - Use `--inspect` flag before run command
- **Parallel Fetch Limit** - 100 parallel fetch requests max
- **Recursive Calls** - LOOP_DETECTED error on recursive worker calls

### 5. HTTP Status Codes
- `400` - Bad request, validation errors
- `401` - Unauthorized, invalid/missing token
- `403` - Forbidden, quota exceeded
- `404` - Not found
- `410` - Gone, expired resource
- `500` - Internal server error
- `503` - Service unavailable, timeout

## API Rate Limiting

### Upstash Redis Pattern (Recommended)
- **Official Supabase Approach** - Use Upstash Redis for distributed rate limiting
- **Error Codes**:
  - `EF047` - Function API Rate Limit Exceeded (throttling)
  - `EF009` - Rate Limit Exceeded (too many calls in timeframe)

### Implementation Strategies
1. **Application-Level** - Track requests by user/IP with express-rate-limit
2. **Gateway-Level** - Validate JWT + apply rate-limits before function execution
3. **Caching** - Cache responses to minimize repeated requests
4. **Batching** - Batch requests to reduce individual API calls

### Rate Limiting Best Practices
- **Per-User Limits** - Track by authenticated user ID
- **Per-IP Limits** - Fallback for unauthenticated requests
- **Tier-Based** - Different limits per subscription tier (free/starter/pro)
- **Sliding Window** - Prevent burst attacks
- **Header Communication** - Return rate limit info in response headers
  - `X-RateLimit-Limit` - Total allowed
  - `X-RateLimit-Remaining` - Requests remaining
  - `X-RateLimit-Reset` - When limit resets

## Edge Function Limits (Supabase)

### Execution
- **Timeout** - 150 seconds max execution time
- **Memory** - Varies by plan, typically 512MB-1GB
- **Request Size** - 2MB max request body
- **Response Size** - 2MB max response body

### Best Practices for Limits
- **Keep Fast** - Target <5 seconds per request
- **Stream Large Data** - Use streaming for responses >1MB
- **Delegate Long Tasks** - Move to background workers via job queue
- **Monitor Performance** - Track execution time, memory usage

## Security Patterns

### JWT Validation
```typescript
import { createClient } from '@supabase/supabase-js'

export async function validateAuth(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Missing Authorization header')

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid token')

  return { user, supabase }
}
```

### Input Validation with Zod
```typescript
import { z } from 'zod'

const schema = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(10).max(5000)
})

try {
  const validated = schema.parse(body)
} catch (error) {
  return errorResponse('Invalid input', 400)
}
```

### CORS Configuration
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production: specific domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

## Performance Optimization

### Cold Start Reduction
- **Fat Functions** - Combine related endpoints
- **Persistent Storage** - 97% faster cold starts with persistent storage
- **Connection Pooling** - Reuse database connections
- **Lazy Loading** - Import heavy dependencies only when needed

### Response Optimization
- **JSON Streaming** - For large payloads
- **Compression** - gzip/brotli for responses
- **Caching Headers** - Cache-Control for static responses
- **Early Returns** - Validate early, return fast on errors

## Testing Strategies

### Unit Tests (Deno Test Runner)
```typescript
// function-name-test/index.test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts'

Deno.test('validates auth token', async () => {
  const result = await validateAuth(mockRequest)
  assertEquals(result.user.id, 'expected-id')
})
```

### Integration Tests
```typescript
// tests/integration/edge-functions.test.ts
import { createClient } from '@supabase/supabase-js'

describe('start-coding-session', () => {
  it('creates session with valid auth', async () => {
    const res = await supabase.functions.invoke('start-coding-session', {
      body: { projectId, prompt: 'Build app' }
    })
    expect(res.data.sessionId).toBeDefined()
  })
})
```

### Load Testing
- **Artillery** - For load/stress testing
- **k6** - For performance testing
- **Supabase Dashboard** - Monitor metrics during tests

## Key Takeaways

1. **Keep Functions Fast** - <5s execution, delegate long tasks to workers
2. **Centralize Auth & Validation** - Shared utilities for consistency
3. **Design for Edge** - Idempotent, stateless, connection-aware
4. **Monitor Everything** - Logs, metrics, traces for debugging
5. **Test Thoroughly** - Unit tests + integration tests + load tests
6. **Security First** - JWT validation, input validation, rate limiting
7. **CORS for Mobile** - Configure proper CORS headers for React Native app

## References
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
- [Supabase Rate Limiting Example](https://supabase.com/docs/guides/functions/examples/rate-limiting)
