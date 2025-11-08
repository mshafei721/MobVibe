/**
 * Onboarding Content Catalog
 *
 * Centralized onboarding screens, walkthroughs, tips, and templates.
 * Provides structured content for guiding new users through first experience.
 *
 * Usage:
 * - Mobile: Display onboarding screens and walkthroughs
 * - Backend: Track progress and determine what to show
 *
 * Design Principles:
 * - Keep total onboarding under 60 seconds
 * - One concept per screen
 * - Always offer skip option
 * - Celebrate early wins
 * - Progressive disclosure
 */

/**
 * Onboarding step types
 */
export type OnboardingStepType =
  | 'welcome'
  | 'features'
  | 'tiers'
  | 'first_session'
  | 'walkthrough'
  | 'tip'

/**
 * Onboarding status
 */
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

/**
 * Milestone types
 */
export type MilestoneType =
  | 'first_session'
  | 'first_execution'
  | 'first_agent_interaction'
  | 'first_session_completed'
  | 'three_sessions'
  | 'first_week'

/**
 * Onboarding screen configuration
 */
export interface OnboardingScreen {
  id: string
  type: OnboardingStepType
  title: string
  description: string
  body?: string | string[]
  illustration: string
  ctaPrimary: {
    label: string
    action: string
  }
  ctaSecondary?: {
    label: string
    action: string
  }
  duration?: number // Estimated seconds on screen
}

/**
 * Walkthrough step configuration
 */
export interface WalkthroughStep {
  id: string
  target: string // Element to highlight
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action: 'highlight' | 'pulse' | 'arrow' | 'none'
  dismissable: boolean
  order: number
}

/**
 * Contextual tip configuration
 */
export interface ContextualTip {
  id: string
  sessionNumber: number // Show on session 1, 2, or 3
  trigger: 'on_load' | 'after_delay' | 'on_event'
  delay?: number // Milliseconds
  event?: string // Event to wait for
  content: string
  icon?: string
  placement: 'top' | 'bottom' | 'toast'
  dismissable: boolean
  priority: number // Higher = more important
}

/**
 * Code template configuration
 */
export interface CodeTemplate {
  id: string
  name: string
  description: string
  language: string
  code: string
  expectedOutput?: string
  agentPrompt?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

/**
 * Milestone configuration
 */
export interface Milestone {
  id: MilestoneType
  title: string
  description: string
  icon: string
  celebrationMessage: string
  rewardType?: 'achievement' | 'tip' | 'feature_unlock'
  rewardData?: any
}

/**
 * Welcome Screens (4 total)
 */
export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    id: 'welcome',
    type: 'welcome',
    title: 'Code Anywhere, Anytime',
    description: 'MobVibe brings professional development to your mobile device with AI-powered assistance.',
    body: 'Build real mobile apps, learn to code, or prototype ideas—all from your phone with Claude AI by your side.',
    illustration: 'welcome-hero',
    ctaPrimary: {
      label: 'Get Started',
      action: 'next',
    },
    ctaSecondary: {
      label: 'Skip',
      action: 'skip',
    },
    duration: 10,
  },
  {
    id: 'features',
    type: 'features',
    title: 'Everything You Need',
    description: 'Professional tools, AI assistance, and instant execution—all optimized for mobile.',
    body: [
      '🚀 Real code execution in secure sandboxes',
      '🤖 Claude AI pair programming',
      '💾 Session persistence and history',
      '📱 Mobile-optimized editor with smart keyboard',
    ],
    illustration: 'features-showcase',
    ctaPrimary: {
      label: 'Continue',
      action: 'next',
    },
    ctaSecondary: {
      label: 'Skip',
      action: 'skip',
    },
    duration: 15,
  },
  {
    id: 'tiers',
    type: 'tiers',
    title: 'Start Free or Go Pro',
    description: 'Choose the plan that fits your coding needs.',
    body: [
      '**Free Tier**',
      '• 3 sessions per month',
      '• All core features',
      '• Perfect for learning',
      '',
      '**Pro Tier - $9.99/month**',
      '• 50 sessions per month',
      '• Priority execution',
      '• Advanced features',
    ],
    illustration: 'pricing-comparison',
    ctaPrimary: {
      label: 'Start Free',
      action: 'continue',
    },
    ctaSecondary: {
      label: 'View Pro Features',
      action: 'view_pricing',
    },
    duration: 15,
  },
  {
    id: 'first_session',
    type: 'first_session',
    title: "Let's Write Some Code",
    description: "We'll guide you through creating and running your first session.",
    body: "You'll start with a simple example and can ask the AI for help anytime. Ready?",
    illustration: 'coding-start',
    ctaPrimary: {
      label: 'Start Coding',
      action: 'create_first_session',
    },
    ctaSecondary: {
      label: "I'll explore on my own",
      action: 'skip_walkthrough',
    },
    duration: 10,
  },
]

