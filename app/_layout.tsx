import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { validateAppEnv } from '@/config/env-validation';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { logger } from '@/utils/logger';
import '../global.css';

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn,
  environment: process.env.NODE_ENV || 'development',
  release: Constants.expoConfig?.version || '1.0.0',
  dist: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
  debug: __DEV__,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!process.env.EXPO_PUBLIC_SENTRY_DSN && !Constants.expoConfig?.extra?.sentryDsn) {
      return null;
    }
    // Filter out non-error events in development
    if (__DEV__ && event.level !== 'error') {
      return null;
    }
    return event;
  },
  integrations: [
    Sentry.reactNavigationIntegration({
      enableTimeToInitialDisplay: !__DEV__,
    }),
  ],
});

export default function RootLayout() {
  useEffect(() => {
    // Validate environment variables on app startup
    try {
      validateAppEnv();
    } catch (error) {
      if (__DEV__) {
        // In development, show the error
        logger.error('Environment validation error', error as Error);
        throw error;
      } else {
        // In production, log to Sentry and continue
        Sentry.captureException(error, {
          tags: { category: 'env-validation' },
          extra: { context: 'app-startup' },
        });
        logger.error('Environment validation failed', error as Error);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ErrorBoundary>
  );
}
