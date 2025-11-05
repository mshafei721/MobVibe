<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: roadmap.md, architecture.md, implementation.md, analysis.md
-->

# MobVibe Documentation Recommendations

> See [SUMMARY.md](./SUMMARY.md) for complete documentation index.

## Summary
- Replace corrupted characters in existing Markdown files with plain UTF-8 text and add linting to prevent regression.
- Rework sandbox orchestration to run outside Supabase Edge Functions and keep Claude sessions alive.
- Adopt a managed Expo preview workflow (Snack or EAS Update/dev clients) instead of self-hosted tunnels.
- Proxy all third-party AI and asset APIs through the backend and store outputs in Supabase Storage.
- Update RLS policies with WITH CHECK clauses and move generated file blobs out of Postgres tables.

## Details

### 1. Fix Documentation Encoding
- Re-export README.md and .docs/architecture.md without emoji control codes so core messaging is legible.
- Add automated Markdown/encoding lint (e.g. markdownlint, custom script) to CI to block future corruption.

### 2. Move Sandbox Orchestration Off Edge Functions
- Keep session creation logic in Supabase but push long-lived work to a Fly or Render service that manages Claude loops.
- Have Edge Functions enqueue jobs/events; the service streams terminal/file updates to Supabase Realtime.
- This avoids Deno edge timeouts and supports multi-minute coding runs.

**See also:** [architecture.md](./architecture.md) for event-driven worker architecture details, [analysis.md](./analysis.md) Section 1 for comprehensive solution

### 3. Use Managed Expo Preview
- Skip running expo start --tunnel inside sandboxes; rely on Expo Snack for instant previews or EAS Update/dev clients for QR flows.
- Document whichever path you choose in both implementation guide and roadmap to keep expectations aligned.

**See also:** [UX-CHANGES.md](./UX-CHANGES.md) for in-app WebView preview approach, [roadmap.md](./roadmap.md) Phase 1 for implementation timeline

### 4. Secure API Usage
- Remove EXPO_PUBLIC_* secrets for Anthropic, DALL-E, ElevenLabs from the mobile app; expose backend endpoints instead.
- Save generated assets to Supabase Storage (or another CDN) and return signed URLs to the client.

**See also:** [analysis.md](./analysis.md) Section 2 for backend proxy pattern implementation, [implementation.md](./implementation.md) for API endpoint specifications

### 5. Harden Data Model
- Add WITH CHECK clauses to every RLS policy so inserts/updates succeed and remain scoped to the owner.
- Store generated code/assets in object storage with metadata rows referencing versions to keep Postgres lean and enable binary assets.

**See also:** [analysis.md](./analysis.md) Section 4 for corrected schema with RLS, [implementation.md](./implementation.md) for database schema details
