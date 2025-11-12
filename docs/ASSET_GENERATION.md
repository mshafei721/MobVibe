# Asset Generation System - Stream 5

Complete AI-powered asset generation system for MobVibe, enabling users to generate app icons and sound effects using AI APIs.

## Overview

The Asset Generation system provides:
- AI-powered app icon generation (6 variants)
- AI-powered sound effect generation (4 variants)
- Asset library management
- Preview and playback capabilities
- One-tap application to projects

## Architecture

### Technology Stack

```yaml
Frontend:
  - React Native with Expo
  - Phase 0.5 UI Primitives
  - Zustand for state management
  - Expo AV for audio playback

Backend:
  - Supabase Edge Functions (Deno)
  - Supabase Storage (icons, sounds)
  - Image Generation API (configurable)
  - ElevenLabs API (sound generation)

Storage:
  - project-icons bucket (5MB limit, PNG/JPEG)
  - project-sounds bucket (10MB limit, MP3/WAV)
  - PostgreSQL assets table
```

## Components

### 1. IconGallery Component

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\components\assets\IconGallery.tsx`

**Features**:
- Prompt input for icon description
- 3-column grid layout displaying 6 variants
- Visual selection feedback with checkmark
- Progress indicator during generation
- One-tap application to project
- Regenerate capability

**Props**:
```typescript
interface IconGalleryProps {
  projectId: string;
  onIconApplied?: (iconUrl: string) => void;
}
```

**Usage**:
```tsx
<IconGallery
  projectId={project.id}
  onIconApplied={(iconUrl) => {
    console.log('Icon applied:', iconUrl);
  }}
/>
```

### 2. SoundGallery Component

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\components\assets\SoundGallery.tsx`

**Features**:
- Prompt input for sound effect description
- List view with play/pause controls
- Real-time audio playback preview
- Selection with visual feedback
- One-tap application to project
- Auto-cleanup of audio resources

**Props**:
```typescript
interface SoundGalleryProps {
  projectId: string;
  onSoundApplied?: (soundUrl: string) => void;
}
```

**Usage**:
```tsx
<SoundGallery
  projectId={project.id}
  onSoundApplied={(soundUrl) => {
    console.log('Sound applied:', soundUrl);
  }}
/>
```

### 3. AssetLibrary Component

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\components\assets\AssetLibrary.tsx`

**Features**:
- Display all generated assets for a project
- Preview modal with full-screen view
- Audio playback for sound assets
- Delete and regenerate actions
- Pull-to-refresh capability
- Empty state messaging

**Props**:
```typescript
interface AssetLibraryProps {
  projectId: string;
}
```

**Usage**:
```tsx
<AssetLibrary projectId={project.id} />
```

### 4. AssetPreview Component

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\components\assets\AssetPreview.tsx`

**Features**:
- Reusable asset preview component
- Supports icons, sounds, and images
- Multiple size options (sm, md, lg)
- Optional onPress handler

**Props**:
```typescript
interface AssetPreviewProps {
  type: 'icon' | 'sound' | 'image';
  url: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}
```

## State Management

### Asset Store

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\store\assetStore.ts`

**State Interface**:
```typescript
interface AssetStore {
  // State
  assets: Asset[];
  generatedIcons: string[];
  generatedSounds: string[];
  selectedIcon: string | null;
  selectedSound: string | null;
  loading: boolean;
  error: string | null;
  generationProgress: GenerationProgress;

  // Icon Actions
  generateIcons: (projectId: string, prompt: string, count?: number) => Promise<string[]>;
  selectIcon: (iconUrl: string) => void;
  applyIcon: (projectId: string, iconUrl: string) => Promise<void>;
  clearGeneratedIcons: () => void;

  // Sound Actions
  generateSounds: (projectId: string, prompt: string, count?: number) => Promise<string[]>;
  selectSound: (soundUrl: string) => void;
  applySound: (projectId: string, soundUrl: string) => Promise<void>;
  clearGeneratedSounds: () => void;

  // Asset Library Actions
  fetchAssets: (projectId: string) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  regenerateAsset: (assetId: string) => Promise<void>;
}
```

## Custom Hooks

### useIconGeneration

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\hooks\useIconGeneration.ts`

**Purpose**: Simplified interface for icon generation operations

**Example**:
```tsx
const { generateIcons, selectIcon, applyIcon, icons, selectedIcon, loading } = useIconGeneration();

await generateIcons(projectId, 'fitness app, green dumbbell');
selectIcon(icons[0]);
await applyIcon(projectId, selectedIcon!);
```

