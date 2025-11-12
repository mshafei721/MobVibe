/**
 * Jest Test Environment Setup
 * Global configuration for all tests
 */

import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'http://localhost:54321',
      supabaseAnonKey: 'test-anon-key',
    },
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://localhost:8081/${path}`),
  parse: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map(key => [key, null]))),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock react-native-gifted-chat
jest.mock('react-native-gifted-chat', () => ({
  GiftedChat: 'GiftedChat',
  Bubble: 'Bubble',
  Send: 'Send',
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardProvider: ({ children }) => children,
  useKeyboard: () => ({
    keyboardHeight: 0,
    keyboardShown: false,
  }),
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => ({
  __esModule: true,
  default: 'BottomSheet',
  BottomSheetModal: 'BottomSheetModal',
  BottomSheetModalProvider: ({ children }) => children,
}));

// Mock lottie-react-native
jest.mock('lottie-react-native', () => 'LottieView');

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        if (callback) callback('SUBSCRIBED');
        return { unsubscribe: jest.fn() };
      }),
      unsubscribe: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://test.com/file' } })),
      })),
    },
  })),
}));

// Suppress console errors/warnings in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  // Keep log for debugging
  log: console.log,
};

// Set up global test utilities
global.testUtils = {
  // Helper to create mock user
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
  }),

  // Helper to create mock session
  createMockSession: () => ({
    id: 'test-session-id',
    user_id: 'test-user-id',
    project_id: 'test-project-id',
    initial_prompt: 'Test prompt',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  // Helper to create mock project
  createMockProject: () => ({
    id: 'test-project-id',
    user_id: 'test-user-id',
    name: 'Test Project',
    description: 'Test project description',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
};

// Increase timeout for integration tests
jest.setTimeout(10000);
