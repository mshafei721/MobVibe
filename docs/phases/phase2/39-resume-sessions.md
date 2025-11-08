# Phase 39: Resume Sessions

## Metadata
```yaml
phase: 39
title: Resume Sessions
track: Advanced Interaction
category: session-management
priority: high
complexity: medium
estimated_hours: 16
dependencies: [27, 37]
websearch: false
```

## Overview
Implement comprehensive session recovery and persistence to allow users to resume coding sessions from their exact point of interruption, including state restoration, background session handling, and seamless continuation.

## Success Criteria
- [ ] Sessions auto-save state every 30 seconds
- [ ] Users can resume interrupted sessions with full context
- [ ] Background sessions continue when app minimized
- [ ] State recovery handles partial/corrupted data
- [ ] Session history shows last 5 sessions
- [ ] Resume restores file states, terminal output, conversation

## Technical Approach

### State Persistence
```typescript
// types/session-state.ts
export interface SessionState {
  sessionId: string;
  projectId: string;
  timestamp: number;

  // Conversation context
  messages: Message[];
  agentState: AgentState;

  // File system state
  openFiles: OpenFile[];
  fileChanges: FileChange[];
  currentDirectory: string;

  // Terminal state
  terminalOutputs: TerminalOutput[];
  runningProcesses: ProcessInfo[];

  // UI state
  activeTab: string;
  scrollPositions: Record<string, number>;
  expandedSections: string[];
}

export interface SessionSnapshot {
  state: SessionState;
  checksum: string;
  compressed: boolean;
}
```

### Auto-Save System
```typescript
// hooks/useSessionAutoSave.ts
export function useSessionAutoSave(sessionId: string) {
  const saveInterval = 30000; // 30 seconds
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const captureState = useCallback(async (): Promise<SessionState> => {
    const messages = await getConversationHistory(sessionId);
    const files = await getOpenFiles(sessionId);
    const terminal = await getTerminalState(sessionId);

    return {
      sessionId,
      projectId: await getProjectId(),
      timestamp: Date.now(),
      messages,
      agentState: await getAgentState(sessionId),
      openFiles: files,
      fileChanges: await getUncommittedChanges(),
      currentDirectory: await getCurrentDirectory(),
      terminalOutputs: terminal.outputs,
      runningProcesses: terminal.processes,
      activeTab: getActiveTab(),
      scrollPositions: getScrollPositions(),
      expandedSections: getExpandedSections()
    };
  }, [sessionId]);

  const saveState = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const state = await captureState();
      const snapshot = await compressAndChecksum(state);
      await supabase
        .from('session_snapshots')
        .upsert({
          session_id: sessionId,
          state: snapshot.state,
          checksum: snapshot.checksum,
          compressed: snapshot.compressed,
          saved_at: new Date().toISOString()
        });
      setLastSaved(new Date());
      setSaveStatus('idle');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [sessionId, captureState]);

  useEffect(() => {
    const interval = setInterval(saveState, saveInterval);
    return () => clearInterval(interval);
  }, [saveState]);

  return { lastSaved, saveStatus, saveState };
}
```

### Resume Logic
```typescript
// lib/session-recovery.ts
export class SessionRecovery {
  async resumeSession(sessionId: string): Promise<ResumableSession> {
    const snapshot = await this.loadSnapshot(sessionId);
    if (!snapshot) throw new Error('Session not found');

    // Validate snapshot integrity
    if (!this.validateChecksum(snapshot)) {
      return this.attemptRecovery(sessionId);
    }

    const state = snapshot.compressed
      ? await this.decompress(snapshot.state)
      : snapshot.state;

    // Restore in order
    await this.restoreFileSystem(state);
    await this.restoreTerminal(state);
    await this.restoreConversation(state);
    await this.restoreUIState(state);

    return {
      sessionId,
      state,
      resumedAt: new Date(),
      recoveryMode: 'full'
    };
  }

  private async attemptRecovery(sessionId: string): Promise<ResumableSession> {
    // Try to recover from partial data
    const partialSnapshots = await this.loadAllSnapshots(sessionId);
    const validSnapshot = partialSnapshots.find(s => this.validateChecksum(s));

    if (!validSnapshot) {
      throw new Error('Unable to recover session');
    }

    console.warn(`Recovered from snapshot ${validSnapshot.saved_at}`);
    const state = await this.decompress(validSnapshot.state);

    // Restore what we can
    await this.restoreFileSystem(state);
    await this.restoreConversation(state);

    return {
      sessionId,
      state,
      resumedAt: new Date(),
      recoveryMode: 'partial'
    };
  }

  private async restoreFileSystem(state: SessionState) {
    // Set working directory
    await setCurrentDirectory(state.currentDirectory);

    // Reopen files
    for (const file of state.openFiles) {
      await openFile(file.path, file.content);
    }

    // Restore uncommitted changes
    for (const change of state.fileChanges) {
      await applyFileChange(change);
    }
  }

  private async restoreTerminal(state: SessionState) {
    // Restore output history
    for (const output of state.terminalOutputs) {
      await appendTerminalOutput(output);
    }

    // Warn about running processes
    if (state.runningProcesses.length > 0) {
      console.warn('Session had running processes:', state.runningProcesses);
    }
  }

  private async restoreConversation(state: SessionState) {
    await loadConversationHistory(state.messages);
    await restoreAgentState(state.agentState);
  }

  private async restoreUIState(state: SessionState) {
    setActiveTab(state.activeTab);
    restoreScrollPositions(state.scrollPositions);
    expandSections(state.expandedSections);
  }
}
```

