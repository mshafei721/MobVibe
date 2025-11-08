# Phase 43: Background Image Generation

## Overview
AI-powered background image generation using Replicate/DALL-E for hero sections and splash screens with multiple style options.

**Duration:** 2 days
**Dependencies:** [42]
**Owners:** Frontend Engineer, Backend Engineer
**Research Required:** Yes (Image generation APIs)

## Objectives
- Replicate/DALL-E API integration
- Hero & splash image generation
- Multiple style options (gradient, abstract, minimal, photorealistic)
- Resolution & format handling (PNG, WebP, multiple sizes)

## Technical Approach

### Image Generation Stack
```yaml
APIs:
  Primary: Replicate (SDXL, Flux models)
  Fallback: OpenAI DALL-E 3

Models:
  SDXL: stability-ai/sdxl
  Flux: black-forest-labs/flux-1.1-pro
  DALL-E: dall-e-3

Storage:
  Temporary: Edge Function memory
  Permanent: Supabase Storage (project_backgrounds bucket)

Formats:
  - PNG (transparency support)
  - WebP (optimized size)
  - Multiple resolutions (1080x1920, 1440x2560, 2048x2732)
```

### Implementation Steps

#### 1. API Integration Edge Function (5h)
```typescript
// supabase/functions/generate-background/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN');
const DALLE_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface GenerateBackgroundRequest {
  prompt: string;
  style: 'gradient' | 'abstract' | 'minimal' | 'photorealistic';
  provider?: 'replicate' | 'dalle';
  resolution?: string; // Default: '1080x1920'
  userId: string;
  projectId: string;
}

const STYLE_PROMPTS = {
  gradient: 'smooth gradient background, vibrant colors, abstract shapes',
  abstract: 'abstract geometric shapes, modern design, clean composition',
  minimal: 'minimalist design, simple shapes, pastel colors, clean',
  photorealistic: 'photorealistic scene, high quality, detailed, professional',
};

serve(async (req) => {
  const {
    prompt,
    style,
    provider = 'replicate',
    resolution = '1080x1920',
    userId,
    projectId
  } = await req.json();

  try {
    let imageUrl: string;

    if (provider === 'replicate') {
      imageUrl = await generateWithReplicate(prompt, style, resolution);
    } else {
      imageUrl = await generateWithDALLE(prompt, style);
    }

    // Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
    const path = `${userId}/${projectId}/bg-${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from('project_backgrounds')
      .upload(path, imageBuffer, { contentType: 'image/png' });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('project_backgrounds')
      .getPublicUrl(path);

    // Generate WebP version
    const webpPath = await convertToWebP(imageBuffer, userId, projectId, supabase);

    return new Response(JSON.stringify({
      png: urlData.publicUrl,
      webp: webpPath,
      resolution,
      style,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function generateWithReplicate(
  prompt: string,
  style: string,
  resolution: string
): Promise<string> {
  const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

  const [width, height] = resolution.split('x').map(Number);

  const output = await replicate.run(
    "black-forest-labs/flux-1.1-pro",
    {
      input: {
        prompt: `${STYLE_PROMPTS[style]}, ${prompt}`,
        width,
        height,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50,
      }
    }
  );

  return output[0];
}

async function generateWithDALLE(
  prompt: string,
  style: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DALLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `${STYLE_PROMPTS[style]}, ${prompt}`,
      size: '1024x1792', // Portrait orientation
      quality: 'hd',
      n: 1,
    }),
  });

  const { data } = await response.json();
  return data[0].url;
}

async function convertToWebP(
  buffer: ArrayBuffer,
  userId: string,
  projectId: string,
  supabase: any
): Promise<string> {
  // Use ImageMagick or similar to convert PNG to WebP
  // For now, placeholder - implement actual conversion
  const webpPath = `${userId}/${projectId}/bg-${Date.now()}.webp`;

  // Upload WebP version
  await supabase.storage
    .from('project_backgrounds')
    .upload(webpPath, buffer, { contentType: 'image/webp' });

  const { data } = supabase.storage
    .from('project_backgrounds')
    .getPublicUrl(webpPath);

  return data.publicUrl;
}
```

#### 2. Background Generator UI (6h)
```typescript
// components/BackgroundGenerator.tsx
interface BackgroundGeneratorProps {
  projectId: string;
  onSelectBackground: (urls: { png: string; webp: string }) => void;
}

