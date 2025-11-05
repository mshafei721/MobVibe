<!--
Status: stable
Owner: MobVibe Core Team
Last updated: 2025-11-05
Related: architecture.md, data-flow.md, features-and-journeys.md, design-system.md
-->

# MobVibe Implementation Guide

> See [SUMMARY.md](./SUMMARY.md) for complete documentation index.

> Technical stack, code structure, and implementation patterns

See [architecture.md](./architecture.md) for system architecture overview and [data-flow.md](./data-flow.md) for complete data flow diagrams.

## Tech Stack

### Mobile App
```yaml
Framework: React Native 0.81
Platform: Expo SDK 54
Language: TypeScript 5.3+
Routing: Expo Router (file-based)
Styling: NativeWind (Tailwind for RN)
State: Zustand 4.5+
Server State: React Query (TanStack Query)
UI Components: Custom + Expo built-ins
WebSocket: native WebSocket API
```

**Expo SDK 54 Improvements:**
- React Native 0.81 integration
- React 19.1 support for better performance
- Precompiled XCFrameworks for iOS (faster builds)
- Modern architecture with improved stability

### Backend
```yaml
Platform: Supabase
Functions: Edge Functions (Deno)
Database: PostgreSQL 15+
Auth: Supabase Auth (magic link, OAuth)
Storage: Supabase Storage
Realtime: Supabase Realtime (WebSocket)
```

### AI Services

**Server-Side API Proxy Architecture**

All AI services are proxied through backend Edge Functions. Users never provide or see API keys.

```yaml
Code Generation: Claude Agent SDK (claude-sonnet-4-5)
  - Proxied through: Worker Service
  - API Key Location: Worker Service environment
  - User Access: Via /start-coding-session endpoint

Icon Generation: Nano Banana API
  - Proxied through: supabase/functions/generate-icon
  - API Key Location: Edge Function secrets
  - User Access: Prompts only, receives signed URLs

3D Logo Generation: Meshy AI / Luma AI
  - Proxied through: supabase/functions/generate-3d-logo
  - API Key Location: Edge Function secrets
  - User Access: Prompts only, receives signed URLs

Sound Generation: ElevenLabs API
  - Proxied through: supabase/functions/generate-sound
  - API Key Location: Edge Function secrets
  - User Access: Text prompts only, receives signed URLs

Voice Transcription: Google Cloud Speech-to-Text (fallback)
  - Proxied through: supabase/functions/transcribe-audio
  - API Key Location: Edge Function secrets
  - User Access: Audio upload, receives transcript text
```

**Security Model:**
- Mobile app contains ZERO AI service API keys
- All AI API keys stored in backend environment variables
- Backend enforces authentication, rate limiting, and usage tracking
- Users access AI services only through authenticated endpoints

See [architecture.md](./architecture.md) for complete server-side proxy architecture details and [data-flow.md](./data-flow.md) for detailed AI service integration flows.

### Infrastructure
```yaml
Worker Service: Fly.io / Render / Railway (long-running)
Sandboxes: Fly.io Firecracker microVMs
Job Queue: Supabase Realtime / Redis
Container: Docker (Node 20 + Expo CLI + EAS CLI)
Payments: Stripe
Analytics: PostHog
Monitoring: Sentry
```

---

## Database Schema

See [architecture.md](./architecture.md) for database architecture context.

### Core Tables

```sql
-- Users and authentication
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  sessions_used INTEGER DEFAULT 0,
  sessions_limit INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects created by users
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  expo_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active coding sessions
CREATE TABLE coding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sandbox_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'failed')),
  initial_prompt TEXT NOT NULL,
  eas_update_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job queue for worker service
CREATE TABLE coding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 2,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_coding_jobs_status ON coding_jobs(status, priority, created_at);

-- File metadata (content stored in Supabase Storage)
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES coding_sessions(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('code', 'asset', 'config')),
  size_bytes INTEGER,
  created_by TEXT DEFAULT 'claude',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, path)
);

-- Agent events for debugging and history
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (WITH CHECK ensures inserts/updates are scoped)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON coding_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own project files"
  ON project_files FOR SELECT
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own agent events"
  ON agent_events FOR SELECT
  USING (session_id IN (SELECT id FROM coding_sessions WHERE user_id = auth.uid()));

-- Supabase Storage RLS (for project files bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

CREATE POLICY "Users can upload own project files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own project files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE user_id = auth.uid()
    )
  );
```

