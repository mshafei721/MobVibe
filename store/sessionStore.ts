import { create } from 'zustand';

interface CodingSession {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  created_at: string;
}

interface SessionEvent {
  type: 'thinking' | 'terminal' | 'file_change' | 'preview_ready' | 'completion' | 'error';
  message?: string;
  data?: any;
}

interface SessionState {
  currentSession: CodingSession | null;
  events: SessionEvent[];
  isConnected: boolean;

  setCurrentSession: (session: CodingSession | null) => void;
  addEvent: (event: SessionEvent) => void;
  clearEvents: () => void;
  setConnected: (isConnected: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  events: [],
  isConnected: false,

  setCurrentSession: (currentSession) => set({ currentSession }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  clearEvents: () => set({ events: [] }),
  setConnected: (isConnected) => set({ isConnected }),
}));
