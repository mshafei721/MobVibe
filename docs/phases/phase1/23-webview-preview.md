# 23-webview-preview.md
---
phase_id: 23
title: WebView Preview
duration_estimate: "2 days"
incremental_value: In-app preview of generated React Native apps
owners: [Frontend Engineer]
dependencies: [22]
linked_phases_forward: [24]
docs_referenced: [Architecture, Implementation]
repo_root: D:\009_Projects_AI\Personal_Projects\MobVibe
subagents:
  - name: WebResearcher
    tool: websearch
    queries: ["React Native WebView best practices", "Expo app preview", "Mobile device frame libraries"]
    outputs: ["/docs/research/phase1/23/webview-patterns.md"]
  - name: ContextCurator
    tool: context7
    scope: ["react-native-webview", "expo-web-browser", "mobile preview patterns"]
    outputs: ["/docs/context/phase1/23-context-bundle.md"]
  - name: Sequencer
    tool: sequentialthinking
    goal: "Generate step-by-step plan for building in-app WebView preview with auto-refresh"
    outputs: ["/docs/sequencing/phase1/23-webview-steps.md"]
acceptance_criteria:
  - Preview loads generated app URL
  - Auto-refresh on app updates
  - Reload button functional
  - Error handling displays issues
  - Device frame optional
  - Screenshot capture works
  - Loading states clear
---

## Objectives

1. **WebView Integration** - Display generated app in-app
2. **Auto-Refresh** - Update preview on code changes
3. **Device Frame** - Optional mobile device frame UI

## Scope

### In
- WebView component for app preview
- URL loading and navigation
- Auto-refresh on updates
- Manual reload button
- Error handling and display
- Loading states
- Screenshot capture
- Device frame (optional aesthetic)
- Basic debugging (console logs)

### Out
- Advanced debugging (full DevTools)
- Multiple device previews simultaneously
- Network traffic inspection (later)
- Performance profiling (later)

## Tasks

- [ ] **Use context7**, **websearch**, **sequentialthinking** per template

- [ ] **Install Dependencies**:
  ```bash
  cd frontend
  npx expo install react-native-webview
  npm install react-native-view-shot
  ```

- [ ] **Create WebViewPreview Component** (`components/preview/WebViewPreview.tsx`):
  ```typescript
  import React, { useRef, useState, useEffect } from 'react'
  import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
  import { WebView } from 'react-native-webview'
  import { Ionicons } from '@expo/vector-icons'
  import ViewShot from 'react-native-view-shot'

  interface WebViewPreviewProps {
    url: string
    onError?: (error: string) => void
    onLoad?: () => void
    autoRefresh?: boolean
    showDeviceFrame?: boolean
  }

  export function WebViewPreview({
    url,
    onError,
    onLoad,
    autoRefresh = true,
    showDeviceFrame = false,
  }: WebViewPreviewProps) {
    const webViewRef = useRef<WebView>(null)
    const viewShotRef = useRef<ViewShot>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()
    const [refreshKey, setRefreshKey] = useState(0)

    // Auto-refresh on URL change
    useEffect(() => {
      if (autoRefresh) {
        setRefreshKey(prev => prev + 1)
      }
    }, [url, autoRefresh])

    const handleReload = () => {
      webViewRef.current?.reload()
    }

    const handleError = (event: any) => {
      const errorMessage = event.nativeEvent.description || 'Failed to load preview'
      setError(errorMessage)
      onError?.(errorMessage)
    }

    const handleLoad = () => {
      setLoading(false)
      setError(undefined)
      onLoad?.()
    }

    const captureScreenshot = async () => {
      if (!viewShotRef.current) return

      try {
        const uri = await viewShotRef.current.capture()
        return uri
      } catch (error) {
        console.error('Screenshot capture failed:', error)
      }
    }

    const preview = (
      <ViewShot ref={viewShotRef} style={styles.webviewContainer}>
        <WebView
          key={refreshKey}
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onLoad={handleLoad}
          onError={handleError}
          onLoadStart={() => setLoading(true)}
          startInLoadingDelay={1000}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onMessage={(event) => {
            // Handle messages from WebView
            console.log('WebView message:', event.nativeEvent.data)
          }}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#FF3B30" />
            <Text style={styles.errorTitle}>Preview Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ViewShot>
    )

    if (showDeviceFrame) {
      return (
        <DeviceFrame>
          {preview}
        </DeviceFrame>
      )
    }

    return (
      <View style={styles.container}>
        <PreviewToolbar
          onReload={handleReload}
          onScreenshot={captureScreenshot}
          url={url}
        />
        {preview}
      </View>
    )
  }
  ```

