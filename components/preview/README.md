# Preview Components

Stream 4: Preview System components for MobVibe mobile WebView preview.

## Overview

The preview system displays live app previews using `react-native-webview` with real-time updates from the backend. It handles the complete preview lifecycle from loading to error states with a clean, consistent UI.

## Architecture

```
Preview System Flow:
┌─────────────────┐
│ usePreviewUrl   │ ← Fetches URL & subscribes to Realtime
│ Hook            │
└────────┬────────┘
         │
         ├─ loading=true ────────→ PreviewLoading
         │
         ├─ error/failed ────────→ PreviewError
         │
         └─ ready + url ─────────→ PreviewToolbar
                                   WebViewPreview
```

## Components

### 1. PreviewLoading

Displays loading spinner with status-based messaging during preview initialization.

**Props:**
- `status: PreviewStatus` - Current preview status (pending, starting, refreshing)
- `message?: string` - Optional custom message

**Usage:**
```tsx
import { PreviewLoading } from '@/components/preview';

<PreviewLoading status="starting" />
<PreviewLoading status="pending" message="Preparing environment..." />
```

**Design:**
- Centered layout with large spinner
- Status-specific messages
- Subtle hint text
- Uses Spinner primitive from src/ui/primitives/

---

### 2. PreviewError

Displays error state with icon, message, and retry button.

**Props:**
- `error: string` - Error message to display
- `onRetry?: () => void` - Optional callback to retry preview generation

**Usage:**
```tsx
import { PreviewError } from '@/components/preview';

<PreviewError
  error="Failed to start preview server"
  onRetry={() => retryPreview()}
/>
```

**Design:**
- Large error icon (ionicons/alert-circle-outline)
- Clear error messaging
- Primary button for retry
- Help text for troubleshooting
- Uses Button, Text, Icon primitives

---

### 3. WebViewPreview

Main WebView component for displaying live app previews with auto-refresh.

**Props:**
- `url: string` - Preview URL to load
- `onError?: (error: string) => void` - Optional error callback
- `onLoadEnd?: () => void` - Optional load completion callback
- `ref?: React.Ref<WebView>` - Optional ref for imperative actions

**Usage:**
```tsx
import { WebViewPreview } from '@/components/preview';
import { useRef } from 'react';
import { WebView } from 'react-native-webview';

const webViewRef = useRef<WebView>(null);

<WebViewPreview
  ref={webViewRef}
  url={previewUrl}
  onError={(error) => console.error(error)}
  onLoadEnd={() => console.log('Loaded')}
/>

// Imperative reload
webViewRef.current?.reload();
```

**Features:**
- Auto-refresh when URL changes
- Loading overlay during initial load
- Error handling with retry
- JavaScript and DOM storage enabled
- Platform-specific optimizations (iOS/Android)
- Cache enabled for performance
- Accessibility labels

**WebView Configuration:**
- `javaScriptEnabled={true}`
- `domStorageEnabled={true}`
- `cacheEnabled={true}`
- `allowsBackForwardNavigationGestures={true}` (iOS)
- `setSupportMultipleWindows={false}` (Android)

---

### 4. PreviewToolbar

Toolbar with reload, URL display, and share controls.

**Props:**
- `url: string` - Current preview URL to display
- `webViewRef?: React.RefObject<WebView>` - Reference to WebView for reload
- `onReload?: () => void` - Optional custom reload callback

**Usage:**
```tsx
import { PreviewToolbar } from '@/components/preview';
import { useRef } from 'react';
import { WebView } from 'react-native-webview';

const webViewRef = useRef<WebView>(null);

<PreviewToolbar
  url={previewUrl}
  webViewRef={webViewRef}
/>

// Custom reload callback
<PreviewToolbar
  url={previewUrl}
  webViewRef={webViewRef}
  onReload={() => {
    console.log('Custom reload');
    webViewRef.current?.reload();
  }}
/>
```

**Features:**
- Reload button (calls webViewRef.reload())
- URL display with ellipsis for long URLs
- Share button (React Native Share API)
- Copy URL on tap (shows alert)
- Platform-specific icons (iOS vs Android)
- Horizontal layout with proper spacing

---

## Complete Integration Example

```tsx
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { usePreviewUrl } from '@/hooks/usePreviewUrl';
import { tokens } from '@/src/ui/tokens';
import {
  PreviewLoading,
  PreviewError,
  WebViewPreview,
  PreviewToolbar,
} from '@/components/preview';

export function PreviewScreen({ sessionId }: { sessionId: string }) {
  const webViewRef = useRef<WebView>(null);
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  // Handle loading states
  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  // Handle error states
  if (error || status === 'failed') {
    return (
      <PreviewError
        error={error || 'Preview generation failed'}
        onRetry={retry}
      />
    );
  }

  // Handle missing URL
  if (!url) {
    return (
      <PreviewError
        error="Preview URL not available"
        onRetry={retry}
      />
    );
  }

  // Render preview with toolbar
  return (
    <View style={styles.container}>
      <PreviewToolbar url={url} webViewRef={webViewRef} />
      <WebViewPreview ref={webViewRef} url={url} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
});
```

