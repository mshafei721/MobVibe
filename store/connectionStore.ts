/**
 * Connection Store
 * Tracks network connectivity status and API connection health
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

interface ConnectionStore {
  // Network status
  isOnline: boolean;
  isConnecting: boolean;
  connectionType: string | null;

  // API health
  lastSync: Date | null;
  lastError: Error | null;

  // Actions
  setOnline: (online: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionType: (type: string | null) => void;
  updateLastSync: () => void;
  setLastError: (error: Error | null) => void;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  // Initial state
  isOnline: true,
  isConnecting: false,
  connectionType: null,
  lastSync: null,
  lastError: null,

  // Actions
  setOnline: (online) => set({ isOnline: online }),

  setConnecting: (connecting) => set({ isConnecting: connecting }),

  setConnectionType: (type) => set({ connectionType: type }),

  updateLastSync: () => set({ lastSync: new Date(), lastError: null }),

  setLastError: (error) => set({ lastError: error }),

  reset: () => set({
    isOnline: true,
    isConnecting: false,
    connectionType: null,
    lastSync: null,
    lastError: null,
  }),
}));

/**
 * Initialize network status monitoring
 * Call this once at app startup
 */
export function initializeNetworkListener() {
  logger.info('[ConnectionStore] Initializing network listener');

  // Subscribe to network state changes
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const { isConnected, isInternetReachable, type } = state;

    logger.info('[ConnectionStore] Network state changed', {
      isConnected,
      isInternetReachable,
      type,
    });

    // Update connection status
    useConnectionStore.getState().setOnline(isConnected ?? false);
    useConnectionStore.getState().setConnectionType(type);
  });

  // Get initial network state
  NetInfo.fetch().then((state) => {
    logger.info('[ConnectionStore] Initial network state', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });

    useConnectionStore.getState().setOnline(state.isConnected ?? false);
    useConnectionStore.getState().setConnectionType(state.type);
  });

  return unsubscribe;
}

/**
 * Check current network status
 */
export async function checkNetworkStatus(): Promise<boolean> {
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  useConnectionStore.getState().setOnline(isOnline);
  useConnectionStore.getState().setConnectionType(state.type);

  return isOnline;
}
