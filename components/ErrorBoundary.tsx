/**
 * Error Boundary Component
 * Catches and handles React errors to prevent full app crashes
 *
 * Security: Prevents error information leakage in production
 * UX: Provides graceful error recovery
 * Monitoring: Integrates with Sentry for error tracking
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { tokens } from '@/src/ui/tokens';
import * as Sentry from '@sentry/react-native';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry in all environments
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: 'root',
      },
      level: 'error',
    });

    this.setState({
      error,
      errorInfo,
    });

    // Log in development only
    if (__DEV__) {
      logger.error('ErrorBoundary caught an error', error, { componentStack: errorInfo.componentStack });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>😔 Oops! Something went wrong</Text>

            <Text style={styles.message}>
              {__DEV__
                ? 'The app encountered an error and needs to restart.'
                : 'We\'re sorry, but something unexpected happened. Please try again.'}
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <Pressable style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  content: {
    maxWidth: 500,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.typography.size['2xl'],
    fontWeight: tokens.typography.weight.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: tokens.typography.size.base,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorDetails: {
    maxHeight: 300,
    width: '100%',
    backgroundColor: tokens.colors.background.muted,
    borderRadius: tokens.spacing.sm,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  errorTitle: {
    fontSize: tokens.typography.size.sm,
    fontWeight: tokens.typography.weight.semibold,
    color: tokens.colors.error.base,
    marginBottom: tokens.spacing.sm,
  },
  errorText: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: tokens.spacing.sm,
  },
  errorStack: {
    fontSize: tokens.typography.size.xs,
    color: tokens.colors.text.tertiary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: tokens.colors.primary.base,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
    borderRadius: tokens.spacing.sm,
    minWidth: 200,
  },
  buttonText: {
    color: tokens.colors.primary.contrast,
    fontSize: tokens.typography.size.base,
    fontWeight: tokens.typography.weight.semibold,
    textAlign: 'center',
  },
});
