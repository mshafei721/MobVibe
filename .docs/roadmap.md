<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: recommendations.md, features-and-journeys.md, architecture.md, implementation.md, analysis.md
-->

# MobVibe Development Roadmap

> See [SUMMARY.md](./SUMMARY.md) for complete documentation index.

## Phase 0.5: UI Framework Integration (Pre-Phase 1)

**Duration:** 3-4 weeks (15-20 working days)
**Goal:** Establish robust UI foundation with systematic framework integration
**Status:** Planned (execute before Phase 1)

### Overview

Before starting Phase 1 MVP development, establish a curated UI framework foundation that ensures:
- Native iOS/Android feel with 60fps performance
- Single source of truth for design tokens
- Adapter pattern preventing vendor lock-in
- WCAG AA accessibility compliance
- Systematic integration of UI libraries

**See:** [ui/UI-FRAMEWORK-INTEGRATION-PLAN.md](./ui/UI-FRAMEWORK-INTEGRATION-PLAN.md) for complete 10-step specification

### Key Decisions

#### 1. Foundation Choice (Week 1)
**Choose ONE primary UI library:**

| Option | Best For | Performance | DX | Theming |
|--------|----------|-------------|-----|---------|
| **Tamagui** | Web parity, max performance, complex animations | ⭐⭐⭐⭐⭐ (compile-time) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **gluestack UI** | Rapid dev, Tailwind-like, flexible theming | ⭐⭐⭐⭐ (runtime) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Decision Criteria:**
- Score both on: performance, web viability, DX, theming depth, migration effort
- Document rationale in `docs/ui/FOUNDATION.md`

#### 2. Selective Add-On Libraries
**Cherry-pick only what's needed:**
- **React Native Paper** - Material Design components (Android-forward screens only)
- **Gifted Chat** - Rich chat UI (chat screens only)
- **Lottie** - Vector animations (centralized component)
- **UI Kitten / Elements** - Fill gaps (no duplicate primitives)

### Week-by-Week Breakdown

#### **Week 1: Baseline & Foundation Decision** (5 days)
- Day 1-2: Measure baseline (TTI, FPS, bundle size, a11y audit)
- Day 3-4: Build proof-of-concepts with Tamagui AND gluestack
- Day 5: Score both, make decision, document rationale

**Deliverable:** `docs/ui/FOUNDATION.md` with decision and scoring

---

#### **Week 2: Tokens & Primitives** (5 days)
- Day 1-2: Define unified token system (colors, typography, spacing, motion, elevation)
- Day 3-5: Build core primitives (Button, Text, Input, Card, Sheet, ListItem, Icon, Divider, Spinner)

**Deliverable:**
- `src/ui/tokens.{ts,json}` with brand mapping
- `src/ui/primitives/*` with 10+ components
- `src/ui/adapters/*` wrapping vendor libraries

---

#### **Week 3: Integration & Screen Refactors** (5 days)
- Day 1-2: Selective library integration (Paper, Gifted Chat, Lottie)
- Day 3-5: Refactor 3-5 key screens (Home, Profile, Settings, Chat, Code Editor)

**Deliverable:** Refactored screens using primitives only (zero direct vendor imports)

---

#### **Week 4: QA, Performance, Documentation** (5 days)
- Day 1-2: Testing (snapshot, RTL, a11y, E2E)
- Day 3: Performance benchmarks (TTI, FPS, bundle analysis)
- Day 4-5: Documentation (`USAGE.md`, `THEMING.md`, `ADAPTERS.md`, `MIGRATION_GUIDE.md`)

**Deliverable:**
- Complete `docs/ui/*` documentation suite
- Performance reports in `reports/ui/`
- PRs ready for review

---

### Acceptance Criteria

**Must all pass before starting Phase 1:**

| Criterion | Target | Verification |
|-----------|--------|--------------|
| **Single Source of Truth** | Zero token conflicts | `grep -r "color:" src/ \| grep -v "tokens.colors"` |
| **No Vendor Leakage** | Zero direct imports outside adapters | `grep -r "from 'react-native-paper'" src/ \| grep -v adapters` |
| **Native Feel** | Zero a11y issues, native gestures | `npx axe-core/react-native`, manual testing |
| **Performance** | TTI ≤ +10%, FPS ≥ 55 | `expo-performance-monitor` |
| **Documentation** | All 4 docs complete | Check `docs/ui/{FOUNDATION,USAGE,THEMING,ADAPTERS,MIGRATION_GUIDE}.md` |

