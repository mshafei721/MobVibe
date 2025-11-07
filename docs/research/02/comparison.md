# Tamagui vs gluestack UI: Head-to-Head Comparison

**Date:** 2025-11-06
**Purpose:** Comprehensive comparison for foundation decision

---

## Quick Summary

| Criterion | Weight | Tamagui Score | gluestack Score | Winner |
|-----------|--------|---------------|-----------------|--------|
| **Performance** | 25% | 7/10 | 9/10 | ✅ gluestack |
| **Developer Experience** | 20% | 7/10 | 8/10 | ✅ gluestack |
| **Theming Flexibility** | 20% | 8/10 | 8/10 | 🤝 Tie |
| **Web Viability** | 15% | 10/10 | 6/10 | ✅ Tamagui |
| **Migration Effort** | 20% | 6/10 | 9/10 | ✅ gluestack |
| **TOTAL** | 100% | **7.45** | **8.35** | **✅ gluestack** |

**Recommendation:** **gluestack UI** (wins by 0.9 points)

---

## Detailed Comparison

### 1. Performance (25% weight)

**Raw Render Performance (gluestack-ui-benchmarks):**
- **gluestack UI v2:** 98-99ms average ⭐
- **Tamagui:** 156-157ms average
- **Native baseline:** 70-79ms
- **Winner:** gluestack UI (37% faster)

**Bundle Size:**
- **Tamagui:** Saves ~30KB for web (avoids react-native-web)
- **gluestack UI:** Modular (only bundle what you use)
- **Winner:** gluestack UI (modular advantage)

**Runtime Characteristics:**
- **Tamagui:** Compile-time optimization, potential for further gains
- **gluestack UI:** Runtime styling, excellent out-of-box performance
- **Winner:** gluestack UI (better default performance)

**Score:**
- Tamagui: **7/10** (compile optimization potential, but slower baseline)
- gluestack: **9/10** (best-in-class raw performance)

---

### 2. Developer Experience (20% weight)

**Learning Curve:**
- **Tamagui:** Steep, unfamiliar patterns, 1-2 weeks ramp-up
- **gluestack UI:** Shallow (if Tailwind familiar), 2-5 days ramp-up
- **Winner:** gluestack UI

**TypeScript Support:**
- **Tamagui:** Excellent (full coverage, great autocomplete)
- **gluestack UI:** Good in v2 (significantly improved from v1)
- **Winner:** Tamagui (slightly better)

**API Clarity:**
- **Tamagui:** Style-first, powerful but complex
- **gluestack UI:** Tailwind utilities, familiar to many
- **Winner:** gluestack UI (more developers know Tailwind)

**Documentation:**
- **Tamagui:** Comprehensive, some gaps in advanced topics
- **gluestack UI:** Good, improving in v2
- **Winner:** Tie

**Lines of Code (estimated from PoC plans):**
- **Tamagui:** Login screen ~60 LOC
- **gluestack UI:** Login screen ~55 LOC
- **Winner:** gluestack UI (slightly more concise)

**Score:**
- Tamagui: **7/10** (excellent TypeScript, but steep curve)
- gluestack: **8/10** (easier onboarding, familiar patterns)

---

### 3. Theming Flexibility (20% weight)

**Token System Depth:**
- **Tamagui:** Granular control, nested themes, variant system
- **gluestack UI:** Tailwind config, comprehensive token support
- **Winner:** Tamagui (more granular)

**Dark Mode Implementation:**
- **Tamagui:** Built-in, nested themes (dark_Button, dark_Text)
- **gluestack UI:** Tailwind dark mode utilities
- **Winner:** Tie (both excellent)

**MobVibe Token Mapping:**
- **Tamagui:** Moderate effort (need to structure for Tamagui expectations)
- **gluestack UI:** Low-moderate effort (direct Tailwind config mapping)
- **Winner:** gluestack UI (easier mapping)

