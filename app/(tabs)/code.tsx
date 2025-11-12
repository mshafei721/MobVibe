import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text } from '@/src/ui/primitives';
import { tokens } from '@/src/ui/tokens';
import { useProjectStore } from '@/store/projectStore';
import { useSessionStore } from '@/store/sessionStore';
import { sessionService } from '@/services/api';
import { MessageBubble, Message } from '@/components/coding/MessageBubble';
import { InputBar } from '@/components/coding/InputBar';
import { SessionControls } from '@/components/coding/SessionControls';
import { EmptySessionState } from '@/components/coding/EmptySessionState';
import { FileExplorerSheet } from '@/components/coding/FileExplorerSheet';
import { TerminalSheet } from '@/components/coding/TerminalSheet';
import { logger } from '@/utils/logger';

export default function CodeScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { currentProject } = useProjectStore();
  const { currentSession, events, isConnected, setCurrentSession, addEvent, clearEvents } = useSessionStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Convert session events to messages
  useEffect(() => {
    const newMessages: Message[] = events.map((event, index) => ({
      id: `event-${index}`,
      role: 'assistant',
      content: event.message || 'Processing...',
      timestamp: new Date(),
      type: event.type === 'thinking' ? 'thinking' : 'text',
    }));
    setMessages(prev => [...prev.filter(m => m.role === 'user'), ...newMessages]);
  }, [events]);

  // Set up event listeners
  useEffect(() => {
    const unsubscribeThinking = sessionService.onThinking((data) => {
      addEvent({ type: 'thinking', message: data.message, data });
    });

    const unsubscribeTerminal = sessionService.onTerminalOutput((data) => {
      addEvent({ type: 'terminal', message: data.output, data });
    });

    const unsubscribeFileChange = sessionService.onFileChange((data) => {
      addEvent({ type: 'file_change', message: `File ${data.action}: ${data.path}`, data });
    });

    const unsubscribeCompletion = sessionService.onCompletion((data) => {
      addEvent({ type: 'completion', message: data.message, data });
    });

    const unsubscribeError = sessionService.onError((data) => {
      addEvent({ type: 'error', message: data.message, data });
    });

    return () => {
      unsubscribeThinking();
      unsubscribeTerminal();
      unsubscribeFileChange();
      unsubscribeCompletion();
      unsubscribeError();
    };
  }, []);

  const handleSend = async (text: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);
    try {
      if (!currentSession) {
        // Create new session
        const activeProjectId = projectId || currentProject?.id;
        if (!activeProjectId) {
          throw new Error('No project selected');
        }

        const response = await sessionService.createSession(activeProjectId, text);
        setCurrentSession({
          id: response.session.id,
          project_id: response.session.project_id,
          status: response.session.status === 'pending' ? 'pending' :
                  response.session.status === 'active' ? 'running' :
                  response.session.status === 'completed' ? 'completed' : 'error',
          created_at: response.session.created_at,
        });
      } else {
        // TODO: Send message to existing session
        // This would require a new API endpoint to send additional prompts
        logger.warn('Sending messages to existing sessions not yet implemented');
      }
    } catch (error) {
      logger.error('Failed to send message', error as Error);
      addEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!currentSession) return;
    try {
      await sessionService.pauseSession(currentSession.id);
      setCurrentSession({ ...currentSession, status: 'pending' });
    } catch (error) {
      logger.error('Failed to pause session', error as Error);
    }
  };

  const handleResume = async () => {
    if (!currentSession) return;
    try {
      await sessionService.resumeSession(currentSession.id);
      setCurrentSession({ ...currentSession, status: 'running' });
    } catch (error) {
      logger.error('Failed to resume session', error as Error);
    }
  };

  const handleStop = async () => {
    if (!currentSession) return;
    try {
      await sessionService.stopSession(currentSession.id);
      setCurrentSession(null);
      clearEvents();
    } catch (error) {
      logger.error('Failed to stop session', error as Error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentSession) {
        const session = await sessionService.getSession(currentSession.id);
        setCurrentSession({
          id: session.id,
          project_id: session.project_id,
          status: session.status === 'pending' ? 'pending' :
                  session.status === 'active' ? 'running' :
                  session.status === 'completed' ? 'completed' : 'error',
          created_at: session.created_at,
        });
      }
    } catch (error) {
      logger.error('Failed to refresh session', error as Error);
    } finally {
      setRefreshing(false);
    }
  };

  const activeProjectId = projectId || currentProject?.id;
  const activeProject = currentProject?.id === activeProjectId ? currentProject : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h3" color={tokens.colors.text.primary}>
            {activeProject?.name || 'Code Session'}
          </Text>
          {currentSession && (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowTerminal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.iconButtonIcon}>⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filesButton}
                onPress={() => setShowFileExplorer(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.filesButtonIcon}>📁</Text>
                <Text style={styles.filesButtonText}>Files</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Session Controls */}
        {currentSession && (
          <SessionControls
            sessionId={currentSession.id}
            status={currentSession.status}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        )}

        {/* Messages Area */}
        {!currentSession && messages.length === 0 ? (
          <EmptySessionState
            projectId={activeProjectId || ''}
            projectName={activeProject?.name}
            templateId={activeProject?.template_id}
            onStartSession={handleSend}
          />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLatest={message.id === messages[messages.length - 1]?.id}
              />
            ))}
          </ScrollView>
        )}

        {/* Input Bar */}
        <InputBar
          onSend={handleSend}
          disabled={isLoading || currentSession?.status === 'completed'}
          placeholder={
            currentSession
              ? 'Type a message...'
              : 'Start a coding session...'
          }
        />

        {/* File Explorer Sheet */}
        {currentSession && (
          <FileExplorerSheet
            sessionId={currentSession.id}
            isVisible={showFileExplorer}
            onClose={() => setShowFileExplorer(false)}
          />
        )}

        {/* Terminal Sheet */}
        {currentSession && (
          <TerminalSheet
            sessionId={currentSession.id}
            isVisible={showTerminal}
            onClose={() => setShowTerminal(false)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
    backgroundColor: tokens.colors.background.base,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: tokens.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonIcon: {
    fontSize: 18,
  },
  filesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary[100],
    borderRadius: 8,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
  },
  filesButtonIcon: {
    fontSize: 16,
    marginRight: tokens.spacing[1],
  },
  filesButtonText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.primary[700],
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: tokens.spacing[2],
  },
});