### useSoundGeneration

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\hooks\useSoundGeneration.ts`

**Purpose**: Simplified interface for sound generation operations

**Example**:
```tsx
const { generateSounds, selectSound, applySound, sounds, selectedSound } = useSoundGeneration();

await generateSounds(projectId, 'button click sound');
selectSound(sounds[0]);
await applySound(projectId, selectedSound!);
```

### useAssetLibrary

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\hooks\useAssetLibrary.ts`

**Purpose**: Asset library management with auto-fetch

**Example**:
```tsx
const { assets, loading, deleteAsset, regenerateAsset, getAssetsByType } = useAssetLibrary(projectId);

const icons = getAssetsByType('icon');
await deleteAsset(assetId);
await regenerateAsset(assetId);
```

## Edge Functions

### 1. Generate Icons

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\supabase\functions\generate-icons\index.ts`

**Endpoint**: `POST /functions/v1/generate-icons`

**Request**:
```json
{
  "prompt": "fitness app, green dumbbell, minimal",
  "count": 6,
  "projectId": "uuid"
}
```

**Response**:
```json
{
  "icons": [
    "https://storage.supabase.co/.../icon-1.png",
    "https://storage.supabase.co/.../icon-2.png",
    ...
  ],
  "generationTime": 8500
}
```

**Environment Variables Required**:
- `IMAGE_GENERATION_API_KEY`: API key for image generation service
- `IMAGE_GENERATION_API_URL`: Endpoint for image generation API
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for storage)

### 2. Generate Sounds

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\supabase\functions\generate-sounds\index.ts`

**Endpoint**: `POST /functions/v1/generate-sounds`

**Request**:
```json
{
  "prompt": "button click sound, crisp, short",
  "count": 4,
  "projectId": "uuid",
  "duration": 3
}
```

**Response**:
```json
{
  "sounds": [
    "https://storage.supabase.co/.../sound-1.mp3",
    "https://storage.supabase.co/.../sound-2.mp3",
    ...
  ],
  "generationTime": 12000
}
```

**Environment Variables Required**:
- `ELEVENLABS_API_KEY`: ElevenLabs API key for sound generation
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for storage)

## Database Schema

### Assets Table

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\supabase\migrations\20250111_create_assets_table.sql`

```sql
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('icon', 'sound', 'image')),
  url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
- `idx_assets_user_id`: Fast user asset lookups
- `idx_assets_project_id`: Fast project asset lookups
- `idx_assets_type`: Fast filtering by asset type
- `idx_assets_created_at`: Ordered retrieval

**RLS Policies**:
- Users can only view/insert/update/delete their own assets
- Row-level security enforced on all operations

## Storage Buckets

### Setup

**Location**: `D:\009_Projects_AI\Personal_Projects\MobVibe\supabase\setup-storage-buckets.sql`

**Buckets**:
1. **project-icons**
   - Public access
   - 5MB file size limit
   - Allowed types: PNG, JPEG, JPG, WEBP
   - User-scoped folders: `{userId}/{projectId}/icon-*.png`

2. **project-sounds**
   - Public access
   - 10MB file size limit
   - Allowed types: MP3, WAV, OGG, MPEG
   - User-scoped folders: `{userId}/{projectId}/sound-*.mp3`

**Storage Policies**:
- Users can only upload/view/delete files in their own folders
- Folder structure: `{userId}/{projectId}/{filename}`

## Setup Instructions

### 1. Database Setup

```bash
# Run the migration
supabase migration up

# Or manually run the SQL file
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250111_create_assets_table.sql
```

### 2. Storage Bucket Setup

```bash
# Run in Supabase SQL Editor
supabase db execute --file supabase/setup-storage-buckets.sql

# Or manually in SQL Editor
# Copy and paste the contents of setup-storage-buckets.sql
```

### 3. Environment Variables

Add to `.env` or Supabase Edge Functions secrets:

```bash
# Icon Generation (Generic API - adapt to your provider)
IMAGE_GENERATION_API_KEY=your_api_key_here
IMAGE_GENERATION_API_URL=https://api.provider.com/v1/images/generations

# Sound Generation (ElevenLabs)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Deploy Edge Functions

```bash
# Deploy icon generation function
supabase functions deploy generate-icons