### Background Session Handler
```typescript
// lib/background-sessions.ts
export function useBackgroundSessionHandler(sessionId: string) {
  const { saveState } = useSessionAutoSave(sessionId);

  useEffect(() => {
    const handleAppStateChange = async (state: AppStateStatus) => {
      if (state === 'background') {
        // Save immediately when backgrounded
        await saveState();

        // Keep sandbox alive
        await keepSandboxAlive(sessionId);
      } else if (state === 'active') {
        // Check for updates when returning
        await syncSessionState(sessionId);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [sessionId, saveState]);
}

async function keepSandboxAlive(sessionId: string) {
  // Ping sandbox to prevent timeout
  await fetch(`${SANDBOX_URL}/ping`, {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
}
```

### Session History UI
```typescript
// components/SessionHistory.tsx
export function SessionHistory() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['session-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('session_snapshots')
        .select('session_id, saved_at, state')
        .order('saved_at', { ascending: false })
        .limit(5);
      return data;
    }
  });

  const resumeSession = async (sessionId: string) => {
    const recovery = new SessionRecovery();
    const resumed = await recovery.resumeSession(sessionId);
    router.push(`/session/${sessionId}`);
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Recent Sessions</Text>
      {sessions?.map(session => (
        <TouchableOpacity
          key={session.session_id}
          onPress={() => resumeSession(session.session_id)}
          className="p-4 mb-2 bg-gray-100 rounded-lg"
        >
          <Text className="font-medium">
            {new Date(session.saved_at).toLocaleString()}
          </Text>
          <Text className="text-sm text-gray-600">
            Session {session.session_id.slice(0, 8)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## Implementation Steps

1. **State Capture Infrastructure** (4h)
   - Implement SessionState type
   - Build state capture functions
   - Add compression & checksums
   - Create snapshot storage

2. **Auto-Save System** (4h)
   - Build useSessionAutoSave hook
   - Implement 30-second auto-save
   - Add save status indicators
   - Handle save failures

3. **Recovery Logic** (4h)
   - Implement SessionRecovery class
   - Build resumeSession function
   - Add partial recovery handling
   - Restore file/terminal/conversation state

4. **Background Handling** (2h)
   - Build background session handler
   - Keep sandbox alive when backgrounded
   - Sync state on return to foreground

5. **Session History UI** (2h)
   - Create SessionHistory component
   - Show last 5 sessions
   - Add resume buttons
   - Display session metadata

## Testing Requirements

### Unit Tests
```typescript
describe('SessionRecovery', () => {
  it('should resume valid session', async () => {
    const recovery = new SessionRecovery();
    const session = await recovery.resumeSession('test-session');
    expect(session.recoveryMode).toBe('full');
  });

  it('should handle corrupted snapshots', async () => {
    const recovery = new SessionRecovery();
    // Test partial recovery
  });

  it('should restore file system state', async () => {
    // Test file/directory restoration
  });
});
```

### Integration Tests
- Auto-save triggers every 30 seconds
- Background sessions remain active
- Resume restores complete state
- Partial recovery works with corrupted data

## Files Changed
```
lib/session-recovery.ts          [new]
lib/background-sessions.ts       [new]
hooks/useSessionAutoSave.ts      [new]
types/session-state.ts           [new]
components/SessionHistory.tsx    [new]
app/(session)/[id]/layout.tsx    [modified - add auto-save]
```

## Database Schema
```sql
-- Session snapshots table
CREATE TABLE session_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  checksum TEXT NOT NULL,
  compressed BOOLEAN DEFAULT true,
  saved_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id, saved_at)
);

CREATE INDEX idx_session_snapshots_session ON session_snapshots(session_id, saved_at DESC);
```

## Notes
- Auto-save every 30 seconds to minimize data loss
- Use compression for large state objects
- Checksums validate snapshot integrity
- Background sessions keep sandbox alive
- Partial recovery attempts to salvage corrupted data
- Show last 5 sessions in history
