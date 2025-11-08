# Phase 25: Icon Generation Workflow

## Overview
AI-powered app icon generation using Nano Banana API with grid display and one-tap application.

**Duration:** 2 days
**Dependencies:** [24]
**Owners:** Frontend Engineer, Backend Engineer

## Objectives
- Nano Banana API integration
- Icon grid gallery (4-9 variants)
- One-tap icon application
- <10s generation time

## Technical Approach

### Icon Generation Stack
```yaml
API:
  Provider: Nano Banana (HuggingFace SDXL)
  Endpoint: https://api.nano-banana.com/generate
  Model: sdxl-icon-generator

Storage:
  Temporary: Edge Function memory
  Permanent: Supabase Storage (project_icons bucket)

Format: PNG, 1024x1024, transparent background
```

### Implementation Steps

#### 1. API Proxy Edge Function (4h)
```typescript
// supabase/functions/generate-icons/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const NANO_BANANA_API = 'https://api.nano-banana.com/generate';
const NANO_BANANA_KEY = Deno.env.get('NANO_BANANA_API_KEY');

interface GenerateRequest {
  prompt: string;
  count?: number; // Default 6
  userId: string;
  projectId: string;
}

serve(async (req) => {
  const { prompt, count = 6, userId, projectId } = await req.json();

  // Generate icons via Nano Banana
  const response = await fetch(NANO_BANANA_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NANO_BANANA_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `app icon, ${prompt}, minimal, flat design, centered, transparent background`,
      model: 'sdxl-icon-generator',
      num_images: count,
      size: '1024x1024',
      format: 'png',
    }),
  });

  const { images } = await response.json();

  // Upload to Supabase Storage
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const iconUrls = await Promise.all(
    images.map(async (base64Image: string, index: number) => {
      const buffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
      const path = `${userId}/${projectId}/icon-${Date.now()}-${index}.png`;

      const { data, error } = await supabase.storage
        .from('project_icons')
        .upload(path, buffer, { contentType: 'image/png' });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('project_icons')
        .getPublicUrl(path);

      return urlData.publicUrl;
    })
  );

  return new Response(JSON.stringify({ icons: iconUrls }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 2. Icon Gallery Component (5h)
```typescript
// components/IconGallery.tsx
interface IconGalleryProps {
  projectId: string;
  onSelectIcon: (iconUrl: string) => void;
}

