# Phase 30: Onboarding Flow

**Duration:** 2 days
**Dependencies:** [29]
**Status:** Not Started

## Objective

Guide new users through welcome screens, feature tour, and first session walkthrough to ensure they understand core features and achieve early success.

## Key Tasks

### 1. Welcome Screens
- [ ] Design welcome carousel (3-4 screens)
- [ ] Highlight key value propositions
- [ ] Show tier options (Free vs Pro)
- [ ] Add skip option for returning users

### 2. Feature Tour
- [ ] Interactive code editor walkthrough
- [ ] Agent assistant introduction
- [ ] Execution and output showcase
- [ ] Session history and persistence demo

### 3. First Session Walkthrough
- [ ] Guided first session creation
- [ ] Pre-filled example code (Hello World)
- [ ] Prompted agent interaction
- [ ] Celebration on first successful execution

### 4. Progressive Disclosure
- [ ] Show advanced features after basic mastery
- [ ] Contextual tips during first 3 sessions
- [ ] Achievement system for learning milestones
- [ ] Help center integration

## Technical Implementation

### Onboarding State Management
```typescript
// libs/onboarding/models/OnboardingState.ts
interface OnboardingState {
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  currentStep: number;
  completedSteps: string[];
  milestones: {
    firstSession: boolean;
    firstExecution: boolean;
    firstAgentInteraction: boolean;
    firstSessionCompleted: boolean;
  };
  preferences: {
    showTips: boolean;
    tourCompleted: boolean;
  };
}
```

### Onboarding Flow Component
```typescript
// libs/onboarding/screens/OnboardingFlow.tsx
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to MobVibe',
    description: 'Code on mobile with AI assistance',
    illustration: 'welcome.png',
    type: 'informational',
  },
  {
    id: 'features',
    title: 'Powerful Features',
    description: 'AI pair programming, instant execution, mobile-optimized',
    illustration: 'features.png',
    type: 'informational',
  },
  {
    id: 'tiers',
    title: 'Choose Your Plan',
    description: 'Start free with 3 sessions/month',
    illustration: 'pricing.png',
    type: 'selection',
  },
  {
    id: 'first-session',
    title: 'Let\'s Code Together',
    description: 'Create your first session',
    illustration: 'coding.png',
    type: 'interactive',
  },
];
```

### Interactive Walkthrough
```typescript
// libs/onboarding/components/InteractiveWalkthrough.tsx
const WALKTHROUGH_STEPS = [
  {
    target: 'code-editor',
    title: 'Your Mobile Editor',
    content: 'Write JavaScript code right on your phone',
    placement: 'bottom',
    action: 'highlight',
  },
  {
    target: 'run-button',
    title: 'Run Your Code',
    content: 'Tap here to execute code in a secure sandbox',
    placement: 'top',
    action: 'pulse',
  },
  {
    target: 'agent-panel',
    title: 'AI Assistant',
    content: 'Get help, suggestions, and code improvements',
    placement: 'left',
    action: 'highlight',
  },
  {
    target: 'output-panel',
    title: 'See Results',
    content: 'View execution output, logs, and errors here',
    placement: 'top',
    action: 'highlight',
  },
];
```

### First Session Template
```typescript
// libs/onboarding/templates/firstSession.ts
export const FIRST_SESSION_TEMPLATE = {
  code: `// Welcome to MobVibe! 👋
// Let's start with a simple example

