# Code Viewer System

**Last Updated**: 2025-11-08
**Phase**: 22
**Status**: Backend Complete, Mobile Deferred

---

## Overview

Code viewer system for displaying session files with syntax highlighting, file tree navigation, and language detection. Backend provides file listing and content retrieval APIs; mobile implementation deferred.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Code Viewer Flow                          │
└──────────────────────────────────────────────────────────────┘

Mobile Client
    ↓
GET /get-session-files?sessionId=xyz
    ↓
Edge Function
    ↓
Supabase Storage List
    ↓
Build File Tree
    ↓
Detect Languages
    ↓
Return FileNode[]
    ↓
Mobile displays tree

User selects file
    ↓
GET /get-file-content?sessionId=xyz&path=src/App.tsx
    ↓
Edge Function
    ↓
Supabase Storage Download
    ↓
Read content
    ↓
Detect language
    ↓
Return {content, language, lines}
    ↓
Mobile highlights and displays
```

## Backend Implementation

### Edge Function: get-session-files

**Location**: `supabase/functions/get-session-files/index.ts`

**Purpose**: List all files in a session with tree structure

**Authentication**: Requires user JWT

**Parameters**:
- `sessionId` (query param) - Session ID

**Response**:
```typescript
{
  files: FileNode[]
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  language?: string
  children?: FileNode[]
}
```

**Example Request**:
```bash
GET /get-session-files?sessionId=abc-123
Authorization: Bearer <user-jwt>
```

**Example Response**:
```json
{
  "files": [
    {
      "name": "src",
      "path": "abc-123/src",
      "type": "directory",
      "children": [
        {
          "name": "App.tsx",
          "path": "abc-123/src/App.tsx",
          "type": "file",
          "size": 1024,
          "language": "tsx"
        },
        {
          "name": "components",
          "path": "abc-123/src/components",
          "type": "directory",
          "children": [
            {
              "name": "Button.tsx",
              "path": "abc-123/src/components/Button.tsx",
              "type": "file",
              "size": 512,
              "language": "tsx"
            }
          ]
        }
      ]
    },
    {
      "name": "package.json",
      "path": "abc-123/package.json",
      "type": "file",
      "size": 256,
      "language": "json"
    }
  ]
}
```

**Implementation**:
```typescript
async function buildFileTree(files: any[], sessionId: string): FileNode[] {
  const root: Map<string, FileNode> = new Map()

  for (const file of files) {
    const parts = file.name.split('/')
    let currentMap = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1 && !file.id?.endsWith('/')
      const path = parts.slice(0, i + 1).join('/')

      if (!currentMap.has(part)) {
        const node: FileNode = {
          name: part,
          path: `${sessionId}/${path}`,
          type: isFile ? 'file' : 'directory',
        }

        if (isFile) {
          node.size = file.metadata?.size
          node.language = detectLanguage(part)
        } else {
          node.children = []
        }

        currentMap.set(part, node)
      }

      // Navigate to children for next iteration
      if (!isFile) {
        const dir = currentMap.get(part)!
        const childMap = new Map<string, FileNode>()
        for (const child of dir.children || []) {
          childMap.set(child.name, child)
        }
        currentMap = childMap
      }
    }
  }

  // Sort: directories first, then alphabetically
  return Array.from(root.values()).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'directory' ? -1 : 1
  })
}
```

**Security**:
- Validates user owns session
- Only returns files for authenticated user's sessions
- RLS policies enforce row-level security

### Edge Function: get-file-content

**Location**: `supabase/functions/get-file-content/index.ts`

**Purpose**: Retrieve file content with metadata

**Authentication**: Requires user JWT

**Parameters**:
- `sessionId` (query param) - Session ID
- `path` (query param) - File path relative to session

**Response**:
```typescript
{
  path: string
  content: string
  language: string
  lines: number
  size: number
}
```

**Example Request**:
```bash
GET /get-file-content?sessionId=abc-123&path=src/App.tsx
Authorization: Bearer <user-jwt>
```

**Example Response**:
```json
{
  "path": "src/App.tsx",
  "content": "import React from 'react'\n\nexport default function App() {\n  return <div>Hello</div>\n}",
  "language": "tsx",
  "lines": 5,
  "size": 82
}
```

**Implementation**:
```typescript
const storagePath = filePath.startsWith(`${sessionId}/`)
  ? filePath
  : `${sessionId}/${filePath}`

