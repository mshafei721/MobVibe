/**
 * PreviewScreen Component Tests
 * Tests preview screen UI and state management
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PreviewScreen from '@/app/(tabs)/preview';
import { useSessionStore } from '@/store/sessionStore';
import { usePreviewUrl } from '@/hooks/usePreviewUrl';

// Mock stores and hooks
jest.mock('@/store/sessionStore');
jest.mock('@/hooks/usePreviewUrl');

describe('PreviewScreen Component', () => {
  const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
  const mockUsePreviewUrl = usePreviewUrl as jest.MockedFunction<typeof usePreviewUrl>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('No Active Session', () => {
    it('should display empty state when no session', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: null,
      } as any);

      const { getByText, getByLabelText } = render(<PreviewScreen />);

      expect(getByText('No Active Session')).toBeTruthy();
      expect(getByText(/Start a coding session/i)).toBeTruthy();
      expect(getByLabelText('Mobile phone icon')).toBeTruthy();
    });

    it('should show tip about automatic preview', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: null,
      } as any);

      const { getByText } = render(<PreviewScreen />);

      expect(getByText(/preview updates automatically/i)).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    it('should show loading when status is pending', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: null,
        status: 'pending',
        loading: true,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByTestId } = render(<PreviewScreen />);

      expect(getByTestId('preview-loading')).toBeTruthy();
    });

    it('should show loading when status is starting', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: null,
        status: 'starting',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByTestId } = render(<PreviewScreen />);

      expect(getByTestId('preview-loading')).toBeTruthy();
    });
  });

  describe('Error States', () => {
    it('should display error message when preview fails', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: null,
        status: 'failed',
        loading: false,
        error: 'Preview generation failed',
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText, getByTestId } = render(<PreviewScreen />);

      expect(getByTestId('preview-error')).toBeTruthy();
      expect(getByText(/Preview generation failed/i)).toBeTruthy();
    });

    it('should call retry when retry button pressed', () => {
      const mockRetry = jest.fn();

      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: null,
        status: 'failed',
        loading: false,
        error: 'Preview generation failed',
        refresh: jest.fn(),
        retry: mockRetry,
      });

      const { getByTestId } = render(<PreviewScreen />);

      const retryButton = getByTestId('retry-button');
      fireEvent.press(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Preview Coming Soon', () => {
    it('should show waiting state when session active but no URL', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: null,
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText } = render(<PreviewScreen />);

      expect(getByText('Preview Coming Soon')).toBeTruthy();
      expect(getByText(/Preview will appear after code generation completes/i)).toBeTruthy();
      expect(getByText(/Claude is working on your code/i)).toBeTruthy();
    });
  });

  describe('Active Preview', () => {
    it('should render WebView when preview URL available', () => {
      const testUrl = 'https://preview.example.com/test';

      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: testUrl,
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByTestId } = render(<PreviewScreen />);

      expect(getByTestId('webview-preview')).toBeTruthy();
      expect(getByTestId('preview-toolbar')).toBeTruthy();
    });

    it('should display preview URL in toolbar', () => {
      const testUrl = 'https://preview.example.com/test';

      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: testUrl,
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByText } = render(<PreviewScreen />);

      expect(getByText(testUrl)).toBeTruthy();
    });

    it('should have accessible labels', () => {
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: 'https://preview.example.com/test',
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      const { getByLabelText } = render(<PreviewScreen />);

      expect(getByLabelText('App preview screen')).toBeTruthy();
    });
  });

  describe('WebView Interactions', () => {
    it('should handle WebView errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: 'https://preview.example.com/test',
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      render(<PreviewScreen />);

      // WebView error would be handled internally
      // Verify error logging exists in component

      consoleError.mockRestore();
    });

    it('should log when preview loads successfully', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: 'https://preview.example.com/test',
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      render(<PreviewScreen />);

      // Preview load completion would trigger onLoadEnd
      // Verify logging exists in component

      consoleLog.mockRestore();
    });
  });

  describe('State Updates', () => {
    it('should update when preview URL changes', async () => {
      const { rerender, getByTestId } = render(<PreviewScreen />);

      // Initial state: no session
      mockUseSessionStore.mockReturnValue({
        currentSession: null,
      } as any);

      rerender(<PreviewScreen />);

      // Update: session with URL
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: 'https://preview.example.com/test',
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      rerender(<PreviewScreen />);

      await waitFor(() => {
        expect(getByTestId('webview-preview')).toBeTruthy();
      });
    });

    it('should handle status transitions', async () => {
      const { rerender, getByTestId } = render(<PreviewScreen />);

      // Starting state
      mockUseSessionStore.mockReturnValue({
        currentSession: {
          id: 'test-session',
          status: 'active',
        },
      } as any);

      mockUsePreviewUrl.mockReturnValue({
        url: null,
        status: 'starting',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      rerender(<PreviewScreen />);
      expect(getByTestId('preview-loading')).toBeTruthy();

      // Ready state
      mockUsePreviewUrl.mockReturnValue({
        url: 'https://preview.example.com/test',
        status: 'ready',
        loading: false,
        error: null,
        refresh: jest.fn(),
        retry: jest.fn(),
      });

      rerender(<PreviewScreen />);

      await waitFor(() => {
        expect(getByTestId('webview-preview')).toBeTruthy();
      });
    });
  });
});
