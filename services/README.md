# Services

API clients and service integrations for MobVibe.

## Structure

- `supabase.ts` - Supabase client configuration
- `api/` - Complete API client and WebSocket integration
  - `apiClient.ts` - HTTP client with authentication
  - `eventStream.ts` - Realtime event streaming
  - `sessionService.ts` - High-level session orchestration
  - `errorHandler.ts` - Error classes and retry logic
  - `types.ts` - TypeScript type definitions
- `auth/` - Authentication service

## Quick Start

```typescript
import { sessionService } from '@/services/api';

// Create a session
const { session } = await sessionService.createSession(
  'project-id',
  'Build a todo app'
);

// Listen to events
sessionService.onThinking((data) => {
  console.log('AI thinking:', data.message);
});
```

See `api/README.md` for complete documentation.
