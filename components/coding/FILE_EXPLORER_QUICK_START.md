# File Explorer - Quick Start Guide

## Installation

```bash
# Install dependencies
npm install @gorhom/bottom-sheet react-native-syntax-highlighter react-syntax-highlighter --legacy-peer-deps
```

## Configuration

### babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin', // MUST be last!
    ]
  };
};
```

## Basic Usage

### 1. Import Component
```tsx
import { FileExplorerSheet } from '@/components/coding';
```

### 2. Add State
```tsx
const [showFileExplorer, setShowFileExplorer] = useState(false);
```

### 3. Add Button
```tsx
<TouchableOpacity onPress={() => setShowFileExplorer(true)}>
  <Text>📁 Files</Text>
</TouchableOpacity>
```

### 4. Add Sheet
```tsx
<FileExplorerSheet
  sessionId={currentSession?.id}
  isVisible={showFileExplorer}
  onClose={() => setShowFileExplorer(false)}
/>
```

## Testing

### 1. Mock Data
```tsx
// Test with static files
const mockFiles = {
  'app/index.tsx': 'export default function App() { return <View />; }',
  'app/layout.tsx': 'export default function Layout() { return <Slot />; }',
  'components/Button.tsx': 'export const Button = () => <Pressable />;',
  'package.json': '{ "name": "test" }',
};
```

### 2. Use useFileChanges Hook
```tsx
import { useFileChanges } from '@/src/hooks/useFileChanges';

const { fileTree, fileChanges } = useFileChanges(sessionId);
// fileTree updates automatically with backend events
```

## Features

### File Tree
- ✅ Hierarchical display
- ✅ Expand/collapse folders
- ✅ File type icons
- ✅ File count badges
- ✅ Selection highlighting

### File Viewer
- ✅ Syntax highlighting (20+ languages)
- ✅ Line numbers
- ✅ Copy to clipboard
- ✅ Auto language detection
- ✅ Dark theme

### Search
- ✅ Fuzzy matching
- ✅ Highlight results
- ✅ Recent files
- ✅ Fast filtering

### Bottom Sheet
- ✅ Swipe gestures
- ✅ Two snap points (50%, 90%)
- ✅ Split view (30/70)
- ✅ Backdrop overlay

## Gestures

- **Swipe Up**: Open sheet
- **Swipe Down**: Close sheet
- **Tap File**: Select and view
- **Tap Folder**: Expand/collapse
- **Tap Search**: Toggle search mode
- **Tap Close**: Close sheet

## Keyboard Shortcuts (Future)

- `Cmd+P` / `Ctrl+P`: Open file search
- `Cmd+Shift+F` / `Ctrl+Shift+F`: Search in files
- `Esc`: Close sheet

## Common Issues

### Sheet not appearing
```tsx
// Make sure sessionId exists
{currentSession && (
  <FileExplorerSheet sessionId={currentSession.id} ... />
)}
```

### Files not loading
```tsx
// Check WebSocket connection
const { isConnected } = useSessionStore();
console.log('Connected:', isConnected);
```

### Syntax highlighting broken
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## Examples

### Example 1: Simple Integration
```tsx
function CodeScreen() {
  const [showFiles, setShowFiles] = useState(false);
  const { currentSession } = useSessionStore();

  return (
    <View>
      <Button onPress={() => setShowFiles(true)}>View Files</Button>

      <FileExplorerSheet
        sessionId={currentSession?.id}
        isVisible={showFiles}
        onClose={() => setShowFiles(false)}
      />
    </View>
  );
}
```

### Example 2: With Custom Button
```tsx
<TouchableOpacity
  style={styles.filesButton}
  onPress={() => setShowFileExplorer(true)}
  activeOpacity={0.7}
>
  <Text style={styles.icon}>📁</Text>
  <Text style={styles.label}>Files</Text>
  {fileCount > 0 && (
    <View style={styles.badge}>
      <Text>{fileCount}</Text>
    </View>
  )}
</TouchableOpacity>
```

### Example 3: Programmatic Control
```tsx
const sheetRef = useRef<BottomSheet>(null);

// Open to specific snap point
sheetRef.current?.snapToIndex(1); // 90%

// Close
sheetRef.current?.close();
```

## Performance Tips

1. **Large file trees**: Implement virtual scrolling
2. **Search**: Add debounce to input
3. **Memory**: Limit file content cache
4. **Animations**: Reduce motion for performance

## Next Steps

1. ✅ Basic setup complete
2. ⏳ Test with real backend
3. ⏳ Add loading states
4. ⏳ Implement error handling
5. ⏳ Add analytics tracking

## Support

- Documentation: `FILE_EXPLORER.md`
- Components: `components/coding/`
- Utilities: `utils/fileTree.ts`, `constants/fileIcons.ts`
- Hook: `src/hooks/useFileChanges.ts`

---

**Ready to use!** The file explorer is fully integrated and waiting for backend file events.
