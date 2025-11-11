# File Explorer Component - Stream 3 Implementation

## Overview
Complete file explorer implementation for the MobVibe coding interface. Displays project files in a hierarchical tree with syntax-highlighted viewing and search capabilities.

## Components Created

### 1. FileTree.tsx
**Purpose:** Displays hierarchical file tree with expand/collapse
**Features:**
- Expandable/collapsible folders
- File type icons (emoji-based)
- Selected file highlighting
- File count badges on folders
- Alphabetical sorting (folders first)
- Empty state handling
- Smooth animations

**Props:**
```typescript
interface FileTreeProps {
  files: Record<string, string>;     // path -> content
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}
```

**Usage:**
```tsx
<FileTree
  files={fileTree}
  onFileSelect={handleFileSelect}
  selectedFile={selectedFile}
/>
```

### 2. FileViewer.tsx
**Purpose:** Display file contents with syntax highlighting
**Features:**
- Syntax highlighting for 20+ languages
- Line numbers
- Copy to clipboard
- Language detection from extension
- Horizontal & vertical scrolling
- Dark theme (VS Code style)
- File info header
- Character/line count footer

**Props:**
```typescript
interface FileViewerProps {
  filePath: string;
  content: string;
  language?: string;  // Auto-detected if not provided
}
```

**Supported Languages:**
- TypeScript/JavaScript (tsx, ts, jsx, js)
- CSS/SCSS
- HTML/Markdown
- JSON/YAML
- Python, Java, C/C++, Rust, Go, Ruby, PHP, Swift, Kotlin

### 3. FileSearch.tsx
**Purpose:** Search files by name with fuzzy matching
**Features:**
- Fuzzy search algorithm
- Highlight matching characters
- Recent files section
- File path context display
- Clear button
- Empty state

**Props:**
```typescript
interface FileSearchProps {
  files: Record<string, string>;
  onSelectFile: (path: string) => void;
  recentFiles?: string[];
}
```

**Search Algorithm:**
- Exact name match: 100 points
- Name starts with query: 80 points
- Name contains query: 60 points
- Path contains query: 40 points
- Fuzzy match: 20 points

### 4. FileExplorerSheet.tsx
**Purpose:** Bottom sheet container with split view
**Features:**
- Swipe gestures (up/down to open/close)
- Two snap points: 50% and 90%
- Split view: tree (30%) + viewer (70%)
- Search toggle button
- File count badge
- Empty state
- Close button
- Backdrop overlay

**Props:**
```typescript
interface FileExplorerSheetProps {
  sessionId?: string;
  isVisible: boolean;
  onClose: () => void;
}
```

**Integration:**
```tsx
import { FileExplorerSheet } from '@/components/coding';

<FileExplorerSheet
  sessionId={currentSession.id}
  isVisible={showFileExplorer}
  onClose={() => setShowFileExplorer(false)}
/>
```

## Utilities

### fileTree.ts
**Functions:**
- `buildFileTree(files)` - Convert flat paths to hierarchy
- `flattenTree(node)` - Convert hierarchy to flat paths
- `searchFiles(files, query)` - Fuzzy search implementation
- `getParentPaths(filePath)` - Get folder ancestors
- `countFiles(node)` - Count files in tree
- `findNodeByPath(root, path)` - Locate node in tree
- `detectLanguage(fileName)` - Get language from extension

### fileIcons.ts
**Functions:**
- `getFileIcon(fileName)` - Get emoji for file type
- `getFolderIcon(isOpen)` - Get folder emoji (open/closed)

**Icons Supported:**
- TypeScript: ⚛️ (tsx), 📘 (ts)
- JavaScript: ⚛️ (jsx), 📜 (js)
- Styles: 🎨 (css, scss)
- Config: ⚙️ (json, yaml)
- Markup: 🌐 (html), 📝 (md)
- Images: 🖼️ (png, jpg, svg)
- Code: 🐍 (py), ☕ (java), 🦀 (rs), etc.
- Special: 🚫 (.gitignore), 🐳 (Dockerfile), 🔒 (.lock)

## Integration with code.tsx

### State Management
```tsx
const [showFileExplorer, setShowFileExplorer] = useState(false);
```

### Header Button
```tsx
{currentSession && (
  <TouchableOpacity
    style={styles.filesButton}
    onPress={() => setShowFileExplorer(true)}
  >
    <Text style={styles.filesButtonIcon}>📁</Text>
    <Text style={styles.filesButtonText}>Files</Text>
  </TouchableOpacity>
)}
```

### Sheet Component
```tsx
{currentSession && (
  <FileExplorerSheet
    sessionId={currentSession.id}
    isVisible={showFileExplorer}
    onClose={() => setShowFileExplorer(false)}
  />
)}
```

## Real-time Integration

### Hook: useFileChanges
Tracks file operations from backend:
```tsx
const { fileTree, fileChanges } = useFileChanges(sessionId);

// fileTree: Record<string, string> - current files
// fileChanges: FileChange[] - operation history
```

**FileChange Interface:**
```typescript
interface FileChange {
  id: string;
  type: 'created' | 'updated' | 'deleted';
  path: string;
  content?: string;
  timestamp: Date;
}
```

### Auto-updates
File tree automatically updates when:
- New files created
- Files updated
- Files deleted

## Dependencies

### Bottom Sheet
```bash
npm install @gorhom/bottom-sheet
```

