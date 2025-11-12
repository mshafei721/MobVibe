# Asset Generation Components

AI-powered asset generation UI components for MobVibe.

## Components Overview

### IconGallery
Generate and select app icons using AI.

**Path:** `components/assets/IconGallery.tsx`

**Usage:**
```tsx
import { IconGallery } from '@/components/assets/IconGallery';

<IconGallery
  projectId={project.id}
  onIconApplied={(iconUrl) => {
    console.log('Icon applied:', iconUrl);
  }}
/>
```

**Features:**
- Text prompt input
- 3-column grid (6 variants)
- Visual selection feedback
- Progress indicator
- One-tap application

---

### SoundGallery
Generate and select sound effects using AI.

**Path:** `components/assets/SoundGallery.tsx`

**Usage:**
```tsx
import { SoundGallery } from '@/components/assets/SoundGallery';

<SoundGallery
  projectId={project.id}
  onSoundApplied={(soundUrl) => {
    console.log('Sound applied:', soundUrl);
  }}
/>
```

**Features:**
- Text prompt input
- List view with 4 variants
- Play/pause controls
- Audio preview
- One-tap application

---

### AssetLibrary
View and manage all generated assets.

**Path:** `components/assets/AssetLibrary.tsx`

**Usage:**
```tsx
import { AssetLibrary } from '@/components/assets/AssetLibrary';

<AssetLibrary projectId={project.id} />
```

**Features:**
- Display all assets
- Preview modal
- Delete/regenerate actions
- Pull-to-refresh
- Empty state

---

### AssetPreview
Reusable asset preview component.

**Path:** `components/assets/AssetPreview.tsx`

**Usage:**
```tsx
import { AssetPreview } from '@/components/assets/AssetPreview';

<AssetPreview
  type="icon"
  url="https://..."
  size="md"
  onPress={() => console.log('Pressed')}
/>
```

**Props:**
- `type`: 'icon' | 'sound' | 'image'
- `url`: string (asset URL)
- `size`: 'sm' | 'md' | 'lg' (optional)
- `onPress`: () => void (optional)

---

## State Management

All components use the centralized `useAssetStore` from `store/assetStore.ts`.

### Store Methods

```typescript
// Icon operations
generateIcons(projectId, prompt, count)
selectIcon(iconUrl)
applyIcon(projectId, iconUrl)
clearGeneratedIcons()

// Sound operations
generateSounds(projectId, prompt, count)
selectSound(soundUrl)
applySound(projectId, soundUrl)
clearGeneratedSounds()

// Library operations
fetchAssets(projectId)
deleteAsset(assetId)
regenerateAsset(assetId)
```

## Custom Hooks

Simplified interfaces for component logic:

```typescript
// Icon generation
import { useIconGeneration } from '@/hooks/useIconGeneration';
const { generateIcons, selectIcon, applyIcon, icons, loading } = useIconGeneration();

// Sound generation
import { useSoundGeneration } from '@/hooks/useSoundGeneration';
const { generateSounds, selectSound, applySound, sounds, loading } = useSoundGeneration();

// Asset library
import { useAssetLibrary } from '@/hooks/useAssetLibrary';
const { assets, fetchAssets, deleteAsset, regenerateAsset } = useAssetLibrary(projectId);
```

## Example Integration

Complete example in `app/(tabs)/assets.tsx`:

```tsx
import React, { useState } from 'react';
import { IconGallery } from '@/components/assets/IconGallery';
import { SoundGallery } from '@/components/assets/SoundGallery';
import { AssetLibrary } from '@/components/assets/AssetLibrary';

export default function AssetsScreen() {
  const [activeTab, setActiveTab] = useState<'icons' | 'sounds' | 'library'>('icons');

  return (
    <View>
      {/* Tab selector */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {activeTab === 'icons' && <IconGallery projectId={projectId} />}
      {activeTab === 'sounds' && <SoundGallery projectId={projectId} />}
      {activeTab === 'library' && <AssetLibrary projectId={projectId} />}
    </View>
  );
}
```

## Testing

Run component tests:

```bash
npm test components/assets/__tests__/IconGallery.test.tsx
```

## Documentation

- Full Guide: `docs/ASSET_GENERATION.md`
- Setup Guide: `docs/SETUP_ASSET_GENERATION.md`
- Phase 25 Plan: `docs/phases/phase1/25-icon-generation.md`

## Dependencies

- `expo-av`: Audio playback
- `react-native-haptic-feedback`: Tactile feedback
- `@supabase/supabase-js`: Backend integration
- Phase 0.5 UI primitives: Button, Input, Text, Card

## Performance Notes

- Icon generation: ~8 seconds
- Sound generation: ~12 seconds
- Audio auto-cleanup on unmount
- Progress indicators for UX
- Error boundaries for reliability
