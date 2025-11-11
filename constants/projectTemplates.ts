export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  initialPrompt: string | null;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a minimal setup',
    icon: '📄',
    initialPrompt: null,
  },
  {
    id: 'todo',
    name: 'Todo App',
    description: 'Task management with lists and checkboxes',
    icon: '✅',
    initialPrompt: 'Create a todo app with add, complete, and delete functionality',
  },
  {
    id: 'weather',
    name: 'Weather App',
    description: 'Weather forecast with location',
    icon: '🌤️',
    initialPrompt: 'Build a weather app that shows current conditions and 5-day forecast',
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    description: 'Track workouts and progress',
    icon: '💪',
    initialPrompt: 'Create a fitness tracker to log exercises and view progress charts',
  },
  {
    id: 'notes',
    name: 'Notes App',
    description: 'Simple note-taking with markdown',
    icon: '📝',
    initialPrompt: 'Build a notes app with markdown support and categories',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Basic calculator with history',
    icon: '🔢',
    initialPrompt: 'Create a calculator app with basic operations and calculation history',
  },
];