**Configuration:**
```javascript
// babel.config.js
plugins: [
  'nativewind/babel',
  'react-native-reanimated/plugin', // Must be last
]
```

### Syntax Highlighting
```bash
npm install react-native-syntax-highlighter react-syntax-highlighter
```

**Styles:**
- Using `atomOneDark` theme
- Dark background: #1e1e1e
- Matches VS Code appearance

## Performance Optimizations

### Tree Building
- Memoized with `useMemo`
- Only rebuilds when files change
- Efficient sorting algorithm

### Expansion State
- Set-based storage (O(1) lookups)
- Minimal re-renders
- Smooth animations

### Search
- Debounced input (consider adding)
- Results limited to top matches
- Efficient fuzzy matching

### Virtual Lists
Consider implementing for large file trees (100+ files):
```tsx
import { FlatList } from 'react-native';
// Render only visible nodes
```

## Layout

### Bottom Sheet
```
┌─────────────────────────────────────┐
│ Files (12) [🔍] [✕]                │ ← Header
├──────────┬──────────────────────────┤
│          │ components/Button.tsx    │ ← Viewer Header
│ 📁 app   │ ⚛️ typescript            │
│  ├ index │                          │
│  └ layout│ import React from 'react'│
│ 📁 comp  │ export const Button = () │
│  ├ Button│ interface ButtonProps {  │
│  └ Input │   label: string;         │
│ 📄 pkg   │ }                        │
│          │                          │
│ (30%)    │         (70%)            │
└──────────┴──────────────────────────┘
```

### Snap Points
- **50%**: Quick preview mode
- **90%**: Full editing view

## Styling

### Theme Colors
```typescript
background: tokens.colors.background.base
codeBackground: tokens.colors.code.background (#1e1e1e)
text: tokens.colors.text.primary
selected: tokens.colors.primary[500] + 15% opacity
border: tokens.colors.border.subtle
```

### Typography
```typescript
fileName: tokens.typography.fontSize.sm
code: 12px monospace (Menlo, Monaco, Courier)
lineNumbers: 10px gray
```

### Animations
```typescript
folderExpand: 200ms ease-out
sheetSnap: spring animation
selection: 100ms fade
```

## Testing Checklist

- [x] File tree displays correctly
- [x] Folders expand/collapse
- [x] Files can be selected
- [x] Syntax highlighting works
- [x] Search finds files
- [x] Copy button works
- [x] Bottom sheet swipes
- [x] Empty state shows
- [ ] Real-time updates work (needs backend)
- [ ] Performance with 100+ files
- [ ] Touch targets accessible (44x44pt)

## Known Limitations

1. **No editing**: View-only (by design)
2. **No filtering**: Could add by file type
3. **No sorting options**: Always alphabetical
4. **No icons library**: Using emojis (limited)
5. **No folder creation**: Read-only interface

## Future Enhancements

### Priority 1
- [ ] Add file type filtering
- [ ] Implement virtual list for large trees
- [ ] Add debounce to search input
- [ ] Show loading states

### Priority 2
- [ ] Add file preview for images
- [ ] Show git status indicators
- [ ] Add breadcrumb navigation
- [ ] Keyboard shortcuts

### Priority 3
- [ ] Add file diff view
- [ ] Show file history
- [ ] Add bookmarks/favorites
- [ ] Custom icon library

## Architecture

```
FileExplorerSheet (Container)
├── Header
│   ├── Title + Count Badge
│   ├── Search Toggle Button
│   └── Close Button
├── Content (Split View)
│   ├── Left Panel (30%)
│   │   ├── FileSearch (conditional)
│   │   └── FileTree (default)
│   └── Right Panel (70%)
│       ├── FileViewer (when selected)
│       └── Empty State (default)
└── BottomSheet (gesture handler)
```

## API Surface

### Exports
```typescript
// Components
export { FileExplorerSheet } from './FileExplorerSheet';
export { FileTree } from './FileTree';
export { FileViewer } from './FileViewer';
export { FileSearch } from './FileSearch';

// Utilities
export { buildFileTree, searchFiles, detectLanguage } from '@/utils/fileTree';
export { getFileIcon, getFolderIcon } from '@/constants/fileIcons';

// Hooks
export { useFileChanges } from '@/src/hooks/useFileChanges';
```

## Troubleshooting

### Sheet not opening
1. Check `isVisible` prop is `true`
2. Verify `sessionId` exists
3. Check console for errors

### Files not showing
1. Verify `fileTree` has data
2. Check `useFileChanges` hook
3. Confirm WebSocket connection

### Syntax highlighting broken
1. Verify language detection
2. Check `react-native-syntax-highlighter` installed
3. Try different style theme

### Performance issues
1. Limit file tree depth
2. Implement virtual scrolling
3. Debounce search input
4. Memoize expensive operations

## References

- Bottom Sheet: https://gorhom.github.io/react-native-bottom-sheet/
- Syntax Highlighter: https://github.com/conorhastings/react-syntax-highlighter
- Reanimated: https://docs.swmansion.com/react-native-reanimated/

## Coordination

**Completed:** Stream 3 - File Explorer (FILE agent)
**Dependencies:** Stream 2 - `useFileChanges` hook ✅
**Parallel:** Terminal viewer (TERM agent)
**Blocks:** None

---

**Implementation Status:** ✅ Complete
**Last Updated:** 2025-11-11
**Author:** FILE Agent (Stream 3)