# Deploy sound generation function
supabase functions deploy generate-sounds
```

### 5. Mobile App Configuration

Update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-av",
        {
          "microphonePermission": "Allow MobVibe to access your microphone for voice commands",
          "audioModeDescription": "Allow MobVibe to play sound effects"
        }
      ]
    ]
  }
}
```

Install required dependencies:

```bash
npm install expo-av react-native-haptic-feedback
```

## API Provider Configuration

### Icon Generation - DALL-E Example

```typescript
// In generate-icons/index.ts
const response = await fetch('https://api.openai.com/v1/images/generations', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.IMAGE_GENERATION_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: enhancedPrompt,
    n: count,
    size: '1024x1024',
    response_format: 'b64_json',
  }),
});
```

### Icon Generation - Stability AI Example

```typescript
const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.IMAGE_GENERATION_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text_prompts: [{ text: enhancedPrompt }],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    samples: count,
  }),
});
```

## Testing

### Manual Testing Checklist

**Icon Generation**:
- [ ] Enter icon description and generate
- [ ] Verify 6 variants display in grid
- [ ] Test selection interaction
- [ ] Apply icon to project
- [ ] Verify icon persists in storage
- [ ] Test regenerate functionality

**Sound Generation**:
- [ ] Enter sound description and generate
- [ ] Verify 4 variants display
- [ ] Test audio playback controls
- [ ] Verify play/pause functionality
- [ ] Test selection interaction
- [ ] Apply sound to project
- [ ] Verify sound persists in storage

**Asset Library**:
- [ ] View all assets for project
- [ ] Test asset preview modal
- [ ] Test delete functionality
- [ ] Test regenerate functionality
- [ ] Verify pull-to-refresh
- [ ] Test empty state display

### Unit Tests

```typescript
// Example test for icon generation hook
import { renderHook, act } from '@testing-library/react-hooks';
import { useIconGeneration } from '@/hooks/useIconGeneration';

describe('useIconGeneration', () => {
  it('generates icons successfully', async () => {
    const { result } = renderHook(() => useIconGeneration());

    await act(async () => {
      const icons = await result.current.generateIcons('project-id', 'test prompt');
      expect(icons).toHaveLength(6);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.icons).toHaveLength(6);
  });
});
```

## Performance Optimization

### Icon Generation
- Generation time target: <10 seconds
- Batch upload to storage
- Progressive loading UI
- Retry logic with exponential backoff

### Sound Generation
- Generation time target: <15 seconds
- Concurrent generation of variants
- Audio streaming where possible
- Preload audio buffers

### Asset Library
- Paginated loading (50 assets per page)
- Image lazy loading
- Audio resource cleanup
- Cache management

## Error Handling

### Common Errors

1. **API Rate Limits**
   - Show user-friendly message
   - Implement retry with backoff
   - Display estimated wait time

2. **Storage Quota Exceeded**
   - Alert user before generation
   - Suggest deleting old assets
   - Show storage usage

3. **Network Failures**
   - Automatic retry (3 attempts)
   - Offline detection
   - Queue for later

4. **Invalid API Keys**
   - Admin notification
   - Graceful degradation
   - Configuration guidance

## Cost Management

### Icon Generation
- Average cost per icon: $0.01-0.05
- Bulk generation optimization
- Cache similar prompts
- Quality vs. cost settings

### Sound Generation
- Average cost per sound: $0.02-0.08
- Duration-based pricing
- Quality tier selection
- Usage analytics

### Storage
- Icon storage: ~500KB per icon
- Sound storage: ~100KB per second
- Automatic cleanup after 30 days
- User storage limits

## Future Enhancements

1. **Advanced Icon Features**
   - Style presets (3D, flat, gradient)
   - Icon editing (crop, filters)
   - Multi-size export (iOS assets)
   - Template library

2. **Advanced Sound Features**
   - Custom duration control
   - Audio effects (reverb, pitch)
   - Layered sound composition
   - Voice synthesis integration

3. **Asset Management**
   - Collections/folders
   - Tagging and search
   - Version history
   - Export to ZIP

4. **Collaboration**
   - Share assets between projects
   - Team asset libraries
   - Asset marketplace
   - Community templates

## Support

For issues or questions:
- Check logs in Supabase Dashboard
- Review Edge Function logs
- Test API keys validity
- Verify storage bucket permissions

## Related Documentation

- Phase 1 Plan: `docs/phases/phase1/25-icon-generation.md`
- UI Primitives: `src/ui/primitives/README.md`
- Design Tokens: `src/ui/tokens/README.md`
- Supabase Setup: `docs/SUPABASE_SETUP.md`