---

## Claude Agent SDK Configuration

See [architecture.md](./architecture.md) for Claude Agent architectural role and [data-flow.md](./data-flow.md) for coding session flow details.

### Agent Setup

```typescript
import Anthropic from '@anthropic-ai/sdk';

interface SandboxTools {
  exec: (args: string[]) => Promise<{ stdout: string; stderr: string }>;
  writeFile: (path: string, content: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  listFiles: (path: string) => Promise<string[]>;
}

async function createCodingAgent(
  sandbox: SandboxTools,
  projectId: string,
  prompt: string
) {
  const client = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
  });

  const systemPrompt = `You are an expert React Native developer building mobile apps with Expo.

Your Environment:
- Node.js 20+ with npm/npx
- Expo CLI installed globally
- Working directory: /workspace
- You have full bash access

Your Mission:
Build a mobile app based on the user's requirements.

Guidelines:
1. Use Expo SDK 54 and React Native 0.81
2. Use TypeScript with strict mode
3. Use Expo Router for navigation (file-based routing in app/ folder)
4. Use NativeWind for styling (Tailwind CSS for React Native)
5. Create clean, production-ready code
6. Install dependencies as needed with npm
7. Test your work by running "expo start --tunnel"
8. Fix any errors immediately
9. Provide clear completion messages

Available Tools:
- bash: Execute shell commands
- write_file: Create or update files
- read_file: Read file contents
- delete_file: Remove files
- list_files: List directory contents

Start by initializing the Expo project, then build the requested features.`;

  const tools = [
    {
      name: 'bash',
      description: 'Execute bash commands in the sandbox',
      input_schema: {
        type: 'object',
        properties: {
          command: {
            type: 'array',
            items: { type: 'string' },
            description: 'Command and arguments as array (e.g., ["npm", "install", "zustand"])'
          }
        },
        required: ['command']
      }
    },
    {
      name: 'write_file',
      description: 'Write content to a file',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path relative to /workspace'
          },
          content: {
            type: 'string',
            description: 'File content'
          }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'read_file',
      description: 'Read file contents',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path relative to /workspace'
          }
        },
        required: ['path']
      }
    },
    {
      name: 'list_files',
      description: 'List files in directory',
      input_schema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path relative to /workspace'
          }
        },
        required: ['path']
      }
    }
  ];

  return { client, systemPrompt, tools };
}
```

### Agent Loop Implementation

```typescript
async function runAgentLoop(
  client: Anthropic,
  systemPrompt: string,
  tools: any[],
  userPrompt: string,
  sandbox: SandboxTools,
  sessionId: string,
  emitEvent: (event: any) => void
) {
  const messages = [{ role: 'user', content: userPrompt }];
  let continueLoop = true;

  while (continueLoop) {
    // Send request to Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      system: systemPrompt,
      messages,
      tools
    });

    // Emit thinking event
    if (response.content.some(c => c.type === 'text')) {
      const thinking = response.content.find(c => c.type === 'text');
      emitEvent({
        type: 'thinking',
        message: thinking.text
      });
    }

    // Handle tool uses
    if (response.stop_reason === 'tool_use') {
      const toolResults = [];

      for (const content of response.content) {
        if (content.type === 'tool_use') {
          const result = await executeToolUse(
            content,
            sandbox,
            sessionId,
            emitEvent
          );
          toolResults.push(result);
        }
      }

      // Add assistant response and tool results to messages
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    } else {
      // Agent finished
      continueLoop = false;
      emitEvent({
        type: 'completion',
        message: response.content.find(c => c.type === 'text')?.text || 'Task completed'
      });
    }
  }
}

async function executeToolUse(
  toolUse: any,
  sandbox: SandboxTools,
  sessionId: string,
  emitEvent: (event: any) => void
) {
  const { name, input } = toolUse;

  try {
    let result: any;

    switch (name) {
      case 'bash':
        const { stdout, stderr } = await sandbox.exec(input.command);
        result = stdout || stderr;
        emitEvent({
          type: 'terminal',
          command: input.command.join(' '),
          output: result
        });
        break;

      case 'write_file':
        await sandbox.writeFile(input.path, input.content);

        // Upload to Supabase Storage
        const storagePath = `${sessionId}/${input.path}`;
        await supabase.storage
          .from('project-files')
          .upload(storagePath, input.content, {
            contentType: getContentType(input.path),
            upsert: true
          });

        // Save metadata to database
        await supabase.from('project_files').upsert({
          project_id: sessionId,
          path: input.path,
          storage_path: storagePath,
          file_type: getFileType(input.path),
          size_bytes: input.content.length,
          created_by: 'claude'
        });

        result = 'File written successfully';
        emitEvent({
          type: 'file_change',
          path: input.path,
          action: 'created',
          content: input.content
        });
        break;

      case 'read_file':
        result = await sandbox.readFile(input.path);
        break;

      case 'list_files':
        result = await sandbox.listFiles(input.path);
        break;

      default:
        result = 'Unknown tool';
    }

    return {
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: String(result)
    };
  } catch (error) {
    emitEvent({
      type: 'error',
      error: error.message
    });

    return {
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: `Error: ${error.message}`,
      is_error: true
    };
  }
}
```