## Backend Integration

### Database Schema
From `docs/backend/WEBVIEW_PREVIEW.md`:

```sql
-- coding_sessions table
preview_url: text | null
preview_status: enum ('pending' | 'starting' | 'ready' | 'failed' | 'stopped')
```

### Real-time Updates
Components automatically react to Supabase Realtime updates via `usePreviewUrl` hook:

```typescript
// Hook subscribes to:
channel: `session:${sessionId}`
table: 'coding_sessions'
event: 'UPDATE'
fields: { preview_url, preview_status }
```

### Preview URL Format
```
http://{sandboxId}.fly.dev:19006
```

Example: `http://late-shadow-1234.fly.dev:19006`

## State Flow

```
Preview Status Lifecycle:
┌─────────┐      ┌──────────┐      ┌───────┐
│ pending │ ───→ │ starting │ ───→ │ ready │
└─────────┘      └──────────┘      └───────┘
     │                 │                 │
     └─────────────────┴─────────────────┴─→ failed
```

## Design System

All components follow MobVibe design system:

**Tokens Used:**
- Colors: `tokens.colors.*`
- Spacing: `tokens.spacing[*]`, `tokens.spacing.borderRadius.*`
- Typography: `tokens.typography.*`

**Primitives Used:**
- `Button` - From src/ui/primitives/
- `Text` - Typography component
- `Icon` - Ionicons with proper sizing
- `Spinner` - Loading indicator

**Accessibility:**
- All interactive elements have accessibility labels
- Proper accessibility roles (button, progressbar)
- Accessibility hints for complex actions
- Screen reader friendly

## Platform Support

**iOS:**
- Native share sheet
- Back/forward gestures
- Inline media playback
- Capitalized button text

**Android:**
- Material Design share icon
- Uppercase button text
- Elevation for toolbar shadow
- Optimized multiple windows

## Testing Checklist

- [ ] Preview loads correctly with valid URL
- [ ] Loading state shows during initialization
- [ ] Error state shows on failed preview
- [ ] Retry button regenerates preview
- [ ] Toolbar reload button refreshes WebView
- [ ] Share button opens native share sheet
- [ ] URL display truncates long URLs
- [ ] Auto-refresh works on URL changes
- [ ] Platform-specific UI matches (iOS/Android)
- [ ] Accessibility labels present on all interactive elements

## Dependencies

**Required Packages:**
- `react-native-webview: ^13.12.5`
- `@expo/vector-icons` (for Ionicons)
- `react-native-haptic-feedback: ^2.3.3` (for Button primitive)

**Internal Dependencies:**
- `@/hooks/usePreviewUrl` - Preview URL fetching and Realtime subscription
- `@/src/ui/primitives` - Button, Text, Icon, Spinner
- `@/src/ui/tokens` - Design tokens
- `@/lib/supabase` - Supabase client (used by hook)

## File Structure

```
components/preview/
├── PreviewLoading.tsx        # Loading state component
├── PreviewError.tsx          # Error state component
├── WebViewPreview.tsx        # Main WebView component
├── PreviewToolbar.tsx        # Control toolbar
├── index.ts                  # Barrel exports
├── PreviewScreen.example.tsx # Integration examples
└── README.md                 # This file
```

## Future Enhancements

Potential improvements for future iterations:

1. **Console Logs Display**: Show app console logs in a panel
2. **Device Frame**: Add device frame around WebView for realistic preview
3. **Orientation Toggle**: Switch between portrait/landscape
4. **Device Presets**: iPhone, iPad, Android phone/tablet
5. **Screenshot Capture**: Take screenshots of preview
6. **Refresh Indicator**: Pull-to-refresh gesture
7. **URL History**: Navigate back/forward through URL changes
8. **Performance Metrics**: Display load time, memory usage
9. **Network Inspector**: Show network requests (like Chrome DevTools)
10. **Error Boundaries**: Graceful error handling for WebView crashes

## Related Documentation

- Backend: `docs/backend/WEBVIEW_PREVIEW.md`
- Hook: `hooks/usePreviewUrl.ts`
- Primitives: `src/ui/primitives/README.md`
- Tokens: `src/ui/tokens/README.md`

## Support

For issues or questions:
1. Check backend preview status in database
2. Verify preview_url is properly formatted
3. Test URL in external browser
4. Check Supabase Realtime subscription status
5. Review WebView error logs in console
