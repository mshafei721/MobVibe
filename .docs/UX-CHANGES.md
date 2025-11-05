<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: features-and-journeys.md, design-system.md, implementation.md, roadmap.md, architecture.md
-->

# MobVibe UX Changes Summary

> See [SUMMARY.md](./SUMMARY.md) for complete documentation index.

> Major UX revision: In-app preview with bottom tab navigation

## Overview

Based on user feedback, the preview system has been completely redesigned from QR code scanning to in-app WebView preview with a bottom tab navigation structure.

---

## Key Changes

### 1. **No QR Code Scanning** ❌ → **In-App WebView Preview** ✅

**Before:**
```
User completes app → QR code displayed →
User scans with phone → Opens in Expo Go → Tests app
```

**After:**
```
User completes app → Tap "Preview" tab →
WebView loads → Test app in-app immediately
```

**Benefits:**
- Instant preview (no scanning needed)
- All-in-one experience
- Easier to iterate (switch tabs, not devices)
- Better for single-device users
- Simpler onboarding

**See also:** [analysis.md](./analysis.md) Section 3 for EAS Update implementation details

---

### 2. **Bottom Tab Navigation**

**New Structure:**
```
┌─────────────────────────────────────┐
│ Coding Session                      │
├─────────────────────────────────────┤
│                                     │
│ [MAIN CONTENT AREA]                 │
│                                     │
├─────────────────────────────────────┤
│ [Code] [Preview] [Integrations] [🎨]│ ← Bottom tabs
└─────────────────────────────────────┘
```

**4 Tabs:**
1. **💾 Code Tab** - File tree, code viewer, terminal
2. **📱 Preview Tab** - WebView with live app
3. **🔗 Integrations Tab** - Firebase, Supabase, Stripe, etc.
4. **🎨 Icon Gen Tab** - Nano Banana AI icon generation

**Settings & Profile:**
- Moved to hamburger menu (☰) for cleaner main navigation

**See also:** [design-system.md](./design-system.md) for component specifications, [features-and-journeys.md](./features-and-journeys.md) for detailed user flows

---

### 3. **Icon Generation: DALL-E → Nano Banana**

**Change:**
- Replaced DALL-E 3 with Nano Banana API
- Dedicated Icon Gen tab in main navigation
- Available from Phase 1 MVP (not Phase 2)

**Icon Gen Tab Features:**
- Natural language prompts
- Multiple style options (Modern, Minimal, Bold)
- Preview variations before applying
- Direct application to project
- Recent generations gallery

**See also:** [implementation.md](./implementation.md) for Nano Banana API integration details

---

### 4. **New Integrations Tab**

**Purpose:** Connect third-party services directly from mobile app

**Supported Services:**
- Firebase (Auth, Firestore, Cloud Functions)
- Supabase (Database, Auth, Storage)
- Stripe (Payments, Subscriptions)
- Auth providers (Google, Apple, GitHub)
- Push notifications (FCM, APNs)

**Workflow:**
```
User taps Integrations tab →
Browses available services →
Taps "Connect" on service →
Follows guided setup →
Claude auto-configures code
```

**See also:** [features-and-journeys.md](./features-and-journeys.md) for complete integration workflows

---

## Updated User Journey

### Session Flow (10 minutes total)

**1. Start Session (1 min)**
```
User: "Build a fitness tracker"
→ Session starts
→ Status bar shows: "🧠 Thinking..."
```

**2. Code Generation (5-7 min)**
```
Code Tab (active by default):
├─ Terminal: Shows npm installs
├─ Files: Live file creation indicators
└─ Status: Real-time thinking updates
```

**3. Preview Ready (1 min)**
```
Notification: "Your app is ready! 🎉"
→ Preview tab badge appears (blue dot)
→ User taps Preview tab
→ WebView loads app instantly
→ User tests features in-app
```

**4. Iteration (2 min)**
```
User swipes back to Code tab
→ Types: "Add dark mode"
→ Claude modifies code
→ Preview tab auto-refreshes
→ User switches to Preview to test
```

**5. Generate Icon (1 min)**
```
User taps Icon Gen tab
→ Types: "Minimal fitness dumbbell icon"
→ Selects style: Modern
→ Taps "Generate"
→ Preview variations
→ Applies to project
```

**See also:** [features-and-journeys.md](./features-and-journeys.md) for detailed user personas and journeys

---

## Screen Layouts

### Code Tab
```
┌─────────────────────────────────────┐
│ 📦 Terminal              [Collapse] │
│ $ npm install zustand               │
│ ✓ Installed zustand@4.5.0           │
│                                     │
│ 📝 Files (18)                       │
│ app/                                │
│ ├─ index.tsx        ✓ 234 lines    │
│ ├─ habits.tsx       ⏳ Writing...   │
│ └─ settings.tsx     ⏳ Queue        │
│                                     │
│ [View Full Code] [Download .zip]   │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

### Preview Tab
```
┌─────────────────────────────────────┐
│ 📱 Live Preview                     │
│                                     │
│ ┌─────────────────────────────────┐│
│ │  [WebView - Interactive App]    ││
│ │                                 ││
│ │  • Full functionality           ││
│ │  • Real-time updates            ││
│ │  • Device frame simulation      ││
│ │                          [📄]   ││ ← Floating button
│ └─────────────────────────────────┘│
│                                     │
│ [🔄 Reload] [📸 Screenshot]        │
│ Preview expires in: 45 min          │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

