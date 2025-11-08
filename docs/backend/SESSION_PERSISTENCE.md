# Session Persistence & Resume System

**Phase:** 27
**Status:** Backend Complete (Mobile Deferred)
**Owner:** Backend Engineer

## Overview

Comprehensive session state persistence system enabling automatic saving, resume functionality, and session history management. Sessions can be paused and resumed with full context restoration, including agent conversation history, generated files, terminal outputs, and execution state. Large session states are automatically compressed to optimize storage.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Session  │  │  Resume   │  │  Session │  │  Storage │ │
│  │  Screen   │  │  Dialog   │  │  History │  │   Stats  │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘ │
│        │              │              │              │       │
│        └──────────────┴──────────────┴──────────────┘       │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ Supabase Client
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                     Worker Service                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        SessionPersistenceManager                       │  │
│  │                                                        │  │
│  │  • saveSessionState()    • loadSessionState()         │  │
│  │  • markResumable()       • getResumableSessions()     │  │
│  │  • resumeSession()       • getSessionHistory()        │  │
│  │  • getStorageStats()     • cleanupOldSessions()       │  │
│  │  • compressState()       • decompressState()          │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                     │
└─────────────────────────┼─────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                    Supabase Database                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              coding_sessions Table                     │  │
│  │                                                        │  │
│  │  • resumable (boolean)                                │  │
│  │  • last_activity (timestamptz)                        │  │
│  │  • state_snapshot (jsonb)                             │  │
│  │  • state_version (integer)                            │  │
│  │  • compressed_state (bytea)                           │  │
│  │  • state_size_bytes (integer)                         │  │
│  │  • resume_count (integer)                             │  │
│  │  • last_resumed_at (timestamptz)                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                Database Functions                      │  │
│  │                                                        │  │
│  │  • update_session_activity()                          │  │
│  │  • mark_paused_sessions_resumable()                   │  │
│  │  • cleanup_old_sessions(days_old)                     │  │
│  │  • get_user_session_storage(user_id)                  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## Database Schema

### Enhanced coding_sessions Table

```sql
-- New persistence columns
ALTER TABLE coding_sessions
  ADD COLUMN resumable BOOLEAN DEFAULT false,
  ADD COLUMN last_activity TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN state_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN state_version INTEGER DEFAULT 1,
  ADD COLUMN compressed_state BYTEA,
  ADD COLUMN state_size_bytes INTEGER DEFAULT 0,
  ADD COLUMN resume_count INTEGER DEFAULT 0,
  ADD COLUMN last_resumed_at TIMESTAMPTZ;
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `resumable` | BOOLEAN | Whether session can be resumed |
| `last_activity` | TIMESTAMPTZ | Timestamp of last user or agent activity |
| `state_snapshot` | JSONB | JSON snapshot of session state (uncompressed) |
| `state_version` | INTEGER | Version of state schema for migrations |
| `compressed_state` | BYTEA | GZIP compressed state for large sessions |
| `state_size_bytes` | INTEGER | Size of state data in bytes |
| `resume_count` | INTEGER | Number of times session has been resumed |
| `last_resumed_at` | TIMESTAMPTZ | Timestamp when session was last resumed |

### State Snapshot Structure

```typescript
interface SessionStateSnapshot {
  version: number                    // Schema version (currently 1)
  timestamp: string                  // ISO timestamp of snapshot
  agentContext: {
    conversationHistory: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    currentTask?: string             // Current task being worked on
    completedTasks: string[]         // Tasks already completed
    suggestions: string[]            // Agent suggestions for next steps
  }
  files: Array<{
    path: string                     // File path in sandbox
    content: string                  // File contents
    hash: string                     // SHA-256 hash
    lastModified: string             // ISO timestamp
  }>
  outputs: Array<{
    type: 'stdout' | 'stderr' | 'command'
    content: string
    timestamp: string
  }>
  metadata: {
    duration: number                 // Session duration in ms
    tokenUsage: number               // Total tokens used
    toolCalls: number                // Number of tool calls
    errorCount: number               // Number of errors encountered
  }
}
```

### Indexes

```sql
-- Find resumable sessions for a user
CREATE INDEX idx_sessions_resumable
  ON coding_sessions(user_id, resumable, last_activity DESC)
  WHERE resumable = true;

