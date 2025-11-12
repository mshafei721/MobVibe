# Preview System Component Hierarchy

> Visual reference for component structure and data flow

## Component Tree

```
PreviewScreen (your implementation)
│
├── usePreviewUrl(sessionId)
│   ├── url: string | null
│   ├── status: PreviewStatus
│   ├── loading: boolean
│   ├── error: string | null
│   ├── refresh: () => void
│   └── retry: () => void
│
├── [Conditional Render: loading || pending || starting]
│   └── PreviewLoading
│       ├── Spinner (primitive)
│       ├── Text (primitive) - Status message
│       └── Text (primitive) - Hint
│
├── [Conditional Render: error || failed]
│   └── PreviewError
│       ├── Icon (primitive) - alert-circle
│       ├── Text (primitive) - Title
│       ├── Text (primitive) - Error message
│       ├── Button (primitive) - Retry
│       └── Text (primitive) - Help text
│
└── [Conditional Render: ready && url]
    ├── PreviewToolbar
    │   ├── TouchableOpacity - Reload
    │   │   └── Icon (primitive) - reload-outline
    │   ├── TouchableOpacity - URL Display
    │   │   ├── Icon (primitive) - link-outline
    │   │   └── Text (primitive) - Truncated URL
    │   └── TouchableOpacity - Share
    │       └── Icon (primitive) - share-outline/share-social-outline
    │
    └── WebViewPreview (forwardRef)
        ├── WebView (react-native-webview)
        │   ├── javaScriptEnabled: true
        │   ├── domStorageEnabled: true
        │   ├── cacheEnabled: true
        │   ├── onLoadStart: () => setLoading(true)
        │   ├── onLoadEnd: () => setLoading(false)
        │   ├── onError: (e) => setError(e)
        │   └── onHttpError: (e) => setError(e)
        │
        └── [Conditional Overlay: loading]
            └── PreviewLoading
```

## Data Flow Diagram

```
Backend (Supabase)                    Frontend (React Native)
┌─────────────────┐                  ┌──────────────────┐
│ coding_sessions │                  │  PreviewScreen   │
│                 │                  │                  │
│ • preview_url   │◄─────fetch───────┤  usePreviewUrl   │
│ • preview_status│                  │                  │
└────────┬────────┘                  └────────┬─────────┘
         │                                     │
         │ Realtime Update                    │ State Change
         │ (postgres_changes)                 │
         │                                     ▼
         └────────subscribe──────────►┌────────────────┐
                                       │ Component Tree │
                                       └────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
          ┌─────────────────┐      ┌─────────────────┐        ┌─────────────────┐
          │ PreviewLoading  │      │  PreviewError   │        │ PreviewToolbar  │
          └─────────────────┘      └─────────────────┘        │ WebViewPreview  │
                                                                └─────────────────┘
```

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                     Preview State Machine                    │
└─────────────────────────────────────────────────────────────┘

[Initial] ────sessionId────► [Fetching]
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              [Loading]                      [Error]
        (pending/starting)                   (failed)
                    │                             │
                    │                             │ retry()
         preview_url ready                        │
                    │                             │
                    ▼                             │
              [Ready] ◄──────────────────────────┘
            (url available)
                    │
                    │ URL changes
                    ▼
            [Auto-Refresh]
                    │
                    └──► Back to [Ready]

User Actions:
• refresh() - Re-fetch from database
• retry() - Attempt preview regeneration
• webViewRef.reload() - Reload WebView content
```

## Component Interaction Flow

```
User Action                    Component Response                    WebView Action
─────────────────────────────────────────────────────────────────────────────────

[Screen Loads]
  sessionId provided ───────►  usePreviewUrl fetches ──────────────► N/A
                               PreviewLoading shown
                                      │
                              Supabase returns data
                                      │
                              preview_status = 'ready'
                              preview_url = 'http://...'
                                      │
                               PreviewToolbar ◄────────────────────► webViewRef
                               WebViewPreview                         created
                                      │
                               WebView renders ────────────────────► Load URL


[URL Changes]
  Backend updates DB ───────►  Realtime event received
                               usePreviewUrl updates state
                                      │
                               WebViewPreview useEffect ────────────► webViewRef
                               detects URL change                      .reload()


[Reload Button]
  User taps reload ─────────►  PreviewToolbar
                               onPress={() => webViewRef.current?.reload()}
                                      │
                               WebView reloads ─────────────────────► Fetch URL


[Share Button]
  User taps share ──────────►  PreviewToolbar
                               Share.share({ message, url })
                                      │
                               Native share sheet ──────────────────► OS UI


[Error Occurs]
  WebView fails ────────────►  onError callback
                               setError(message)
                                      │
                               PreviewError shown
                               with retry button
                                      │
  User taps retry ──────────►  onRetry callback
                               usePreviewUrl.retry()
                                      │
                               Re-fetch & regenerate ───────────────► Backend
```

## Component Dependencies

```
PreviewLoading
├── Primitives
│   ├── Spinner (ActivityIndicator wrapper)
│   └── Text (Typography component)
├── Tokens
│   ├── colors.primary[500]
│   ├── colors.text.secondary
│   ├── colors.text.tertiary
│   ├── colors.background.base
│   ├── spacing[2-6]
│   └── spacing.borderRadius
└── Types
    └── PreviewStatus (from usePreviewUrl)