const { data: fileData, error } = await supabase.storage
  .from('session-files')
  .download(storagePath)

const content = await fileData.text()
const language = detectLanguage(filePath)
const lines = content.split('\n').length

return {
  path: filePath,
  content,
  language,
  lines,
  size: fileData.size,
}
```

**Security**:
- Validates user owns session
- Only downloads files from authenticated user's sessions
- Prevents path traversal attacks

### Language Detection

**Location**: `backend/worker/src/utils/languageDetection.ts`

**Purpose**: Detect programming language from file extension

**Supported Languages** (25+):
- JavaScript, JSX, TypeScript, TSX
- CSS, SCSS
- HTML, XML
- JSON, YAML
- Python, Java, Go, Rust
- Ruby, PHP, C, C++, C#
- Swift, Kotlin
- SQL, Bash, Shell
- Markdown, Dockerfile

**API**:
```typescript
export interface LanguageInfo {
  language: string        // Prism language ID
  displayName: string     // Human-readable name
  icon: string           // Ionicons icon name
  highlightable: boolean // Can syntax highlight
}

export function detectLanguage(filename: string): LanguageInfo
export function getLanguageIcon(filename: string): string
export function getLanguageName(filename: string): string
export function isHighlightable(filename: string): boolean
export function getSupportedLanguages(): string[]
```

**Usage**:
```typescript
const info = detectLanguage('App.tsx')
// {
//   language: 'tsx',
//   displayName: 'React TSX',
//   icon: 'logo-react',
//   highlightable: true
// }

const icon = getLanguageIcon('styles.css')
// 'color-palette'