- [ ] **Create PreviewToolbar Component** (`components/preview/PreviewToolbar.tsx`):
  ```typescript
  import React from 'react'
  import { View, Text, TouchableOpacity, Share } from 'react-native'
  import { Ionicons } from '@expo/vector-icons'

  interface PreviewToolbarProps {
    url: string
    onReload: () => void
    onScreenshot: () => Promise<string | undefined>
  }

  export function PreviewToolbar({ url, onReload, onScreenshot }: PreviewToolbarProps) {
    const handleShare = async () => {
      try {
        await Share.share({
          message: `Check out my app preview: ${url}`,
          url: url,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }

    const handleScreenshot = async () => {
      const uri = await onScreenshot()
      if (uri) {
        // Save or share screenshot
        await Share.share({
          url: uri,
          message: 'App screenshot',
        })
      }
    }

    return (
      <View style={styles.toolbar}>
        <View style={styles.urlContainer}>
          <Text style={styles.urlText} numberOfLines={1}>
            {url}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={onReload}>
            <Ionicons name="reload" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleScreenshot}>
            <Ionicons name="camera" size={20} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
  ```

- [ ] **Create DeviceFrame Component** (`components/preview/DeviceFrame.tsx`):
  ```typescript
  import React from 'react'
  import { View, Dimensions } from 'react-native'

  interface DeviceFrameProps {
    children: React.ReactNode
    device?: 'iphone14' | 'pixel7'
  }

  export function DeviceFrame({ children, device = 'iphone14' }: DeviceFrameProps) {
    const dimensions = getDeviceDimensions(device)

    return (
      <View style={styles.frameContainer}>
        <View style={[styles.frame, dimensions]}>
          {/* Device notch/cutout */}
          <View style={styles.notch} />

          {/* Screen content */}
          <View style={styles.screen}>
            {children}
          </View>

          {/* Home indicator */}
          <View style={styles.homeIndicator} />
        </View>
      </View>
    )
  }

  function getDeviceDimensions(device: string) {
    const frames = {
      iphone14: {
        width: 390,
        height: 844,
        borderRadius: 47,
      },
      pixel7: {
        width: 412,
        height: 915,
        borderRadius: 32,
      },
    }

    return frames[device] || frames.iphone14
  }
  ```

- [ ] **Create Preview Screen** (`app/preview/[sessionId].tsx`):
  ```typescript
  import React, { useEffect, useState } from 'react'
  import { View, Text } from 'react-native'
  import { useLocalSearchParams } from 'expo-router'
  import { WebViewPreview } from '@/components/preview/WebViewPreview'
  import { usePreviewUrl } from '@/hooks/usePreviewUrl'

  export default function PreviewScreen() {
    const { sessionId } = useLocalSearchParams()
    const { url, loading, error, refresh } = usePreviewUrl(sessionId as string)

    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text>Preparing preview...</Text>
        </View>
      )
    }

    if (error || !url) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error || 'Preview not available'}
          </Text>
        </View>
      )
    }

    return (
      <WebViewPreview
        url={url}
        autoRefresh={true}
        showDeviceFrame={false}
        onError={(err) => console.error('Preview error:', err)}
      />
    )
  }
  ```

