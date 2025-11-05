# MobVibe

> AI-powered mobile app builder for everyone

Build iOS & Android apps using natural language - no coding required. Powered by Claude Agent SDK.

---

## What is MobVibe?

MobVibe is a mobile application where you **describe your app idea**, and **Claude AI builds it for you** in real-time. Watch as an expert AI developer writes code, installs dependencies, and creates a working app - all from your phone.

**You prompt. Claude codes. You preview.**

---

## Key Features

🤖 **AI Developer**
- Claude Agent SDK writes all code
- Expert React Native knowledge
- Auto-debugging and testing
- Real-time development

📱 **Mobile-First**
- Build on your phone
- Live preview on device
- Expo Go integration
- Cross-platform (iOS + Android)

⚡ **Real-Time Updates**
- See Claude coding live
- Terminal output streaming
- File changes as they happen
- Instant preview updates

🎨 **AI Asset Generation**
- App icons (DALL-E 3)
- Sound effects (ElevenLabs)
- Background images
- UI components

💬 **Conversational**
- Natural language prompts
- Iterative refinement
- Voice input support
- Context-aware responses

📦 **Full Ownership**
- Export source code anytime
- GitHub integration
- SSH to Cursor/VS Code
- No vendor lock-in

---

## How It Works

```
1. You: "Build a fitness tracker app"
     ↓
2. Claude: *Creates project, writes code, installs deps*
     ↓
3. You: *See real-time updates in app*
     ↓
4. Preview: *Scan QR code, app runs on your phone*
     ↓
5. You: "Add dark mode"
     ↓
6. Claude: *Modifies code, preview updates*
     ↓
7. Export or publish to App Store
```

---

## Tech Stack

**Mobile:** React Native 0.81, Expo SDK 54, TypeScript
**Backend:** Supabase, Claude Agent SDK
**Sandboxes:** Fly.io microVMs
**AI:** Claude Sonnet 4.5, DALL-E 3, ElevenLabs

**SDK 54 Improvements:**
- React Native 0.81 integration
- React 19.1 support
- Precompiled XCFrameworks for iOS (faster builds)
- Modern architecture focus

---

## Project Status

🏗️ **Phase:** Architecture Complete
📅 **Timeline:** 12-week MVP
✅ **Next:** Begin Phase 1 development

---

## Documentation

📚 **Complete documentation suite available in `.docs/`**

### Quick Links

**Start Here:**
- 📖 [**SUMMARY.md**](./.docs/SUMMARY.md) - Complete documentation index with glossary and changelog

**Core Documentation:**
- 🏗️ [**Architecture**](./.docs/architecture.md) - System architecture, data flow, component relationships
- ⚙️ [**Implementation**](./.docs/implementation.md) - Technical stack, database schema, code examples
- 🔄 [**Data Flow**](./.docs/data-flow.md) - Comprehensive data flows for every feature
- ✨ [**Features & Journeys**](./.docs/features-and-journeys.md) - Feature matrix, user personas, user flows

**Design & UX:**
- 🎨 [**Design System**](./.docs/design-system.md) - Native iOS/Android design system, components, patterns
- 📱 [**Native UI**](./.docs/vibecode/native_ui.md) - Native UI enhancements and component guidelines
- 🔀 [**UX Changes**](./.docs/UX-CHANGES.md) - Major UX revision (QR code → in-app WebView preview)

**Planning & Strategy:**
- 🗓️ [**Roadmap**](./.docs/roadmap.md) - Development timeline, milestones, success metrics
- 💡 [**Recommendations**](./.docs/recommendations.md) - Technical recommendations and best practices
- 🔍 [**Analysis**](./.docs/analysis.md) - Codex recommendations analysis with 2025 best practices

### Documentation Features

✅ **Consistent Structure** - All files include front-matter with status, owner, last updated, and related files
✅ **Cross-Linked** - Strategic cross-references between related topics for easy navigation
✅ **Visual Navigation** - [Mermaid graphs](./.docs/DOCUMENTATION-GRAPH.md) showing all documentation relationships
✅ **Terminology Normalized** - Consistent use of key terms across all documents
✅ **Comprehensive Coverage** - 11 files, 15,000+ lines covering architecture, implementation, UX, and planning
✅ **Professional Quality** - Enterprise-grade documentation with TOC, glossary, and changelog

### For Developers

**Getting Started:**
1. Read [SUMMARY.md](./.docs/SUMMARY.md) for complete overview
2. Review [Architecture](./.docs/architecture.md) to understand system design
3. Check [Tech Stack](./.docs/implementation.md#tech-stack) for technology details
4. Follow [Roadmap](./.docs/roadmap.md) for development phases

**For Designers:**
1. Review [Design System](./.docs/design-system.md) for UI components and patterns
2. Check [Native UI Guidelines](./.docs/vibecode/native_ui.md) for platform-specific components
3. Read [UX Changes](./.docs/UX-CHANGES.md) for latest UX decisions
4. See [User Journeys](./.docs/features-and-journeys.md#core-user-journeys) for user flows

**For Project Managers:**
1. Review [Roadmap](./.docs/roadmap.md) for timeline and milestones
2. Check [Features Matrix](./.docs/features-and-journeys.md#feature-matrix) for feature scope
3. See [Recommendations](./.docs/recommendations.md) for technical decisions
4. Read [Analysis](./.docs/analysis.md) for best practices and considerations

---

## Quick Start (Coming Soon)

```bash
# Clone repository
git clone https://github.com/yourusername/mobvibe.git

# Install dependencies
cd mobvibe
pnpm install

# Start mobile app
cd apps/mobile
pnpm dev

# Start backend
cd backend/supabase
supabase start
```

---

## Pricing (Planned)

| Tier | Price | Sessions/month | Features |
|------|-------|----------------|----------|
| **Free** | $0 | 3 | Basic features |
| **Starter** | $9 | 10 | Asset generation, templates |
| **Pro** | $29 | 40 | Priority support, advanced features |
| **Enterprise** | Custom | Unlimited | White-label, dedicated infra |

---

## Why MobVibe?

### vs Traditional Development
- ❌ Learn React Native, TypeScript, Expo
- ✅ Just describe what you want

### vs VibeCode
- ✅ Open source approach (planned)
- ✅ Transparent architecture
- ✅ Competitive pricing
- ✅ More customization options

### vs No-Code Tools (FlutterFlow, Adalo)
- ✅ True native apps (not web wrappers)
- ✅ Full code export
- ✅ AI-powered (not drag-and-drop)
- ✅ Better performance

---

## Contributing

Coming soon - contributions welcome after MVP launch!

---

## License

TBD

---

## Contact

- **Email:** contact@mobvibe.dev
- **Twitter:** [@mobvibe](https://twitter.com/mobvibe)
- **Discord:** [Join Community](https://discord.gg/mobvibe)

---

**Built with ❤️ for makers who want to build without barriers**
