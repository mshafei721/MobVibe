import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  language?: string
  children?: FileNode[]
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

    if (!sessionId) {
      throw new Error('Missing sessionId parameter')
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

    const { data: files, error: filesError } = await supabase.storage
      .from('session-files')
      .list(`${sessionId}`, {
        sortBy: { column: 'name', order: 'asc' },
      })

    if (filesError) {
      throw new Error(`Failed to list files: ${filesError.message}`)
    }

    const fileTree = buildFileTree(files || [], sessionId)

    return new Response(JSON.stringify({ files: fileTree }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in get-session-files:', error)

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

function buildFileTree(files: any[], sessionId: string): FileNode[] {
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

      if (!isFile) {
        const dir = currentMap.get(part)!
        if (!dir.children) {
          dir.children = []
        }
        const childMap = new Map<string, FileNode>()
        for (const child of dir.children) {
          childMap.set(child.name, child)
        }
        currentMap = childMap
      }
    }
  }

  return Array.from(root.values()).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'directory' ? -1 : 1
  })
}

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