-- Session history queries
CREATE INDEX idx_sessions_history
  ON coding_sessions(user_id, created_at DESC);

-- Cleanup operations
CREATE INDEX idx_sessions_cleanup
  ON coding_sessions(status, last_activity)
  WHERE status IN ('completed', 'failed', 'expired');
```

## SessionPersistenceManager API

### Save Session State

**Method**: `saveSessionState(sessionId, state)`

**Purpose**: Save current session state to database with automatic compression

```typescript
await persistenceManager.saveSessionState(sessionId, {
  version: 1,
  timestamp: new Date().toISOString(),
  agentContext: {
    conversationHistory: [
      { role: 'user', content: 'Build a todo app', timestamp: '...' },
      { role: 'assistant', content: 'I\'ll create...', timestamp: '...' },
    ],
    currentTask: 'Creating TodoList component',
    completedTasks: ['Project setup', 'Created App.tsx'],
    suggestions: ['Add delete functionality', 'Add edit feature'],
  },
  files: [
    { path: '/src/App.tsx', content: '...', hash: 'abc123', lastModified: '...' },
    { path: '/src/TodoList.tsx', content: '...', hash: 'def456', lastModified: '...' },
  ],
  outputs: [
    { type: 'stdout', content: 'npm install complete', timestamp: '...' },
    { type: 'command', content: 'npx expo start', timestamp: '...' },
  ],
  metadata: {
    duration: 120000,
    tokenUsage: 5000,
    toolCalls: 15,
    errorCount: 0,
  },
})
```

**Features**:
- Automatic compression for states >10 KB
- Size limit check (max 10 MB)
- Version tracking
- Last activity timestamp update
- Compression ratio logging

**Compression**:
- Threshold: 10 KB
- Algorithm: GZIP
- Typical ratio: 0.1-0.3 (70-90% reduction)
- 100 KB state → ~15 KB compressed

### Load Session State

**Method**: `loadSessionState(sessionId)`

**Purpose**: Load saved session state with automatic decompression

```typescript
const state = await persistenceManager.loadSessionState(sessionId)

if (state) {
  console.log('Conversation history:', state.agentContext.conversationHistory.length)
  console.log('Files:', state.files.length)
  console.log('Current task:', state.agentContext.currentTask)
}
```

**Returns**: `SessionStateSnapshot | null`

**Features**:
- Automatic decompression if needed
- Version checking
- Null if no state found

### Mark Resumable

**Method**: `markResumable(sessionId, resumable = true)`

**Purpose**: Mark session as resumable or not

```typescript
// Mark as resumable (paused sessions)
await persistenceManager.markResumable(sessionId, true)

// Mark as not resumable (completed/failed)
await persistenceManager.markResumable(sessionId, false)
```

**Auto-Trigger**: Database trigger automatically marks sessions as resumable when status changes from 'active' to 'paused'

### Get Resumable Sessions

**Method**: `getResumableSessions(userId)`

**Purpose**: Fetch all resumable sessions for a user

```typescript
const resumable = await persistenceManager.getResumableSessions(userId)

resumable.forEach(session => {
  console.log(`${session.projectName}: ${session.initialPrompt}`)
  console.log(`Last active: ${session.lastActivity}`)
  console.log(`Files: ${session.preview.filesCount}`)
  console.log(`Resume count: ${session.resumeCount}`)
})
```

**Returns**: `ResumableSession[]`

```typescript
interface ResumableSession {
  id: string
  projectId: string
  projectName: string
  initialPrompt: string
  lastActivity: string
  status: string
  resumeCount: number
  stateSizeBytes: number
  preview: {
    lastTask?: string
    filesCount: number
    outputsCount: number
  }
}
```

**Features**:
- Sorted by last activity (most recent first)
- Limited to 10 sessions
- Includes project name
- Quick preview without loading full state

### Resume Session

**Method**: `resumeSession(sessionId)`

**Purpose**: Resume a session (increment count, update timestamp)

```typescript
await persistenceManager.resumeSession(sessionId)
```

**Effects**:
- Increments `resume_count`
- Sets `last_resumed_at` timestamp
- Marks session as not resumable (single resume)

### Get Session History

**Method**: `getSessionHistory(userId, limit = 30, offset = 0)`

**Purpose**: Fetch paginated session history

```typescript
const history = await persistenceManager.getSessionHistory(userId, 30, 0)

