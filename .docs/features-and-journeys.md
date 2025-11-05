# MobVibe Features & User Journeys

> Complete feature matrix and user experience flows

## Table of Contents
1. [Feature Matrix](#feature-matrix)
2. [User Personas](#user-personas)
3. [Core User Journeys](#core-user-journeys)
4. [Screen-by-Screen Flows](#screen-by-screen-flows)
5. [Interaction Patterns](#interaction-patterns)
6. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## Feature Matrix

### Phase 1: MVP (Core Features)

#### Authentication & Onboarding
- **Magic Link Login** - Email-based passwordless authentication
- **OAuth Social Login** - Google, Apple, GitHub sign-in
- **Interactive Tutorial** - First-time user walkthrough
- **Quick Start Templates** - Pre-built app templates to fork
- **Skip to Build** - Jump straight into creating first app

#### Project Management
- **Projects List** - View all created apps with thumbnails
- **Create New Project** - Start from scratch or template
- **Project Details** - Name, description, last edited timestamp
- **Delete Project** - Remove projects with confirmation
- **Project Search** - Find projects by name/description
- **Sort & Filter** - By date, name, status

#### AI Coding Session (Bottom Tab Navigation)
- **Code Tab**
  - File tree navigation with live indicators
  - Syntax highlighted code viewer (readonly)
  - Terminal output view (expandable)
  - File search and filtering
  - Copy code snippets
- **Preview Tab**
  - In-app WebView preview (no scanning)
  - Auto-refresh when Claude updates
  - Device frame simulation (iOS/Android)
  - Preview expiry indicator
  - Reload and screenshot buttons
- **Integrations Tab**
  - Third-party service connections
  - API key management
  - Firebase, Supabase, Stripe setup
  - Auth provider integration
  - Push notifications config
- **Icon Gen Tab**
  - Nano Banana AI icon generation
  - Describe icon in natural language
  - Multiple style options
  - Preview variations
  - Apply directly to project

#### Session Management
- **Conversational Prompt Input** - Natural language app descriptions
- **Voice Input** - Speak your app idea (optional)
- **Real-Time Thinking Display** - See Claude's planning process
- **Session Status Indicator** - Active/paused/completed states
- **Download App** - Get generated code as .zip

#### Iteration & Refinement
- **Follow-Up Prompts** - Modify existing app with new requests
- **Session History** - See all prompts in current session
- **Undo Last Change** - Revert to previous state
- **Stop Generation** - Cancel ongoing coding session
- **Resume Session** - Continue paused/interrupted sessions

#### Tier System
- **Free Tier** - 3 sessions/month, basic features
- **Starter Tier** - 10 sessions/month, priority queue
- **Pro Tier** - 40 sessions/month, faster sandboxes
- **Usage Dashboard** - Track sessions used vs limit
- **Upgrade Prompts** - In-app upgrade when limit reached

---

### Phase 2: Enhanced Features

#### Advanced Interaction
- **Pinch to Build** - Select UI element → describe changes
- **Screenshot Analysis** - Upload mockup → generate matching UI
- **Voice Command Mode** - Hands-free continuous interaction
- **Prompt Suggestions** - AI-suggested improvements
- **Smart Auto-Complete** - Finish your prompts intelligently

#### AI Asset Generation
- **Icon Generator** - Nano Banana AI powered app icons
- **Sound Generator** - ElevenLabs alert/notification sounds
- **Background Images** - Generate hero/splash images
- **Asset Library** - Manage all generated assets
- **Asset Preview** - See/hear before applying
- **Asset Variations** - Generate multiple options
- **Custom Prompts** - Fine-tune asset generation
- **Asset Export** - Download individual assets

#### Templates & Community
- **Template Gallery** - Browse pre-built app templates
- **Template Categories** - Fitness, productivity, social, etc.
- **Fork Template** - Start from community template
- **Publish Template** - Share your app as template
- **Template Ratings** - Community votes/reviews
- **Featured Templates** - Curated by MobVibe team
- **Template Search** - Find templates by keyword/category

#### Collaboration
- **Share Project Link** - View-only access for others
- **Invite Collaborators** - Multiple users on one project
- **Comment System** - Discuss changes with team
- **Version History** - See all iterations with diffs
- **Branch Projects** - Fork and experiment

#### Quality of Life
- **Dark Mode** - System or manual toggle
- **Haptic Feedback** - Vibrations on key actions
- **Custom Themes** - Personalize app appearance
- **Keyboard Shortcuts** - External keyboard support
- **Offline Mode** - View past projects offline
- **Push Notifications** - Session complete alerts
- **Smart Onboarding** - Context-aware tips

---

### Phase 3: Professional Features

#### Code Export & Integration
- **GitHub Sync** - Auto-push to GitHub repo
- **Download Source** - Complete project as .zip
- **SSH/Cursor Connection** - Direct code editor access
- **Git History** - Preserve all commits
- **README Generation** - Auto-generated documentation
- **Environment Variables** - Manage secrets securely

#### Publishing Automation
- **EAS Build Integration** - One-click native builds
- **App Store Connect** - Automatic iOS submission
- **Google Play Console** - Automatic Android submission
- **Certificate Management** - Handle signing automatically
- **Review Status Tracking** - Monitor submission progress
- **Update Management** - Push OTA updates
- **Beta Testing** - TestFlight/Internal testing setup

#### Enterprise & Teams
- **Team Workspaces** - Shared project spaces
- **White-Label** - Remove MobVibe branding
- **Custom Branding** - Your logo/colors
- **SSO Integration** - Enterprise authentication
- **Admin Dashboard** - Team management console
- **Usage Analytics** - Track team activity
- **Billing Management** - Centralized billing
- **API Access** - Programmatic project creation

#### Advanced Features
- **Custom Backend Integration** - Connect to existing APIs
- **Database Designer** - Visual schema builder
- **API Endpoint Creator** - Generate backend routes
- **Third-Party SDK Integration** - Add Firebase, Stripe, etc.
- **Performance Profiling** - Identify bottlenecks
- **A/B Testing** - Built-in experimentation
- **Analytics Integration** - PostHog, Mixpanel, etc.
- **Error Monitoring** - Sentry integration

---

## User Personas

### 1. Sarah - The Solopreneur
**Background:**
- 32, runs online fitness coaching business
- Non-technical, uses no-code tools
- Wants custom mobile app for clients
- Budget: $100/month

**Goals:**
- Create branded fitness tracking app
- Schedule workouts for clients
- Track client progress
- Simple, professional look

**Pain Points:**
- Can't afford developer ($10k+)
- No-code tools too limited
- Need specific fitness features
- Want to own the code

**MobVibe Value:**
- Affordable ($29/month Pro)
- Describe exact needs
- Custom branding
- Export code to scale later

---

### 2. Marcus - The Indie Hacker
**Background:**
- 28, full-stack developer
- Building SaaS side projects
- Needs mobile app quickly
- Revenue: $5k MRR from web app

**Goals:**
- MVP mobile app in days, not weeks
- Focus on business logic, not boilerplate
- Iterate fast based on feedback
- Maintain code quality

**Pain Points:**
- React Native learning curve steep
- Setup takes days (navigation, auth, etc.)
- Design not his strength
- Time is limiting factor

**MobVibe Value:**
- Skip boilerplate setup
- AI handles best practices
- Iterate via prompts
- Export to own repo

---

### 3. Alex - The Agency Owner
**Background:**
- 45, runs digital agency (20 employees)
- Builds apps for clients
- High client demand, limited resources
- Agency revenue: $2M/year

**Goals:**
- Faster prototyping for clients
- Reduce developer hours on MVPs
- Win more deals with quick demos
- Maintain quality standards

**Pain Points:**
- Junior devs too slow
- Senior devs too expensive for prototypes
- Clients want to "see" before committing
- Long sales cycles

**MobVibe Value:**
- Quick client demos (hours not days)
- White-label for agency branding
- Team workspace for collaboration
- Export code for agency developers

---

### 4. Jamie - The Student
**Background:**
- 21, computer science student
- Learning mobile development
- Hackathon participant
- Budget: $0-10/month

**Goals:**
- Build portfolio projects
- Learn mobile best practices
- Win hackathons
- Get internship offers

**Pain Points:**
- Limited time between classes
- Tutorials too basic or too complex
- Don't know best practices
- Need working apps fast

**MobVibe Value:**
- Free tier (3 apps/month)
- Learn by watching Claude code
- Professional-quality output
- Portfolio-ready projects

---

## Core User Journeys

### Journey 1: First App Creation (New User)

#### Pre-App Experience
**Discovery** → **Sign Up** → **Onboarding** → **First App**

**1. Discovery (External)**
```
User hears about MobVibe
    ↓
Visits landing page
    ↓
Watches demo video (30s)
    ↓
Clicks "Try Free" CTA
```

**2. Sign Up (30 seconds)**
```
Screen: Welcome
    ├─ "Sign in with Google" (tap)
    ├─ "Sign in with Apple" (tap)
    └─ "Continue with Email" (tap)
        ↓
    Enter email address
        ↓
    "Check your email for magic link"
        ↓
    (Open email, click link)
        ↓
    Redirect to app → Authenticated ✓
```

**3. Onboarding Tutorial (45 seconds, skippable)**
```
Screen: Tutorial Carousel
    ├─ Slide 1: "Describe Your App"
    │   └─ Animation: Speech bubble → Code files
    ├─ Slide 2: "Watch Claude Build"
    │   └─ Animation: Code typing in real-time
    ├─ Slide 3: "Preview on Your Phone"
    │   └─ Animation: QR scan → App appears
    └─ Slide 4: "Iterate Until Perfect"
        └─ Animation: Prompt → Changes → Preview
    ↓
Options:
    ├─ "Take Tutorial" (5 min guided experience)
    └─ "Skip to Build" → First App Screen ✓
```

**4. First App Creation (2 minutes)**
```
Screen: Create Your First App
    ├─ Template Suggestions (swipeable cards)
    │   ├─ "Todo List App"
    │   ├─ "Fitness Tracker"
    │   ├─ "Note Taking App"
    │   └─ "Blank Canvas" ✓ (user selects)
    │
    ├─ Prompt Input (text area with placeholder)
    │   Placeholder: "Example: Build a todo app with categories..."
    │   User types: "Build a daily habits tracker with streak counter"
    │
    ├─ Voice Input Button (optional)
    │   └─ Hold to speak → Transcribe
    │
    └─ "Start Building" Button (primary CTA)
        ↓
    (Tap "Start Building")
        ↓
    Haptic feedback (success vibration)
        ↓
    Navigate to Coding Session Screen
```

**5. Coding Session (5-10 minutes)**
```
Screen: Coding Session with Bottom Tabs

┌─────────────────────────────────────┐
│ ☰  Daily Habits Tracker      [⋮]   │ ← Header with menu
├─────────────────────────────────────┤
│ 🧠 Thinking... (2:34)               │ ← Status bar
│ "Creating habit tracker with        │
│  streak counter and notifications"  │
├─────────────────────────────────────┤
│                                     │
│  [Code Tab - Currently Active]      │ ← Main content area
│                                     │
│  📦 Terminal              [Expand]  │
│  $ npm install zustand             │
│  ✓ Installed zustand@4.5.0         │
│                                     │
│  📝 Files (12)                      │
│  app/                               │
│  ├─ index.tsx        ✓ 234 lines   │
│  ├─ habits.tsx       ⏳ Writing...  │
│  └─ settings.tsx     ⏳ Queue       │
│                                     │
│  [View Full Code] [Copy All]       │
│                                     │
├─────────────────────────────────────┤
│ [Code] [Preview] [🔗] [🎨]         │ ← Bottom tabs
└─────────────────────────────────────┘

Bottom Tab Navigation:
├─ Code (active) - File tree + code viewer
├─ Preview - WebView with live app
├─ 🔗 Integrations - API connections
└─ 🎨 Icon Gen - Nano Banana generator

User Actions Available:
├─ Switch tabs to see preview/integrations/icon gen
├─ Scroll through terminal output
├─ Tap file to view full code
├─ Pull to refresh status
└─ Tap [⋮] menu to stop/pause session
```

**6. Preview & Completion (2 minutes)**
```
Claude completes generation
    ↓
Notification: "Your app is ready!" (haptic)
    ↓
Screen updates:
    ├─ Status: "✓ Complete"
    ├─ Preview tab badge appears (blue dot)
    └─ New prompt input appears at bottom

User taps "Preview" tab
    ↓
WebView loads with app preview
    ↓
See working app in-app ✓
    ↓
User interacts with preview:
    ├─ Adds habits
    ├─ Marks complete
    ├─ Sees streak counter working
    └─ Tests all features

User satisfied with preview
    ↓
Swipes back or taps "Code" tab
    ↓
Prompt appears: "What would you like to change?"
```

**7. Iteration (Optional, 3 minutes)**
```
User types: "Add dark mode and haptic feedback"
    ↓
Tap "Continue Building"
    ↓
Claude modifies existing code
    ├─ Updates theme system
    ├─ Adds haptic library
    └─ Implements feedback
    ↓
Preview auto-updates
    ↓
User tests dark mode ✓
```

**8. Save & Exit (10 seconds)**
```
User taps "Done" or back button
    ↓
Auto-saved to "My Projects"
    ↓
Screen: "Great work! 🎉"
    ├─ "You created your first app!"
    ├─ "2 sessions remaining this month"
    └─ Options:
        ├─ "Create Another App"
        ├─ "View My Projects"
        └─ "Share This App" → Share link copied
```

**Total Time: 10-15 minutes** (Setup to working app)

---

### Journey 2: Returning User Workflow

#### Experienced User Flow
**Open App** → **Quick Action** → **Build/Edit** → **Preview** → **Done**

**1. App Launch (2 seconds)**
```
User opens MobVibe
    ↓
Screen: Projects Dashboard
    ├─ Recent Projects (top 3 with thumbnails)
    ├─ Quick Actions (floating buttons)
    │   ├─ "+ New Project" (primary)
    │   └─ "🎤 Voice Start" (secondary)
    └─ Projects List (scrollable)

User Actions:
├─ Tap project → Resume/view details
├─ Tap "+ New" → Create new app
├─ Tap voice → Speak app idea immediately
└─ Search → Find specific project
```

**2. Quick Creation (30 seconds)**
```
User taps voice button
    ↓
Holds to speak: "Build a countdown timer app"
    ↓
Releases → Transcription appears
    ↓
"Start Building" button auto-appears
    ↓
Tap → Session starts immediately
    (No additional screens)
```

**3. Resume Existing Project (1 minute)**
```
User taps existing project from list
    ↓
Screen: Project Details
    ├─ Project name & description
    ├─ Last edited: "2 days ago"
    ├─ Preview: Last QR code (if recent)
    └─ Actions:
        ├─ "Continue Building" (primary)
        ├─ "View Code"
        ├─ "Download Project"
        └─ "Delete"

User taps "Continue Building"
    ↓
Prompt appears: "What would you like to add?"
    ↓
User types: "Add a progress circle animation"
    ↓
Session continues with context from last session
```

---

### Journey 3: Upgrade Journey (Limit Reached)

#### Free → Paid Conversion Flow

**1. Limit Hit (5 seconds)**
```
User tries to create 4th app this month
    ↓
Tap "+ New Project"
    ↓
Modal appears (blocking, beautiful)

┌─────────────────────────────────────┐
│         Monthly Limit Reached       │
│                                     │
│    You've used 3/3 free sessions    │
│         this month! 🎉              │
│                                     │
│  Upgrade to keep building:          │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ ✓ Starter - $9/mo           │  │
│  │   10 sessions, priority     │  │
│  │                             │  │
│  │ ✓ Pro - $29/mo  ⭐ Popular │  │
│  │   40 sessions, faster       │  │
│  │                             │  │
│  │ ✓ Enterprise - Custom       │  │
│  │   Unlimited, white-label    │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Upgrade Now] [Maybe Later]       │
└─────────────────────────────────────┘
```

**2. Upgrade Decision (30 seconds)**
```
User taps "Upgrade Now"
    ↓
Screen: Choose Plan
    ├─ Plans comparison table
    ├─ Toggle: Monthly / Annual (20% off)
    └─ Tap "Pro - $29/mo"
        ↓
Screen: Payment (Stripe)
    ├─ Card input
    ├─ "Starting today, $29/mo"
    └─ "Tap to Pay" button
        ↓
    Processing... (loading indicator)
        ↓
    Success! ✓
        ↓
Screen: "Welcome to Pro! 🎉"
    ├─ "You now have 40 sessions/month"
    ├─ "Sessions reset on: Nov 1"
    └─ "Start Building" button
        ↓
    Returns to new project flow
```

**3. Alternative: Maybe Later (10 seconds)**
```
User taps "Maybe Later"
    ↓
Modal updates:

┌─────────────────────────────────────┐
│    Want to keep using free?         │
│                                     │
│  Your sessions reset on Nov 1       │
│  (in 12 days)                       │
│                                     │
│  Meanwhile:                         │
│  ✓ View existing projects           │
│  ✓ Download code                    │
│  ✓ Edit projects (no AI)            │
│                                     │
│  Or refer friends for bonus         │
│  sessions! (1 session per friend)   │
│                                     │
│  [Refer Friends] [Got It]           │
└─────────────────────────────────────┘
```

---

## Screen-by-Screen Flows

### Screen 1: Projects Dashboard (Home)

**Layout:**
```
┌─────────────────────────────────────┐
│ ☰                        👤 Profile │ ← Header
├─────────────────────────────────────┤
│                                     │
│  Good morning, Sarah! 🌅            │ ← Personalized
│  You have 2/3 sessions left         │
│                                     │
│  Recent Projects                    │ ← Section
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ 📱   │ │ 📱   │ │ 📱   │       │ ← Cards
│  │Habit │ │Todo  │ │Timer │       │
│  └──────┘ └──────┘ └──────┘       │
│                                     │
│  All Projects (12)          [Sort] │ ← Section
│  ┌─────────────────────────────┐  │
│  │ 📱 Daily Habits              │  │ ← List item
│  │ Last edited: 2 days ago      │  │
│  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │
│  │ 📱 Workout Logger            │  │
│  │ Last edited: 1 week ago      │  │
│  └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
│                                     │
│          [+ New Project]            │ ← FAB (floating)
│              [🎤]                   │ ← Voice button
└─────────────────────────────────────┘
```

**User Actions:**
- Tap hamburger (☰) → Side menu
- Tap profile → Account settings
- Tap recent project card → Project details
- Tap list item → Project details
- Long press project → Quick actions (delete, share)
- Pull down → Refresh list
- Tap + button → New project flow
- Hold 🎤 button → Voice input
- Tap Sort → Sort options (date, name, status)

**Navigation Options:**
- Swipe left on project → Delete
- Swipe right on project → Share
- Search bar (appears on scroll up)

---

### Screen 2: New Project Setup

**Layout:**
```
┌─────────────────────────────────────┐
│ ← Back          Create New App      │
├─────────────────────────────────────┤
│                                     │
│  Choose a starting point            │
│                                     │
│  Templates ─────────────────→       │
│  ┌───────────────────────────────┐ │
│  │  ✨ Popular                    │ │
│  │                                │ │
│  │  [Todo App] [Fitness] [Social] │ │ ← Scrollable
│  │  [Notes]    [Timer]   [Habits] │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌─ Blank Canvas ─────────────────┐│
│  │  Start from scratch             ││
│  │  Describe exactly what you want ││
│  └─────────────────────────────────┘│
│                                     │
│  Or describe your idea:             │
│  ┌─────────────────────────────────┐│
│  │ Build a...                  🎤  ││ ← Text input
│  │                                 ││
│  │ [Try: "fitness tracker with     ││
│  │  meal logging and charts"]      ││
│  └─────────────────────────────────┘│
│                                     │
│  Examples ↓                         │
│  • Meditation timer with sounds     │
│  • Recipe organizer with shopping   │
│  • Expense tracker with budgets     │
│                                     │
│          [Start Building]           │ ← Disabled until
│                                     │   input provided
└─────────────────────────────────────┘
```

**User Interactions:**
- Tap template → Auto-fills description
- Type in text area → Enable "Start Building"
- Tap 🎤 → Voice input modal
- Tap example → Copy to input
- Tap "Start Building" → Coding session begins

---

### Screen 3: Coding Session (Active) - Bottom Tab Navigation

**Layout:**
```
┌─────────────────────────────────────┐
│ ☰   Fitness Tracker          [⋮]   │ ← Header
├─────────────────────────────────────┤
│ Status: 🧠 Thinking... (2:34)       │ ← Status bar
│ "Creating comprehensive fitness     │
│  tracker with meal logging..."      │
├─────────────────────────────────────┤
│                                     │
│ [MAIN CONTENT AREA]                 │ ← Changes per tab
│ Content based on active tab:        │
│ - Code: File tree + viewer          │
│ - Preview: WebView                  │
│ - Integrations: API connections     │
│ - Icon Gen: Nano Banana UI          │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │ ← Bottom tabs
└─────────────────────────────────────┘
```

**Code Tab (Active):**
```
┌─────────────────────────────────────┐
│ 📦 Terminal              [Collapse] │
│ $ npm install zustand chart-kit     │
│ ⏳ Installing... 45%                │
│                                     │
│ 📝 Project Files (18)               │
│ app/                                │
│ ├─ index.tsx         ✓ 234 lines   │ ← Tap to view
│ ├─ workouts.tsx      ✓ 189 lines   │
│ ├─ nutrition.tsx     ⏳ Writing...  │
│ └─ stats.tsx         ⏳ Queue       │
│                                     │
│ components/                         │
│ ├─ WorkoutCard.tsx   ✓ 67 lines    │
│ └─ Chart.tsx         ✓ 102 lines   │
│                                     │
│ [View Full Code] [Download .zip]   │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │ ← Bottom tabs
└─────────────────────────────────────┘
```

**Preview Tab:**
```
┌─────────────────────────────────────┐
│ 📱 Live Preview                     │
│                                     │
│ ┌─────────────────────────────────┐│
│ │  [WebView showing app]          ││
│ │                                 ││
│ │  [App renders here in-app]      ││
│ │  • Interactive                  ││
│ │  • Real-time updates            ││
│ │  • Full functionality           ││
│ │                                 ││
│ └─────────────────────────────────┘│
│                                     │
│ [🔄 Reload] [📸 Screenshot]        │
│ Preview expires in: 45 min          │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

**Integrations Tab:**
```
┌─────────────────────────────────────┐
│ 🔗 Integrations                     │
│                                     │
│ Available Services:                 │
│ ┌─────────────────────────────────┐│
│ │ [Firebase]         [Connect]    ││
│ │ Authentication, Firestore        ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Supabase]         [Connect]    ││
│ │ Database, Auth, Storage          ││
│ └─────────────────────────────────┘│
│ ┌─────────────────────────────────┐│
│ │ [Stripe]           [Connect]    ││
│ │ Payments, Subscriptions          ││
│ └─────────────────────────────────┘│
│                                     │
│ [Browse All Integrations]           │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

**Icon Gen Tab:**
```
┌─────────────────────────────────────┐
│ 🎨 Generate App Icon                │
│                                     │
│ Describe your app icon:             │
│ ┌─────────────────────────────────┐│
│ │ Minimalist fitness dumbbell     ││
│ │ with progress circle, modern    ││
│ │ gradient blue to purple         ││
│ └─────────────────────────────────┘│
│                                     │
│ Style: [Modern] [Minimal] [Bold]    │
│                                     │
│ [Generate Icon]                     │
│                                     │
│ Recent generations:                 │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ 🏋️  │ │ 💪  │ │ ⚡  │            │
│ └─────┘ └─────┘ └─────┘            │
│                                     │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

**Bottom Sheet (pulled up):**
```
┌─────────────────────────────────────┐
│ ─────                         [×]   │ ← Drag handle
│                                     │
│ Want to modify something?           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Add...                      🎤  │ │ ← New prompt
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Suggestions:                        │
│ • Add dark mode                     │
│ • Include rest timer                │
│ • Add exercise GIFs                 │
│                                     │
│ [Send] (disabled until typed)       │
└─────────────────────────────────────┘
```

---

### Screen 4: Completion & Next Steps

**Layout:**
```
┌─────────────────────────────────────┐
│ ☰   Fitness Tracker          [⋮]   │
├─────────────────────────────────────┤
│                                     │
│  ✓ Your app is ready! 🎉            │
│                                     │
│  Session Summary:                   │
│  • 18 files created                 │
│  • 2,456 lines of code              │
│  • 4 dependencies installed         │
│  • Time: 8 min 32 sec               │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 📱 Preview Now              │  │ ← Primary
│  │ Tap Preview tab to test     │  │
│  └─────────────────────────────┘  │
│                                     │
│  Next steps:                        │
│  • Tap Preview tab to test          │
│  • Make changes with new prompts    │
│  • Generate icon in Icon Gen tab    │
│  • Connect integrations             │
│  • Download code when ready         │
│                                     │
│  Sessions remaining: 2/3            │
│                                     │
├─────────────────────────────────────┤
│ [💾 Code] [📱 Preview] [🔗] [🎨]   │
└─────────────────────────────────────┘
```

---

## Interaction Patterns

### Mobile-Specific Gestures

**Swipe Gestures:**
- **Swipe left on project** → Delete option
- **Swipe right on project** → Share option
- **Swipe down on coding session** → Refresh status
- **Swipe up from bottom** → New prompt sheet
- **Swipe between bottom tabs** → Code/Preview/Integrations/Icon Gen navigation

**Long Press:**
- **Long press project** → Context menu (share, delete, duplicate)
- **Long press file in list** → Quick actions (view, download, copy path)
- **Long press code line** → Copy code snippet
- **Long press preview** → Screenshot/fullscreen options

**Pinch & Zoom:**
- **Pinch on code viewer** → Zoom in/out text
- **Pinch on preview** → Zoom in/out app preview
- **Pinch on preview element (Phase 2)** → "Pinch to Build" feature activation

**Pull to Refresh:**
- **Projects list** → Sync latest from cloud
- **Coding session** → Check for updates
- **Preview tab** → Reload preview WebView

**Haptic Feedback:**
- Session starts → Success haptic (3 quick taps)
- File created → Light tap
- Error occurs → Strong vibration pattern
- Completion → Success pattern (ta-da)
- Limit reached → Warning vibration
- Button press → Light feedback

### Voice Interaction

**Voice Commands (Phase 2):**
```
User: "Hey MobVibe, create a new app"
→ Opens new project screen

User: "Build a timer app with intervals"
→ Starts session with that prompt

User: "Add dark mode"
→ Sends as follow-up prompt

User: "Show me the code for index file"
→ Opens file viewer with index.tsx

User: "Pause session"
→ Pauses Claude generation

User: "How many sessions do I have left?"
→ Shows usage stats
```

**Voice Input Features:**
- **Hold to speak** - Traditional push-to-talk
- **Hey MobVibe** - Wake word (optional, Phase 2)
- **Continuous mode** - Keep listening until "done"
- **Multi-language** - English, Spanish, French, German
- **Accent adaptation** - Learns user's pronunciation

---

## Edge Cases & Error Handling

### Network Issues

**Scenario: Connection Lost During Session**
```
User starts session
    ↓
Network drops mid-generation
    ↓
App detects disconnection
    ↓
Banner appears: "⚠️ Connection lost. Reconnecting..."
    ↓
Attempts reconnection (3 tries, 5s apart)
    ↓
If successful:
    └─ "✓ Reconnected. Resuming session..."
    └─ Session continues from last event

If failed:
    └─ "❌ Couldn't reconnect"
    └─ Options:
        ├─ "Try Again"
        ├─ "View Offline" (see generated code so far)
        └─ "Save & Exit" (preserves session state)
```

**Session Recovery:**
- All events stored in local database
- Can resume from any point
- No data loss on disconnect
- Background sync when back online

---

### Claude API Errors

**Scenario: Rate Limit Hit**
```
Claude returns 429 Too Many Requests
    ↓
Worker service detects error
    ↓
Sends event to user:
    {
      type: 'error',
      error: 'Claude API temporarily busy',
      suggestion: 'Retrying in 30 seconds...',
      autoRetry: true
    }
    ↓
User sees modal:

┌─────────────────────────────────────┐
│         Please Wait...              │
│                                     │
│  Claude is busy with many requests  │
│  Your session will continue in 30s  │
│                                     │
│  [⏱️ 28 seconds remaining]          │
│                                     │
│  This won't count towards your      │
│  session time limit.                │
│                                     │
│  [Cancel Session] [Wait]            │
└─────────────────────────────────────┘

After 30s:
    └─ Auto-retry
    └─ Session continues normally
```

**Scenario: Generation Failure**
```
Claude encounters unrecoverable error
    ↓
Worker service logs error
    ↓
Sends completion event with partial results
    ↓
User sees:

┌─────────────────────────────────────┐
│     Generation Incomplete           │
│                                     │
│  Claude encountered an issue and    │
│  couldn't complete your app.        │
│                                     │
│  What was generated (75%):          │
│  ✓ Project structure                │
│  ✓ Main screens                     │
│  ✓ Navigation                       │
│  ✗ Data persistence (failed)        │
│                                     │
│  Options:                           │
│  • Try again (free, doesn't count)  │
│  • Keep partial project             │
│  • Report issue & get session back  │
│                                     │
│  [Try Again] [Keep Partial]         │
└─────────────────────────────────────┘
```

---

### Preview Issues

**Scenario: WebView Load Failure**
```
User taps Preview tab
    ↓
WebView fails to load preview
    ↓
Error detected (network, timeout, etc)
    ↓
Modal appears:

┌─────────────────────────────────────┐
│     Preview Loading Failed          │
│                                     │
│  Couldn't load preview in-app.      │
│                                     │
│  Try these options:                 │
│                                     │
│  1. [Reload Preview]                │
│     Try loading again               │
│                                     │
│  2. [Copy Preview URL]              │
│     Open in external browser        │
│                                     │
│  3. [Download & Run Locally]        │
│     Advanced: Run on your machine   │
│                                     │
│  4. [View Code Instead]             │
│     Check code while we fix this    │
│                                     │
│  [Contact Support]                  │
└─────────────────────────────────────┘
```

**Scenario: Preview Expired**
```
User returns to preview after 60 minutes
    ↓
EAS Update branch expired
    ↓
WebView shows 404 or expired message
    ↓
App detects expiry
    ↓
Modal appears:

┌─────────────────────────────────────┐
│      Preview Expired                │
│                                     │
│  This preview link expired 15 mins  │
│  ago to save resources.             │
│                                     │
│  Would you like to:                 │
│                                     │
│  [Generate New Preview]             │
│  (Free, takes 30 seconds)           │
│                                     │
│  [View Code Instead]                │
│                                     │
│  [Download Project]                 │
│                                     │
└─────────────────────────────────────┘

If user taps "Generate New Preview":
    └─ Re-publishes to EAS Update
    └─ New preview URL generated
    └─ WebView auto-reloads in 30s
```

---

### Payment & Billing Issues

**Scenario: Payment Fails on Upgrade**
```
User tries to upgrade to Pro
    ↓
Stripe payment fails (declined card)
    ↓
Stripe webhook returns error
    ↓
User sees:

┌─────────────────────────────────────┐
│      Payment Failed                 │
│                                     │
│  We couldn't process your payment.  │
│                                     │
│  Common reasons:                    │
│  • Insufficient funds               │
│  • Card expired                     │
│  • Bank declined                    │
│  • Wrong CVV                        │
│                                     │
│  [Try Different Card]               │
│  [Contact Bank]                     │
│  [Contact Support]                  │
│                                     │
└─────────────────────────────────────┘
```

**Scenario: Subscription Expired**
```
Pro user's subscription lapses
    ↓
Stripe sends webhook: subscription.deleted
    ↓
System updates user tier → Free
    ↓
Next time user opens app:

┌─────────────────────────────────────┐
│    Your Pro Plan Expired            │
│                                     │
│  Your subscription ended on Oct 31  │
│                                     │
│  You're now on the Free plan:       │
│  • 3 sessions/month                 │
│  • Standard queue priority          │
│  • All existing projects saved      │
│                                     │
│  Want to continue with Pro?         │
│                                     │
│  [Renew Pro Plan]                   │
│  [Stay on Free]                     │
│                                     │
└─────────────────────────────────────┘
```

---

### Session Timeout

**Scenario: User Abandons Active Session**
```
User starts session
    ↓
Leaves app without completing
    ↓
30 minutes pass (timeout threshold)
    ↓
Worker service auto-stops Claude
    ↓
Cleanup sandbox
    ↓
Save partial progress
    ↓
Send push notification:
    "Your session timed out after 30 min.
     Tap to view what was generated."
    ↓
Next time user opens app:

┌─────────────────────────────────────┐
│    Session Auto-Saved               │
│                                     │
│  Your Fitness Tracker session       │
│  timed out but progress was saved.  │
│                                     │
│  Generated (partial):               │
│  • 12 files                         │
│  • 1,245 lines of code              │
│  • 60% complete                     │
│                                     │
│  [Resume Building]                  │
│  [View What Was Built]              │
│  [Start Fresh]                      │
│                                     │
└─────────────────────────────────────┘
```

---

### Account & Data Issues

**Scenario: User Wants to Delete Account**
```
Settings → Account → Delete Account
    ↓
Modal with confirmation:

┌─────────────────────────────────────┐
│    Delete Your Account?             │
│                                     │
│  ⚠️ This action cannot be undone    │
│                                     │
│  What will be deleted:              │
│  • All your projects (12)           │
│  • Session history                  │
│  • Account data                     │
│  • Subscription (if active)         │
│                                     │
│  What you can do first:             │
│  • Download all projects (.zip)     │
│  • Export to GitHub                 │
│  • Cancel subscription              │
│                                     │
│  Type "DELETE" to confirm:          │
│  ┌─────────────────────────────┐  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Cancel] [Confirm Deletion]        │
│                                     │
└─────────────────────────────────────┘

After typing "DELETE":
    └─ 7-day grace period starts
    └─ Account marked for deletion
    └─ Email sent with reactivation link
    └─ After 7 days: permanent deletion
```

---

## Success Metrics & Analytics

### User Behavior Tracking

**Key Events Tracked:**
1. **Onboarding**
   - Sign up method (email/Google/Apple)
   - Tutorial completed vs skipped
   - Time to first app creation

2. **App Creation**
   - Template used vs blank start
   - Prompt length (characters)
   - Voice vs text input ratio
   - Generation time (p50, p95, p99)
   - Success vs failure rate

3. **Iteration**
   - Follow-up prompts per session
   - Average iterations before "done"
   - Session abandonment rate
   - Time between iterations

4. **Preview & Testing**
   - QR code scans
   - Preview success rate
   - Time spent in preview
   - Issues reported

5. **Conversion**
   - Free → Paid conversion rate
   - Time to upgrade
   - Upgrade triggers (limit hit, feature locked)
   - Churn rate by tier

6. **Retention**
   - Day 1, 7, 30 return rate
   - Sessions per week (active users)
   - Projects per user
   - Feature adoption rates

---

**Status:** Comprehensive features & journeys documented ✅ | Ready for UI/UX design phase ✅