**Automated Verification:**
```bash
./scripts/ui-audit.sh  # Runs all checks, outputs to reports/ui/AUDIT.md
```

### Deliverables

**Code:**
```
src/ui/
  ├── tokens.{ts,json}      # Design tokens
  ├── primitives/           # App components (Button, Text, Card, etc.)
  ├── adapters/             # Vendor wrappers (tamagui/, paper/, elements/)
  └── platform/             # iOS/Android specific (ActionSheet, Haptics, Picker)
```

**Documentation:**
```
docs/ui/
  ├── FOUNDATION.md         # Decision rationale (Tamagui vs gluestack)
  ├── USAGE.md              # How to use primitives
  ├── THEMING.md            # Token system and themes
  ├── ADAPTERS.md           # Adapter pattern explanation
  └── MIGRATION_GUIDE.md    # Step-by-step migration from old components
```

**Reports:**
```
reports/ui/
  ├── baseline-performance.json
  ├── final-performance.json
  ├── baseline-a11y.json
  ├── final-a11y.json
  ├── bundle-analysis.json
  └── AUDIT.md              # Verification results
```

### Success Metrics

- ✅ Single UI foundation configured
- ✅ Unified token system (one source of truth)
- ✅ 10+ primitives with adapters
- ✅ 3-5 screens refactored successfully
- ✅ Zero vendor imports outside adapters
- ✅ Performance within budget (TTI ≤ +10%, FPS ≥ 55)
- ✅ WCAG AA compliance (contrast, screen reader, dynamic type)
- ✅ Complete documentation enabling team self-service

### Dependencies

**External:**
- Expo SDK 54 upgrade (Phase 1, Week 1-2)
- React Native 0.81 upgrade (Phase 1, Week 1-2)

**Note:** Phase 0.5 can use SDK 52 initially, then upgrade during Phase 1 Week 1-2 alongside foundation upgrade.

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Foundation choice regret** | Build POCs with both Tamagui AND gluestack before deciding |
| **Performance regression** | Measure baseline first, set budgets, enable compiler/optimizations |
| **Accessibility gaps** | Test with screen reader from day 1, automated audits |
| **Scope creep** | Only refactor 3-5 representative screens, leave rest for Phase 1+ |
| **Team adoption** | Comprehensive docs, live demo, migration guide, pair programming |

---

## Phase 1: MVP (Weeks 1-12)

### Weeks 1-2: Foundation
**Goal:** Setup project infrastructure

**Tasks:**
- Initialize Expo monorepo with Turborepo
- Setup TypeScript, ESLint, Prettier
- Create Supabase project
- Implement database schema
- Configure authentication
- Basic mobile UI structure

**Deliverable:** Project skeleton with auth

---

### Weeks 3-4: Worker Service & Sandbox Infrastructure
**Goal:** Long-running service + sandboxes for Claude Agent

**Tasks:**
- Setup Fly.io account
- Create sandbox Docker image (Node 20 + Expo CLI + EAS CLI)
- Build worker service (Fly.io/Render/Railway)
- Implement job queue (Supabase Realtime/Redis)
- Test sandbox creation/destruction
- Implement resource limits & auto-cleanup
- Setup worker-sandbox communication

**Deliverable:** Worker service + sandbox infrastructure

**See also:** [architecture.md](./architecture.md) for event-driven worker architecture, [analysis.md](./analysis.md) for implementation best practices

---

### Weeks 5-7: Claude Agent Integration
**Goal:** AI coding agent that writes apps

**Tasks:**
- Integrate Claude Agent SDK into worker service
- Implement tools (bash, filesystem, expo, eas)
- Configure system prompts for React Native/Expo
- Test code generation in sandboxes
- Implement error handling & retry logic
- Stream events to Supabase Realtime
- Handle job queue processing

**Deliverable:** Worker service runs Claude to generate apps

---