**Theme Switching:**
- **Tamagui:** Seamless, optimized
- **gluestack UI:** Via Tailwind utilities
- **Winner:** Tamagui (better optimization)

**Score:**
- Tamagui: **8/10** (granular control, excellent dark mode)
- gluestack: **8/10** (easier mapping, comprehensive)

---

### 4. Web Viability (15% weight)

**SSR Support:**
- **Tamagui:** Excellent (SSR, RSC, proper hydration)
- **gluestack UI:** Limited (basic web, no explicit SSR features)
- **Winner:** Tamagui (decisive)

**Web Performance:**
- **Tamagui:** Optimized for web, ~30KB savings
- **gluestack UI:** Via React Native Web (standard)
- **Winner:** Tamagui

**Cross-Platform Consistency:**
- **Tamagui:** Excellent (true "write once, run everywhere")
- **gluestack UI:** Good (standard RN Web)
- **Winner:** Tamagui

**Use Case Fit:**
- **MobVibe:** Mobile-first, web expansion later
- **Tamagui Advantage:** SSR ready if needed
- **gluestack Advantage:** Good enough for basic web

**Score:**
- Tamagui: **10/10** (best-in-class SSR/web support)
- gluestack: **6/10** (basic web, sufficient for most cases)

---

### 5. Migration Effort (20% weight)

**Learning Curve Impact:**
- **Tamagui:** 1-2 weeks team ramp-up, slows initial velocity
- **gluestack UI:** 2-5 days team ramp-up, fast productivity
- **Winner:** gluestack UI

**Documentation Quality:**
- **Tamagui:** Comprehensive but complex
- **gluestack UI:** Good, beginner-friendly
- **Winner:** gluestack UI

**Community Support:**
- **Tamagui:** Active, ~10K GitHub stars
- **gluestack UI:** Growing, ~2-3K GitHub stars
- **Winner:** Tamagui (larger community)

**Production Case Studies:**
- **Tamagui:** Proven (Inkitt/Galatea, others)
- **gluestack UI:** Growing (fewer public cases)
- **Winner:** Tamagui

**Breaking Changes Risk:**
- **Tamagui:** v1.0 stable, semantic versioning
- **gluestack UI:** v2 (Jan 2025) → v3 (already), rapid iteration
- **Winner:** Tamagui (more stable)

**Overall Migration Ease:**
- **Tamagui:** Higher initial cost, long-term benefits
- **gluestack UI:** Lower initial cost, faster to production
- **Winner:** gluestack UI (for rapid deployment)

**Score:**
- Tamagui: **6/10** (steeper curve, but stable and proven)
- gluestack: **9/10** (easy onboarding, fast productivity)

---

## Weighted Calculation

### Tamagui Total Score

```
(Performance × 0.25) + (DX × 0.20) + (Theming × 0.20) + (Web × 0.15) + (Migration × 0.20)
= (7 × 0.25) + (7 × 0.20) + (8 × 0.20) + (10 × 0.15) + (6 × 0.20)
= 1.75 + 1.40 + 1.60 + 1.50 + 1.20
= 7.45 / 10
```

### gluestack UI Total Score

```
(Performance × 0.25) + (DX × 0.20) + (Theming × 0.20) + (Web × 0.15) + (Migration × 0.20)
= (9 × 0.25) + (8 × 0.20) + (8 × 0.20) + (6 × 0.15) + (9 × 0.20)
= 2.25 + 1.60 + 1.60 + 0.90 + 1.80
= 8.35 / 10
```

**Difference:** gluestack UI wins by **0.9 points** (12% higher score)

---

## Trade-Off Analysis

### When Tamagui Would Be Better

**Choose Tamagui if:**
1. ✅ **Web version with SSR is planned** (Next.js, Expo + Next.js monorepo)
2. ✅ **Maximum compile-time optimization** is critical
3. ✅ **Team has advanced React Native experience**
4. ✅ **Long-term cross-platform consistency** is paramount
5. ✅ **Complex animations** and interactions are planned
6. ✅ **Willing to invest 1-2 weeks** in team ramp-up