history.forEach(session => {
  console.log(`${session.projects.name}: ${session.initial_prompt}`)
  console.log(`Status: ${session.status}`)
  console.log(`Created: ${session.created_at}`)
  if (session.resumable) {
    console.log(`Resumable (resumed ${session.resume_count} times)`)
  }
})
```

**Pagination**:
- Default: 30 sessions
- Sorted by created_at (newest first)
- Offset for pagination

### Get Storage Statistics

**Method**: `getStorageStats(userId)`

**Purpose**: Calculate storage usage for a user

```typescript
const stats = await persistenceManager.getStorageStats(userId)

console.log(`Total sessions: ${stats.totalSessions}`)
console.log(`Active: ${stats.activeSessions}`)
console.log(`Resumable: ${stats.resumableSessions}`)
console.log(`Storage: ${(stats.totalStorageBytes / 1024 / 1024).toFixed(2)} MB`)
console.log(`Avg size: ${(stats.averageSessionSizeBytes / 1024).toFixed(2)} KB`)
```

**Returns**: `SessionStorageStats`

```typescript
interface SessionStorageStats {
  totalSessions: number
  activeSessions: number
  resumableSessions: number
  totalStorageBytes: number
  averageSessionSizeBytes: number
}
```

### Clean Up Old Sessions

**Method**: `cleanupOldSessions(daysOld = 30)`

**Purpose**: Delete old completed/failed/expired sessions

```typescript
const deletedCount = await persistenceManager.cleanupOldSessions(30)
console.log(`Deleted ${deletedCount} old sessions`)
```

**Criteria**:
- Status: completed, failed, or expired
- Last activity: older than specified days
- Not resumable

**Recommended Schedule**: Run weekly via cron

## Database Functions

### update_session_activity()

**Trigger**: Automatic on UPDATE

**Purpose**: Update `updated_at` and `last_activity` on any session modification

```sql
CREATE TRIGGER coding_sessions_update_activity
  BEFORE UPDATE ON coding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();
```

### mark_paused_sessions_resumable()

**Trigger**: Automatic on status change to 'paused'

**Purpose**: Automatically mark sessions as resumable when paused

```sql
CREATE TRIGGER sessions_auto_resumable
  BEFORE UPDATE ON coding_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'paused' AND OLD.status = 'active')
  EXECUTE FUNCTION mark_paused_sessions_resumable();