/**
 * Interactive Walkthrough Steps (5 steps)
 */
export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'editor',
    target: 'code-editor',
    title: 'Your Mobile Editor',
    content: 'Write JavaScript code right on your phone. Syntax highlighting and smart keyboard make it easy.',
    placement: 'bottom',
    action: 'highlight',
    dismissable: false,
    order: 1,
  },
  {
    id: 'run',
    target: 'run-button',
    title: 'Run Your Code',
    content: 'Tap here to execute code in a secure sandbox. Your code runs in seconds.',
    placement: 'top',
    action: 'pulse',
    dismissable: false,
    order: 2,
  },
  {
    id: 'agent',
    target: 'agent-panel',
    title: 'AI Assistant',
    content: 'Get help, suggestions, and code improvements from Claude. Just ask a question!',
    placement: 'left',
    action: 'highlight',
    dismissable: false,
    order: 3,
  },
  {
    id: 'output',
    target: 'output-panel',
    title: 'See Results',
    content: 'View execution output, console logs, and errors here. Everything happens in real-time.',
    placement: 'top',
    action: 'highlight',
    dismissable: false,
    order: 4,
  },
  {
    id: 'celebrate',
    target: 'none',
    title: '🎉 Great Job!',
    content: "You've completed your first session! Keep coding and ask the AI for help anytime.",
    placement: 'center',
    action: 'none',
    dismissable: true,
    order: 5,
  },
]

/**
 * Contextual Tips (9 tips for first 3 sessions)
 */
export const CONTEXTUAL_TIPS: ContextualTip[] = [
  // Session 1 Tips
  {
    id: 'session_1_agent',
    sessionNumber: 1,
    trigger: 'after_delay',
    delay: 10000, // 10 seconds
    content: '💡 Tap the agent icon to ask questions or get code suggestions.',
    icon: 'lightbulb',
    placement: 'toast',
    dismissable: true,
    priority: 1,
  },
  {
    id: 'session_1_long_press',
    sessionNumber: 1,
    trigger: 'after_delay',
    delay: 30000, // 30 seconds
    content: '💡 Long-press on code to access quick actions like copy, format, or ask AI.',
    icon: 'gesture',
    placement: 'toast',
    dismissable: true,
    priority: 2,
  },
  {
    id: 'session_1_save',
    sessionNumber: 1,
    trigger: 'on_event',
    event: 'code_changed',
    content: '💡 Your code auto-saves every few seconds. No need to worry about losing work!',
    icon: 'save',
    placement: 'toast',
    dismissable: true,
    priority: 3,
  },

  // Session 2 Tips
  {
    id: 'session_2_refactor',
    sessionNumber: 2,
    trigger: 'after_delay',
    delay: 15000, // 15 seconds
    content: '💡 Try asking the AI to refactor your code for better readability or performance.',
    icon: 'code',
    placement: 'toast',
    dismissable: true,
    priority: 1,
  },
  {
    id: 'session_2_history',
    sessionNumber: 2,
    trigger: 'on_load',
    content: '💡 Access your session history from the menu to revisit previous work.',
    icon: 'history',
    placement: 'toast',
    dismissable: true,
    priority: 2,
  },
  {
    id: 'session_2_auto_save',
    sessionNumber: 2,
    trigger: 'after_delay',
    delay: 25000, // 25 seconds
    content: '💡 Sessions automatically save progress. Resume anytime from where you left off!',
    icon: 'cloud',
    placement: 'toast',
    dismissable: true,
    priority: 3,
  },

  // Session 3 Tips
  {
    id: 'session_3_quota',
    sessionNumber: 3,
    trigger: 'on_load',
    content: '💡 Check your remaining sessions for the month in Settings → Usage.',
    icon: 'chart',
    placement: 'toast',
    dismissable: true,
    priority: 1,
  },
  {
    id: 'session_3_export',
    sessionNumber: 3,
    trigger: 'after_delay',
    delay: 20000, // 20 seconds
    content: '💡 Export your code to share with others or continue on another device.',
    icon: 'share',
    placement: 'toast',
    dismissable: true,
    priority: 2,
  },
  {
    id: 'session_3_advanced',
    sessionNumber: 3,
    trigger: 'after_delay',
    delay: 40000, // 40 seconds
    content: '💡 Explore advanced features like custom templates and project management in Settings.',
    icon: 'settings',
    placement: 'toast',
    dismissable: true,
    priority: 3,
  },
]

