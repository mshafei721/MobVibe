import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type PreviewStatus = 'pending' | 'starting' | 'ready' | 'failed' | 'stopped' | 'refreshing'

export interface UsePreviewUrlReturn {
  url: string | null
  status: PreviewStatus
  loading: boolean
  error: string | null
  refresh: () => void
  retry: () => void
}

/**
 * Hook to fetch and subscribe to preview URL updates for a coding session
 *
 * Features:
 * - Fetches initial preview_url from database
 * - Subscribes to Supabase Realtime for live updates
 * - Handles preview status lifecycle (pending → starting → ready/failed)
 * - Provides refresh and retry functions
 *
 * @param sessionId - The ID of the coding session
 * @returns Preview URL state and control functions
 *
 * @example
 * ```tsx
 * const { url, status, loading, error, refresh, retry } = usePreviewUrl(sessionId)
 *
 * if (loading) return <LoadingSpinner />
 * if (error) return <ErrorView error={error} onRetry={retry} />
 * if (status === 'ready' && url) return <WebView source={{ uri: url }} />
 * ```
 */
export function usePreviewUrl(sessionId: string | null | undefined): UsePreviewUrlReturn {
  const [url, setUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<PreviewStatus>('pending')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preview URL from database
  const fetchPreviewUrl = async () => {
    if (!sessionId) {
      setLoading(false)
      setError('No session ID provided')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('coding_sessions')
        .select('preview_url, preview_status')
        .eq('id', sessionId)
        .single()

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      if (data) {
        setUrl(data.preview_url || null)
        setStatus((data.preview_status as PreviewStatus) || 'pending')
      }
    } catch (err) {
      console.error('[usePreviewUrl] Failed to fetch preview URL:', err)
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  // Refresh preview (re-fetch from database)
  const refresh = () => {
    fetchPreviewUrl()
  }

  // Retry preview generation (for failed previews)
  const retry = () => {
    // Reset error state
    setError(null)
    setStatus('pending')

    // TODO: Call backend API to regenerate preview
    // For now, just re-fetch to check if backend auto-retried
    fetchPreviewUrl()
  }

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!sessionId) return

    // Initial fetch
    fetchPreviewUrl()

    // Subscribe to preview URL updates
    const channel = supabase
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
          const newData = payload.new as {
            preview_url?: string
            preview_status?: PreviewStatus
          }

          console.log('[usePreviewUrl] Received update:', {
            url: newData.preview_url,
            status: newData.preview_status,
          })

          if (newData.preview_url !== undefined) {
            setUrl(newData.preview_url || null)
          }

          if (newData.preview_status) {
            setStatus(newData.preview_status)

            // Handle status-based updates
            if (newData.preview_status === 'ready' && newData.preview_url) {
              setLoading(false)
              setError(null)
            } else if (newData.preview_status === 'starting') {
              setLoading(true)
              setError(null)
            } else if (newData.preview_status === 'failed') {
              setLoading(false)
              setError('Preview generation failed')
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[usePreviewUrl] Subscription status:', status)
      })

    // Cleanup subscription
    return () => {
      console.log('[usePreviewUrl] Unsubscribing from session:', sessionId)
      channel.unsubscribe()
    }
  }, [sessionId])

  return {
    url,
    status,
    loading,
    error,
    refresh,
    retry,
  }
}
