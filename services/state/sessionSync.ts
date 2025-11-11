/**
 * Session Sync Service
 * Periodically syncs session state with backend to prevent drift
 * Ensures local state remains consistent with server state
 */

import { useSessionStore } from '../../store/sessionStore';
import { sessionService } from '../api';
import type { Session } from '../api/types';

export interface SessionSyncOptions {
  /**
   * Sync interval in milliseconds
   * @default 30000 (30 seconds)
   */
  intervalMs?: number;

  /**
   * Auto-start sync on initialization
   * @default false
   */
  autoStart?: boolean;

  /**
   * Callback when sync completes
   */
  onSyncComplete?: (session: Session) => void;

  /**
   * Callback when sync fails
   */
  onSyncError?: (error: Error) => void;

  /**
   * Callback when session status changes
   */
  onStatusChange?: (oldStatus: Session['status'], newStatus: Session['status']) => void;
}

export class SessionSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;
  private options: Required<Omit<SessionSyncOptions, 'autoStart'>>;
  private isSyncing = false;

  constructor(options: SessionSyncOptions = {}) {
    this.options = {
      intervalMs: options.intervalMs ?? 30000,
      onSyncComplete: options.onSyncComplete ?? (() => {}),
      onSyncError: options.onSyncError ?? (() => {}),
      onStatusChange: options.onStatusChange ?? (() => {})
    };

    if (options.autoStart) {
      const currentSession = useSessionStore.getState().currentSession;
      if (currentSession) {
        this.startSync(currentSession.id);
      }
    }
  }

  /**
   * Start periodic syncing for a session
   */
  startSync(sessionId: string, intervalMs?: number): void {
    // Stop any existing sync
    this.stopSync();

    this.currentSessionId = sessionId;
    const interval = intervalMs ?? this.options.intervalMs;

    console.log('[SessionSync] Starting sync', {
      sessionId,
      intervalMs: interval
    });

    // Perform initial sync immediately
    this.performSync();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, interval);
  }

  /**
   * Stop periodic syncing
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;

      console.log('[SessionSync] Stopped sync', {
        sessionId: this.currentSessionId
      });
    }

    this.currentSessionId = null;
  }

  /**
   * Perform a one-time sync
   */
  async performSync(): Promise<void> {
    if (!this.currentSessionId) {
      console.warn('[SessionSync] No session to sync');
      return;
    }

    if (this.isSyncing) {
      console.log('[SessionSync] Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('[SessionSync] Syncing session', {
        sessionId: this.currentSessionId
      });

      // Fetch latest session state from backend
      const session = await sessionService.getSession(this.currentSessionId);

      // Get current state from store
      const currentSession = useSessionStore.getState().currentSession;

      if (!currentSession) {
        console.warn('[SessionSync] No current session in store');
        return;
      }

      // Check for status changes
      if (session.status !== currentSession.status) {
        console.log('[SessionSync] Session status changed', {
          sessionId: session.id,
          oldStatus: currentSession.status,
          newStatus: session.status
        });

        this.options.onStatusChange(currentSession.status, session.status);

        // Update store with new status
        useSessionStore.setState({
          currentSession: {
            ...currentSession,
            ...session
          }
        });

        // Handle specific status changes
        this.handleStatusChange(session);
      }

      // Update other fields that may have changed
      if (
        session.webview_url !== currentSession.webview_url ||
        session.eas_update_url !== currentSession.eas_update_url
      ) {
        console.log('[SessionSync] Session URLs updated', {
          sessionId: session.id,
          hasWebview: !!session.webview_url,
          hasEasUpdate: !!session.eas_update_url
        });

        useSessionStore.setState({
          currentSession: {
            ...currentSession,
            webview_url: session.webview_url,
            eas_update_url: session.eas_update_url
          }
        });
      }

      this.options.onSyncComplete(session);
    } catch (error) {
      console.error('[SessionSync] Sync failed:', error);
      this.options.onSyncError(error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Handle session status changes
   */
  private handleStatusChange(session: Session): void {
    const { setThinking } = useSessionStore.getState();

    switch (session.status) {
      case 'active':
        // Session is actively running
        setThinking(true);
        break;

      case 'paused':
        // Session is paused
        setThinking(false);
        break;

      case 'completed':
        // Session completed successfully
        setThinking(false);
        console.log('[SessionSync] Session completed', {
          sessionId: session.id
        });

        // Stop syncing completed sessions
        if (this.currentSessionId === session.id) {
          this.stopSync();
        }
        break;

      case 'failed':
        // Session failed
        setThinking(false);
        useSessionStore.setState({
          error: session.error_message || 'Session failed'
        });

        console.error('[SessionSync] Session failed', {
          sessionId: session.id,
          error: session.error_message
        });

        // Stop syncing failed sessions
        if (this.currentSessionId === session.id) {
          this.stopSync();
        }
        break;

      case 'expired':
        // Session expired
        setThinking(false);
        useSessionStore.setState({
          error: 'Session expired'
        });

        console.warn('[SessionSync] Session expired', {
          sessionId: session.id
        });

        // Stop syncing expired sessions
        if (this.currentSessionId === session.id) {
          this.stopSync();
        }
        break;

      case 'pending':
        // Session is pending (not yet started)
        break;
    }
  }

  /**
   * Check if currently syncing
   */
  isSyncActive(): boolean {
    return this.syncInterval !== null;
  }

  /**
   * Get current sync session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Update sync interval
   */
  setInterval(intervalMs: number): void {
    this.options.intervalMs = intervalMs;

    // Restart sync with new interval if active
    if (this.currentSessionId && this.syncInterval) {
      this.startSync(this.currentSessionId, intervalMs);
    }
  }

  /**
   * Force an immediate sync
   */
  async forceSync(): Promise<void> {
    await this.performSync();
  }
}

// Export singleton instance for global use
export const sessionSync = new SessionSync({
  intervalMs: 30000, // Sync every 30 seconds
  onStatusChange: (oldStatus, newStatus) => {
    console.log('[SessionSync] Global: Status changed', {
      from: oldStatus,
      to: newStatus
    });
  },
  onSyncError: (error) => {
    console.error('[SessionSync] Global: Sync error', {
      error: error.message
    });
  }
});