---

## API Endpoints (Supabase Edge Functions)

### Start Coding Session

```typescript
// supabase/functions/start-coding-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { prompt, projectId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get user from auth header
  const authHeader = req.headers.get('Authorization')!;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check session limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('sessions_used, sessions_limit, tier')
    .eq('id', user.id)
    .single();

  if (profile.sessions_used >= profile.sessions_limit) {
    return new Response('Session limit reached', { status: 403 });
  }

  // Create session record
  const { data: session } = await supabase
    .from('coding_sessions')
    .insert({
      user_id: user.id,
      project_id: projectId,
      status: 'pending',
      initial_prompt: prompt,
      expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    })
    .select()
    .single();

  // Enqueue job for worker service
  await supabase
    .from('coding_jobs')
    .insert({
      session_id: session.id,
      prompt,
      status: 'queued',
      priority: profile.tier === 'pro' ? 1 : 2
    });

  // Return immediately (<5s total)
  return new Response(
    JSON.stringify({
      sessionId: session.id,
      wsUrl: `wss://your-realtime-endpoint.supabase.co/sessions/${session.id}`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### Continue Coding Session

```typescript
// supabase/functions/continue-coding/index.ts
serve(async (req) => {
  const { sessionId, prompt } = await req.json();

  // Verify session ownership
  const { data: session } = await supabase
    .from('coding_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Enqueue follow-up prompt
  await supabase
    .from('coding_jobs')
    .insert({
      session_id: sessionId,
      prompt,
      status: 'queued'
    });

  return new Response('Prompt queued', { status: 200 });
});
```

### Generate Icon (API Proxy)

```typescript
// supabase/functions/generate-icon/index.ts
serve(async (req) => {
  const { prompt, projectId } = await req.json();
  const user = await validateAuth(req);

  // Rate limiting check
  const usage = await checkUsage(user.id, 'icon_generation');
  if (usage.count >= usage.limit) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Call Nano Banana API (server-side key)
  const response = await fetch('https://api.nanobanana.com/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('NANO_BANANA_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      size: '1024x1024',
      format: 'png',
      style: 'app-icon'
    })
  });

  const { imageUrl } = await response.json();

  // Download and upload to Supabase Storage
  const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
  const filename = `${projectId}/icon-${Date.now()}.png`;

  await supabase.storage
    .from('project-files')
    .upload(filename, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600'
    });

  // Get signed URL
  const { data: signedUrl } = await supabase.storage
    .from('project-files')
    .createSignedUrl(filename, 3600);

  // Track usage
  await incrementUsage(user.id, 'icon_generation');

  return new Response(JSON.stringify({ url: signedUrl.signedUrl }));
});
```

### Generate Sound (API Proxy)

```typescript
// supabase/functions/generate-sound/index.ts
serve(async (req) => {
  const { text, projectId } = await req.json();
  const user = await validateAuth(req);

  // Rate limiting
  const usage = await checkUsage(user.id, 'sound_generation');
  if (usage.count >= usage.limit) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Call ElevenLabs (server-side key)
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY')!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1'
    })
  });

  const audioBuffer = await response.arrayBuffer();
  const filename = `${projectId}/sound-${Date.now()}.mp3`;

  // Upload to Storage
  await supabase.storage
    .from('project-files')
    .upload(filename, audioBuffer, {
      contentType: 'audio/mpeg',
      cacheControl: '3600'
    });

  // Get signed URL
  const { data: signedUrl } = await supabase.storage
    .from('project-files')
    .createSignedUrl(filename, 3600);

  // Track usage
  await incrementUsage(user.id, 'sound_generation');

  return new Response(JSON.stringify({ url: signedUrl.signedUrl }));
});
```

