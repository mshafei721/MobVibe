/**
 * API Services
 * Centralized exports for all API-related services
 */

// Main services
export { apiClient } from './apiClient';
export { eventStream } from './eventStream';
export { sessionService } from './sessionService';

// Error classes
export {
  APIError,
  NetworkError,
  TimeoutError,
  withRetry,
  parseAPIError,
  createNetworkError,
} from './errorHandler';

// Types
export type {
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
  SessionEvent,
  SessionEventType,
  ThinkingEventData,
  TerminalEventData,
  FileChangeEventData,
  PreviewReadyEventData,
  CompletionEventData,
  ErrorEventData,
  UsageStats,
  APIErrorResponse,
} from './types';
