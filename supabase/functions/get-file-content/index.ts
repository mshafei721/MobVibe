import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('sessionId')
    const filePath = url.searchParams.get('path')

    if (!sessionId) {
      throw new Error('Missing sessionId parameter')
    }

    if (!filePath) {
      throw new Error('Missing path parameter')
    }

    const { data: session, error: sessionError } = await supabase
      .from('coding_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found or unauthorized')
    }

    const storagePath = filePath.startsWith(`${sessionId}/`)
      ? filePath
      : `${sessionId}/${filePath}`

    const { data: fileData, error: fileError } = await supabase.storage
      .from('session-files')
      .download(storagePath)

    if (fileError) {
      throw new Error(`Failed to download file: ${fileError.message}`)
    }

    const content = await fileData.text()
    const language = detectLanguage(filePath)
    const lines = content.split('\n').length

    return new Response(
      JSON.stringify({
        path: filePath,
        content,
        language,
        lines,
        size: fileData.size,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-file-content:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    css: 'css',
    json: 'json',
    html: 'html',
    md: 'markdown',
    py: 'python',
    java: 'java',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'bash',
  }

  return languageMap[ext || ''] || 'text'
}