---

## Real-Time WebSocket Events

### Event Types

```typescript
// WebSocket event payloads
type WebSocketEvent =
  | { type: 'thinking'; message: string }
  | { type: 'terminal'; command: string; output: string }
  | { type: 'file_change'; path: string; content: string; action: 'created' | 'updated' | 'deleted' }
  | { type: 'preview_ready'; previewUrl: string; webviewUrl: string; branch: string; expiresIn: number }
  | { type: 'completion'; message: string }
  | { type: 'error'; error: string; suggestion?: string };
```

### Mobile WebSocket Client

```typescript
// mobile/hooks/useRealtimeSession.ts
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export function useRealtimeSession(sessionId: string) {
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_events',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const event = payload.new.event_data as WebSocketEvent;
          setEvents(prev => [...prev, event]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { events, isConnected };
}
```

---

## Mobile App Structure

See [design-system.md](./design-system.md) for UI component specifications and [features-and-journeys.md](./features-and-journeys.md) for user journey implementations.

### File Organization

```
mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (session)/               # Coding session with bottom tabs
│   │   ├── [id]/
│   │   │   ├── code.tsx         # Code tab
│   │   │   ├── preview.tsx      # Preview tab (WebView)
│   │   │   ├── integrations.tsx # Integrations tab
│   │   │   ├── icon-gen.tsx     # Icon generation tab
│   │   │   └── _layout.tsx      # Bottom tab navigator
│   │   └── index.tsx            # Session entry
│   ├── index.tsx                # Projects list (home)
│   └── _layout.tsx              # Root layout with hamburger menu
├── components/
│   ├── CodeViewer.tsx           # Syntax highlighted code viewer
│   ├── TerminalOutput.tsx       # Terminal output display
│   ├── PreviewWebView.tsx       # In-app preview WebView
│   ├── IconGenerator.tsx        # Nano Banana icon gen
│   ├── IntegrationsList.tsx     # Third-party integrations
│   └── PromptInput.tsx          # Chat-style prompt input
├── hooks/
│   ├── useRealtimeSession.ts    # WebSocket connection
│   ├── useSession.ts            # Session management
│   ├── useAuth.ts               # Authentication
│   └── usePreview.ts            # Preview URL management
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── api.ts                   # API functions
└── stores/
    └── sessionStore.ts          # Zustand state
```

### Key Components

```typescript
// components/CodeViewer.tsx
import { ScrollView, View } from 'react-native';
import { SyntaxHighlighter } from 'react-native-syntax-highlighter';

export function CodeViewer({ files }: { files: ProjectFile[] }) {
  return (
    <ScrollView className="flex-1 bg-gray-900">
      {files.map(file => (
        <View key={file.path} className="mb-4 p-4">
          <Text className="text-white font-mono mb-2">{file.path}</Text>
          <SyntaxHighlighter
            language="typescript"
            style={atomOneDark}
          >
            {file.content}
          </SyntaxHighlighter>
        </View>
      ))}
    </ScrollView>
  );
}
```

```typescript
// components/PromptInput.tsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

export function PromptInput({ onSend }: { onSend: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState('');

  return (
    <View className="flex-row items-center p-4 bg-white border-t border-gray-200">
      <TextInput
        className="flex-1 bg-gray-100 rounded-full px-4 py-2"
        placeholder="Describe what you want..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />
      <TouchableOpacity
        onPress={() => {
          onSend(prompt);
          setPrompt('');
        }}
        className="ml-2 bg-blue-500 rounded-full p-3"
      >
        <SendIcon />
      </TouchableOpacity>
    </View>
  );
}
```

```typescript
// components/PreviewWebView.tsx
import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export function PreviewWebView({ previewUrl }: { previewUrl?: string }) {
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    // Auto-reload when preview URL changes
    if (previewUrl && webviewRef.current) {
      webviewRef.current.reload();
    }
  }, [previewUrl]);

  if (!previewUrl) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-600">Generating preview...</Text>
      </View>
    );
  }

  return (
    <WebView
      ref={webviewRef}
      source={{ uri: previewUrl }}
      className="flex-1"
      startInLoadingState
      renderLoading={() => (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      )}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error:', nativeEvent);
      }}
    />
  );
}
```

