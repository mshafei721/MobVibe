<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: implementation.md, data-flow.md, design-system.md, features-and-journeys.md
-->

# MobVibe Architecture

> See [SUMMARY.md](./SUMMARY.md) for complete documentation index.

> **Core Concept:** Users prompt → Claude Agent builds → Real-time updates

## Overview

MobVibe is an AI-powered mobile app builder where **Claude Agent SDK writes all the code**. Users are product managers who describe what they want; Claude is the AI developer who builds it.

See [implementation.md](./implementation.md) for technical stack details and [data-flow.md](./data-flow.md) for complete data flow diagrams.

**Key Principle:** Users give requirements, not code.

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│         Mobile App (React Native + Expo)               │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │ Prompt   │  │ Code Viewer │  │ Live Preview │     │
│  │ Input    │  │ (Readonly)  │  │ (EAS Update) │     │
│  └────┬─────┘  └──────┬──────┘  └──────┬───────┘     │
│       │    WebSocket   │                │              │
└───────┼────────────────┼────────────────┼─────────────┘
        │                │                │
        ▼                ▼                ▼
┌────────────────────────────────────────────────────────┐
│    Backend API (Supabase Edge Functions) <5s           │
│  • Validate auth & user tier                           │
│  • Create session records                              │
│  • Enqueue coding jobs                                 │
│  • Return session ID + WebSocket URL                   │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│    Job Queue (Supabase Realtime / Redis)               │
│  • Priority queue by user tier                         │
│  • Job persistence & retry logic                       │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Worker Service (Fly.io / Render / Railway)            │
│  Long-running Node.js process (5-30 min sessions)      │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Job Processor                                     │ │
│  │  • Poll queue for pending jobs                    │ │
│  │  • Manage sandbox lifecycle                       │ │
│  │  • Run Claude Agent SDK                           │ │
│  │  • Stream events to Realtime                      │ │
│  │  • Handle errors & cleanup                        │ │
│  └──────────────────────────────────────────────────┘ │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│   Development Sandbox (Fly.io microVM)                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Claude Agent SDK                                  │ │
│  │  • Model: claude-sonnet-4-5                       │ │
│  │  • Tools: bash, filesystem, expo, npm             │ │
│  │  • Loop: plan → code → test → fix                 │ │
│  └──────────────────────────────────────────────────┘ │
│  /workspace/                                           │
│    ├─ package.json                                     │
│    ├─ app/ (Expo Router)                               │
│    └─ node_modules/                                    │
│  Processes:                                            │
│    ├─ Claude Agent                                     │
│    └─ EAS CLI (for publishing updates)                 │
└────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. User Prompts

```
User: "Build a todo app"
   ↓
Mobile → POST /start-coding-session { prompt }
   ↓
Edge Function (<5s):
  1. Validate auth & tier
  2. Create session record
  3. Enqueue job to queue
  4. Return session ID + WebSocket URL
   ↓
Mobile establishes WebSocket connection
   ↓
Worker Service (background):
  1. Poll queue, pick up job
  2. Create Fly.io sandbox
  3. Initialize Claude Agent SDK
  4. Start coding loop (5-30 min)
  5. Stream events to Realtime
```

### 2. Claude Codes (Real-Time)

```
Claude Agent Loop:
  1. Think: "I'll create a todo app with Expo Router..."
     → Mobile: { type: 'thinking', message: '...' }

  2. Execute: bash(['npx', 'create-expo-app@latest', 'app'])
     → Mobile: { type: 'terminal', output: '✓ Created project' }

  3. Write: filesystem.write('app/index.tsx', code)
     → Mobile: { type: 'file_change', path: '...', content: '...' }

  4. Install: bash(['npm', 'install', 'zustand'])
     → Mobile: { type: 'terminal', output: '✓ Installed' }

  5. Publish: bash(['eas', 'update', '--branch', 'preview-{id}'])
     → Mobile: { type: 'preview_ready', previewUrl: '...', webviewUrl: '...' }

  6. Complete: "Todo app is ready!"
     → Mobile: { type: 'completion', message: '...' }
```

### 3. User Iterates

```
User: "Add dark mode"
   ↓
Mobile → POST /continue-coding { prompt: "Add dark mode" }
   ↓
Claude: Modifies existing files
   ↓
Preview auto-reloads
```