### Integrations Tab
```
┌─────────────────────────────────────┐
│ 🔗 Integrations                     │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ [Firebase]         [Connect]    ││
│ │ Auth, Firestore, Functions       ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Supabase]         [Connect]    ││
│ │ Database, Auth, Storage          ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Stripe]           [Connect]    ││
│ │ Payments, Subscriptions          ││
│ └─────────────────────────────────┘│
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

### Icon Gen Tab
```
┌─────────────────────────────────────┐
│ 🎨 Generate App Icon                │
│                                     │
│ Describe your icon:                 │
│ ┌─────────────────────────────────┐│
│ │ Minimalist fitness dumbbell     ││
│ │ with gradient blue to purple    ││
│ └─────────────────────────────────┘│
│                                     │
│ Style: [Modern] [Minimal] [Bold]    │
│                                     │
│ [Generate Icon]                     │
│                                     │
│ Recent:                             │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ 🏋️  │ │ 💪  │ │ ⚡  │            │
│ └─────┘ └─────┘ └─────┘            │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

**See also:** [design-system.md](./design-system.md) for complete UI component library and patterns

---

### 5. **Floating Preview Button**

**New Interaction Pattern:**
- Small floating circle button on Preview tab
- Quick access to full code viewer
- Non-intrusive, always accessible
- Context-preserving interaction

**Workflow:**
```
User on Preview tab
→ Taps floating button (📄)
→ Code viewer opens (full app view)
→ User can dismiss via:
  ├─ Back button
  ├─ X button
  └─ Slide down gesture
→ Returns to preview seamlessly
```

**Benefits vs Traditional Navigation:**
- **Faster:** No tab switching required
- **Contextual:** Stays in preview mode
- **Intuitive:** Common mobile pattern
- **Discoverable:** Always visible

**See also:** [design-system.md](./design-system.md) for floating button component specs

---

## Updated Gestures

### Swipe Gestures
- **Swipe between tabs** → Navigate Code/Preview/Integrations/Icon Gen
- **Swipe down** → Refresh current view
- **Swipe down on code viewer (from floating button)** → Dismiss code viewer
- **Pull to refresh** → Code: update files, Preview: reload WebView

### Long Press
- **Long press preview** → Screenshot/fullscreen options
- **Long press code line** → Copy snippet
- **Long press file** → View/download/share
- **Long press floating button** → Quick actions menu

### Pinch & Zoom
- **Pinch on preview** → Zoom in/out app
- **Pinch on code** → Adjust text size
- **Pinch on preview element (Phase 2)** → "Pinch to Build" feature

### Tap Interactions
- **Tap floating preview button** → Open code viewer overlay
- **Tap X button or back** → Dismiss code viewer
- **Tap outside code viewer** → Dismiss (optional)

---

## Technical Changes

### Mobile App Structure
```
app/
├── (session)/
│   ├── [id]/
│   │   ├── code.tsx         # Code tab
│   │   ├── preview.tsx      # Preview tab (WebView)
│   │   ├── integrations.tsx # Integrations tab
│   │   ├── icon-gen.tsx     # Icon Gen tab
│   │   └── _layout.tsx      # Bottom tab navigator
│   └── index.tsx
└── _layout.tsx              # Root with hamburger menu
```

**See also:** [implementation.md](./implementation.md) for detailed component implementation and tech stack

### New Components
```typescript
<PreviewWebView previewUrl={url} />      // WebView component
<IconGenerator projectId={id} />         // Nano Banana UI
<IntegrationsList />                     // Service connections
```

### API Changes
```typescript
// Icon generation (Nano Banana)
POST /api/generate-icon
{
  prompt: "minimalist fitness icon",
  projectId: "...",
  style: "modern"
}

// Response
{
  url: "https://...signed-url",
  imageUrl: "https://nanobanana.com/..."
}
```

### WebSocket Events
```typescript
type PreviewReadyEvent = {
  type: 'preview_ready',
  previewUrl: string,      // For WebView
  webviewUrl: string,      // Snack URL if needed
  branch: string,
  expiresIn: number
}
```

---

## Migration Impact

### Removed Features
- ❌ QR code generation
- ❌ "Scan with Expo Go" instructions
- ❌ External device testing flow
- ❌ QR code troubleshooting

### New Features
- ✅ In-app WebView preview
- ✅ Bottom tab navigation (4 tabs)
- ✅ Integrations tab (connect services)
- ✅ Icon Gen tab (Nano Banana)
- ✅ Hamburger menu (settings/profile)
- ✅ Tab badge notifications
- ✅ WebView controls (reload, screenshot)

### Updated Features
- 📝 Code tab (combined terminal + files)
- 📱 Preview (WebView instead of QR)
- 🎨 Icon generation (Nano Banana, not DALL-E)
- 🔗 New integrations workflow

---

## Benefits Summary

### User Experience
- **Faster preview** - No scanning, instant in-app view
- **Easier iteration** - Switch tabs, not devices
- **More discoverable** - Integrations & icon gen in main nav
- **Simpler onboarding** - No QR code explanation needed
- **Single device** - No need for second phone

### Development
- **Cleaner architecture** - Bottom tabs = clear separation
- **Better scalability** - Tabs can be added easily
- **Consistent navigation** - Standard mobile pattern
- **Easier testing** - WebView = automated testing possible

### Business
- **Lower friction** - Fewer steps to preview
- **Higher activation** - Instant gratification
- **Better retention** - Smoother experience
- **More features visible** - Integrations & icon gen upfront

---

## Documentation Updated

All documentation has been revised to reflect these changes:

✅ **[architecture.md](./architecture.md)** - In-app preview, bottom tabs, WebView integration
✅ **[implementation.md](./implementation.md)** - New components, Nano Banana API, tab structure
✅ **[features-and-journeys.md](./features-and-journeys.md)** - Updated flows, screens, interactions
✅ **[roadmap.md](./roadmap.md)** - Phase 1 includes icon gen, WebView preview

---

**Status:** All documentation updated ✅ | Ready for UI/UX design ✅ | Ready for development ✅