- [ ] **Create usePreviewUrl Hook** (`hooks/usePreviewUrl.ts`):
  ```typescript
  import { useState, useEffect } from 'react'
  import { supabase } from '@/lib/supabase'

  export function usePreviewUrl(sessionId: string) {
    const [url, setUrl] = useState<string>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    useEffect(() => {
      fetchPreviewUrl()

      // Subscribe to preview URL updates
      const subscription = supabase
        .channel(`session:${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'coding_sessions',
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload.new.preview_url) {
              setUrl(payload.new.preview_url)
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }, [sessionId])

    const fetchPreviewUrl = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('coding_sessions')
          .select('preview_url')
          .eq('id', sessionId)
          .single()

        if (fetchError) throw fetchError

        if (data?.preview_url) {
          setUrl(data.preview_url)
        } else {
          setError('Preview URL not available yet')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const refresh = () => {
      setLoading(true)
      fetchPreviewUrl()
    }

    return { url, loading, error, refresh }
  }
  ```

- [ ] **Add Backend Preview URL Generation**:
  ```typescript
  // backend/worker/src/PreviewManager.ts
  export class PreviewManager {
    async generatePreviewUrl(sessionId: string, sandboxId: string): Promise<string> {
      // Start Expo dev server in sandbox
      await this.sandboxes.execInSandbox(sessionId, [
        'npx', 'expo', 'start', '--web', '--port', '19006'
      ])

      // Get sandbox IP
      const sandbox = await this.sandboxes.getSandbox(sandboxId)

      // Generate preview URL
      const previewUrl = `http://${sandbox.ip}:19006`

      // Update session with preview URL
      await this.updateSessionPreviewUrl(sessionId, previewUrl)

      return previewUrl
    }

    private async updateSessionPreviewUrl(sessionId: string, url: string) {
      const { error } = await supabase
        .from('coding_sessions')
        .update({ preview_url: url })
        .eq('id', sessionId)

      if (error) {
        throw new Error(`Failed to update preview URL: ${error.message}`)
      }
    }
  }
  ```

- [ ] **Add Console Log Capture** (optional):
  ```typescript
  // Inject script to capture console logs
  const injectedJavaScript = `
    (function() {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = function(...args) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          level: 'log',
          args: args
        }));
        originalLog.apply(console, args);
      };

      console.error = function(...args) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          level: 'error',
          args: args
        }));
        originalError.apply(console, args);
      };

      console.warn = function(...args) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          level: 'warn',
          args: args
        }));
        originalWarn.apply(console, args);
      };
    })();
    true;
  `
  ```

- [ ] **Add Tests**:
  ```typescript
  // tests/frontend/webview-preview.test.tsx
  describe('WebViewPreview', () => {
    it('loads preview URL', async () => {
      const { getByTestId } = render(
        <WebViewPreview url="http://example.com" />
      )

      const webview = getByTestId('preview-webview')
      expect(webview.props.source.uri).toBe('http://example.com')
    })

    it('reloads on button press', () => {
      const { getByTestId } = render(
        <WebViewPreview url="http://example.com" />
      )

      const reloadButton = getByTestId('reload-button')
      fireEvent.press(reloadButton)

      // Verify reload called
    })

    it('displays error on load failure', async () => {
      const { getByText } = render(
        <WebViewPreview url="http://invalid" />
      )

      await waitFor(() => {
        expect(getByText('Preview Error')).toBeDefined()
      })
    })

    it('captures screenshot', async () => {
      const { getByTestId } = render(
        <WebViewPreview url="http://example.com" />
      )

      const screenshotButton = getByTestId('screenshot-button')
      fireEvent.press(screenshotButton)

      // Verify screenshot captured
    })
  })
  ```

- [ ] **Add Styling** (`styles/preview.ts`):
  ```typescript
  export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
      backgroundColor: '#f8f8f8',
    },
    urlContainer: {
      flex: 1,
      marginRight: 12,
    },
    urlText: {
      fontSize: 12,
      color: '#666',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      padding: 4,
    },
    webviewContainer: {
      flex: 1,
      position: 'relative',
    },
    webview: {
      flex: 1,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      color: '#333',
    },
    errorMessage: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginTop: 8,
    },
    retryButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#007AFF',
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  })
  ```

- [ ] **Document WebView Preview**:
  - Create: `docs/frontend/WEBVIEW_PREVIEW.md`
  - Include: Architecture overview
  - Include: Preview URL generation
  - Include: Auto-refresh mechanism
  - Include: Debugging tips

- [ ] **Update links-map**

## Artifacts & Paths

**Components:**
- `frontend/components/preview/WebViewPreview.tsx`
- `frontend/components/preview/PreviewToolbar.tsx`
- `frontend/components/preview/DeviceFrame.tsx`

**Screens:**
- `frontend/app/preview/[sessionId].tsx`

**Hooks:**
- `frontend/hooks/usePreviewUrl.ts`

**Backend:**
- `backend/worker/src/PreviewManager.ts` (new)

**Tests:**
- `tests/frontend/webview-preview.test.tsx`

**Docs:**
- `docs/frontend/WEBVIEW_PREVIEW.md` ⭐

## Testing

### Phase-Only Tests
- Preview loads URL correctly
- Reload button refreshes preview
- Auto-refresh on URL change
- Error states display properly
- Screenshot capture works
- Device frame renders correctly

### Cross-Phase Compatibility
- Phase 24+ will enhance preview features
- Integration with code viewer (Phase 22)

### Test Commands
```bash
# Run tests
npm test -- tests/frontend/webview-preview.test.tsx

# Test on device
npx expo start
# Navigate to preview screen
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|------|------------|
| Preview URL not accessible from device | High | Use tunnel/ngrok for dev, proper networking for prod |
| WebView performance issues | UX | Optimize preview app, consider native preview |
| Auto-refresh too aggressive | UX | Add debounce, manual refresh option |
| CORS issues with preview | High | Configure sandbox to allow cross-origin requests |

## References

- [Architecture](./../../../../.docs/architecture.md) - Frontend architecture
- [Phase 22](./22-code-viewer-component.md) - Code viewer integration

## Handover

**Next Phase:** [24-session-management.md](./24-session-management.md) - Add session creation and management

**Required Inputs Provided to Phase 24:**
- WebView preview functional
- Preview URL generation working
- Auto-refresh mechanism implemented

---

**Status:** Ready after Phase 22
**Estimated Time:** 2 days
**Blocking Issues:** Requires Phase 22 code viewer, backend preview URL generation