---

## Server-Side API Proxy Architecture

**Security-First Design Principle**

MobVibe implements a **server-side API proxy architecture** where all external AI service API keys are managed exclusively by the backend. Users never see, provide, or manage API keys directly.

### Architecture Benefits

```
┌──────────────────────────────────────────────────────────────┐
│                   CLIENT-SIDE (INSECURE)                     │
│  ❌ API Keys in Mobile App → Reverse Engineering Risk        │
│  ❌ Users Provide Own Keys → Support Burden                  │
│  ❌ Direct API Calls → No Rate Limiting Control              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              SERVER-SIDE PROXY (MOBVIBE APPROACH)            │
│  ✅ Keys Secured in Backend → Zero Exposure Risk             │
│  ✅ Invisible to Users → Zero Configuration Required         │
│  ✅ Backend Rate Limiting → Full Control & Abuse Prevention  │
│  ✅ Centralized Billing → Better Cost Management             │
│  ✅ Service Abstraction → Can Switch Providers Seamlessly    │
└──────────────────────────────────────────────────────────────┘
```

### API Proxy Flow

```
Mobile App                Backend API              AI Service
    │                         │                         │
    ├──"Generate icon"───────>│                         │
    │  (prompt only)          │                         │
    │                         ├──auth + rate limit      │
    │                         ├──add API key───────────>│
    │                         │  (server key)           │
    │                         │                         │
    │                         │<────image data──────────┤
    │<────signed URL──────────┤                         │
    │  (no API key visible)   │                         │
```

### Services Proxied Through Backend

**ALL AI APIs are server-side proxied:**

1. **Anthropic Claude API** (Code Generation)
   - Endpoint: `/start-coding-session`
   - Key Location: Backend environment only
   - Usage: Claude Agent SDK in Worker Service

2. **Nano Banana API** (Icon Generation)
   - Endpoint: `/generate-icon`
   - Key Location: Supabase Edge Function env
   - Usage: 2D app icon creation

3. **Meshy AI / Luma AI** (3D Logo Generation)
   - Endpoint: `/generate-3d-logo`
   - Key Location: Backend environment only
   - Usage: Premium 3D logo creation

4. **ElevenLabs API** (Sound Generation)
   - Endpoint: `/generate-sound`
   - Key Location: Backend environment only
   - Usage: UI sound effects generation

5. **OpenAI API** (Future: Voice, Vision)
   - Endpoint: `/ai-service` (future)
   - Key Location: Backend environment only
   - Usage: Additional AI capabilities

### Security Advantages

**1. Zero Key Exposure**
- Mobile app contains ONLY public keys (Supabase anon key)
- All AI service keys stored in backend environment variables
- Even reverse engineering the app reveals nothing

**2. Centralized Rate Limiting**
- Backend enforces tier-based limits per user
- Prevent API abuse and cost overruns
- Can implement sophisticated throttling strategies

**3. Cost Control**
- Single billing relationship with each AI provider
- Volume discounts negotiable at scale
- Can switch providers without mobile app updates

**4. Service Abstraction**
- Mobile app doesn't know which AI provider is used
- Can A/B test different providers
- Failover to backup services seamlessly

**5. Credential Management**
- API keys rotated server-side with zero downtime
- No need for users to manage multiple API accounts
- Simplified onboarding (no API key setup required)

### Competitive Advantage

Unlike competitors who require users to provide their own API keys:
- **MobVibe**: "Just sign in and start building" (frictionless)
- **Competitors**: "First, sign up for Anthropic, get API key, paste it here..." (friction)

This architecture is a **product differentiator** and **security best practice**, not a limitation.

---

## Core Components

### Mobile App (React Native)

**Purpose:** Display Claude's work in real-time

**Screens:**
- **Home:** Project list
- **Coding Session:** Bottom tab navigation
  - **Code Tab:** File tree + syntax highlighted viewer
  - **Preview Tab:** WebView with live app preview
  - **Integrations Tab:** Third-party services & APIs
  - **Icon Gen Tab:** AI-powered app icon creation
- **Hamburger Menu:** Settings, profile, account

See [design-system.md](./design-system.md) for UI/UX specifications and [features-and-journeys.md](./features-and-journeys.md) for user journey details.

