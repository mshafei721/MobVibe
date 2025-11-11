/**
 * API Client Tests
 * Test suite for API client functionality
 */

import { APIClient } from '../apiClient';
import { APIError, NetworkError, TimeoutError } from '../errorHandler';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase
jest.mock('../../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from '../../supabase';

describe('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should include auth token in requests', async () => {
      // Mock auth token
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
          },
        },
      });

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await client.healthCheck();

      // Check that fetch was called with auth header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should work without auth token', async () => {
      // Mock no session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await client.healthCheck();

      // Check that fetch was called without auth header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
    });

    it('should handle 401 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await expect(client.healthCheck()).rejects.toThrow(APIError);
      await expect(client.healthCheck()).rejects.toThrow('Unauthorized');
    });

    it('should handle 404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await expect(client.healthCheck()).rejects.toThrow(APIError);
    });

    it('should handle 429 rate limit errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await expect(client.healthCheck()).rejects.toThrow(APIError);
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
        headers: new Map([['content-type', 'application/json']]),
      });

      await expect(client.healthCheck()).rejects.toThrow(APIError);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Network error'));

      await expect(client.healthCheck()).rejects.toThrow(NetworkError);
    });
  });

  describe('Session Endpoints', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
    });

    it('should create a session', async () => {
      const mockResponse = {
        session: {
          id: 'session-123',
          status: 'pending',
        },
        job_id: 'job-123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.createSession('project-123', 'Test prompt');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            projectId: 'project-123',
            prompt: 'Test prompt',
          }),
        })
      );
    });

    it('should get a session', async () => {
      const mockSession = {
        id: 'session-123',
        status: 'active',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSession,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.getSession('session-123');

      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-123'),
        expect.any(Object)
      );
    });

    it('should list sessions', async () => {
      const mockSessions = [
        { id: 'session-1', status: 'active' },
        { id: 'session-2', status: 'completed' },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessions,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.listSessions();

      expect(result).toEqual(mockSessions);
    });

    it('should list sessions for a project', async () => {
      const mockSessions = [{ id: 'session-1', status: 'active' }];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSessions,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.listSessions('project-123');

      expect(result).toEqual(mockSessions);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?projectId=project-123'),
        expect.any(Object)
      );
    });

    it('should pause a session', async () => {
      const mockSession = { id: 'session-123', status: 'paused' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSession,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.pauseSession('session-123');

      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-123/pause'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should resume a session', async () => {
      const mockSession = { id: 'session-123', status: 'active' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSession,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.resumeSession('session-123');

      expect(result).toEqual(mockSession);
    });

    it('should stop a session', async () => {
      const mockSession = { id: 'session-123', status: 'completed' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSession,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.stopSession('session-123');

      expect(result).toEqual(mockSession);
    });
  });

  describe('Usage Endpoint', () => {
    beforeEach(() => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });
    });

    it('should get usage stats', async () => {
      const mockUsage = {
        user_id: 'user-123',
        tier: 'free',
        sessions_used: 5,
        sessions_limit: 10,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUsage,
        headers: new Map([['content-type', 'application/json']]),
      });

      const result = await client.getUsage();

      expect(result).toEqual(mockUsage);
    });
  });
});
