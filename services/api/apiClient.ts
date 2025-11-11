/**
 * API Client
 * HTTP client for MobVibe backend API with authentication
 */

import { supabase } from '../supabase';
import { APIError, NetworkError, parseAPIError, createNetworkError, withRetry } from './errorHandler';
import {
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
  UsageStats,
} from './types';

const API_TIMEOUT = 30000; // 30 seconds

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || '';

    if (!this.baseURL) {
      console.warn('[APIClient] EXPO_PUBLIC_API_URL not set');
    }
  }

  /**
   * Get authentication token from Supabase
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('[APIClient] Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make authenticated HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get auth token
    const token = await this.getAuthToken();

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const url = `${this.baseURL}${endpoint}`;

      console.log(`[APIClient] ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Parse response body
      let body: any;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      // Handle non-OK responses
      if (!response.ok) {
        throw parseAPIError(response, body);
      }

      console.log(`[APIClient] ${options.method || 'GET'} ${url} - Success`);

      return body as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network errors
      if (error instanceof TypeError || error.name === 'AbortError') {
        throw createNetworkError(error);
      }

      // Re-throw API errors
      if (error instanceof APIError) {
        throw error;
      }

      // Unknown error
      console.error('[APIClient] Request failed:', error);
      throw new APIError(500, 'An unexpected error occurred');
    }
  }

  /**
   * Make GET request
   */
  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * Make POST request
   */
  private async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make PUT request
   */
  private async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make DELETE request
   */
  private async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // Session Endpoints
  // ============================================================================

  /**
   * Create a new coding session
   */
  async createSession(
    projectId: string,
    prompt: string
  ): Promise<CreateSessionResponse> {
    return withRetry(
      () => this.post<CreateSessionResponse>('/api/sessions', {
        projectId,
        prompt,
      }),
      2 // Fewer retries for session creation (user action)
    );
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    return withRetry(
      () => this.get<Session>(`/api/sessions/${sessionId}`)
    );
  }

  /**
   * List sessions, optionally filtered by project
   */
  async listSessions(projectId?: string): Promise<Session[]> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return withRetry(
      () => this.get<Session[]>(`/api/sessions${query}`)
    );
  }

  /**
   * Pause a running session
   */
  async pauseSession(sessionId: string): Promise<Session> {
    return this.post<Session>(`/api/sessions/${sessionId}/pause`);
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<Session> {
    return this.post<Session>(`/api/sessions/${sessionId}/resume`);
  }

  /**
   * Stop a session
   */
  async stopSession(sessionId: string): Promise<Session> {
    return this.post<Session>(`/api/sessions/${sessionId}/stop`);
  }

  // ============================================================================
  // Usage Endpoints
  // ============================================================================

  /**
   * Get current user's usage statistics
   */
  async getUsage(): Promise<UsageStats> {
    return withRetry(
      () => this.get<UsageStats>('/api/usage')
    );
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for testing
export { APIClient };