### Weeks 8-9: Real-Time Communication
**Goal:** Stream Claude's work to mobile

**Tasks:**
- Setup WebSocket server (Supabase Realtime)
- Implement event types
- Mobile WebSocket client
- Real-time UI updates
- Handle reconnection
- Error recovery

**Deliverable:** Real-time updates working

---

### Weeks 10-11: Mobile UI & In-App Preview
**Goal:** Bottom tab navigation + WebView preview

**Tasks:**
- Bottom tab navigator (Code, Preview, Integrations, Icon Gen)
- Code tab: File tree + syntax highlighting + terminal
- Preview tab: WebView with EAS Update integration
- Integrations tab: Third-party service connections
- Icon Gen tab: Nano Banana integration
- Hamburger menu: Settings, profile, account
- Configure eas.json for WebView preview
- Session management UI
- Projects list & history

**Deliverable:** Complete mobile UI with in-app WebView preview

**See also:** [UX-CHANGES.md](./UX-CHANGES.md) for detailed UX decisions, [design-system.md](./design-system.md) for component specifications

---

### Week 12: Testing & Launch Prep
**Goal:** Production-ready MVP

**Tasks:**
- End-to-end testing
- Performance optimization
- Security audit
- Analytics integration
- Payment setup (Stripe)
- App Store submission
- Landing page

**Deliverable:** MVP ready for TestFlight

---

## Phase 2: Enhancement (Weeks 13-20)

### Weeks 13-14: Advanced Interaction
**Tasks:**
- "Pinch to Build" gesture (element selection → prompt)
- Voice input improvements
- Prompt suggestions
- Session history
- Resume sessions

**Deliverable:** Rich interaction model

---

### Weeks 15-16: Asset Generation (Secure Proxy)
**Tasks:**
- Backend API proxies for Nano Banana & ElevenLabs
- Icon Gen tab UI (already in Phase 1)
- Icon generator with rate limiting (Nano Banana)
- Sound generator with caching (ElevenLabs)
- Background image generation
- Asset storage (Supabase Storage)
- Asset library management UI
- Multiple style options for icons
- Preview assets before applying

**Deliverable:** Secure AI asset generation with Nano Banana proxies

**See also:** [analysis.md](./analysis.md) for backend proxy security pattern, [recommendations.md](./recommendations.md) for API security requirements

---

### Weeks 17-18: Templates & Sharing
**Tasks:**
- App templates (todo, fitness, social, etc.)
- Template marketplace
- Share projects (view-only links)
- Collaboration features
- Community showcase

**Deliverable:** Template ecosystem

---

### Weeks 19-20: Quality of Life
**Tasks:**
- Dark mode
- Haptic feedback refinement
- Onboarding tutorial
- In-app tips
- Performance monitoring
- Error reporting

**Deliverable:** Polished experience

---

## Phase 3: Publishing & Scale (Months 6-9)

### Month 6: Code Export
**Tasks:**
- GitHub integration
- Download source code (.zip)
- SSH/Cursor connection
- Git history preservation
- README generation

**Deliverable:** Full code ownership

---

### Month 7: Publishing Automation
**Tasks:**
- EAS Build integration
- App Store Connect API
- Google Play API
- Automated submission
- Review status tracking
- Certificate management

**Deliverable:** One-click publishing

---

### Month 8: Enterprise Features
**Tasks:**
- Team workspaces
- White-label options
- Custom branding
- SSO integration
- Admin dashboard
- Usage analytics

**Deliverable:** Enterprise tier

---

### Month 9: Global Scale
**Tasks:**
- Multi-region deployment
- CDN optimization
- Database sharding
- Load balancing
- Auto-scaling sandboxes
- 99.9% SLA

**Deliverable:** Global availability

---

## Success Metrics

### MVP Launch (Week 12)
- 100 beta users
- 500 apps generated
- 4.5+ App Store rating
- 80% user activation rate
- 60% week 1 retention

### Phase 2 Complete (Week 20)
- 1,000 active users
- 5,000 apps generated
- 100 paying customers
- $1,000 MRR
- 70% week 4 retention

### Phase 3 Complete (Month 9)
- 10,000 active users
- 50,000 apps generated
- 1,000 paying customers
- $10,000 MRR
- 50% 3-month retention

