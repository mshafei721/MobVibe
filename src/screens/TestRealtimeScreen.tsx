/**
 * Test Realtime Screen
 * Example screen for testing real-time hooks
 */

import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Text,
  Box,
  VStack,
  HStack,
  Button,
  Badge,
  Heading,
  Divider,
} from '@gluestack-ui/themed';
import {
  useRealtimeMessages,
  useFileChanges,
  useTerminalOutput,
  useSessionProgress,
  usePreviewReady,
} from '../hooks';

interface Props {
  sessionId: string;
}

/**
 * Test screen for real-time hooks
 * Shows all events in real-time
 */
export function TestRealtimeScreen({ sessionId }: Props) {
  const [isConnected, setIsConnected] = useState(true);

  // Use all hooks
  const {
    messages,
    isThinking,
    addUserMessage,
    clearMessages,
  } = useRealtimeMessages(isConnected ? sessionId : undefined);

  const { fileChanges, fileTree, clearFileChanges } = useFileChanges(
    isConnected ? sessionId : undefined
  );

  const { lines, isExecuting, clearTerminal } = useTerminalOutput(
    isConnected ? sessionId : undefined
  );

  const {
    status,
    progress,
    currentTask,
    isActive,
    isCompleted,
    hasError,
  } = useSessionProgress(isConnected ? sessionId : undefined);

  const { previewUrl, isReady, resetPreview } = usePreviewReady(
    isConnected ? sessionId : undefined
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <Box p="$4" gap="$4">
        {/* Header */}
        <VStack gap="$2">
          <Heading size="xl">Real-time Event Test</Heading>
          <Text size="sm" color="$textLight600">
            Session: {sessionId}
          </Text>
          <HStack gap="$2">
            <Button
              size="sm"
              variant={isConnected ? 'solid' : 'outline'}
              onPress={() => setIsConnected(!isConnected)}
            >
              <Text>{isConnected ? 'Disconnect' : 'Connect'}</Text>
            </Button>
          </HStack>
        </VStack>

        <Divider />

        {/* Session Progress */}
        <VStack gap="$2">
          <Heading size="md">Session Progress</Heading>
          <HStack gap="$2" flexWrap="wrap">
            <Badge
              variant="solid"
              bg={
                status === 'completed'
                  ? '$success500'
                  : status === 'error'
                  ? '$error500'
                  : '$primary500'
              }
            >
              <Text color="$white">{status}</Text>
            </Badge>
            {isActive && (
              <Badge variant="outline" borderColor="$primary500">
                <Text>Active</Text>
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="solid" bg="$success500">
                <Text color="$white">Completed</Text>
              </Badge>
            )}
            {hasError && (
              <Badge variant="solid" bg="$error500">
                <Text color="$white">Error</Text>
              </Badge>
            )}
          </HStack>
          {currentTask && <Text size="sm">{currentTask}</Text>}
          {progress !== undefined && (
            <Text size="sm">Progress: {progress}%</Text>
          )}
        </VStack>

        <Divider />

        {/* Messages */}
        <VStack gap="$2">
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="md">Messages ({messages.length})</Heading>
            <HStack gap="$2">
              {isThinking && (
                <Badge variant="solid" bg="$primary500">
                  <Text color="$white">Thinking...</Text>
                </Badge>
              )}
              <Button size="xs" variant="outline" onPress={clearMessages}>
                <Text>Clear</Text>
              </Button>
            </HStack>
          </HStack>
          <VStack gap="$2">
            {messages.length === 0 ? (
              <Text size="sm" color="$textLight600">
                No messages yet
              </Text>
            ) : (
              messages.slice(-5).map((message) => (
                <Box
                  key={message.id}
                  p="$2"
                  bg="$backgroundLight100"
                  borderRadius="$md"
                >
                  <HStack gap="$2" flexWrap="wrap">
                    <Badge
                      variant="outline"
                      size="sm"
                      borderColor={
                        message.role === 'user'
                          ? '$primary500'
                          : message.role === 'system'
                          ? '$secondary500'
                          : '$success500'
                      }
                    >
                      <Text>{message.role}</Text>
                    </Badge>
                    <Badge variant="outline" size="sm">
                      <Text>{message.type}</Text>
                    </Badge>
                  </HStack>
                  <Text size="sm" mt="$2" numberOfLines={2}>
                    {message.content}
                  </Text>
                </Box>
              ))
            )}
          </VStack>
          <Button
            size="sm"
            onPress={() => addUserMessage('Test message from UI')}
          >
            <Text>Send Test Message</Text>
          </Button>
        </VStack>

        <Divider />

        {/* File Changes */}
        <VStack gap="$2">
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="md">
              File Changes ({fileChanges.length})
            </Heading>
            <Button size="xs" variant="outline" onPress={clearFileChanges}>
              <Text>Clear</Text>
            </Button>
          </HStack>
          <VStack gap="$2">
            {fileChanges.length === 0 ? (
              <Text size="sm" color="$textLight600">
                No file changes yet
              </Text>
            ) : (
              fileChanges.slice(-5).map((change) => (
                <Box
                  key={change.id}
                  p="$2"
                  bg="$backgroundLight100"
                  borderRadius="$md"
                >
                  <HStack gap="$2" alignItems="center">
                    <Badge
                      variant="solid"
                      bg={
                        change.type === 'created'
                          ? '$success500'
                          : change.type === 'updated'
                          ? '$primary500'
                          : '$error500'
                      }
                    >
                      <Text color="$white">{change.type}</Text>
                    </Badge>
                    <Text size="sm">{change.path}</Text>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
          <Text size="sm" color="$textLight600">
            File tree: {Object.keys(fileTree).length} files
          </Text>
        </VStack>

        <Divider />

        {/* Terminal Output */}
        <VStack gap="$2">
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="md">Terminal ({lines.length})</Heading>
            <HStack gap="$2">
              {isExecuting && (
                <Badge variant="solid" bg="$primary500">
                  <Text color="$white">Executing...</Text>
                </Badge>
              )}
              <Button size="xs" variant="outline" onPress={clearTerminal}>
                <Text>Clear</Text>
              </Button>
            </HStack>
          </HStack>
          <VStack gap="$1">
            {lines.length === 0 ? (
              <Text size="sm" color="$textLight600">
                No terminal output yet
              </Text>
            ) : (
              lines.slice(-5).map((line) => (
                <Text
                  key={line.id}
                  size="xs"
                  fontFamily="$mono"
                  color={line.type === 'stderr' ? '$error500' : '$textLight900'}
                  numberOfLines={1}
                >
                  {line.content}
                </Text>
              ))
            )}
          </VStack>
        </VStack>

        <Divider />

        {/* Preview */}
        <VStack gap="$2">
          <Heading size="md">Preview</Heading>
          <HStack gap="$2" alignItems="center">
            <Badge
              variant={isReady ? 'solid' : 'outline'}
              bg={isReady ? '$success500' : undefined}
            >
              <Text color={isReady ? '$white' : undefined}>
                {isReady ? 'Ready' : 'Not Ready'}
              </Text>
            </Badge>
            {isReady && (
              <Button size="xs" variant="outline" onPress={resetPreview}>
                <Text>Reset</Text>
              </Button>
            )}
          </HStack>
          {previewUrl && (
            <Text size="sm" numberOfLines={1}>
              URL: {previewUrl}
            </Text>
          )}
        </VStack>
      </Box>
    </ScrollView>
  );
}