**Key Features:**
- WebSocket for real-time updates
- In-app WebView preview (no scanning needed)
- Haptic feedback on file changes
- Voice input for prompts
- Bottom tab navigation

**Tech Stack:**
- React Native 0.81
- Expo SDK 54
- Expo Router
- NativeWind
- Zustand (state)
- React Query (server state)

**Expo SDK 54 Benefits:**
- React 19.1 support for better performance
- Precompiled XCFrameworks for iOS (faster builds)
- Modern architecture with improved stability

See [implementation.md](./implementation.md) for complete technology specifications.

### Backend API (Supabase)

**Purpose:** Fast request/response API layer (<5s)

See [data-flow.md](./data-flow.md) for detailed API flow diagrams.

**Edge Functions:**
- `start-coding-session`: Validate, enqueue job, return immediately
- `continue-coding`: Add prompt to existing session queue
- `stop-coding-session`: Mark session for cleanup
- `generate-icon`: Proxy Nano Banana API with rate limiting
- `generate-sound`: Proxy ElevenLabs API with rate limiting

**Database Tables:**
- `coding_sessions`: Session state & metadata
- `coding_jobs`: Job queue with status tracking
- `project_files`: File metadata (content in Storage)
- `agent_events`: Event history for debugging

**Supabase Realtime:**
- Real-time event streaming via WebSocket
- Subscribe to session-specific channels
- Low-latency updates (<100ms)

### Worker Service (Fly.io / Render / Railway)

**Purpose:** Long-running Claude Agent orchestration

**Architecture:**
- Long-running Node.js process (not serverless)
- Polls job queue continuously
- Handles multiple concurrent sessions
- Manages sandbox lifecycle
- Streams events to Supabase Realtime

**Responsibilities:**
1. **Job Processing:** Poll queue, execute jobs by priority
2. **Sandbox Management:** Create, monitor, cleanup Fly.io VMs
3. **Agent Orchestration:** Run Claude Agent SDK with tools
4. **Event Streaming:** Real-time updates to mobile via Realtime
5. **Error Handling:** Retry logic, graceful failures, cleanup

**Why Separate Service:**
- Edge Functions timeout at 150s (Claude needs 5-30 min)
- Need persistent connection to sandbox
- Can handle disconnects and resume
- Independent scaling from API layer

**Deployment Options:**
- **Fly.io:** Same platform as sandboxes, low latency
- **Render:** Simple deployment, auto-scaling
- **Railway:** Good dev experience, fair pricing

### Development Sandbox (Fly.io)

**Purpose:** Workspace for Claude Agent

**Requirements:**
- Full Linux environment
- Node.js 20+
- Expo CLI
- File system access
- Bash execution
- npm/npx
- 30-minute sessions
- Auto-pause when idle

**Resource Limits:**
- 1 vCPU
- 2GB RAM
- 1GB storage
- 100 req/min

**Isolation:**
- Separate microVM per user/project
- Network isolation
- Process isolation

---

## Claude Agent SDK

### Configuration

```typescript
const agent = new ClaudeAgent({
  model: 'claude-sonnet-4-5',

  systemPrompt: `You are an expert React Native developer building mobile apps with Expo.

  Guidelines:
  - Use Expo SDK 54 and React Native 0.81
  - Use TypeScript with strict mode
  - Use Expo Router for navigation
  - Use NativeWind for styling
  - Test your code by running expo start
  - Fix any errors before completing`,

  tools: [
    bashTool(sandbox),
    filesystemTool(sandbox),
    expoTool(sandbox),
    npmTool(sandbox)
  ]
})
```

### Tools

**bash:** Execute shell commands
```typescript
{
  type: 'bash',
  execute: (args: string[]) => sandbox.execCommand(args)
}
```

**filesystem:** File operations
```typescript
{
  type: 'filesystem',
  read: (path: string) => sandbox.readFile(path),
  write: (path: string, content: string) => sandbox.writeFile(path, content),
  delete: (path: string) => sandbox.deleteFile(path),
  list: (path: string) => sandbox.listFiles(path)
}
```

**expo:** Expo CLI operations
```typescript
{
  type: 'expo',
  publish: (branchName) => sandbox.execCommand(['eas', 'update', '--branch', branchName]),
  build: () => sandbox.execCommand(['eas', 'build']),
  test: () => sandbox.execCommand(['npm', 'test'])
}
```