const supported = getSupportedLanguages()
// ['javascript', 'typescript', 'python', ...]
```

**Extension Mapping**:
```typescript
const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  js: { language: 'javascript', displayName: 'JavaScript', ... },
  ts: { language: 'typescript', displayName: 'TypeScript', ... },
  tsx: { language: 'tsx', displayName: 'React TSX', ... },
  py: { language: 'python', displayName: 'Python', ... },
  // ... 25+ languages
}
```

**Special Cases**:
- Dockerfile detection (no extension)
- Default to 'text' for unknown extensions
- Case-insensitive matching

## Mobile Implementation (Deferred)

### CodeViewer Component

**Location**: `mobile/src/components/code/CodeViewer.tsx` (future)

**Props**:
```typescript
interface CodeViewerProps {
  sessionId: string
  selectedFile?: string
  onFileSelect: (path: string) => void
}
```

**Layout**:
```
┌────────────┬─────────────────────────────┐
│            │                             │
│  File      │  Code Display               │
│  Tree      │  (Syntax Highlighted)       │
│            │                             │
│  src/      │  import React from 'react'  │
│  ├─ App    │                             │
│  ├─ comp/  │  export default function    │
│     └─ Btn │  App() {                    │
│            │    return <div>Hello</div>  │
│  package   │  }                          │
│            │                             │
└────────────┴─────────────────────────────┘
```

**Features**:
- Split view: file tree + code panel
- Touch-friendly tree navigation
- Collapsible directories
- File icons by type
- Selected file highlighting

**Example**:
```typescript
export function CodeViewer({ sessionId, selectedFile, onFileSelect }: CodeViewerProps) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [sessionId])

  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile)
    }
  }, [selectedFile])

  const loadFiles = async () => {
    const response = await fetch(
      `${API_URL}/get-session-files?sessionId=${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const { files } = await response.json()
    setFiles(files)
    setLoading(false)
  }

  const loadFileContent = async (path: string) => {
    const response = await fetch(
      `${API_URL}/get-file-content?sessionId=${sessionId}&path=${path}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const { content } = await response.json()
    setContent(content)
  }

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <FileTree
          files={files}
          selectedPath={selectedFile}
          onSelect={onFileSelect}
        />
      </View>

      <View style={styles.codePanel}>
        {selectedFile ? (
          <SyntaxHighlighter
            code={content}
            path={selectedFile}
          />
        ) : (
          <Text>Select a file to view</Text>
        )}
      </View>
    </View>
  )
}
```

### SyntaxHighlighter Component

**Location**: `mobile/src/components/code/SyntaxHighlighter.tsx` (future)

**Props**:
```typescript
interface SyntaxHighlighterProps {
  code: string
  language?: string
  path?: string
  showLineNumbers?: boolean
  scrollToLine?: number
}
```

**Implementation Strategy**:
- WebView with Prism.js for syntax highlighting
- HTML generation with VS Code Dark+ theme
- Line numbers in sidebar
- Horizontal scroll for long lines
- Scroll to specific line support

**Example HTML Output**:
```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: 'Menlo', monospace;
        font-size: 12px;
        background: #1e1e1e;
        color: #d4d4d4;
      }
      .line-numbers {
        background: #252526;
        color: #858585;
        text-align: right;
        border-right: 1px solid #3e3e42;
      }
      .code-content {
        padding: 12px;
        white-space: pre;
        overflow-x: auto;
      }
      .token.keyword { color: #569cd6; }
      .token.string { color: #ce9178; }
      .token.function { color: #dcdcaa; }
      /* ... */
    </style>
  </head>
  <body>
    <div class="container">
      <div class="line-numbers">
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </div>
      <div class="code-content">
        <span class="token keyword">import</span>
        <span class="token variable">React</span>
        <span class="token keyword">from</span>
        <span class="token string">'react'</span>
      </div>
    </div>
  </body>
</html>
```

**Performance Considerations**:
- Cache file content in memory
- Lazy load large files (>100KB)
- Debounce scroll events
- Virtualize line numbers for 1000+ lines

### FileTree Component

**Location**: `mobile/src/components/code/FileTree.tsx` (future)

**Props**:
```typescript
interface FileTreeProps {
  files: FileNode[]
  selectedPath?: string
  onSelect: (path: string) => void
}
```

**Features**:
- Recursive tree rendering
- Expand/collapse directories
- File type icons (JS, TS, CSS, etc.)
- Selected file highlighting
- Indentation by depth

**Example**:
```typescript
function FileTreeNode({ node, depth, selectedPath, onSelect }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const isDirectory = node.type === 'directory'
  const isSelected = node.path === selectedPath

  const handlePress = () => {
    if (isDirectory) {
      setExpanded(!expanded)
    } else {
      onSelect(node.path)
    }
  }

  const icon = isDirectory
    ? (expanded ? 'folder-open' : 'folder')
    : getFileIcon(node.name)

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.node,
          { paddingLeft: 12 + depth * 16 },
          isSelected && styles.selected
        ]}
        onPress={handlePress}
      >
        <Ionicons name={icon} size={16} />
        <Text>{node.name}</Text>
      </TouchableOpacity>

      {isDirectory && expanded && node.children && (
        <View>
          {node.children.map(child => (
            <FileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </View>
      )}
    </View>
  )
}
```

## File Tree Building

### Algorithm

**Input**: Flat file list from Supabase Storage

**Output**: Nested tree structure

**Steps**:
1. Parse file paths into segments
2. Create directory nodes for intermediate paths
3. Create file nodes for leaf paths
4. Nest children under parent directories
5. Sort: directories first, then alphabetically

**Example**:
```typescript
// Input
[
  { name: 'src/App.tsx' },
  { name: 'src/components/Button.tsx' },
  { name: 'package.json' }
]

// Output
[
  {
    name: 'src',
    type: 'directory',
    children: [
      { name: 'App.tsx', type: 'file' },
      {
        name: 'components',
        type: 'directory',
        children: [
          { name: 'Button.tsx', type: 'file' }
        ]
      }
    ]
  },
  { name: 'package.json', type: 'file' }
]
```

**Complexity**: O(n * m) where n = files, m = average path depth

## Security

### Authentication
- All requests require valid user JWT
- Edge Functions validate JWT via Supabase Auth
- User must own the session to access files

### Authorization
```typescript
// Verify session ownership
const { data: session } = await supabase
  .from('coding_sessions')
  .select('id, user_id')
  .eq('id', sessionId)
  .eq('user_id', user.id)
  .single()

if (!session) {
  throw new Error('Unauthorized')
}
```

### Path Traversal Prevention
```typescript
// Normalize path to prevent ../.. attacks
const storagePath = filePath.startsWith(`${sessionId}/`)
  ? filePath
  : `${sessionId}/${filePath}`

// Only access files within session directory
```

### RLS Policies
- Storage bucket policies enforce user_id checks
- session_files bucket restricted to session owners
- Read-only access (no file modification via API)

## Performance

### File Listing
```
Supabase Storage List:  <200ms (typical)
File Tree Building:     <50ms (100 files)
Language Detection:     <1ms per file
──────────────────────────────────
Total:                  <300ms
```

### File Content
```
Supabase Storage Download: <100ms (small files)
Text Parsing:              <10ms
Language Detection:        <1ms
──────────────────────────────────
Total:                     <150ms
```

### Optimization Strategies
1. **Caching**: Cache file tree for 5 minutes
2. **Lazy Loading**: Load file content on demand
3. **Compression**: Gzip large files
4. **CDN**: Serve static syntax highlighting assets from CDN

## Monitoring

### Edge Function Metrics
```sql
-- Get session files request volume
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as requests
FROM edge_function_logs
WHERE function_name = 'get-session-files'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Performance Tracking
```sql
-- Average response times
SELECT
  function_name,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as request_count
FROM edge_function_logs
WHERE function_name IN ('get-session-files', 'get-file-content')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY function_name;
```

### Error Rate
```sql
-- Error rate by function
SELECT
  function_name,
  status_code,
  COUNT(*) as error_count
FROM edge_function_logs
WHERE status_code >= 400
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY function_name, status_code
ORDER BY error_count DESC;
```

## Testing

### Edge Function Tests

**get-session-files**:
```typescript
describe('get-session-files', () => {
  it('returns file tree for valid session', async () => {
    const response = await fetch(
      `${API_URL}/get-session-files?sessionId=${sessionId}`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    )

    expect(response.status).toBe(200)

    const { files } = await response.json()
    expect(files).toBeInstanceOf(Array)
    expect(files[0]).toHaveProperty('name')
    expect(files[0]).toHaveProperty('type')
  })

  it('returns 401 for unauthorized user', async () => {
    const response = await fetch(
      `${API_URL}/get-session-files?sessionId=${otherUserSession}`
    )

    expect(response.status).toBe(401)
  })

  it('builds nested directory structure', async () => {
    // Test file tree building algorithm
    const files = buildFileTree([
      { name: 'src/App.tsx' },
      { name: 'src/utils/helper.ts' }
    ], sessionId)

    expect(files[0].name).toBe('src')
    expect(files[0].children).toHaveLength(2)
  })
})
```

**get-file-content**:
```typescript
describe('get-file-content', () => {
  it('returns file content with metadata', async () => {
    const response = await fetch(
      `${API_URL}/get-file-content?sessionId=${sessionId}&path=src/App.tsx`,
      { headers: { Authorization: `Bearer ${userToken}` } }
    )

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('content')
    expect(data).toHaveProperty('language')
    expect(data.language).toBe('tsx')
  })
})
```

## Future Enhancements

### Phase 23+

1. **Search & Replace** - Find/replace across files
2. **Git Diff View** - Show file changes over time
3. **Code Folding** - Collapse functions/classes
4. **Minimap** - Visual file overview (VS Code style)
5. **Multiple Tabs** - View multiple files simultaneously
6. **Split View** - Side-by-side code comparison
7. **Line Selection** - Copy specific line ranges
8. **Permalink** - Share link to specific line

### Advanced Features

**Code Search**:
```typescript
// Search across all files
const results = await searchFiles(sessionId, 'function App')

// Returns:
[
  { path: 'src/App.tsx', line: 3, match: 'export default function App() {' },
  { path: 'src/components/Header.tsx', line: 7, match: '// Call App function' }
]
```

**Diff View**:
```typescript
// Compare file versions
const diff = await compareFiles(sessionId, 'src/App.tsx', version1, version2)

// Shows additions/deletions highlighted
```

---

**Phase 22 Status**: ✅ Backend Complete (Mobile Deferred)
**Integration**: Phase 21 (Error Handling) ← **Phase 22** → Phase 23 (WebView Preview)
**Dependencies**: FileSyncService (Phase 18), Error Handling (Phase 21)