function greet(name) {
  return \`Hello, \${name}! Welcome to mobile coding.\`;
}

console.log(greet('Developer'));

// Try modifying this code or ask the AI for suggestions!`,

  agentPrompt: "I'm new to MobVibe. Can you explain what this code does?",

  expectedOutput: "Hello, Developer! Welcome to mobile coding.",
};
```

## Onboarding Screen Content

### Screen 1: Welcome
**Illustration:** Hero image with code and AI elements
**Title:** "Code Anywhere, Anytime"
**Body:** "MobVibe brings professional development to your mobile device with AI-powered assistance."
**CTA:** "Get Started" | "Skip"

### Screen 2: Features
**Illustration:** Feature showcase split-screen
**Title:** "Everything You Need"
**Body:**
- Real code execution in secure sandboxes
- Claude AI pair programming
- Session persistence and history
- Mobile-optimized editor

**CTA:** "Continue" | "Skip"

### Screen 3: Choose Plan
**Illustration:** Tier comparison
**Title:** "Start Free or Go Pro"
**Body:**
- **Free:** 3 sessions/month, all core features
- **Pro:** 50 sessions/month, priority execution

**CTA:** "Start Free" | "View Pro Features"

### Screen 4: First Session
**Illustration:** Interactive code example
**Title:** "Let's Write Some Code"
**Body:** "We'll guide you through creating and running your first session."
**CTA:** "Start Coding" | "I'll explore on my own"

## Interactive Walkthrough Steps

### Step 1: Code Editor
- Highlight editor area with overlay
- Explain mobile-optimized keyboard
- Show syntax highlighting
- Tip: "Swipe to access code suggestions"

### Step 2: Run Button
- Pulse animation on run button
- Explain sandbox execution
- Show loading state preview
- Tip: "Code runs in a secure environment"

### Step 3: Agent Panel
- Highlight agent interface
- Show example question
- Explain AI capabilities
- Tip: "Ask for help, refactoring, or explanations"

### Step 4: Output Panel
- Highlight output area
- Show console logs and results
- Explain error handling
- Tip: "All outputs appear here in real-time"

### Step 5: Celebrate Success
- Confetti animation on first execution
- Achievement unlocked: "First Execution"
- Encourage next steps
- CTA: "Continue Coding" | "View More Examples"

## Contextual Tips (First 3 Sessions)

### Session 1 Tips
- "Tap the agent icon to ask questions"
- "Long-press on code for quick actions"
- "Swipe down to save your session"

### Session 2 Tips
- "Try asking the agent to refactor your code"
- "Access session history from the menu"
- "Code auto-saves every few seconds"

### Session 3 Tips
- "You have X sessions remaining this month"
- "Export your code to share with others"
- "Check out advanced features in settings"

## Acceptance Criteria

- [x] Welcome screens showcase key value props
- [x] Users can skip onboarding at any point
- [x] Feature tour interactive and under 60 seconds
- [x] First session pre-filled with working example
- [x] Walkthrough highlights all core UI elements
- [x] First execution triggers celebration animation
- [x] Contextual tips appear during first 3 sessions
- [x] Tips dismissible and don't interrupt workflow
- [x] Onboarding state persists across sessions
- [x] Returning users bypass onboarding automatically
- [x] Help center accessible from onboarding

## Testing Strategy

### User Flow Tests
- Complete onboarding start to finish
- Skip at each step works properly
- First session template loads and executes
- Walkthrough tooltips position correctly
- Celebration triggers on first success

### Edge Cases
- User closes app mid-onboarding (resume)
- Skip and manually trigger onboarding later
- Multiple devices (onboarding state synced)
- Screen size variations (layout adapts)

### UX Testing
- Time to first execution <2 minutes
- Onboarding completion rate >70%
- User comprehension of core features
- No confusion about next steps

### A/B Testing
- Welcome screen copy variations
- Walkthrough step order
- First session template complexity
- Tip frequency and timing

## Risk Mitigation

**Onboarding Too Long**
→ Keep under 60s total, allow skip, progressive disclosure

**Overwhelming Information**
→ One concept per screen, visuals > text, interactive > passive

**Users Skip Onboarding**
→ Make skippable, offer to retake, contextual tips compensate

**First Session Failure**
→ Tested template, fallback examples, clear error handling

## Success Metrics

- 70%+ onboarding completion rate
- 90%+ first session success rate
- <2 minutes time to first execution
- 80%+ users reach first agent interaction
- <10% users request onboarding retake
- 60%+ positive feedback on onboarding

## Notes

- Keep total onboarding under 60 seconds
- A/B test onboarding variations for optimization
- Collect analytics on drop-off points
- Offer onboarding retake in settings
- Consider video walkthrough alternative
- Localization ready (multi-language support)
- Accessibility: Screen reader compatible, reduced motion option