---

## Real-Time Updates

### WebSocket Events

**thinking**
```json
{
  "type": "thinking",
  "message": "Planning the todo app structure..."
}
```

**terminal**
```json
{
  "type": "terminal",
  "command": "npm install zustand",
  "output": "✓ Installed zustand@4.5.0"
}
```

**file_change**
```json
{
  "type": "file_change",
  "path": "app/index.tsx",
  "content": "import { View } from 'react-native'...",
  "action": "created"
}
```

**preview_ready**
```json
{
  "type": "preview_ready",
  "previewUrl": "https://u.expo.dev/preview/...",
  "webviewUrl": "https://snack.expo.dev/@project/...",
  "branch": "preview-abc123",
  "expiresIn": 3600
}
```

**completion**
```json
{
  "type": "completion",
  "message": "Todo app is ready! You can now add tasks, mark them complete, and persist them to local storage."
}
```

**error**
```json
{
  "type": "error",
  "error": "Module not found: 'expo-av'",
  "suggestion": "Installing dependency..."
}
```

---

## Security & Isolation

### Multi-Tenant Isolation

**Sandbox Level:**
- Each user/project = separate Fly.io microVM
- File system isolation
- Process isolation
- Network isolation

**Database Level:**
- Schema per project: `app_{project_id}`
- Row Level Security (RLS)
- Scoped API keys

**Resource Limits:**
- CPU: 1 vCPU per sandbox
- Memory: 2GB per sandbox
- Storage: 1GB per sandbox
- Time: 30 min max session
- Rate: 100 req/min

### Security Measures

1. **Sandbox Isolation:** Firecracker microVMs
2. **Network Limits:** Egress controls
3. **Resource Limits:** CPU/memory/time caps
4. **Auto-Cleanup:** Sessions expire after 30 min
5. **Rate Limiting:** Per-user request limits

---

## Cost Structure

### Per Session Costs

**Infrastructure (Fly.io):**
- $0.02/hour = $0.0003/minute
- 15 min avg session = $0.0045

**Claude API:**
- Input: 50k tokens × $3/M = $0.15
- Output: 20k tokens × $15/M = $0.30
- Total: $0.45

**Total per session: ~$0.45**

### Monthly Projections

| Tier | Sessions | Cost | Revenue | Margin |
|------|----------|------|---------|--------|
| Free | 3 | $1.36 | $0 | -$1.36 |
| Starter | 10 | $4.55 | $9 | $4.45 |
| Pro | 40 | $18.18 | $29 | $10.82 |

### Optimization Strategies

1. **Auto-pause:** Idle sandboxes after 5 min
2. **Prompt caching:** Reduce token costs
3. **Rate limits:** Prevent abuse
4. **Session timeouts:** Force cleanup
5. **Tier limits:** Cap free usage

---

## Scalability

### Phase 1: Single Region (MVP)
- 100 concurrent sandboxes
- 1,000 users
- 10,000 sessions/month

### Phase 2: Multi-Region
- 1,000 concurrent sandboxes
- 10,000 users
- 100,000 sessions/month

### Phase 3: Global
- 10,000 concurrent sandboxes
- 100,000 users
- 1,000,000 sessions/month

**Bottlenecks:**
- Sandbox startup time (2-5s)
- WebSocket connections (10k max per server)
- Claude API rate limits (tier-dependent)

**Solutions:**
- Sandbox pooling (pre-warmed)
- WebSocket server sharding
- Enterprise Claude API tier

---

## Key Differences from Traditional IDEs

| Aspect | Traditional IDE | MobVibe |
|--------|----------------|---------|
| User writes | Code | Prompts |
| User role | Developer | Product manager |
| Editor | Interactive | Read-only viewer |
| Execution | Local machine | Cloud sandbox |
| Updates | Manual save | Real-time stream |
| Preview | Simulator | In-app WebView |
| Cost | One-time | Per-session |

---

## Design Principles

1. **Conversational:** Natural language, not code
2. **Real-time:** See Claude work live
3. **Transparent:** Show all actions
4. **Iterative:** Continuous refinement
5. **Mobile-first:** Build on phone, for phone
6. **No lock-in:** Export anytime

---

**Status:** Architecture validated ✅ | Worker service pattern ✅ | EAS Update integration ✅