export function BackgroundGenerator({ projectId, onSelectBackground }: BackgroundGeneratorProps) {
  const [backgrounds, setBackgrounds] = useState<Array<{
    png: string;
    webp: string;
    style: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<'gradient' | 'abstract' | 'minimal' | 'photorealistic'>('gradient');
  const [selectedBg, setSelectedBg] = useState<number | null>(null);

  const styles = [
    { id: 'gradient', label: 'Gradient', icon: '🌈' },
    { id: 'abstract', label: 'Abstract', icon: '🎨' },
    { id: 'minimal', label: 'Minimal', icon: '✨' },
    { id: 'photorealistic', label: 'Photo', icon: '📸' },
  ];

  const generateBackground = async (prompt: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
          provider: 'replicate',
          resolution: '1080x1920',
          userId: user.id,
          projectId,
        }),
      });

      const background = await response.json();
      setBackgrounds([...backgrounds, background]);
    } catch (error) {
      Alert.alert('Generation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBackground = (index: number) => {
    setSelectedBg(index);
    haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleApply = async () => {
    if (selectedBg === null) return;
    await onSelectBackground(backgrounds[selectedBg]);
    Alert.alert('Success', 'Background applied to project');
  };

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Generate Background</Text>

      {/* Style Selector */}
      <View className="mb-6">
        <Text className="text-sm font-semibold mb-2">Style</Text>
        <View className="flex-row gap-2">
          {styles.map(style => (
            <Pressable
              key={style.id}
              onPress={() => setSelectedStyle(style.id)}
              className={`flex-1 items-center py-3 rounded-lg border-2 ${
                selectedStyle === style.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Text className="text-2xl mb-1">{style.icon}</Text>
              <Text className="text-xs font-medium">{style.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Generation Form */}
      <View className="mb-6">
        <TextInput
          placeholder="Describe your background..."
          className="border border-gray-300 rounded-lg p-3 mb-3"
          multiline
          numberOfLines={3}
          onSubmitEditing={(e) => generateBackground(e.nativeEvent.text)}
        />
        <Button
          title="Generate Background"
          onPress={() => generateBackground(promptRef.current)}
          disabled={loading}
        />
      </View>

      {/* Loading State */}
      {loading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text className="text-gray-500 mt-2">Generating background...</Text>
          <Text className="text-xs text-gray-400 mt-1">This may take 15-30 seconds</Text>
        </View>
      )}

      {/* Background Grid */}
      <ScrollView>
        {backgrounds.map((bg, index) => (
          <Pressable
            key={index}
            onPress={() => handleSelectBackground(index)}
            className={`mb-4 rounded-xl overflow-hidden ${
              selectedBg === index ? 'border-4 border-purple-500' : 'border border-gray-200'
            }`}
          >
            <Image
              source={{ uri: bg.webp }}
              className="w-full h-64"
              resizeMode="cover"
            />
            {selectedBg === index && (
              <View className="absolute top-2 right-2 bg-purple-500 rounded-full p-2">
                <CheckIcon size={20} color="white" />
              </View>
            )}
            <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
              <Text className="text-white text-xs">{bg.style}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Apply Button */}
      {selectedBg !== null && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button
            title="Apply Background"
            onPress={handleApply}
            color="#8b5cf6"
          />
        </View>
      )}
    </View>
  );
}
```

#### 3. Resolution Options (3h)
```typescript
// components/ResolutionSelector.tsx
export function ResolutionSelector({ onChange }: Props) {
  const resolutions = [
    { label: 'Phone (HD)', value: '1080x1920', aspect: '9:16' },
    { label: 'Phone (FHD)', value: '1440x2560', aspect: '9:16' },
    { label: 'Tablet', value: '2048x2732', aspect: '3:4' },
    { label: 'Square', value: '1024x1024', aspect: '1:1' },
  ];

  const [selected, setSelected] = useState(resolutions[0].value);

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold mb-2">Resolution</Text>
      <View className="flex-row gap-2 flex-wrap">
        {resolutions.map(res => (
          <Pressable
            key={res.value}
            onPress={() => {
              setSelected(res.value);
              onChange(res.value);
            }}
            className={`px-4 py-2 rounded-lg border ${
              selected === res.value
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <Text className="text-xs font-medium">{res.label}</Text>
            <Text className="text-xs text-gray-500">{res.aspect}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

## Key Tasks

### API Integration
- [ ] Research Replicate vs DALL-E pricing & capabilities
- [ ] Setup Replicate API account & token
- [ ] Implement Replicate SDXL/Flux integration
- [ ] Add DALL-E fallback option
- [ ] Configure Supabase Storage bucket
- [ ] Implement WebP conversion

### UI Components
- [ ] Build BackgroundGenerator component
- [ ] Add style selector (4 options)
- [ ] Implement resolution selector
- [ ] Add generation progress indicator
- [ ] Create preview & selection UI

### Format Handling
- [ ] Generate multiple resolutions
- [ ] Convert PNG to WebP
- [ ] Optimize file sizes
- [ ] Handle aspect ratios
- [ ] Store multiple formats

## Acceptance Criteria
- [ ] Backgrounds generate in <30s
- [ ] 4 style options available
- [ ] Multiple resolutions supported
- [ ] PNG & WebP formats generated
- [ ] Selection UI is clear
- [ ] One-tap apply works
- [ ] Images persist in Storage

## Testing Strategy

### Unit Tests
```typescript
describe('Background Generation', () => {
  it('generates background with Replicate', async () => {
    const response = await fetch('/api/generate-background', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'sunset landscape',
        style: 'photorealistic',
        provider: 'replicate',
      }),
    });
    const { png, webp } = await response.json();
    expect(png).toBeDefined();
    expect(webp).toBeDefined();
  });

  it('generates multiple resolutions', async () => {
    const resolutions = ['1080x1920', '1440x2560', '2048x2732'];
    for (const res of resolutions) {
      const response = await generateBackground({ resolution: res });
      expect(response.resolution).toBe(res);
    }
  });
});
```

### Integration Tests
- Test full generation flow
- Verify image upload to Storage
- Test WebP conversion
- Verify style variations
- Test fallback to DALL-E

### Manual Testing
- Generation quality across styles
- Resolution accuracy
- File size optimization
- Selection UX
- Apply confirmation

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slow generation (30s+) | High | Progress UI, resolution limits |
| High API costs | High | Usage tracking, rate limits |
| Poor image quality | Medium | Model selection, prompt engineering |
| Large file sizes | Medium | WebP conversion, compression |
| API downtime | Low | Fallback provider, error handling |

## Success Metrics
- Background generation success rate: >90%
- Average generation time: <25s
- Average file size (WebP): <500KB
- Style variety score: >4.0/5.0
- API cost per generation: <$0.15

## Future Enhancements
- Custom color palette selection
- Image editing (crop, filters, brightness)
- Template backgrounds library
- AI upscaling for higher resolutions
- Background animation generation
