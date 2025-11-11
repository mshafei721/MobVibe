/**
 * Session Service
 * High-level orchestration for coding sessions
 */

import { apiClient } from './apiClient';
import { eventStream } from './eventStream';
import {
  Session,
  CreateSessionResponse,
  SessionEventType,
} from './types';

type EventCallback<T = any> = (data: T) => void;
type UnsubscribeFn = () => void;

class SessionService {
  private activeSessionId: string | null = null;

  /**
   * Create a new coding session and start listening to events
   */
  async createSession(
    projectId: string,
    prompt: string
  ): Promise<CreateSessionResponse> {
    console.log('[SessionService] Creating session', { projectId, prompt });

    const response = await apiClient.createSession(projectId, prompt);

    // Start listening to events for this session
    this.activeSessionId = response.session.id;
    eventStream.subscribeToSession(response.session.id);

    console.log('[SessionService] Session created and event stream started', {
      sessionId: response.session.id,
      jobId: response.job_id,
    });

    return response;
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<Session> {
    return apiClient.getSession(sessionId);
  }

  /**
   * Get session history for a project
   */
  async getSessionHistory(projectId: string): Promise<Session[]> {
    return apiClient.listSessions(projectId);
  }

  /**
   * Get all user sessions
   */
  async getAllSessions(): Promise<Session[]> {
    return apiClient.listSessions();
  }

  /**
   * Pause a running session
   */
  async pauseSession(sessionId: string): Promise<Session> {
    console.log('[SessionService] Pausing session', { sessionId });
    const session = await apiClient.pauseSession(sessionId);

    // Keep listening to events even when paused
    // (backend might still send final events)

    return session;
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<Session> {
    console.log('[SessionService] Resuming session', { sessionId });
    const session = await apiClient.resumeSession(sessionId);

    // Resume event listening
    this.activeSessionId = sessionId;
    eventStream.subscribeToSession(sessionId);

    return session;
  }

  /**
   * Stop a session completely
   */
  async stopSession(sessionId: string): Promise<Session> {
    console.log('[SessionService] Stopping session', { sessionId });
    const session = await apiClient.stopSession(sessionId);

    // Stop listening to events
    if (this.activeSessionId === sessionId) {
      this.cleanup();
    }

    return session;
  }

  /**
   * Reconnect to an existing session
   * Useful for app restarts or navigation
   */
  reconnectToSession(sessionId: string): void {
    console.log('[SessionService] Reconnecting to session', { sessionId });

    this.activeSessionId = sessionId;
    eventStream.subscribeToSession(sessionId);
  }

  /**
   * Disconnect from current session without stopping it
   */
  disconnect(): void {
    console.log('[SessionService] Disconnecting from session', {
      sessionId: this.activeSessionId,
    });

    this.cleanup();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    eventStream.unsubscribe();
    eventStream.removeAllListeners();
    this.activeSessionId = null;
  }

  // ============================================================================
  // Event Listeners (Convenience methods)
  // ============================================================================

  /**
   * Listen to all events
   */
  onAnyEvent(callback: EventCallback): UnsubscribeFn {
    return eventStream.onAnyEvent(callback);
  }

  /**
   * Listen to thinking events
   */
  onThinking(callback: EventCallback): UnsubscribeFn {
    return eventStream.onThinking(callback);
  }

  /**
   * Listen to terminal output events
   */
  onTerminalOutput(callback: EventCallback): UnsubscribeFn {
    return eventStream.onTerminalOutput(callback);
  }

  /**
   * Listen to file change events
   */
  onFileChange(callback: EventCallback): UnsubscribeFn {
    return eventStream.onFileChange(callback);
  }

  /**
   * Listen to preview ready events
   */
  onPreviewReady(callback: EventCallback): UnsubscribeFn {
    return eventStream.onPreviewReady(callback);
  }

  /**
   * Listen to completion events
   */
  onCompletion(callback: EventCallback): UnsubscribeFn {
    return eventStream.onCompletion(callback);
  }

  /**
   * Listen to error events
   */
  onError(callback: EventCallback): UnsubscribeFn {
    return eventStream.onError(callback);
  }

  /**
   * Get current active session ID
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  /**
   * Check if currently connected to a session
   */
  isConnected(): boolean {
    return eventStream.isSubscribed();
  }
}

// Export singleton instance
export const sessionService = new SessionService();

// Export class for testing
export { SessionService };
