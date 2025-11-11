/**
 * Event Stream Service
 * Supabase Realtime integration for session events
 */

import { supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  SessionEvent,
  SessionEventType,
  ThinkingEventData,
  TerminalEventData,
  FileChangeEventData,
  PreviewReadyEventData,
  CompletionEventData,
  ErrorEventData,
} from './types';

type EventCallback<T = any> = (data: T) => void;

class EventStream {
  private subscription: RealtimeChannel | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private currentSessionId: string | null = null;

  /**
   * Subscribe to events for a specific session
   */
  subscribeToSession(sessionId: string): void {
    console.log(`[EventStream] Subscribing to session: ${sessionId}`);

    // Unsubscribe from previous session if any
    this.unsubscribe();

    this.currentSessionId = sessionId;

    // Create channel for this session
    this.subscription = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_events',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const event = payload.new as SessionEvent;
          this.handleEvent(event);
        }
      )
      .subscribe((status) => {
        console.log(`[EventStream] Subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log(`[EventStream] Successfully subscribed to session: ${sessionId}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[EventStream] Subscription failed with status: ${status}`);
        }
      });
  }

  /**
   * Unsubscribe from current session
   */
  unsubscribe(): void {
    if (this.subscription) {
      console.log(`[EventStream] Unsubscribing from session: ${this.currentSessionId}`);
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.currentSessionId = null;
    }
  }

  /**
   * Handle incoming event
   */
  private handleEvent(event: SessionEvent): void {
    console.log(`[EventStream] Received event: ${event.event_type}`, event);

    // Emit to specific event type listeners
    this.emit(event.event_type, event.data);

    // Emit to wildcard listeners
    this.emit('*', event);
  }

  /**
   * Add event listener
   */
  private on(eventType: string, callback: EventCallback): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  /**
   * Remove event listener
   */
  private off(eventType: string, callback: EventCallback): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventStream] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // ============================================================================
  // Typed Event Listeners
  // ============================================================================

  /**
   * Listen to all events
   */
  onAnyEvent(callback: EventCallback<SessionEvent>): () => void {
    this.on('*', callback);
    return () => this.off('*', callback);
  }

  /**
   * Listen to thinking events
   */
  onThinking(callback: EventCallback<ThinkingEventData>): () => void {
    this.on('thinking', callback);
    return () => this.off('thinking', callback);
  }

  /**
   * Listen to terminal output events
   */
  onTerminalOutput(callback: EventCallback<TerminalEventData>): () => void {
    this.on('terminal', callback);
    return () => this.off('terminal', callback);
  }

  /**
   * Listen to file change events
   */
  onFileChange(callback: EventCallback<FileChangeEventData>): () => void {
    this.on('file_change', callback);
    return () => this.off('file_change', callback);
  }

  /**
   * Listen to preview ready events
   */
  onPreviewReady(callback: EventCallback<PreviewReadyEventData>): () => void {
    this.on('preview_ready', callback);
    return () => this.off('preview_ready', callback);
  }

  /**
   * Listen to completion events
   */
  onCompletion(callback: EventCallback<CompletionEventData>): () => void {
    this.on('completion', callback);
    return () => this.off('completion', callback);
  }

  /**
   * Listen to error events
   */
  onError(callback: EventCallback<ErrorEventData>): () => void {
    this.on('error', callback);
    return () => this.off('error', callback);
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Check if currently subscribed
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }
}

// Export singleton instance
export const eventStream = new EventStream();

// Export class for testing
export { EventStream };
