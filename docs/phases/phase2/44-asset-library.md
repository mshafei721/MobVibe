# Phase 44: Asset Library & Management

## Overview
Centralized asset library UI for managing all generated assets (icons, sounds, background images) with export, download, and version history capabilities.

**Duration:** 2 days
**Dependencies:** [43]
**Owners:** Frontend Engineer, Backend Engineer

## Objectives
- Asset library UI with grid/list views
- Manage icons, sounds, and images in one place
- Export & download assets (single/batch)
- Asset history & version tracking
- Search & filter functionality

## Technical Approach

### Asset Management Stack
```yaml
Database:
  Table: project_assets
  Fields: id, project_id, user_id, type, url, metadata, created_at
  Indexes: project_id, type, created_at

Storage:
  Buckets:
    - project_icons
    - project_sounds
    - project_backgrounds

Features:
  - Versioning enabled
  - Public URLs
  - CDN caching
  - Auto-cleanup (30 days unused)

UI:
  Views: Grid (default), List
  Filters: Type, Date, Status (used/unused)
  Sort: Recent, Oldest, Name, Size
```

### Implementation Steps

#### 1. Asset Database Schema (2h)
```sql
-- supabase/migrations/044_asset_library.sql
CREATE TABLE project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Asset details
  type TEXT NOT NULL CHECK (type IN ('icon', 'sound', 'background')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  format TEXT NOT NULL, -- png, webp, mp3, wav
  size_bytes INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}', -- resolution, duration, style, etc.
  is_active BOOLEAN DEFAULT false, -- Currently used in project
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES project_assets(id), -- For versioning

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  CONSTRAINT unique_active_asset UNIQUE (project_id, type, is_active)
);

CREATE INDEX idx_project_assets_project ON project_assets(project_id);
CREATE INDEX idx_project_assets_type ON project_assets(type);
CREATE INDEX idx_project_assets_active ON project_assets(is_active);
CREATE INDEX idx_project_assets_created ON project_assets(created_at DESC);

-- RLS policies
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON project_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON project_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON project_assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON project_assets FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2. Asset Library Component (8h)
```typescript
// components/AssetLibrary.tsx
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useAssets } from '@/hooks/useAssets';

interface AssetLibraryProps {
  projectId: string;
}

