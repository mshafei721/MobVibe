# 12-edge-functions.md
---
phase_id: 12
title: Edge Functions Foundation
duration_estimate: "2 days"
incremental_value: API endpoints for job creation and session management
owners: [Backend Engineer]
dependencies: [11]
linked_phases_forward: [13]
docs_referenced: [Architecture, Implementation, Data Flow]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["Supabase Edge Functions best practices", "Deno serverless patterns", "API authentication Supabase"]
    outputs: ["/docs/research/phase1/12/edge-functions.md"]
  - name: ContextCurator
    tool: context7
    scope: ["architecture.md Edge Functions", "data-flow.md API flows", "Phase 11 schema"]
    outputs: ["/docs/context/phase1/12-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for creating Edge Functions with auth and validation"
    outputs: ["/docs/sequencing/phase1/12-functions-steps.md"]
acceptance_criteria:
  - start-coding-session function validates auth and creates job
  - continue-coding function adds prompts to existing sessions
  - get-session-status function returns session details
  - All functions validate input and handle errors
  - CORS configured for mobile app
  - Functions tested with cURL and integration tests
---

## Objectives

1. **Create Core API Endpoints** - Edge Functions for session management
2. **Implement Authentication** - Validate Supabase JWT tokens
3. **Input Validation** - Validate and sanitize all inputs

## Scope

### In
- `start-coding-session` - Create new coding session
- `continue-coding` - Add prompt to existing session
- `get-session-status` - Get session details
- Auth validation middleware
- Input validation (Zod schemas)
- CORS configuration
- Error handling

### Out
- Complex business logic (defer to worker service)
- File operations (worker service)
- Long-running operations (>5s)

## Tasks

- [ ] **Use context7** to compile API context:
  - Include: architecture.md Edge Functions section
  - Include: data-flow.md API request flows
  - Include: Phase 11 database schema
  - Output: `/docs/context/phase1/12-context-bundle.md`

- [ ] **Use websearch** for Edge Functions patterns:
  - Query: "Supabase Edge Functions best practices 2025"
  - Query: "Deno Deploy serverless error handling"
  - Query: "API rate limiting Edge Functions"
  - Output: `/docs/research/phase1/12/edge-functions.md`

- [ ] **Use sequentialthinking** to plan:
  - Define: Function signatures and inputs
  - Define: Auth validation approach
  - Define: Error handling strategy
  - Output: `/docs/sequencing/phase1/12-functions-steps.md`

- [ ] **Setup Edge Functions Directory**:
  ```bash
  # Create functions
  supabase functions new start-coding-session
  supabase functions new continue-coding
  supabase functions new get-session-status
  ```

- [ ] **Create Shared Utilities** (`supabase/functions/_shared/`):
  ```typescript
  // supabase/functions/_shared/auth.ts
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

  ```typescript
  // supabase/functions/_shared/validation.ts
  import { z } from 'zod'

  export const StartSessionSchema = z.object({
    projectId: z.string().uuid(),
    prompt: z.string().min(10).max(5000),
  })

  export const ContinueCodingSchema = z.object({
    sessionId: z.string().uuid(),
    prompt: z.string().min(10).max(5000),
  })
  ```

  ```typescript
  // supabase/functions/_shared/response.ts
  export function successResponse(data: any, status = 200) {
    return new Response(JSON.stringify({ success: true, data }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  export function errorResponse(message: string, status = 400) {
    return new Response(JSON.stringify({ success: false, error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  ```

- [ ] **Create start-coding-session Function**:
  ```typescript
  // supabase/functions/start-coding-session/index.ts
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import { validateAuth } from '../_shared/auth.ts'
  import { StartSessionSchema } from '../_shared/validation.ts'
  import { successResponse, errorResponse } from '../_shared/response.ts'

  serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // Validate auth
      const { user, supabase } = await validateAuth(req)

      // Parse and validate input
      const body = await req.json()
      const { projectId, prompt } = StartSessionSchema.parse(body)

      // Check user tier and usage limits
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, sessions_used, sessions_limit')
        .eq('id', user.id)
        .single()

      if (profile.sessions_used >= profile.sessions_limit) {
        return errorResponse('Session limit reached', 403)
      }

      // Create session
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min
      const { data: session, error: sessionError } = await supabase
        .from('coding_sessions')
        .insert({
          user_id: user.id,
          project_id: projectId,
          initial_prompt: prompt,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create job in queue
      const { data: job, error: jobError } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: session.id,
          prompt: prompt,
          status: 'pending',
          priority: profile.tier === 'pro' ? 10 : 0,
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Increment usage
      await supabase
        .from('profiles')
        .update({ sessions_used: profile.sessions_used + 1 })
        .eq('id', user.id)

      return successResponse({
        sessionId: session.id,
        jobId: job.id,
        expiresAt: session.expires_at,
      }, 201)

    } catch (error) {
      console.error('Error:', error)
      return errorResponse(error.message, 500)
    }
  })

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  ```

- [ ] **Create continue-coding Function**:
  ```typescript
  // supabase/functions/continue-coding/index.ts
  serve(async (req) => {
    try {
      const { user, supabase } = await validateAuth(req)
      const body = await req.json()
      const { sessionId, prompt } = ContinueCodingSchema.parse(body)

      // Verify session ownership
      const { data: session } = await supabase
        .from('coding_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (!session) {
        return errorResponse('Session not found', 404)
      }

      if (session.status === 'expired' || new Date(session.expires_at) < new Date()) {
        return errorResponse('Session expired', 410)
      }

      // Create new job
      const { data: job } = await supabase
        .from('coding_jobs')
        .insert({
          session_id: sessionId,
          prompt: prompt,
          status: 'pending',
        })
        .select()
        .single()

      return successResponse({ jobId: job.id }, 201)

    } catch (error) {
      return errorResponse(error.message, 500)
    }
  })
  ```

- [ ] **Create get-session-status Function**:
  ```typescript
  // supabase/functions/get-session-status/index.ts
  serve(async (req) => {
    try {
      const { user, supabase } = await validateAuth(req)
      const url = new URL(req.url)
      const sessionId = url.searchParams.get('sessionId')

      if (!sessionId) {
        return errorResponse('sessionId required', 400)
      }

      // Get session with latest events
      const { data: session } = await supabase
        .from('coding_sessions')
        .select(`
          *,
          session_events (
            event_type,
            data,
            created_at
          )
        `)
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (!session) {
        return errorResponse('Session not found', 404)
      }

      return successResponse(session)

    } catch (error) {
      return errorResponse(error.message, 500)
    }
  })
  ```

- [ ] **Add Environment Variables**:
  ```bash
  # .env.local
  SUPABASE_URL=your-project-url
  SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

- [ ] **Test Functions Locally**:
  ```bash
  # Start functions locally
  supabase functions serve

  # Test start-coding-session
  curl -X POST http://localhost:54321/functions/v1/start-coding-session \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "projectId": "uuid-here",
      "prompt": "Build a todo app"
    }'

  # Test continue-coding
  curl -X POST http://localhost:54321/functions/v1/continue-coding \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "sessionId": "uuid-here",
      "prompt": "Add dark mode"
    }'

  # Test get-session-status
  curl http://localhost:54321/functions/v1/get-session-status?sessionId=uuid-here \
    -H "Authorization: Bearer $TOKEN"
  ```

- [ ] **Create Integration Tests**:
  ```typescript
  // tests/integration/edge-functions.test.ts
  describe('Edge Functions', () => {
    describe('start-coding-session', () => {
      it('creates session and job', async () => {
        const res = await supabase.functions.invoke('start-coding-session', {
          body: { projectId, prompt: 'Build a todo app' }
        })

        expect(res.data.sessionId).toBeDefined()
        expect(res.data.jobId).toBeDefined()
      })

      it('rejects when session limit reached', async () => {
        // Create user at limit
        const res = await supabase.functions.invoke('start-coding-session', {
          body: { projectId, prompt: 'Test' }
        })

        expect(res.error).toContain('Session limit reached')
      })
    })
  })
  ```

- [ ] **Deploy Functions**:
  ```bash
  # Deploy to Supabase
  supabase functions deploy start-coding-session
  supabase functions deploy continue-coding
  supabase functions deploy get-session-status
  ```

- [ ] **Document API**:
  - Create: `docs/backend/API.md`
  - Include: Endpoint specs (OpenAPI/Swagger style)
  - Include: Request/response examples
  - Include: Error codes

- [ ] **Update links-map** with Edge Function artifacts

## Artifacts & Paths

**Functions:**
- `supabase/functions/start-coding-session/index.ts`
- `supabase/functions/continue-coding/index.ts`
- `supabase/functions/get-session-status/index.ts`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/validation.ts`
- `supabase/functions/_shared/response.ts`

**Tests:**
- `tests/integration/edge-functions.test.ts`

**Docs:**
- `docs/backend/API.md` ⭐

## Testing

### Phase-Only Tests
- All functions respond correctly
- Auth validation works
- Input validation rejects bad data
- Error handling returns proper status codes
- CORS works for mobile app

### Cross-Phase Compatibility
- Phase 13 Job Queue will consume jobs created here
- Phase 17 Session Lifecycle will use these endpoints

### Test Commands
```bash
# Local testing
supabase functions serve
npm run test:functions

# Integration tests
npm test -- tests/integration/edge-functions.test.ts
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Edge Function timeout (150s) | Can't handle long operations | Keep functions fast (<5s), delegate to worker |
| CORS issues | Mobile app blocked | Test CORS thoroughly, allow proper origins |
| Auth token validation fails | Users can't access API | Test auth middleware, handle token refresh |

## References

- [Architecture](./../../../../.docs/architecture.md) - Edge Functions architecture
- [Data Flow](./../../../../.docs/data-flow.md) - API flows
- [Phase 11](./11-database-schema.md) - Database schema

## Handover

**Next Phase:** [13-job-queue.md](./13-job-queue.md) - Implement job queue with Realtime

**Required Inputs Provided to Phase 13:**
- Edge Functions creating jobs in coding_jobs table
- Session management working

---

**Status:** Ready after Phase 11
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 11 database schema
