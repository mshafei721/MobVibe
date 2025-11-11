/**
 * State Management Integration Examples
 * Complete examples showing how to use the state management system
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSessionStore, type Message } from '../store/sessionStore';
import { useAutoSessionRecovery } from '../hooks/useSessionRecovery';
import { sessionSync } from '../services/state';
import { MessageHistory } from '../services/state';

// ============================================================================
// Example 1: Simple Chat Screen
// ============================================================================

export function SimpleChatScreen({ projectId }: { projectId: string }) {
  // Enable automatic session recovery
  useAutoSessionRecovery();

  const [inputText, setInputText] = useState('');

  // Get state from store
  const {
    currentSession,
    messages,
    loading,
    error,
    isThinking,
    startSession,
    sendMessage,
    clearError
  } = useSessionStore();

  // Start sync when session becomes active
  useEffect(() => {
    if (currentSession?.status === 'active') {
      sessionSync.startSync(currentSession.id);
    }

    return () => {
      sessionSync.stopSync();
    };
  }, [currentSession?.id, currentSession?.status]);

  const handleStart = async () => {
    if (!inputText.trim()) return;

    try {
      await startSession(projectId, inputText);
      setInputText('');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleSend = async () => {
    if (!currentSession || !inputText.trim()) return;

    try {
      await sendMessage(currentSession.id, inputText);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Error Banner */}
      {error && (
        <View style={{ backgroundColor: '#ff6b6b', padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <Text style={{ color: 'white' }}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={{ color: 'white', marginTop: 4 }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Message List */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              marginVertical: 4,
              backgroundColor: item.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              borderRadius: 8,
              alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              {item.role} • {item.type}
            </Text>
            <Text>{item.content}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
      />

      {/* Thinking Indicator */}
      {isThinking && (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
          <ActivityIndicator size="small" color="#2196f3" />
          <Text style={{ marginLeft: 8, color: '#666' }}>Assistant is thinking...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={currentSession ? 'Type a message...' : 'Enter your prompt to start...'}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            marginRight: 8
          }}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={currentSession ? handleSend : handleStart}
          disabled={loading || !inputText.trim()}
          style={{
            backgroundColor: loading || !inputText.trim() ? '#ccc' : '#2196f3',
            padding: 12,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white' }}>
            {loading ? '...' : currentSession ? 'Send' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Example 2: Session History with Selection
// ============================================================================

export function SessionHistoryScreen({ projectId, onSelectSession }: {
  projectId: string;
  onSelectSession: (sessionId: string) => void;
}) {
  const {
    recentSessions,
    loading,
    fetchRecentSessions,
    loadSession
  } = useSessionStore();

  useEffect(() => {
    fetchRecentSessions(projectId);
  }, [projectId]);

  const handleSelect = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      onSelectSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading sessions...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Recent Sessions
      </Text>

      <FlatList
        data={recentSessions}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelect(item.id)}
            style={{
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 8,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                {item.status.toUpperCase()}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            <Text numberOfLines={2} style={{ color: '#666' }}>
              {item.initial_prompt}
            </Text>

            {item.error_message && (
              <Text style={{ color: '#ff6b6b', marginTop: 4, fontSize: 12 }}>
                Error: {item.error_message}
              </Text>
            )}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

// ============================================================================
// Example 3: Advanced Session Controls
// ============================================================================

export function SessionControlPanel() {
  const {
    currentSession,
    messages,
    loading,
    isThinking,
    pauseSession,
    resumeSession,
    stopSession,
    clearMessages,
    clearCurrentSession
  } = useSessionStore();

  const [syncActive, setSyncActive] = useState(false);

  useEffect(() => {
    setSyncActive(sessionSync.isSyncActive());

    const interval = setInterval(() => {
      setSyncActive(sessionSync.isSyncActive());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePause = async () => {
    try {
      await pauseSession();
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleResume = async () => {
    if (!currentSession) return;

    try {
      await resumeSession(currentSession.id);
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopSession();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  };

  const handleClearMessages = () => {
    clearMessages();
  };

  const handleExportMessages = async () => {
    if (!currentSession) return;

    try {
      const history = await MessageHistory.load(currentSession.id);
      console.log('Exported messages:', history);
      // Could save to file, share, etc.
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (!currentSession) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>No active session</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ddd' }}>
      {/* Session Info */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#666' }}>Session ID</Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{currentSession.id.substring(0, 8)}...</Text>

        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Status</Text>
            <Text style={{ fontSize: 14 }}>{currentSession.status}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Messages</Text>
            <Text style={{ fontSize: 14 }}>{messages.length}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Sync</Text>
            <Text style={{ fontSize: 14, color: syncActive ? '#4caf50' : '#999' }}>
              {syncActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {currentSession.status === 'active' && (
          <TouchableOpacity
            onPress={handlePause}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : '#ff9800',
              padding: 12,
              borderRadius: 8,
              flex: 1,
              minWidth: 100
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>
              {loading ? '...' : 'Pause'}
            </Text>
          </TouchableOpacity>
        )}

        {currentSession.status === 'paused' && (
          <TouchableOpacity
            onPress={handleResume}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : '#4caf50',
              padding: 12,
              borderRadius: 8,
              flex: 1,
              minWidth: 100
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>
              {loading ? '...' : 'Resume'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={handleStop}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#f44336',
            padding: 12,
            borderRadius: 8,
            flex: 1,
            minWidth: 100
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {loading ? '...' : 'Stop'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClearMessages}
          style={{
            backgroundColor: '#9e9e9e',
            padding: 12,
            borderRadius: 8,
            flex: 1,
            minWidth: 100
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleExportMessages}
          style={{
            backgroundColor: '#2196f3',
            padding: 12,
            borderRadius: 8,
            flex: 1,
            minWidth: 100
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Example 4: Message Search
// ============================================================================

export function MessageSearchScreen() {
  const { currentSession } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!currentSession || !searchQuery.trim()) return;

    setSearching(true);

    try {
      const results = await MessageHistory.searchMessages(
        currentSession.id,
        searchQuery
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Search Messages
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search messages..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            padding: 12,
            marginRight: 8
          }}
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={searching || !searchQuery.trim()}
          style={{
            backgroundColor: searching || !searchQuery.trim() ? '#ccc' : '#2196f3',
            padding: 12,
            borderRadius: 8,
            justifyContent: 'center'
          }}
        >
          <Text style={{ color: 'white' }}>
            {searching ? '...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: 'white',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2
              }}
            >
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                {item.role} • {new Date(item.timestamp).toLocaleString()}
              </Text>
              <Text>{item.content}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>
            {searchQuery ? 'No results found' : 'Enter a search query'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Example 5: Storage Management
// ============================================================================

export function StorageManagementScreen() {
  const [storageInfo, setStorageInfo] = useState({
    totalSessions: 0,
    totalMessages: 0,
    estimatedSizeKB: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStorageInfo = async () => {
    setLoading(true);
    try {
      const info = await MessageHistory.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const handleClearAll = async () => {
    try {
      await MessageHistory.clearAll();
      await loadStorageInfo();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196f3" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Storage Management
      </Text>

      <View style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Total Sessions</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
            {storageInfo.totalSessions}
          </Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Total Messages</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
            {storageInfo.totalMessages}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 14, color: '#666' }}>Estimated Size</Text>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
            {storageInfo.estimatedSizeKB} KB
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleClearAll}
        style={{
          backgroundColor: '#f44336',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Clear All Message History
        </Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 8, color: '#666', fontSize: 12, textAlign: 'center' }}>
        This will delete all stored messages but keep session metadata
      </Text>
    </View>
  );
}