**MobVibe Fit:** 3/6 criteria (web expansion possible, cross-platform, but mobile-first priority)

### When gluestack UI Is Better

**Choose gluestack UI if:**
1. ✅ **Raw mobile performance** is top priority
2. ✅ **Rapid development** and fast time-to-market
3. ✅ **Team knows Tailwind CSS** (or wants to learn)
4. ✅ **Mobile-first** with basic web support sufficient
5. ✅ **Easier team onboarding** (2-5 days vs 1-2 weeks)
6. ✅ **Modular, copy-paste** workflow preferred

**MobVibe Fit:** 6/6 criteria (mobile-first, rapid MVP, performance-critical)

---

## MobVibe-Specific Recommendation

### Project Context

**MobVibe Requirements:**
- Mobile-first (iOS/Android priority)
- AI-powered app builder (performance-critical)
- Web version planned but secondary
- MVP timeline: 12 weeks (Phase 1)
- Team: Small, needs fast velocity

### Alignment Analysis

| Factor | Tamagui | gluestack UI | MobVibe Priority |
|--------|---------|--------------|------------------|
| Mobile performance | Good (7/10) | Excellent (9/10) | **HIGH** ✅ gluestack |
| Web/SSR | Excellent (10/10) | Basic (6/10) | **MEDIUM** (future) |
| Development speed | Slower (6/10) | Faster (9/10) | **HIGH** ✅ gluestack |
| Team ramp-up | 1-2 weeks | 2-5 days | **HIGH** ✅ gluestack |
| Long-term stability | Stable (v1.0) | Rapid versions | **MEDIUM** |

**Conclusion:** gluestack UI aligns better with **4 of 5** high-priority MobVibe factors

---

## Risk Mitigation

### If gluestack UI is chosen:

**Risk 1: Rapid major version releases (v2 → v3)**
- **Mitigation:** Pin to specific version, monitor changelog, budget migration time

**Risk 2: Limited SSR if web becomes priority**
- **Mitigation:** Can migrate to Tamagui later if SSR becomes critical (adapter pattern helps)

**Risk 3: Smaller community than Tamagui**
- **Mitigation:** Active development, NativeBase successor credibility, growing adoption

### If Tamagui is chosen:

**Risk 1: Steep learning curve slows initial development**
- **Mitigation:** Allocate 1-2 weeks ramp-up time, pair programming, internal training

**Risk 2: Slower raw performance than gluestack**
- **Mitigation:** Compile-time optimization can compensate in production

**Risk 3: More complex setup and maintenance**
- **Mitigation:** Document patterns thoroughly, create component library

---

## Final Recommendation

**Winner: gluestack UI** ✅

**Rationale:**
1. **Better mobile performance** (37% faster render times) - critical for MobVibe UX
2. **Faster team onboarding** (2-5 days vs 1-2 weeks) - accelerates MVP timeline
3. **Modular architecture** - only bundle what's needed, smaller app size
4. **Tailwind familiarity** - many devs know Tailwind, reduces friction
5. **Good enough web support** - basic web sufficient for Phase 1, can revisit if SSR needed

**Trade-off Accepted:**
- Giving up excellent SSR support (Tamagui 10/10 → gluestack 6/10)
- But gaining better mobile performance and faster development

**Decision Confidence:** **High** (8.35 vs 7.45, clear winner across most criteria)

---

## Next Steps

1. Install gluestack UI on main branch
2. Configure Tailwind with MobVibe tokens
3. Create initial component library (Phase 04-05)
4. Keep Tamagui PoC branch for reference (if SSR becomes critical later)
5. Document rollback plan (can migrate to Tamagui if needed)

---

**Status:** Comparison complete | Recommendation: gluestack UI ✅