```

### cleanup_old_sessions(days_old)

**Usage**: Manual or via cron

**Purpose**: Delete old completed sessions

```sql
SELECT * FROM cleanup_old_sessions(30);  -- Delete sessions >30 days old
```

**Returns**: Number of deleted sessions

### get_user_session_storage(user_id)

**Usage**: Calculate storage statistics

**Purpose**: Aggregate session storage data for a user

```sql
SELECT * FROM get_user_session_storage('user-uuid-here');
```

**Returns**:
- total_sessions
- active_sessions
- resumable_sessions
- total_storage_bytes
- average_session_size_bytes

## Auto-Save Strategy

### When to Save

1. **After Agent Response**: Save after each Claude response
2. **After Tool Execution**: Save after bash, file read/write
3. **On File Changes**: Save when files are created/modified
4. **Periodic**: Save every 30 seconds during active session
5. **On Pause**: Save when user pauses session
6. **On Session Complete**: Final save with full metadata

### Debouncing

**Problem**: Rapid file changes trigger too many saves

**Solution**: Debounce saves with 500ms delay

```typescript
const debouncedSave = debounce(async (sessionId, state) => {
  await persistenceManager.saveSessionState(sessionId, state)
}, 500)
```

### Background Saving

**Problem**: Blocking UI during save

**Solution**: Non-blocking async saves

```typescript
// Don't await - fire and forget
persistenceManager.saveSessionState(sessionId, state).catch(err => {
  logger.error({ err }, 'Background save failed')
})
```

## Mobile Integration (Deferred)

### Resume Dialog

**When**: Show on app launch if resumable sessions exist

```typescript
function ResumeDialog({ sessions, onResume, onDismiss }: Props) {
  return (
    <Modal>
      <Text>You have {sessions.length} resumable session(s)</Text>
      {sessions.map(session => (
        <Pressable key={session.id} onPress={() => onResume(session)}>
          <Text>{session.projectName}</Text>
          <Text>{session.preview.lastTask}</Text>
          <Text>{formatDistanceToNow(session.lastActivity)} ago</Text>
          <Text>{session.preview.filesCount} files</Text>
        </Pressable>
      ))}
      <Button onPress={onDismiss}>Start New Session</Button>
    </Modal>
  )
}
```

### Session History Screen

```typescript
function SessionHistoryScreen() {
  const [history, setHistory] = useState<any[]>([])
  const [page, setPage] = useState(0)

  useEffect(() => {
    loadHistory(page)
  }, [page])

  const loadHistory = async (page: number) => {
    const sessions = await getSessionHistory(userId, 30, page * 30)
    setHistory(sessions)
  }

  const restoreSession = async (sessionId: string) => {
    const state = await loadSessionState(sessionId)
    // Navigate to session screen with restored state
  }

  return (
    <FlatList
      data={history}
      renderItem={({ item }) => (
        <SessionHistoryCard session={item} onRestore={restoreSession} />
      )}
    />
  )
}
```

### Storage Management Screen

```typescript
function StorageManagementScreen() {
  const [stats, setStats] = useState<SessionStorageStats>()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const data = await getStorageStats(userId)
    setStats(data)
  }

  const cleanup = async () => {
    await cleanupOldSessions(30)
    loadStats()
  }

  return (
    <View>
      <Text>Sessions: {stats?.totalSessions}</Text>
      <Text>Storage: {(stats?.totalStorageBytes / 1024 / 1024).toFixed(2)} MB</Text>
      <Button onPress={cleanup}>Clean Up Old Sessions</Button>
    </View>
  )
}
```

## Performance

### Save Performance

**Target**: <100ms for typical session

```
Serialize state:          10-20ms
Compress (if needed):     50-100ms
Database update:          20-50ms
─────────────────────────────────
Total (uncompressed):     30-70ms
Total (compressed):       80-170ms
```

**Optimization**:
- Compression only for states >10 KB
- Background saves (non-blocking)
- Debouncing (500ms)
- Skip unchanged state

### Load Performance

**Target**: <200ms for typical session

```
Database query:           20-50ms
Decompress (if needed):   50-100ms
Parse JSON:               10-20ms
─────────────────────────────────
Total (uncompressed):     30-70ms
Total (compressed):       80-170ms
```

### Storage Usage

**Typical Session**:
- Agent context: 5-20 KB
- Files (5-10 files): 20-50 KB
- Outputs (100 lines): 5-10 KB
- Metadata: <1 KB
- **Total (uncompressed)**: 30-80 KB
- **Total (compressed)**: 5-15 KB

**30 Sessions**:
- Uncompressed: 0.9-2.4 MB
- Compressed: 0.15-0.45 MB

**Quota**: 50 MB target (supports 100+ sessions compressed)

## Security

### Data Privacy

**Local Storage Only**: All session data stored in user's database (not shared)

**RLS Policies**: Existing RLS ensures users can only access own sessions

```sql
-- Users can only view their own sessions
CREATE POLICY "Users can view own sessions"
  ON coding_sessions FOR SELECT
  USING (auth.uid() = user_id);