/**
 * Code Templates (3 difficulty levels)
 */
export const CODE_TEMPLATES: Record<string, CodeTemplate> = {
  HELLO_WORLD: {
    id: 'hello_world',
    name: 'Hello World',
    description: 'Your first program—a friendly greeting!',
    language: 'javascript',
    code: `// Welcome to MobVibe! 👋
// Let's start with a simple example

function greet(name) {
  return \`Hello, \${name}! Welcome to mobile coding.\`;
}

console.log(greet('Developer'));

// Try modifying this code or ask the AI for suggestions!`,
    expectedOutput: 'Hello, Developer! Welcome to mobile coding.',
    agentPrompt: "I'm new to MobVibe. Can you explain what this code does?",
    difficulty: 'beginner',
  },

  COUNTER: {
    id: 'counter',
    name: 'Simple Counter',
    description: 'Learn about variables and functions with a counter.',
    language: 'javascript',
    code: `// A simple counter example

let count = 0;

function increment() {
  count++;
  console.log(\`Count is now: \${count}\`);
}

function reset() {
  count = 0;
  console.log('Counter reset!');
}

// Try it out
increment(); // 1
increment(); // 2
increment(); // 3
reset();     // 0`,
    expectedOutput: 'Count is now: 1\nCount is now: 2\nCount is now: 3\nCounter reset!',
    agentPrompt: 'Can you help me add a decrement function?',
    difficulty: 'beginner',
  },

  TODO_LIST: {
    id: 'todo_list',
    name: 'Todo List',
    description: 'Build a simple todo list with arrays and objects.',
    language: 'javascript',
    code: `// Todo list example

const todos = [];

function addTodo(task) {
  todos.push({ task, completed: false });
  console.log(\`Added: \${task}\`);
}

function completeTodo(index) {
  if (todos[index]) {
    todos[index].completed = true;
    console.log(\`Completed: \${todos[index].task}\`);
  }
}

function listTodos() {
  console.log('Your todos:');
  todos.forEach((todo, i) => {
    const status = todo.completed ? '✓' : ' ';
    console.log(\`[\${status}] \${i + 1}. \${todo.task}\`);
  });
}

// Try it
addTodo('Learn MobVibe');
addTodo('Build an app');
completeTodo(0);
listTodos();`,
    expectedOutput: 'Added: Learn MobVibe\nAdded: Build an app\nCompleted: Learn MobVibe\nYour todos:\n[✓] 1. Learn MobVibe\n[ ] 2. Build an app',
    agentPrompt: 'Can you help me add a delete todo function?',
    difficulty: 'intermediate',
  },

  API_FETCH: {
    id: 'api_fetch',
    name: 'API Fetch Example',
    description: 'Learn async/await by fetching data from an API.',
    language: 'javascript',
    code: `// Fetch data from an API

async function getUser(userId) {
  try {
    const response = await fetch(
      \`https://jsonplaceholder.typicode.com/users/\${userId}\`
    );
    const user = await response.json();

    console.log(\`Name: \${user.name}\`);
    console.log(\`Email: \${user.email}\`);
    console.log(\`City: \${user.address.city}\`);
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

// Try it
getUser(1);`,
    expectedOutput: 'Name: Leanne Graham\nEmail: Sincere@april.biz\nCity: Gwenborough',
    agentPrompt: 'Can you explain how async/await works?',
    difficulty: 'intermediate',
  },

  REACT_COMPONENT: {
    id: 'react_component',
    name: 'React Component',
    description: 'Build a simple React component with state.',
    language: 'javascript',
    code: `// Simple React component example
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );
}

// Note: This requires React Native environment
console.log('React component defined!');`,
    expectedOutput: 'React component defined!',
    agentPrompt: 'Can you help me add a decrement button?',
    difficulty: 'advanced',
  },
}