export function IconGallery({ projectId, onSelectIcon }: IconGalleryProps) {
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const generateIcons = async (prompt: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          count: 6,
          userId: user.id,
          projectId,
        }),
      });

      const { icons } = await response.json();
      setIcons(icons);
    } catch (error) {
      Alert.alert('Generation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIcon = (iconUrl: string) => {
    setSelectedIcon(iconUrl);
    haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleApply = async () => {
    if (!selectedIcon) return;

    await onSelectIcon(selectedIcon);
    Alert.alert('Success', 'Icon applied to project');
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Generate App Icon</Text>

      {/* Generation Form */}
      <View className="mb-6">
        <TextInput
          placeholder="Describe your app icon..."
          className="border border-gray-300 rounded-lg p-3 mb-3"
          onSubmitEditing={(e) => generateIcons(e.nativeEvent.text)}
        />
        <Button
          title="Generate Icons"
          onPress={() => generateIcons(promptRef.current)}
          disabled={loading}
        />
      </View>

      {/* Loading State */}
      {loading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text className="text-gray-500 mt-2">Generating icons...</Text>
        </View>
      )}

      {/* Icon Grid */}
      <FlatList
        data={icons}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={3}
        contentContainerStyle={{ gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSelectIcon(item)}
            className={`flex-1 aspect-square rounded-xl overflow-hidden ${
              selectedIcon === item ? 'border-4 border-purple-500' : 'border border-gray-200'
            }`}
          >
            <Image
              source={{ uri: item }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {selectedIcon === item && (
              <View className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                <CheckIcon size={16} color="white" />
              </View>
            )}
          </Pressable>
        )}
      />

      {/* Apply Button */}
      {selectedIcon && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button
            title="Apply Icon"
            onPress={handleApply}
            color="#8b5cf6"
          />
        </View>
      )}
    </View>
  );
}
```

#### 3. Project Icon Update (3h)
```typescript
// hooks/useProjectIcon.ts
export function useProjectIcon(projectId: string) {
  const supabase = useSupabase();

  const updateIcon = async (iconUrl: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ icon_url: iconUrl })
      .eq('id', projectId);

    if (error) throw error;

    // Also update app.json for Expo
    await updateExpoConfig(iconUrl);
  };

  const updateExpoConfig = async (iconUrl: string) => {
    // Download icon from Storage
    const response = await fetch(iconUrl);
    const blob = await response.blob();

    // Save locally to assets/icon.png
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await FileSystem.writeAsStringAsync(
        `${FileSystem.documentDirectory}icon.png`,
        base64.split(',')[1],
        { encoding: FileSystem.EncodingType.Base64 }
      );
    };
    reader.readAsDataURL(blob);
  };

  return { updateIcon };
}
```

#### 4. Generation Progress UI (2h)
```typescript
// components/GenerationProgress.tsx
export function GenerationProgress({ visible }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, { duration: 8000 }); // 8s estimate
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Modal visible={visible} transparent>
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white rounded-xl p-6 w-full max-w-sm">
          <Text className="text-xl font-bold text-center mb-4">
            Generating Icons
          </Text>

          <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <Animated.View
              style={[animatedStyle, { backgroundColor: '#8b5cf6' }]}
              className="h-full"
            />
          </View>

          <Text className="text-gray-500 text-center text-sm">
            Creating 6 unique icon variations...
          </Text>
        </View>
      </View>
    </Modal>
  );
}
```

## Key Tasks

### API Integration
- [ ] Setup Nano Banana API account
- [ ] Create /api/generate-icons Edge Function
- [ ] Implement icon generation request
- [ ] Handle API errors & retries
- [ ] Configure Supabase Storage bucket

### UI Components
- [ ] Build IconGallery component
- [ ] Add icon grid with 3-column layout
- [ ] Implement selection state
- [ ] Add generation progress modal
- [ ] Create apply confirmation

### Project Integration
- [ ] Add icon generation to project creation
- [ ] Implement icon update in project settings
- [ ] Update Expo app.json config
- [ ] Handle icon file management
- [ ] Add regeneration capability

## Acceptance Criteria
- [ ] Icons generate in <10s
- [ ] Grid displays 6 variants
- [ ] Selection UI is clear
- [ ] One-tap apply works
- [ ] Icons persist in Storage
- [ ] Expo config updates
- [ ] Error handling graceful

## Testing Strategy

### Unit Tests
```typescript
describe('Icon Generation', () => {
  it('generates 6 icon variants', async () => {
    const response = await fetch('/api/generate-icons', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'finance app', count: 6 }),
    });
    const { icons } = await response.json();
    expect(icons).toHaveLength(6);
  });

  it('uploads icons to Storage', async () => {
    const iconUrl = icons[0];
    expect(iconUrl).toContain('project_icons');
  });
});
```

### Integration Tests
- Test full generation flow
- Verify icon application to project
- Test Expo config update
- Verify Storage permissions
- Test regeneration

### Manual Testing
- Generation latency
- Icon quality & variety
- Selection UX
- Apply confirmation
- Error scenarios

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Cache, usage tracking |
| Slow generation | Medium | Progress UI, 10s timeout |
| Poor icon quality | Medium | Prompt engineering, retries |
| Storage costs | Low | Cleanup old icons, limits |
| API downtime | Low | Error handling, retry logic |

## Success Metrics
- Icon generation success rate: >95%
- Average generation time: <8s
- Icon application rate: >60%
- User satisfaction: >4.0/5.0
- API cost per generation: <$0.05

## Future Enhancements
- Custom style selection (3D, flat, gradient)
- Icon editing (crop, filters)
- Multi-size export (iOS App Store assets)
- Icon templates library
- Batch generation
