# 18-file-system-operations.md
---
phase_id: 18
title: File System Operations & Sync
duration_estimate: "2.5 days"
incremental_value: Enables reliable file synchronization between E2B sandboxes and Supabase Storage with conflict resolution
owners: [Backend Engineer]
dependencies: [17-coding-session-lifecycle]
linked_phases_forward: [19-error-handling-recovery]
docs_referenced: [Architecture, Implementation, Data Flow]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["File watching patterns Node.js", "Conflict resolution strategies file sync"]
    outputs: ["/docs/research/phase1/18/file-sync-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["file synchronization", "Supabase Storage API"]
    outputs: ["/docs/context/phase1/18-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Design bidirectional file sync with conflict detection and resolution"
    outputs: ["/docs/sequencing/phase1/18-steps.md"]
acceptance_criteria:
  - Files sync reliably between sandbox and Supabase Storage in both directions
  - File changes tracked with diffs and timestamps
  - Conflicts detected and resolved using last-write-wins or user intervention
  - Storage usage monitored and quota limits enforced
---

## Objectives
1. Implement bidirectional file sync between E2B sandboxes and Supabase Storage
2. Build file watching and change detection for real-time sync
3. Create conflict resolution strategy for concurrent modifications

## Scope
### In
- File upload/download to Supabase Storage
- Directory watching for file changes
- Diff generation and change tracking
- Conflict detection (concurrent edits, version mismatches)
- Storage quota monitoring and enforcement
- File metadata tracking (size, hash, modified time)

### Out
- Real-time collaborative editing (Phase 2)
- Version control integration (Phase 2)
- Advanced conflict resolution UI (Phase 2)
- File compression/optimization (Phase 2)

## Tasks
- [ ] **Use context7**, **websearch**, **sequentialthinking** per template
- [ ] Create FileSyncService for bidirectional sync
```typescript
class FileSyncService {
  async uploadFile(sessionId: string, filePath: string, content: Buffer): Promise<void>
  async downloadFile(sessionId: string, filePath: string): Promise<Buffer>
  async syncDirectory(sessionId: string, dirPath: string): Promise<SyncResult>
  async detectConflicts(sessionId: string): Promise<Conflict[]>
}
```
- [ ] Implement FileWatcher for sandbox file system monitoring
```typescript
class FileWatcher {
  watch(dirPath: string, callback: (event: FileEvent) => void): void
  unwatch(dirPath: string): void
  generateDiff(filePath: string, oldContent: string, newContent: string): Diff
}
```
- [ ] Build ConflictResolver with configurable strategies
```typescript
enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  USER_INTERVENTION = 'user_intervention',
  AUTO_MERGE = 'auto_merge'
}
```
- [ ] Integrate Supabase Storage client with bucket management
- [ ] Add storage quota tracking and enforcement
- [ ] Implement file hashing for change detection (MD5/SHA256)
- [ ] Create batch upload/download for efficiency
- [ ] Test sync with large files, concurrent edits, network failures
- [ ] Document file sync architecture and conflict resolution flows
- [ ] Update links-map with file system operations docs

## Artifacts & Paths
- `lib/services/FileSyncService.ts`
- `lib/services/FileWatcher.ts`
- `lib/services/ConflictResolver.ts`
- `lib/types/file-operations.ts`
- `lib/utils/file-hash.ts`
- `docs/backend/FILE-SYNC.md` ⭐

## Testing
### Phase-Only Tests
- Files upload to Supabase Storage successfully
- Downloads retrieve correct file content
- File changes detected within 2 seconds
- Conflicts identified when timestamps differ
- Storage quota enforced (reject uploads when exceeded)
- Large files (>10MB) sync without corruption
- Network failure recovery (retry logic)

### Cross-Phase Compatibility
- Phase 17 session state used to coordinate sync operations
- Phase 19 will use file operations for error recovery (checkpoint/restore)

## References
- [Architecture](./../../../../.docs/architecture.md)
- [Data Flow](./../../../../.docs/data-flow.md)
- [Phase 17](./17-coding-session-lifecycle.md)

## Handover
**Next Phase:** [19-error-handling-recovery.md](./19-error-handling-recovery.md)

File system operations complete. Error handling ready to implement comprehensive recovery strategies across all Phase 1 systems.

---
**Status:** Ready after Phase 17
**Estimated Time:** 2.5 days