```typescript
// components/IconGenerator.tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Image, Text } from 'react-native';

export function IconGenerator({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [iconUrl, setIconUrl] = useState<string>();

  const generateIcon = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('generate-icon', {
        body: { prompt, projectId }
      });
      setIconUrl(response.data.url);
    } catch (error) {
      console.error('Icon generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-semibold mb-2">Generate App Icon</Text>
      <TextInput
        className="bg-gray-100 rounded-lg px-4 py-3 mb-4"
        placeholder="Describe your icon (e.g., 'minimalist fitness app')"
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />
      <TouchableOpacity
        onPress={generateIcon}
        disabled={loading || !prompt}
        className="bg-blue-500 rounded-lg py-3 items-center"
      >
        <Text className="text-white font-semibold">
          {loading ? 'Generating...' : 'Generate Icon'}
        </Text>
      </TouchableOpacity>

      {iconUrl && (
        <View className="mt-6 items-center">
          <Image
            source={{ uri: iconUrl }}
            className="w-32 h-32 rounded-2xl"
          />
          <TouchableOpacity className="mt-4">
            <Text className="text-blue-500">Apply to Project</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

---

## Fly.io Sandbox Setup

### Dockerfile

```dockerfile
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Expo CLI globally
RUN npm install -g expo-cli eas-cli

# Create workspace
WORKDIR /workspace

# Expose Expo dev server port
EXPOSE 8081

CMD ["tail", "-f", "/dev/null"]
```

### Sandbox Manager

```typescript
// Fly.io API integration
async function createFlySandbox(projectId: string): Promise<string> {
  const flyToken = Deno.env.get('FLY_API_TOKEN')!;

  const response = await fetch('https://api.fly.io/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${flyToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        mutation CreateMachine {
          createMachine(
            input: {
              appName: "mobvibe-sandboxes"
              config: {
                image: "mobvibe-sandbox:latest"
                guest: { cpus: 1, memory_mb: 2048 }
                env: { PROJECT_ID: "${projectId}" }
              }
            }
          ) {
            id
          }
        }
      `
    })
  });

  const { data } = await response.json();
  return data.createMachine.id;
}

async function destroySandbox(sandboxId: string): Promise<void> {
  // Stop and destroy the Fly.io machine
  await fetch('https://api.fly.io/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('FLY_API_TOKEN')!}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        mutation DestroyMachine {
          destroyMachine(input: { id: "${sandboxId}" }) {
            id
          }
        }
      `
    })
  });
}
```

---

## Environment Variables

### Mobile App (.env)

```bash
# ✅ ONLY PUBLIC KEYS (safe to expose)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ❌ NO AI SERVICE KEYS IN MOBILE APP
# All AI APIs are server-side proxied:
# - Anthropic Claude API → Backend Worker Service
# - Nano Banana API → Edge Function /generate-icon
# - Meshy/Luma AI → Edge Function /generate-3d-logo
# - ElevenLabs API → Edge Function /generate-sound
# - OpenAI API → Edge Function /ai-service (future)
#
# This is a SECURITY FEATURE, not a limitation.
# Users never need to provide or manage AI API keys.
```

### Backend (Supabase Edge Functions)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
NANO_BANANA_API_KEY=your-nano-banana-key
ELEVENLABS_API_KEY=your-elevenlabs-key
FLY_API_TOKEN=your-fly-token
STRIPE_SECRET_KEY=your-stripe-key
```

### Worker Service (.env)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
FLY_API_TOKEN=your-fly-token
```

---

## Development Setup

### Prerequisites

```bash
# Install Node.js 20+
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Install Expo CLI
npm install -g expo-cli

# Install Supabase CLI
npm install -g supabase
```

### Project Initialization

```bash
# Clone repository
git clone <repo-url>
cd mobvibe

# Install dependencies
pnpm install

# Setup Supabase
cd backend/supabase
supabase init
supabase start
supabase db reset

# Start mobile app
cd ../../mobile
pnpm dev
```

### Running Development

```bash
# Terminal 1: Supabase
cd backend/supabase
supabase start

# Terminal 2: Mobile app
cd mobile
pnpm dev

# Terminal 3: Edge Functions (watch mode)
cd backend/supabase
supabase functions serve --env-file .env.local
```

---

**Status:** Implementation guide complete ✅ | Worker service pattern ✅ | Secure API proxies ✅ | EAS Update workflow ✅ | RLS hardened ✅
