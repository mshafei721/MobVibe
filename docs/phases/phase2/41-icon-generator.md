# Phase 41: Icon Generator

## Metadata
```yaml
phase: 41
title: Icon Generator
track: Asset Generation
category: ai-generation
priority: medium
complexity: medium
estimated_hours: 16
dependencies: [40]
websearch: true
```

## Overview
Integrate Nano Banana API to generate custom app icons for user projects, providing 6 variations to choose from, preview UI, and seamless icon application to the project configuration.

## Success Criteria
- [ ] Nano Banana API integrated via proxy
- [ ] Generate 6 icon variations from text prompt
- [ ] Preview UI shows all variations side-by-side
- [ ] User can select & apply icon to project
- [ ] Generated icons stored in project assets
- [ ] Icon formats: 512x512 PNG (iOS/Android compatible)
- [ ] Generation completes in <30 seconds

## Technical Approach

### Nano Banana Integration
```typescript
// lib/icon-generator.ts
export class IconGenerator {
  private apiUrl = `${API_BASE_URL}/nano-banana/generate`;

  async generateIcons(prompt: string, projectId: string): Promise<IconVariation[]> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        prompt,
        project_id: projectId,
        variations: 6,
        size: 512,
        format: 'png'
      })
    });

    if (!response.ok) {
      throw new Error(`Icon generation failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Download and store icons
    const variations = await Promise.all(
      data.variations.map(async (v: any, index: number) => {
        const blob = await fetch(v.url).then(r => r.blob());
        const path = await this.storeIcon(projectId, index, blob);

        return {
          id: v.id,
          url: v.url,
          localPath: path,
          prompt: v.prompt_variation,
          selected: false
        };
      })
    );

    return variations;
  }

  private async storeIcon(projectId: string, index: number, blob: Blob): Promise<string> {
    const fileName = `icon-variation-${index}.png`;
    const path = `projects/${projectId}/assets/icons/${fileName}`;

    const { data, error } = await supabase.storage
      .from('project-assets')
      .upload(path, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('project-assets')
      .getPublicUrl(path);

    return publicUrl.publicUrl;
  }

  async applyIcon(projectId: string, variationId: string): Promise<void> {
    // Update project configuration
    await supabase
      .from('projects')
      .update({
        icon_url: variationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // Update app.json or app.config.js
    await this.updateProjectConfig(projectId, variationId);
  }

  private async updateProjectConfig(projectId: string, iconUrl: string) {
    // Update Expo config
    const config = await readProjectConfig(projectId);
    config.expo.icon = iconUrl;
    await writeProjectConfig(projectId, config);
  }
}
```

### Backend Proxy
```typescript
// backend/src/proxies/nano-banana.ts
export class NanoBananaProxy extends BaseProxy {
  constructor(userId: string) {
    super(userId, 'nano-banana');
  }

  protected async getApiKey(): Promise<string> {
    return await getRotatedKey('nano-banana');
  }

  protected async makeRequest(req: Request, apiKey: string) {
    const response = await fetch('https://api.nanobanana.com/v1/generate-icon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: req.body.prompt,
        variations: req.body.variations || 6,
        size: req.body.size || 512,
        format: req.body.format || 'png',
        style: req.body.style || 'modern'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw { status: response.status, message: error.error?.message };
    }

    return response.json();
  }

  protected estimateCost(body: any): number {
    // Nano Banana pricing: $0.02 per icon
    const variations = body.variations || 6;
    return variations * 0.02;
  }

  protected calculateCost(response: any): number {
    return response.variations.length * 0.02;
  }

  protected sanitizeResponse(response: any): any {
    // Return variations with URLs
    return {
      variations: response.variations.map((v: any) => ({
        id: v.id,
        url: v.url,
        prompt_variation: v.prompt_variation,
        created_at: v.created_at
      }))
    };
  }
}
```

### Icon Generator Hook
```typescript
// hooks/useIconGenerator.ts
export function useIconGenerator(projectId: string) {
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<IconVariation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateIcons = async (prompt: string) => {
    setGenerating(true);
    setError(null);

    try {
      const generator = new IconGenerator();
      const generated = await generator.generateIcons(prompt, projectId);
      setVariations(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const applyIcon = async (variationId: string) => {
    try {
      const generator = new IconGenerator();
      await generator.applyIcon(projectId, variationId);

      // Update local state
      setVariations(prev =>
        prev.map(v => ({
          ...v,
          selected: v.id === variationId
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply icon');
    }
  };

  return {
    generating,
    variations,
    error,
    generateIcons,
    applyIcon
  };
}
```

### Icon Generator UI
```typescript
// components/IconGenerator.tsx
export function IconGenerator({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState('');
  const { generating, variations, error, generateIcons, applyIcon } =
    useIconGenerator(projectId);

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4">Generate App Icon</Text>

      {/* Prompt Input */}
      <View className="mb-6">
        <Text className="text-sm font-medium mb-2">
          Describe your app icon
        </Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g., minimalist music note on gradient background"
          className="border border-gray-300 rounded-lg p-3 mb-2"
          multiline
          numberOfLines={3}
        />
        <Text className="text-xs text-gray-500">
          Be specific about colors, style, and objects
        </Text>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        onPress={() => generateIcons(prompt)}
        disabled={!prompt.trim() || generating}
        className={`p-4 rounded-lg mb-6 ${
          !prompt.trim() || generating ? 'bg-gray-300' : 'bg-blue-500'
        }`}
      >
        <Text className="text-white text-center font-medium">
          {generating ? 'Generating...' : 'Generate 6 Variations'}
        </Text>
      </TouchableOpacity>

      {/* Error Display */}
      {error && (
        <View className="bg-red-100 p-4 rounded-lg mb-6">
          <Text className="text-red-800">{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {generating && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">
            Generating your icons...
          </Text>
        </View>
      )}

      {/* Variations Grid */}
      {variations.length > 0 && (
        <View>
          <Text className="text-lg font-medium mb-4">
            Choose your favorite
          </Text>
          <View className="flex-row flex-wrap gap-4">
            {variations.map((variation, index) => (
              <IconVariationCard
                key={variation.id}
                variation={variation}
                index={index}
                onSelect={() => applyIcon(variation.id)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function IconVariationCard({
  variation,
  index,
  onSelect
}: {
  variation: IconVariation;
  index: number;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      className={`w-[48%] border-2 rounded-lg p-4 ${
        variation.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      {/* Icon Preview */}
      <Image
        source={{ uri: variation.localPath }}
        className="w-full aspect-square rounded-lg mb-2"
        resizeMode="cover"
      />

      {/* Variation Info */}
      <Text className="text-xs text-gray-500 mb-1">
        Variation {index + 1}
      </Text>
      <Text className="text-xs text-gray-600 line-clamp-2">
        {variation.prompt}
      </Text>

      {/* Selected Badge */}
      {variation.selected && (
        <View className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
          <Text className="text-white text-xs px-2">✓ Applied</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

### Icon Preview Modal
```typescript
// components/IconPreviewModal.tsx
export function IconPreviewModal({
  variation,
  visible,
  onClose,
  onApply
}: {
  variation: IconVariation;
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <Text className="text-xl font-bold mb-4">Icon Preview</Text>

          {/* Large Preview */}
          <Image
            source={{ uri: variation.localPath }}
            className="w-full aspect-square rounded-2xl mb-4"
            resizeMode="cover"
          />

          {/* Prompt */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">
              Generated from:
            </Text>
            <Text className="text-sm text-gray-600">{variation.prompt}</Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 p-3 border border-gray-300 rounded-lg"
            >
              <Text className="text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onApply();
                onClose();
              }}
              className="flex-1 p-3 bg-blue-500 rounded-lg"
            >
              <Text className="text-white text-center font-medium">
                Apply Icon
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

## Implementation Steps

1. **API Integration** (4h)
   - Build IconGenerator class
   - Implement Nano Banana proxy
   - Add icon storage to Supabase
   - Handle 6 variations generation

2. **Icon Storage** (2h)
   - Store icons in project assets
   - Generate public URLs
   - Update project configuration

3. **Generator UI** (4h)
   - Build IconGenerator component
   - Create prompt input
   - Add variations grid
   - Implement selection UI

4. **Preview & Apply** (3h)
   - Build IconPreviewModal
   - Add apply icon logic
   - Update project config
   - Show selected state

5. **Testing & Polish** (3h)
   - Test generation flow
   - Handle errors gracefully
   - Add loading states
   - Optimize image loading

## Testing Requirements

### Unit Tests
```typescript
describe('IconGenerator', () => {
  it('should generate 6 variations', async () => {
    const generator = new IconGenerator();
    const variations = await generator.generateIcons('test prompt', 'project-123');
    expect(variations).toHaveLength(6);
  });

  it('should store icons in project assets', async () => {
    // Test storage logic
  });

  it('should apply selected icon to project', async () => {
    // Test apply logic
  });
});
```

### Integration Tests
- Generation completes in <30 seconds
- All 6 variations display correctly
- Selected icon updates project config
- Icons persist across app restarts

## Files Changed
```
lib/icon-generator.ts                   [new]
hooks/useIconGenerator.ts               [new]
components/IconGenerator.tsx            [new]
components/IconPreviewModal.tsx         [new]
backend/src/proxies/nano-banana.ts      [new]
app/(project)/[id]/settings.tsx         [modified - add icon generator]
```

## Database Schema
```sql
-- Icon generation tracking
CREATE TABLE icon_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  variations JSONB NOT NULL, -- Array of {id, url, localPath, prompt}
  selected_variation_id TEXT,
  cost DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_icon_generations_project ON icon_generations(project_id, created_at DESC);
```

## Notes
- Research Nano Banana API pricing & limits
- Consider caching popular prompts
- Add prompt suggestions/templates
- Support custom styles (minimalist, gradient, 3D, etc.)
- Consider icon size variants (1024x1024 for iOS)
- Add download option for all variations
- Implement regeneration with tweaked prompts