```

### State Validation

**Size Limit**: 10 MB maximum per session

**Version Check**: Validate state version before restoration

**Corruption Recovery**: Graceful handling of corrupted state

```typescript
try {
  const state = await loadSessionState(sessionId)
  if (state.version !== CURRENT_VERSION) {
    logger.warn('State version mismatch, may need migration')
  }
} catch (error) {
  logger.error('Corrupted state, cannot restore')
  // Offer partial restoration or new session
}
```

## Error Handling

### Common Errors

1. **State Too Large** (>10 MB)
   - Message: "Session state exceeds maximum size"
   - Solution: Truncate old history, reduce file count

2. **Compression Failed**
   - Message: "Failed to compress state"
   - Solution: Save uncompressed, log warning

3. **Database Error**
   - Message: "Failed to save session state"
   - Solution: Retry with exponential backoff

4. **Corrupted State**
   - Message: "Invalid state format"
   - Solution: Clear state, start fresh

### Retry Strategy

```typescript
const retry = new RetryManager()

await retry.withRetry(
  async () => {
    await persistenceManager.saveSessionState(sessionId, state)
  },
  { maxAttempts: 3, initialDelay: 1000 }
)
```

## Testing

### Unit Tests

```typescript
describe('SessionPersistenceManager', () => {
  it('saves and loads state', async () => {
    const state: SessionStateSnapshot = {
      version: 1,
      timestamp: new Date().toISOString(),
      agentContext: { conversationHistory: [], completedTasks: [], suggestions: [] },
      files: [],
      outputs: [],
      metadata: { duration: 0, tokenUsage: 0, toolCalls: 0, errorCount: 0 },
    }

    await manager.saveSessionState(sessionId, state)
    const loaded = await manager.loadSessionState(sessionId)

    expect(loaded).toEqual(state)
  })

  it('compresses large states', async () => {
    const largeState = createLargeState(50 * 1024) // 50 KB

    await manager.saveSessionState(sessionId, largeState)

    const { data } = await supabase
      .from('coding_sessions')
      .select('compressed_state, state_snapshot')
      .eq('id', sessionId)
      .single()

    expect(data.compressed_state).toBeTruthy()
    expect(data.state_snapshot).toBeNull()
  })

  it('marks paused sessions as resumable', async () => {
    await supabase
      .from('coding_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId)

    const { data } = await supabase
      .from('coding_sessions')
      .select('resumable')
      .eq('id', sessionId)
      .single()

    expect(data.resumable).toBe(true)
  })
})
```

### Integration Tests

```typescript
describe('Resume Flow', () => {
  it('resumes session with full context', async () => {
    // Create session with state
    const session = await createSession()
    const state = createTestState()
    await manager.saveSessionState(session.id, state)
    await manager.markResumable(session.id, true)

    // Get resumable sessions
    const resumable = await manager.getResumableSessions(userId)
    expect(resumable).toHaveLength(1)
    expect(resumable[0].id).toBe(session.id)

    // Resume
    await manager.resumeSession(session.id)

    // Verify resume count
    const { data } = await supabase
      .from('coding_sessions')
      .select('resume_count, resumable')
      .eq('id', session.id)
      .single()

    expect(data.resume_count).toBe(1)
    expect(data.resumable).toBe(false)
  })
})
```

## Future Enhancements

### Cloud Sync (Phase 28+)
- Sync sessions across devices
- Conflict resolution for concurrent edits
- Offline-first architecture

### Incremental Snapshots
- Save only changed files (delta)
- Reduce storage and bandwidth
- Faster saves and loads

### State Versioning
- Schema migrations for state format changes
- Backward compatibility
- Version upgrade prompts

### Export/Import
- Export session as ZIP file
- Share sessions with team members
- Import sessions from file

### Smart Cleanup
- ML-based prediction of resumable likelihood
- Prioritize important sessions
- Auto-archive old projects

---

**Phase 27 Status**: Backend Complete (Mobile Deferred)
**Database**: Enhanced schema with persistence columns
**Manager**: SessionPersistenceManager with compression
**Functions**: Auto-triggers, cleanup, statistics
**Documentation**: Complete
**Mobile Components**: Designed, implementation deferred