export function AssetLibrary({ projectId }: AssetLibraryProps) {
  const { assets, loading, deleteAsset, setActiveAsset, exportAssets } = useAssets(projectId);
  const [filter, setFilter] = useState<'all' | 'icon' | 'sound' | 'background'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  const filteredAssets = filter === 'all'
    ? assets
    : assets.filter(a => a.type === filter);

  const handleSelectAsset = (assetId: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const handleBatchExport = async () => {
    const assetsToExport = assets.filter(a => selectedAssets.has(a.id));
    await exportAssets(assetsToExport);
    Alert.alert('Success', `Exported ${assetsToExport.length} assets`);
  };

  const handleMakeActive = async (assetId: string) => {
    await setActiveAsset(assetId);
    haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold">Asset Library</Text>

          {/* View Toggle */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setView('grid')}
              className={`p-2 rounded ${view === 'grid' ? 'bg-purple-100' : 'bg-gray-100'}`}
            >
              <GridIcon size={20} color={view === 'grid' ? '#8b5cf6' : '#666'} />
            </Pressable>
            <Pressable
              onPress={() => setView('list')}
              className={`p-2 rounded ${view === 'list' ? 'bg-purple-100' : 'bg-gray-100'}`}
            >
              <ListIcon size={20} color={view === 'list' ? '#8b5cf6' : '#666'} />
            </Pressable>
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row gap-2">
          {['all', 'icon', 'sound', 'background'].map(type => (
            <Pressable
              key={type}
              onPress={() => setFilter(type)}
              className={`px-4 py-2 rounded-full ${
                filter === type
                  ? 'bg-purple-500'
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                filter === type ? 'text-white' : 'text-gray-700'
              }`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Asset Grid/List */}
      {view === 'grid' ? (
        <FlatList
          data={filteredAssets}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={{ padding: 12, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <AssetGridItem
              asset={item}
              selected={selectedAssets.has(item.id)}
              onSelect={() => handleSelectAsset(item.id)}
              onMakeActive={() => handleMakeActive(item.id)}
              onDelete={() => deleteAsset(item.id)}
            />
          )}
        />
      ) : (
        <FlatList
          data={filteredAssets}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <AssetListItem
              asset={item}
              selected={selectedAssets.has(item.id)}
              onSelect={() => handleSelectAsset(item.id)}
              onMakeActive={() => handleMakeActive(item.id)}
              onDelete={() => deleteAsset(item.id)}
            />
          )}
        />
      )}

      {/* Batch Actions */}
      {selectedAssets.size > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex-row gap-2">
          <Button
            title={`Export (${selectedAssets.size})`}
            onPress={handleBatchExport}
            color="#8b5cf6"
          />
          <Button
            title="Cancel"
            onPress={() => setSelectedAssets(new Set())}
            color="#666"
          />
        </View>
      )}
    </View>
  );
}

// Asset Grid Item Component
function AssetGridItem({ asset, selected, onSelect, onMakeActive, onDelete }: Props) {
  return (
    <Pressable
      onPress={onSelect}
      onLongPress={onMakeActive}
      className={`flex-1 aspect-square rounded-xl overflow-hidden ${
        selected ? 'border-4 border-purple-500' : 'border border-gray-200'
      }`}
    >
      {/* Asset Preview */}
      {asset.type === 'icon' || asset.type === 'background' ? (
        <Image source={{ uri: asset.url }} className="w-full h-full" />
      ) : (
        <View className="w-full h-full bg-purple-50 items-center justify-center">
          <MusicIcon size={32} color="#8b5cf6" />
          <Text className="text-xs text-gray-600 mt-2">{asset.format}</Text>
        </View>
      )}

      {/* Active Badge */}
      {asset.is_active && (
        <View className="absolute top-2 left-2 bg-green-500 rounded-full px-2 py-1">
          <Text className="text-white text-xs font-bold">Active</Text>
        </View>
      )}

      {/* Selection Checkbox */}
      {selected && (
        <View className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
          <CheckIcon size={16} color="white" />
        </View>
      )}

      {/* Asset Info */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
        <Text className="text-white text-xs font-medium" numberOfLines={1}>
          {asset.name}
        </Text>
        <Text className="text-white/70 text-xs">
          {formatBytes(asset.size_bytes)}
        </Text>
      </View>
    </Pressable>
  );
}

// Asset List Item Component
function AssetListItem({ asset, selected, onSelect, onMakeActive, onDelete }: Props) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-row items-center p-3 mb-2 rounded-lg ${
        selected ? 'bg-purple-50 border-2 border-purple-500' : 'bg-gray-50'
      }`}
    >
      {/* Thumbnail */}
      <View className="w-16 h-16 rounded-lg overflow-hidden mr-3">
        {asset.type === 'icon' || asset.type === 'background' ? (
          <Image source={{ uri: asset.url }} className="w-full h-full" />
        ) : (
          <View className="w-full h-full bg-purple-100 items-center justify-center">
            <MusicIcon size={24} color="#8b5cf6" />
          </View>
        )}
      </View>

      {/* Details */}
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">{asset.name}</Text>
        <Text className="text-xs text-gray-500">
          {asset.type} • {asset.format} • {formatBytes(asset.size_bytes)}
        </Text>
        <Text className="text-xs text-gray-400">
          {formatDate(asset.created_at)}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        {!asset.is_active && (
          <Pressable onPress={onMakeActive} className="p-2 bg-purple-100 rounded-lg">
            <Text className="text-purple-600 text-xs">Use</Text>
          </Pressable>
        )}
        <Pressable onPress={onDelete} className="p-2 bg-red-100 rounded-lg">
          <TrashIcon size={16} color="#ef4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}
```

#### 3. Asset Management Hooks (4h)
```typescript
// hooks/useAssets.ts
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function useAssets(projectId: string) {
  const supabase = useSupabase();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error) setAssets(data);
    setLoading(false);
  };

  const deleteAsset = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);

    // Delete from Storage
    const bucket = getBucketName(asset.type);
    const path = new URL(asset.url).pathname.split('/').pop();
    await supabase.storage.from(bucket).remove([path]);

    // Delete from database
    await supabase
      .from('project_assets')
      .delete()
      .eq('id', assetId);

    fetchAssets();
  };

  const setActiveAsset = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);

    // Deactivate current active asset of same type
    await supabase
      .from('project_assets')
      .update({ is_active: false })
      .eq('project_id', projectId)
      .eq('type', asset.type)
      .eq('is_active', true);

    // Activate new asset
    await supabase
      .from('project_assets')
      .update({ is_active: true, last_used_at: new Date().toISOString() })
      .eq('id', assetId);

    fetchAssets();
  };

  const exportAssets = async (assetsToExport: Asset[]) => {
    const downloads = await Promise.all(
      assetsToExport.map(async asset => {
        const fileUri = `${FileSystem.documentDirectory}${asset.name}.${asset.format}`;
        await FileSystem.downloadAsync(asset.url, fileUri);
        return fileUri;
      })
    );

    // Share files
    await Sharing.shareAsync(downloads[0], {
      mimeType: getMimeType(assetsToExport[0].format),
      dialogTitle: 'Export Assets',
    });
  };

  return { assets, loading, deleteAsset, setActiveAsset, exportAssets, refresh: fetchAssets };
}

function getBucketName(type: string): string {
  const buckets = {
    icon: 'project_icons',
    sound: 'project_sounds',
    background: 'project_backgrounds',
  };
  return buckets[type];
}

function getMimeType(format: string): string {
  const mimes = {
    png: 'image/png',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };
  return mimes[format] || 'application/octet-stream';
}
```

## Key Tasks

### Database & Storage
- [ ] Create project_assets table
- [ ] Add indexes for performance
- [ ] Setup RLS policies
- [ ] Configure Storage buckets
- [ ] Implement versioning

### UI Components
- [ ] Build AssetLibrary component
- [ ] Add grid/list view toggle
- [ ] Implement filter tabs
- [ ] Create asset preview cards
- [ ] Add batch selection

### Asset Management
- [ ] Implement delete functionality
- [ ] Add set active/inactive
- [ ] Build export & download
- [ ] Add search capability
- [ ] Implement version history

## Acceptance Criteria
- [ ] All asset types displayed
- [ ] Grid & list views work
- [ ] Filter by type functional
- [ ] Batch export works
- [ ] Delete removes from Storage
- [ ] Active asset indicator visible
- [ ] Search & sort functional

## Testing Strategy

### Unit Tests
```typescript
describe('Asset Library', () => {
  it('fetches all project assets', async () => {
    const { assets } = useAssets(projectId);
    expect(assets.length).toBeGreaterThan(0);
  });

  it('filters assets by type', () => {
    const filtered = assets.filter(a => a.type === 'icon');
    expect(filtered.every(a => a.type === 'icon')).toBe(true);
  });

  it('exports selected assets', async () => {
    const selected = [assets[0], assets[1]];
    await exportAssets(selected);
    expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests
- Test asset CRUD operations
- Verify Storage bucket operations
- Test batch export
- Verify active asset switching
- Test version tracking

### Manual Testing
- Grid vs list view UX
- Filter responsiveness
- Export functionality
- Delete confirmation
- Search accuracy

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large asset libraries slow | Medium | Pagination, lazy loading |
| Storage costs accumulate | Medium | Auto-cleanup, usage limits |
| Export fails for large batches | Low | Chunked downloads, progress UI |
| Version history complexity | Low | Simple parent_id reference |

## Success Metrics
- Asset fetch time: <1s for 100 assets
- Export success rate: >95%
- UI responsiveness: 60fps scrolling
- Storage usage per project: <50MB
- User satisfaction: >4.2/5.0

## Future Enhancements
- Drag & drop reordering
- Asset sharing between projects
- Bulk upload from device
- Asset tags & categories
- Smart collections (recently used, favorites)