---

## Risk Mitigation

### Technical Risks

**Risk:** Claude API rate limits
**Mitigation:** Enterprise tier, fallback queuing, prompt caching

**Risk:** Sandbox startup time too slow
**Mitigation:** Pre-warmed sandbox pool, optimize Docker image

**Risk:** WebSocket connection drops
**Mitigation:** Automatic reconnection, event replay, state recovery

**Risk:** Mobile app crashes during coding
**Mitigation:** Background session continuation, state persistence

### Business Risks

**Risk:** Free tier abuse
**Mitigation:** Strict rate limits, CAPTCHA, usage monitoring

**Risk:** Low conversion to paid
**Mitigation:** Free tier limits, compelling pro features, trials

**Risk:** High churn rate
**Mitigation:** Onboarding improvements, engagement features, support

**Risk:** Competition from VibeCode
**Mitigation:** Unique features, better UX, faster iteration

---

## Feature Prioritization

### Must Have (MVP)
1. Claude Agent code generation
2. Real-time updates
3. In-app WebView preview (no scanning)
4. Bottom tab navigation (Code, Preview, Integrations, Icon Gen)
5. Project management
6. Basic authentication

### Should Have (Phase 2)
1. Asset generation
2. Templates
3. Voice input
4. Session history
5. Dark mode

### Nice to Have (Phase 3)
1. Collaboration
2. Publishing automation
3. White-label
4. Analytics dashboard
5. API access

### Won't Have (Initially)
1. Web editor
2. Desktop app
3. Custom backend (beyond Supabase)
4. Multi-language support
5. Video tutorials

---

## Technology Decisions

### Confirmed
- ✅ React Native 0.81 + Expo SDK 54 (mobile framework with React 19.1 support and precompiled XCFrameworks)
- ✅ Claude Agent SDK (AI coding agent)
- ✅ Worker Service on Fly.io/Render/Railway (long-running)
- ✅ Fly.io microVMs (sandbox infrastructure)
- ✅ Supabase (backend platform, Edge Functions, Realtime)
- ✅ In-app WebView preview (no QR scanning)
- ✅ EAS Update for WebView preview URLs
- ✅ Bottom tab navigation (Code, Preview, Integrations, Icon Gen)
- ✅ Backend API proxies (secure AI service access)
- ✅ Nano Banana API (icon generation)
- ✅ Supabase Storage (file storage with RLS)
- ✅ Stripe (payments)

### Under Evaluation
- ⏳ Fly.io vs Render vs Railway for worker service
- ⏳ Supabase Realtime vs Redis for job queue
- ⏳ Self-hosted vs managed EAS infrastructure

### Deferred
- 📅 Native code editor (Phase 4+)
- 📅 Offline mode (Phase 4+)
- 📅 Desktop companion app (Phase 5+)

---

## Go-to-Market Strategy

### Pre-Launch (Weeks 1-11)
- Build in public (Twitter/X, dev.to)
- Create waitlist
- Demo videos
- Beta tester recruitment

### Launch (Week 12)
- Product Hunt launch
- TestFlight beta (1,000 users)
- Social media campaign
- Press outreach (TechCrunch, etc.)
- Community building (Discord)

### Post-Launch (Weeks 13+)
- Content marketing (tutorials, showcases)
- User success stories
- Template marketplace growth
- Partnerships (accelerators, bootcamps)
- Referral program

---

## Budget Estimates

### Development (Phase 1)
- Developers: 2 full-time (12 weeks)
- Infrastructure: $500/month
- AI API costs: $1,000 (testing)
- **Total: ~$70,000**

### Operations (Monthly)
- Fly.io sandboxes: $200
- Supabase Pro: $25
- Claude API: $2,000 (at scale)
- CDN (Cloudflare): $20
- Monitoring (Sentry): $26
- **Total: ~$2,300/month**

### Marketing (Phase 2)
- Landing page: $2,000
- Video production: $3,000
- Paid ads: $5,000
- Content creation: $2,000
- **Total: ~$12,000**

---

**Status:** Roadmap complete ✅ | Worker service architecture ✅ | EAS Update workflow ✅ | Timeline: 9 months to scale ✅
