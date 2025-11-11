/**
 * API Types
 * Type definitions for MobVibe backend API
 */

// Session Types
export interface Session {
  id: string;
  user_id: string;
  project_id: string;
  sandbox_id: string | null;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'failed' | 'expired';
  initial_prompt: string;
  eas_update_url: string | null;
  webview_url: string | null;
  expires_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  projectId: string;
  prompt: string;
}

export interface CreateSessionResponse {
  session: Session;
  job_id: string;
}

// Session Event Types
export type SessionEventType =
  | 'thinking'
  | 'terminal'
  | 'file_change'
  | 'preview_ready'
  | 'completion'
  | 'error';

export interface SessionEvent {
  id: string;
  session_id: string;
  event_type: SessionEventType;
  data: any;
  created_at: string;
}

export interface ThinkingEventData {
  message: string;
  progress?: number;
}

export interface TerminalEventData {
  output: string;
  command?: string;
}

export interface FileChangeEventData {
  path: string;
  action: 'created' | 'updated' | 'deleted';
  content?: string;
}

export interface PreviewReadyEventData {
  url: string;
  preview_url?: string;
}

export interface CompletionEventData {
  message: string;
  summary?: string;
}

export interface ErrorEventData {
  message: string;
  code?: string;
  stack?: string;
}

// Usage Types
export interface UsageStats {
  user_id: string;
  tier: 'free' | 'starter' | 'pro';
  sessions_used: number;
  sessions_limit: number;
  api_calls_used: number;
  api_calls_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  reset_at: string;
}

// API Error Types
export interface APIErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}