PreviewError
├── Primitives
│   ├── Button (with haptics)
│   ├── Text (Typography component)
│   └── Icon (Ionicons wrapper)
├── Tokens
│   ├── colors.error[500]
│   ├── colors.text.primary
│   ├── colors.text.secondary
│   ├── colors.text.tertiary
│   ├── colors.background.base
│   ├── colors.surface[1]
│   ├── colors.border.primary
│   ├── spacing[2-6]
│   └── spacing.borderRadius.md
└── React Native
    └── Alert

WebViewPreview
├── External
│   └── react-native-webview
│       └── WebView component
├── Components
│   └── PreviewLoading (overlay)
├── Tokens
│   └── colors.background.base
└── React
    ├── useRef
    ├── useState
    ├── useEffect
    └── forwardRef

PreviewToolbar
├── Primitives
│   ├── Text (Typography component)
│   └── Icon (Ionicons wrapper)
├── Tokens
│   ├── colors.primary[500]
│   ├── colors.text.secondary
│   ├── colors.text.tertiary
│   ├── colors.background.base
│   ├── colors.surface[1]
│   ├── colors.border.subtle
│   ├── colors.neutral[900]
│   ├── spacing[2-4]
│   └── spacing.borderRadius.md
├── React Native
│   ├── TouchableOpacity
│   ├── Share
│   ├── Alert
│   └── Platform
└── External
    └── WebView (ref)
```

## Hook Integration

```
usePreviewUrl(sessionId)
│
├── Internal State
│   ├── url: string | null
│   ├── status: PreviewStatus
│   ├── loading: boolean
│   └── error: string | null
│
├── Functions
│   ├── fetchPreviewUrl() - Initial fetch
│   ├── refresh() - Re-fetch from DB
│   └── retry() - Regenerate preview
│
├── Effects
│   ├── useEffect(() => {
│   │     fetchPreviewUrl()
│   │     subscribeToRealtime()
│   │     return () => unsubscribe()
│   │   }, [sessionId])
│   │
│   └── Realtime Subscription
│       └── channel: `session:${sessionId}`
│           └── on('UPDATE') ───────► Update state
│
└── Returns
    ├── url
    ├── status
    ├── loading
    ├── error
    ├── refresh
    └── retry
```

## Platform-Specific Rendering

```
Platform.OS === 'ios'                Platform.OS === 'android'
───────────────────────────────────────────────────────────────

PreviewToolbar
├── Share Icon: share-outline        ├── Share Icon: share-social-outline
├── Shadow: shadowColor/Offset       ├── Shadow: elevation
└── Button Text: Capitalize          └── Button Text: Uppercase

WebViewPreview
├── allowsBackForwardGestures        ├── setSupportMultipleWindows: false
├── allowsInlineMediaPlayback        ├── allowFileAccess: false
└── mediaPlaybackRequiresUserAction  └── (Android-specific optimizations)

Button Primitive
├── minHeight: 44px (iOS)            ├── minHeight: 48px (Android)
├── textTransform: capitalize        ├── textTransform: uppercase
└── Haptic feedback                  └── Haptic feedback
```

## Error Handling Chain

```
WebView Error Sources
│
├── onError (WebView native error)
│   └── event.nativeEvent.description
│       └── setError(description)
│           └── PreviewError shown
│
├── onHttpError (HTTP status codes)
│   └── event.nativeEvent.statusCode
│       └── setError(`HTTP Error ${statusCode}`)
│           └── PreviewError shown
│
└── Backend Error (preview_status = 'failed')
    └── usePreviewUrl.error
        └── PreviewError shown
            └── Retry button calls usePreviewUrl.retry()
                └── Re-fetch or regenerate
                    └── Backend API call (TODO)
```

## Complete Usage Pattern

```typescript
// 1. Import everything needed
import { useRef } from 'react';
import { WebView } from 'react-native-webview';
import { usePreviewUrl } from '@/hooks/usePreviewUrl';
import {
  PreviewLoading,
  PreviewError,
  WebViewPreview,
  PreviewToolbar,
} from '@/components/preview';

// 2. Setup hook and ref
const webViewRef = useRef<WebView>(null);
const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

// 3. Render based on state
if (loading || status === 'pending' || status === 'starting') {
  return <PreviewLoading status={status} />;
}

if (error || status === 'failed' || !url) {
  return <PreviewError error={error || 'Preview unavailable'} onRetry={retry} />;
}

return (
  <View style={{ flex: 1 }}>
    <PreviewToolbar url={url} webViewRef={webViewRef} />
    <WebViewPreview ref={webViewRef} url={url} />
  </View>
);
```

## Summary

This hierarchy shows:
- Component nesting and composition
- Data flow from backend to UI
- State machine transitions
- User interaction patterns
- Platform-specific adaptations
- Error handling cascades
- Complete integration pattern

All components work together seamlessly to provide a robust preview experience with proper loading, error, and success states.
