<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: architecture.md, implementation.md, recommendations.md, roadmap.md
-->

# MobVibe Architecture Analysis & Improvements

> See [SUMMARY.md](./SUMMARY.md) for complete documentation index.

> Deep analysis of Codex recommendations with 2025 best practices

## Executive Summary

**Critical Changes Required:**
1. **Sandbox Orchestration** - Move from Edge Functions to dedicated worker service
2. **API Security** - Remove client-side API keys, proxy all AI services through backend
3. **Preview System** - Adopt EAS Update + dev clients (no self-hosted tunnels)
4. **Data Model** - Add WITH CHECK to RLS, move files to Storage
5. **Documentation** - Fix UTF-8 encoding, add linting

---

## 1. Sandbox Orchestration: Worker Service Architecture

### Problem: Edge Functions Can't Run Long Tasks

**Current:** Edge Functions run Claude Agent directly
**Issue:** Supabase Edge Functions timeout at 150 seconds
**Reality:** Claude coding sessions need 5-30 minutes

### Solution: Event-Driven Worker Architecture

```
User Request → Edge Function (<5s)
    ├── Validate auth/tier
    ├── Create session record
    ├── Enqueue job to queue
    └── Return session ID + WS URL
        ↓
Message Queue (Supabase Realtime / Redis)
        ↓
Worker Service (Fly.io / Render / Railway)
    ├── Long-running Node.js process
    ├── Polls queue for jobs
    ├── Runs Claude Agent (5-30 min)
    ├── Manages sandbox lifecycle
    └── Streams events via Realtime
        ↓
Mobile App (receives real-time updates)
```

**Key Benefits:**
- Edge Functions stay fast (<5s)
- Worker has unlimited runtime
- Can handle disconnects
- Proper separation of concerns
- Independent scaling

**Research Findings:**
- Supabase Edge Functions: 2s CPU time, 150s idle, 400s wall clock max
- Claude Agent SDK best practice: orchestrator pattern with specialized subagents
- Production requirements: versioned hooks, idempotent operations, rollback capability

**See also:** [architecture.md](./architecture.md) for complete event-driven worker architecture, [roadmap.md](./roadmap.md) Weeks 3-7 for implementation timeline

---

## 2. API Security: Backend Proxy Pattern

### Problem: Client-Side API Keys Exposed

**Current Issue:**
```bash
# Mobile .env - EXPOSED in JavaScript bundle!
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
EXPO_PUBLIC_ELEVENLABS_API_KEY=sk_...
```

**Risks:**
- Anyone can extract keys from app bundle
- Unlimited API usage on our account
- No per-user rate limiting
- Can't track costs per user
- No content moderation

### Solution: Backend API Proxy

```
Mobile App
    ↓
POST /api/generate-icon
    {prompt, projectId}
    Authorization: Bearer <jwt>
    ↓
Edge Function
    ├── Validate JWT
    ├── Check user tier/limits
    ├── Rate limit by user
    ├── Call Nano Banana (server-side key)
    ├── Save to Supabase Storage
    └── Return signed URL
    ↓
Mobile displays image
```

**Benefits:**
- API keys never exposed
- Per-user rate limits
- Cost tracking
- Content moderation
- Asset caching/reuse

**Security Pattern:**
```typescript
// REMOVE from mobile .env:
// EXPO_PUBLIC_OPENAI_API_KEY ❌
// EXPO_PUBLIC_ELEVENLABS_API_KEY ❌

// Backend handles all AI API calls ✅
```

**See also:** [implementation.md](./implementation.md) for backend API endpoint specifications, [recommendations.md](./recommendations.md) Section 4 for security requirements

---

## 3. Expo Preview: EAS Update Workflow

### Problem: Self-Hosted Tunnels Are Fragile

**Current:** Running expo start --tunnel in sandbox
**Issues:**
- Ngrok tunnels unreliable
- Complex port management
- Security concerns with open tunnels
- Doesn't work well with Fly.io networking

### Solution: EAS Update + In-App WebView Preview

**Primary Approach:** In-app WebView (no scanning)
- User taps Preview tab → WebView loads app instantly
- EAS Update provides the preview URL
- No QR code scanning needed
- Seamless single-device experience

**Research (Expo SDK 54, Jan 2025):**
- EAS Update is the official preview workflow
- Dev builds can load published updates instantly
- No self-hosted tunnel management
- Better security and reliability

**Workflow:**
```
Claude finishes coding
    ↓
Worker runs: eas update --branch preview-{sessionId}
    ↓
Get preview URL from EAS
    ↓
Emit preview_ready event with webviewUrl
    ↓
User taps Preview tab
    ↓
WebView loads app from EAS CDN
```

**Benefits:**
- Official Expo workflow
- No tunnel management
- Better security
- Works everywhere
- Team sharing via QR

**Tradeoff:**
- Requires EAS account (free tier available)
- ~30s to publish update
- Need eas.json configuration

**See also:** [UX-CHANGES.md](./UX-CHANGES.md) for complete in-app WebView preview design, [roadmap.md](./roadmap.md) Weeks 10-11 for UI implementation

---

## 4. Data Model: RLS + Object Storage

### Problem: Missing WITH CHECK, Files in Postgres

**Current Issues:**
```sql
-- Missing WITH CHECK
CREATE POLICY "Users view own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);
-- ❌ Can fail silently on INSERT

-- Large text in Postgres
CREATE TABLE project_files (
  content TEXT  -- ❌ 10MB+ code bloats DB
);
```

### Solution: WITH CHECK + Supabase Storage

**Research Findings:**
- Common RLS issue: policies need both USING and WITH CHECK
- Supabase Storage has helper functions for RLS
- Binary files belong in object storage, not Postgres

**Corrected Schema:**
```sql
-- Add WITH CHECK everywhere
CREATE POLICY "Users manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);  -- ✅ ADD THIS

-- Store metadata, not content
CREATE TABLE project_files (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  path TEXT NOT NULL,
  storage_path TEXT NOT NULL,  -- → Supabase Storage
  file_type TEXT,
  size_bytes INTEGER,
  UNIQUE(project_id, path)
);

-- Storage RLS
CREATE POLICY "Users upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects
      WHERE user_id = auth.uid()
    )
  );
```

**Benefits:**
- Postgres stays lean
- Can store binary assets
- Better performance
- Proper RLS enforcement
- Easier backups

**See also:** [implementation.md](./implementation.md) for complete database schema with RLS policies, [recommendations.md](./recommendations.md) Section 5 for data model best practices

---

## 5. Documentation Quality: Linting + CI

### Problem: Encoding Issues

Corrupted UTF-8 characters can break CI/CD tools and documentation generators.

### Solution: Markdownlint + CI Enforcement

```yaml
# .markdownlintrc
default: true
MD013: false  # Line length
MD033: false  # HTML allowed

# package.json
"scripts": {
  "lint:md": "markdownlint '**/*.md' --ignore node_modules"
}

# GitHub Actions
- name: Lint Markdown
  run: pnpm lint:md
```

---

## Implementation Priority

| Change | Priority | Impact | Effort |
|--------|----------|--------|--------|
| Worker Service | **CRITICAL** | High | High |
| API Security | **CRITICAL** | Medium | Medium |
| EAS Preview | High | Medium | Medium |
| RLS + Storage | High | Medium | Medium |
| Markdown Lint | Medium | Low | Low |

**See also:** [recommendations.md](./recommendations.md) for complete list of documentation improvements

**Next:** Update all three docs with corrected patterns ✅