/**
 * Milestones
 */
export const MILESTONES: Record<MilestoneType, Milestone> = {
  first_session: {
    id: 'first_session',
    title: 'First Session',
    description: 'Created your first coding session',
    icon: 'rocket',
    celebrationMessage: '🎉 Welcome to MobVibe! Your coding journey begins.',
    rewardType: 'achievement',
  },
  first_execution: {
    id: 'first_execution',
    title: 'First Execution',
    description: 'Ran your first code successfully',
    icon: 'play',
    celebrationMessage: '🚀 Code executed! You\'re officially a mobile developer.',
    rewardType: 'achievement',
  },
  first_agent_interaction: {
    id: 'first_agent_interaction',
    title: 'AI Collaboration',
    description: 'Asked Claude for help',
    icon: 'message',
    celebrationMessage: '🤖 Great question! AI pair programming unlocked.',
    rewardType: 'feature_unlock',
    rewardData: { feature: 'advanced_agent_features' },
  },
  first_session_completed: {
    id: 'first_session_completed',
    title: 'Session Complete',
    description: 'Finished your first session',
    icon: 'check-circle',
    celebrationMessage: '✅ Session completed! Your progress is saved.',
    rewardType: 'achievement',
  },
  three_sessions: {
    id: 'three_sessions',
    title: 'Coding Streak',
    description: 'Completed 3 sessions',
    icon: 'fire',
    celebrationMessage: '🔥 3 sessions down! You\'re on a roll.',
    rewardType: 'tip',
    rewardData: { tip: 'Consider upgrading to Pro for 50 sessions/month!' },
  },
  first_week: {
    id: 'first_week',
    title: 'Week Warrior',
    description: 'Coded for a full week',
    icon: 'calendar',
    celebrationMessage: '📅 One week of coding! Keep up the momentum.',
    rewardType: 'achievement',
  },
}

/**
 * Helper function to get onboarding screen by ID
 */
export function getOnboardingScreen(id: string): OnboardingScreen | undefined {
  return ONBOARDING_SCREENS.find((screen) => screen.id === id)
}

/**
 * Helper function to get walkthrough step by ID
 */
export function getWalkthroughStep(id: string): WalkthroughStep | undefined {
  return WALKTHROUGH_STEPS.find((step) => step.id === id)
}

/**
 * Helper function to get tips for session number
 */
export function getTipsForSession(sessionNumber: number): ContextualTip[] {
  return CONTEXTUAL_TIPS.filter((tip) => tip.sessionNumber === sessionNumber).sort(
    (a, b) => a.priority - b.priority
  )
}

/**
 * Helper function to get code template by ID
 */
export function getCodeTemplate(id: string): CodeTemplate | undefined {
  return CODE_TEMPLATES[id.toUpperCase() as keyof typeof CODE_TEMPLATES]
}

/**
 * Helper function to get milestone by ID
 */
export function getMilestone(id: MilestoneType): Milestone | undefined {
  return MILESTONES[id]
}

/**
 * Helper function to get first session template (default)
 */
export function getFirstSessionTemplate(): CodeTemplate {
  return CODE_TEMPLATES.HELLO_WORLD
}

/**
 * Calculate total onboarding duration
 */
export function getTotalOnboardingDuration(): number {
  return ONBOARDING_SCREENS.reduce((total, screen) => total + (screen.duration || 0), 0)
}

/**
 * Get onboarding progress percentage
 */
export function calculateProgressPercentage(currentStep: number, totalSteps: number): number {
  if (totalSteps === 0) return 0
  return Math.round((currentStep / totalSteps) * 100)
}
