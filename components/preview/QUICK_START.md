# Preview System Quick Start

> Fast reference for implementing preview functionality in your screens

## Basic Implementation (3 Steps)

### 1. Import Dependencies

```tsx
import { useRef } from 'react';
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
```

### 2. Setup Hook & State

```tsx
function YourPreviewScreen({ sessionId }: { sessionId: string }) {
  const webViewRef = useRef<WebView>(null);
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  // Continue to step 3...
}
```

### 3. Render Based on State

```tsx
  // Loading state
  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  // Error state
  if (error || status === 'failed' || !url) {
    return (
      <PreviewError
        error={error || 'Preview unavailable'}
        onRetry={retry}
      />
    );
  }

  // Success state
  return (
    <View style={styles.container}>
      <PreviewToolbar url={url} webViewRef={webViewRef} />
      <WebViewPreview ref={webViewRef} url={url} />
    </View>
  );
```

## Complete Working Example

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

interface PreviewScreenProps {
  sessionId: string;
}

export default function PreviewScreen({ sessionId }: PreviewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  if (error || status === 'failed' || !url) {
    return (
      <PreviewError
        error={error || 'Preview unavailable'}
        onRetry={retry}
      />
    );
  }

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

## Minimal Version (No Toolbar)

```tsx
export default function MinimalPreview({ sessionId }: { sessionId: string }) {
  const { url, status, loading, error, retry } = usePreviewUrl(sessionId);

  if (loading || status === 'pending' || status === 'starting') {
    return <PreviewLoading status={status} />;
  }

  if (error || status === 'failed' || !url) {
    return <PreviewError error={error || 'Preview unavailable'} onRetry={retry} />;
  }

  return <WebViewPreview url={url} />;
}
```

## Custom Callbacks

```tsx
<WebViewPreview
  ref={webViewRef}
  url={url}
  onError={(errorMessage) => {
    console.error('Preview error:', errorMessage);
    // Track analytics, show toast, etc.
  }}
  onLoadEnd={() => {
    console.log('Preview loaded successfully');
    // Hide splash screen, track event, etc.
  }}
/>
```

## Imperative WebView Control

```tsx
const webViewRef = useRef<WebView>(null);

// Reload WebView programmatically
const handleCustomReload = () => {
  webViewRef.current?.reload();
};

// Inject JavaScript
const injectJS = () => {
  webViewRef.current?.injectJavaScript(`
    console.log('Injected from parent!');
    true; // Required by React Native WebView
  `);
};

// Go back/forward (if enabled)
const goBack = () => webViewRef.current?.goBack();
const goForward = () => webViewRef.current?.goForward();
```

## Common Patterns

### Empty Session State

```tsx
import { EmptyPreviewState } from '@/components/preview';

// When no session is active
if (!sessionId) {
  return (
    <EmptyPreviewState
      message="No Active Session"
      description="Start a coding session to see your app preview"
    />
  );
}
```

### Custom Loading Message

```tsx
<PreviewLoading
  status="starting"
  message="Preparing your custom environment..."
/>
```

### Custom Toolbar Reload

```tsx
<PreviewToolbar
  url={url}
  webViewRef={webViewRef}
  onReload={() => {
    console.log('Custom reload logic');
    // Add haptics, analytics, etc.
    webViewRef.current?.reload();
  }}
/>
```

## Troubleshooting

### Preview Not Loading

1. Check preview_status in database (should be 'ready')
2. Verify preview_url is properly formatted
3. Test URL in external browser
4. Check WebView error logs in console

### Real-time Updates Not Working

1. Verify Supabase Realtime is enabled for table
2. Check subscription status in console logs
3. Ensure sessionId is stable (not changing)
4. Test with manual database updates

### WebView Shows Blank

1. Check if JavaScript is enabled (default: true)
2. Verify URL is accessible from device
3. Check for CORS issues (not applicable for Expo previews)
4. Try clearing cache: webViewRef.current?.clearCache(true)

### Share Button Not Working

1. Test on physical device (simulator may have limited share)
2. Check Share API permissions
3. Verify URL format is valid

## Next Steps

- Read full documentation: `components/preview/README.md`
- Check backend integration: `docs/backend/WEBVIEW_PREVIEW.md`
- Explore hook details: `hooks/usePreviewUrl.ts`
- See example implementations: `components/preview/PreviewScreen.example.tsx`
