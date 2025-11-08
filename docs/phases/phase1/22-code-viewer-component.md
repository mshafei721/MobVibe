# 22-code-viewer-component.md
---
phase_id: 22
title: Code Viewer Component
duration_estimate: "2 days"
incremental_value: Syntax-highlighted code display with file tree navigation
owners: [Frontend Engineer]
dependencies: [21]
linked_phases_forward: [23]
docs_referenced: [Architecture, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native syntax highlighter", "Expo code viewer components", "Mobile code display libraries"]
    outputs: ["/docs/research/phase1/22/code-viewer-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["react-syntax-highlighter", "react-native-code-editor", "mobile code display"]
    outputs: ["/docs/context/phase1/22-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for building mobile-optimized code viewer with syntax highlighting"
    outputs: ["/docs/sequencing/phase1/22-code-viewer-steps.md"]
acceptance_criteria:
  - Code displays with syntax highlighting
  - File tree navigation functional
  - Language detection automatic
  - Scroll to specific line works
  - Performance good on mobile (large files)
  - Readonly viewer secure (no editing)
  - Horizontal scroll for long lines
---

## Objectives

1. **Syntax Highlighting** - Color-coded code display
2. **File Tree Navigation** - Browse project structure
3. **Mobile Optimized** - Smooth scrolling, touch-friendly

## Scope

### In
- Syntax highlighting (react-syntax-highlighter or similar)
- File tree component with expand/collapse
- Language auto-detection
- Line numbers
- Scroll to line functionality
- Horizontal scroll for long lines
- Readonly viewer
- Mobile touch gestures (pinch-zoom optional)

### Out
- Code editing (readonly only)
- Search/replace (Phase 24+)
- Git diff view (later)
- Advanced IDE features (autocomplete, etc.)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Research Code Viewer Libraries**:
  ```bash
  # Evaluate options:
  # 1. react-syntax-highlighter (web, works with Expo)
  # 2. react-native-syntax-highlighter (native)
  # 3. Custom solution with Prism.js

  # Decision: react-syntax-highlighter + react-native-webview
  # OR native solution for better performance
  ```

- [ ] **Install Dependencies**:
  ```bash
  cd frontend
  npx expo install react-native-webview
  npm install react-syntax-highlighter @types/react-syntax-highlighter
  npm install prismjs @types/prismjs

  # For file tree
  npm install @react-native-community/checkbox
  ```

- [ ] **Create CodeViewer Component** (`components/code/CodeViewer.tsx`):
  ```typescript
  import React, { useState } from 'react'
  import { View, ScrollView, Text } from 'react-native'
  import { SyntaxHighlighter } from './SyntaxHighlighter'
  import { FileTree } from './FileTree'

  interface CodeViewerProps {
    files: FileNode[]
    selectedFile?: string
    onFileSelect: (path: string) => void
  }

  export function CodeViewer({ files, selectedFile, onFileSelect }: CodeViewerProps) {
    const [activeFile, setActiveFile] = useState(selectedFile)

    const handleFileSelect = (path: string) => {
      setActiveFile(path)
      onFileSelect(path)
    }

    return (
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <FileTree
            files={files}
            selectedPath={activeFile}
            onSelect={handleFileSelect}
          />
        </View>

        <View style={styles.codePanel}>
          {activeFile ? (
            <SyntaxHighlighter
              path={activeFile}
              code={getFileContent(activeFile, files)}
            />
          ) : (
            <Text style={styles.placeholder}>Select a file to view</Text>
          )}
        </View>
      </View>
    )
  }
  ```

- [ ] **Create SyntaxHighlighter Component** (`components/code/SyntaxHighlighter.tsx`):
  ```typescript
  import React, { useMemo } from 'react'
  import { ScrollView, Text, View } from 'react-native'
  import { WebView } from 'react-native-webview'
  import Prism from 'prismjs'

  // Import language support
  import 'prismjs/components/prism-javascript'
  import 'prismjs/components/prism-typescript'
  import 'prismjs/components/prism-jsx'
  import 'prismjs/components/prism-tsx'
  import 'prismjs/components/prism-css'
  import 'prismjs/components/prism-json'

  interface SyntaxHighlighterProps {
    code: string
    language?: string
    path?: string
    showLineNumbers?: boolean
    scrollToLine?: number
  }

  export function SyntaxHighlighter({
    code,
    language,
    path,
    showLineNumbers = true,
    scrollToLine
  }: SyntaxHighlighterProps) {
    const detectedLanguage = useMemo(() => {
      if (language) return language
      return detectLanguage(path || '')
    }, [language, path])

    const highlightedCode = useMemo(() => {
      try {
        const grammar = Prism.languages[detectedLanguage]
        if (!grammar) return code

        return Prism.highlight(code, grammar, detectedLanguage)
      } catch (error) {
        console.error('Syntax highlighting error:', error)
        return code
      }
    }, [code, detectedLanguage])

    const html = useMemo(() => {
      return generateHighlightedHTML(
        highlightedCode,
        detectedLanguage,
        showLineNumbers,
        scrollToLine
      )
    }, [highlightedCode, detectedLanguage, showLineNumbers, scrollToLine])

    return (
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={true}
        showsVerticalScrollIndicator={true}
      />
    )
  }

  function detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase()

    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'css': 'css',
      'json': 'json',
      'html': 'html',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
    }

    return languageMap[ext || ''] || 'text'
  }

  function generateHighlightedHTML(
    highlightedCode: string,
    language: string,
    showLineNumbers: boolean,
    scrollToLine?: number
  ): string {
    const lines = highlightedCode.split('\n')

    const lineNumbersHtml = showLineNumbers
      ? `<div class="line-numbers">${lines.map((_, i) =>
          `<div class="line-number">${i + 1}</div>`
        ).join('')}</div>`
      : ''

    const codeHtml = `<div class="code-content">${highlightedCode}</div>`

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
              font-size: 12px;
              background: #1e1e1e;
              color: #d4d4d4;
              overflow-x: auto;
            }
            .container {
              display: flex;
              min-width: 100%;
            }
            .line-numbers {
              background: #252526;
              color: #858585;
              padding: 12px 8px;
              text-align: right;
              user-select: none;
              border-right: 1px solid #3e3e42;
            }
            .line-number {
              line-height: 1.5;
            }
            .code-content {
              padding: 12px;
              white-space: pre;
              line-height: 1.5;
              overflow-x: auto;
            }
            ${getPrismTheme()}
            ${scrollToLine ? `.line-number:nth-child(${scrollToLine}) { background: #264f78; }` : ''}
          </style>
        </head>
        <body>
          <div class="container">
            ${lineNumbersHtml}
            ${codeHtml}
          </div>
          ${scrollToLine ? `<script>
            window.scrollTo(0, ${(scrollToLine - 1) * 18});
          </script>` : ''}
        </body>
      </html>
    `
  }

  function getPrismTheme(): string {
    // VS Code Dark+ theme colors
    return `
      .token.comment { color: #6a9955; }
      .token.string { color: #ce9178; }
      .token.number { color: #b5cea8; }
      .token.keyword { color: #569cd6; }
      .token.operator { color: #d4d4d4; }
      .token.function { color: #dcdcaa; }
      .token.class-name { color: #4ec9b0; }
      .token.variable { color: #9cdcfe; }
      .token.punctuation { color: #d4d4d4; }
    `
  }
  ```

- [ ] **Create FileTree Component** (`components/code/FileTree.tsx`):
  ```typescript
  import React, { useState } from 'react'
  import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
  import { Ionicons } from '@expo/vector-icons'

  export interface FileNode {
    name: string
    path: string
    type: 'file' | 'directory'
    children?: FileNode[]
  }

  interface FileTreeProps {
    files: FileNode[]
    selectedPath?: string
    onSelect: (path: string) => void
  }

  export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
    return (
      <ScrollView style={styles.container}>
        {files.map(node => (
          <FileTreeNode
            key={node.path}
            node={node}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </ScrollView>
    )
  }

  interface FileTreeNodeProps {
    node: FileNode
    selectedPath?: string
    onSelect: (path: string) => void
    depth: number
  }

  function FileTreeNode({ node, selectedPath, onSelect, depth }: FileTreeNodeProps) {
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
            styles.nodeContainer,
            { paddingLeft: 12 + depth * 16 },
            isSelected && styles.selectedNode
          ]}
          onPress={handlePress}
        >
          <Ionicons
            name={icon}
            size={16}
            color={isSelected ? '#007AFF' : '#888'}
          />
          <Text style={[styles.nodeText, isSelected && styles.selectedText]}>
            {node.name}
          </Text>
        </TouchableOpacity>

        {isDirectory && expanded && node.children && (
          <View>
            {node.children.map(child => (
              <FileTreeNode
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </View>
        )}
      </View>
    )
  }

  function getFileIcon(filename: string): any {
    const ext = filename.split('.').pop()?.toLowerCase()

    const iconMap: Record<string, string> = {
      'js': 'logo-javascript',
      'jsx': 'logo-react',
      'ts': 'logo-javascript',
      'tsx': 'logo-react',
      'css': 'color-palette',
      'json': 'code-slash',
      'html': 'logo-html5',
      'md': 'document-text',
    }

    return iconMap[ext || ''] || 'document'
  }
  ```

- [ ] **Create Code Viewer Screen** (`app/code/[sessionId].tsx`):
  ```typescript
  import React, { useEffect, useState } from 'react'
  import { View, ActivityIndicator } from 'react-native'
  import { useLocalSearchParams } from 'expo-router'
  import { CodeViewer } from '@/components/code/CodeViewer'
  import { fetchSessionFiles } from '@/lib/api'

  export default function CodeViewerScreen() {
    const { sessionId } = useLocalSearchParams()
    const [files, setFiles] = useState<FileNode[]>([])
    const [selectedFile, setSelectedFile] = useState<string>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      loadFiles()
    }, [sessionId])

    const loadFiles = async () => {
      try {
        const data = await fetchSessionFiles(sessionId as string)
        setFiles(buildFileTree(data))
      } catch (error) {
        console.error('Failed to load files:', error)
      } finally {
        setLoading(false)
      }
    }

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      )
    }

    return (
      <CodeViewer
        files={files}
        selectedFile={selectedFile}
        onFileSelect={setSelectedFile}
      />
    )
  }

  function buildFileTree(files: any[]): FileNode[] {
    // Convert flat file list to tree structure
    // Implementation details...
  }
  ```

- [ ] **Add API Integration** (`lib/api.ts`):
  ```typescript
  export async function fetchSessionFiles(sessionId: string) {
    const response = await fetch(
      `${API_URL}/sessions/${sessionId}/files`,
      {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch files')
    }

    return response.json()
  }

  export async function fetchFileContent(sessionId: string, path: string) {
    const response = await fetch(
      `${API_URL}/sessions/${sessionId}/files/${encodeURIComponent(path)}`,
      {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch file content')
    }

    return response.text()
  }
  ```

- [ ] **Add Performance Optimizations**:
  ```typescript
  // Virtual scrolling for large files
  import { FlashList } from '@shopify/flash-list'

  // Lazy load file content
  const [fileCache, setFileCache] = useState<Map<string, string>>(new Map())

  const loadFileContent = async (path: string) => {
    if (fileCache.has(path)) {
      return fileCache.get(path)
    }

    const content = await fetchFileContent(sessionId, path)
    setFileCache(new Map(fileCache).set(path, content))
    return content
  }
  ```

- [ ] **Add Tests**:
  ```typescript
  // tests/frontend/code-viewer.test.tsx
  describe('CodeViewer', () => {
    it('displays file tree', () => {
      const files = mockFileTree()
      const { getByText } = render(
        <CodeViewer files={files} onFileSelect={jest.fn()} />
      )

      expect(getByText('src')).toBeDefined()
      expect(getByText('App.tsx')).toBeDefined()
    })

    it('highlights code syntax', async () => {
      const { getByTestId } = render(
        <SyntaxHighlighter
          code="const x = 1;"
          language="javascript"
        />
      )

      await waitFor(() => {
        const webview = getByTestId('code-webview')
        expect(webview).toBeDefined()
      })
    })

    it('selects file on click', () => {
      const onSelect = jest.fn()
      const { getByText } = render(
        <FileTree files={mockFileTree()} onSelect={onSelect} />
      )

      fireEvent.press(getByText('App.tsx'))
      expect(onSelect).toHaveBeenCalledWith('src/App.tsx')
    })
  })
  ```

- [ ] **Add Styling** (`styles/code-viewer.ts`):
  ```typescript
  export const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'row',
    },
    sidebar: {
      width: 250,
      borderRightWidth: 1,
      borderRightColor: '#ddd',
      backgroundColor: '#f8f8f8',
    },
    codePanel: {
      flex: 1,
      backgroundColor: '#1e1e1e',
    },
    nodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 8,
    },
    selectedNode: {
      backgroundColor: '#e3f2fd',
    },
    nodeText: {
      fontSize: 14,
      color: '#333',
    },
    selectedText: {
      color: '#007AFF',
      fontWeight: '600',
    },
  })
  ```

- [ ] **Document Code Viewer**:
  - Create: `docs/frontend/CODE_VIEWER.md`
  - Include: Architecture overview
  - Include: Language support
  - Include: Performance considerations
  - Include: Usage examples

- [ ] **Update links-map**

## Artifacts & Paths

**Components:**
- `frontend/components/code/CodeViewer.tsx`
- `frontend/components/code/SyntaxHighlighter.tsx`
- `frontend/components/code/FileTree.tsx`

**Screens:**
- `frontend/app/code/[sessionId].tsx`

**API:**
- `frontend/lib/api.ts` (updated)

**Tests:**
- `tests/frontend/code-viewer.test.tsx`

**Docs:**
- `docs/frontend/CODE_VIEWER.md` ⭐

## Testing

### Phase-Only Tests
- File tree displays correctly
- Code syntax highlighting works
- File selection updates viewer
- Scroll to line functions
- Large files perform well
- Touch gestures responsive

### Cross-Phase Compatibility
- Phase 23 will display generated code
- Phase 24+ may add search/edit features

### Test Commands
```bash
# Run tests
npm test -- tests/frontend/code-viewer.test.tsx

# Test on device
npx expo start
# Open code viewer screen
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Large files slow to render | UX | Implement virtual scrolling, lazy loading |
| WebView performance issues | Mobile | Consider native syntax highlighter alternative |
| Language detection inaccurate | UX | Allow manual language override |
| Memory leaks with file cache | Stability | Implement LRU cache with size limits |

## References

- [Architecture](./../../../../.docs/architecture.md) - Frontend architecture
- [Phase 21](./21-chat-interface.md) - Chat interface integration

## Handover

**Next Phase:** [23-webview-preview.md](./23-webview-preview.md) - Add WebView preview for generated apps

**Required Inputs Provided to Phase 23:**
- Code viewer component functional
- File tree navigation working
- Syntax highlighting integrated

---

**Status:** Ready after Phase 21
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 21 chat interface
