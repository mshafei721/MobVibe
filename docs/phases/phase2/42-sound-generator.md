# Phase 42: Sound Generator

## Metadata
```yaml
phase: 42
title: Sound Generator
track: Asset Generation
category: ai-generation
priority: medium
complexity: medium
estimated_hours: 16
dependencies: [40]
websearch: true
```

## Overview
Integrate ElevenLabs API to generate custom sound effects and audio assets for user projects, providing text-to-audio generation, preview player, asset storage, and seamless integration into project files.

## Success Criteria
- [ ] ElevenLabs API integrated via proxy
- [ ] Generate audio from text descriptions
- [ ] Preview player with play/pause/replay
- [ ] Multiple voice/style options available
- [ ] Generated audio stored in project assets
- [ ] Audio formats: MP3 (optimal size/quality)
- [ ] Generation completes in <20 seconds
- [ ] Support sound effects & voice generation

## Technical Approach

### ElevenLabs Integration
```typescript
// lib/sound-generator.ts
export class SoundGenerator {
  private apiUrl = `${API_BASE_URL}/elevenlabs/generate`;

  async generateAudio(
    prompt: string,
    projectId: string,
    options: AudioGenerationOptions
  ): Promise<GeneratedAudio> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        text: prompt,
        project_id: projectId,
        voice_id: options.voiceId || 'default',
        model_id: options.modelId || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Download and store audio
    const blob = await fetch(data.audio_url).then(r => r.blob());
    const localPath = await this.storeAudio(projectId, prompt, blob);

    return {
      id: data.id,
      url: data.audio_url,
      localPath,
      prompt,
      voiceId: options.voiceId,
      duration: data.duration,
      createdAt: new Date()
    };
  }

  private async storeAudio(
    projectId: string,
    prompt: string,
    blob: Blob
  ): Promise<string> {
    const fileName = `${slugify(prompt)}-${Date.now()}.mp3`;
    const path = `projects/${projectId}/assets/audio/${fileName}`;

    const { data, error } = await supabase.storage
      .from('project-assets')
      .upload(path, blob, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from('project-assets')
      .getPublicUrl(path);

    return publicUrl.publicUrl;
  }

  async getAvailableVoices(): Promise<Voice[]> {
    const response = await fetch(`${this.apiUrl}/voices`, {
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    return response.json();
  }

  async addToProject(
    projectId: string,
    audioPath: string,
    assetName: string
  ): Promise<void> {
    // Copy audio to project's sound directory
    await copyAsset(projectId, audioPath, `assets/sounds/${assetName}.mp3`);

    // Update project manifest
    await this.updateProjectManifest(projectId, assetName);
  }

  private async updateProjectManifest(projectId: string, assetName: string) {
    const manifest = await readProjectManifest(projectId);
    if (!manifest.assets) manifest.assets = {};
    if (!manifest.assets.sounds) manifest.assets.sounds = [];

    manifest.assets.sounds.push({
      name: assetName,
      path: `./assets/sounds/${assetName}.mp3`,
      addedAt: new Date().toISOString()
    });

    await writeProjectManifest(projectId, manifest);
  }
}

interface AudioGenerationOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number; // 0-1
  similarityBoost?: number; // 0-1
}

interface GeneratedAudio {
  id: string;
  url: string;
  localPath: string;
  prompt: string;
  voiceId?: string;
  duration: number;
  createdAt: Date;
}
```

### Backend Proxy
```typescript
// backend/src/proxies/elevenlabs.ts
export class ElevenLabsProxy extends BaseProxy {
  constructor(userId: string) {
    super(userId, 'elevenlabs');
  }

  protected async getApiKey(): Promise<string> {
    return await getRotatedKey('elevenlabs');
  }

  protected async makeRequest(req: Request, apiKey: string) {
    const endpoint = req.path.includes('/voices')
      ? 'https://api.elevenlabs.io/v1/voices'
      : 'https://api.elevenlabs.io/v1/text-to-speech';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: req.body.text,
        model_id: req.body.model_id,
        voice_settings: req.body.voice_settings
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw { status: response.status, message: error.detail?.message };
    }

    // For audio generation, return blob URL
    if (req.path.includes('text-to-speech')) {
      const audioBlob = await response.blob();
      const audioBuffer = await audioBlob.arrayBuffer();

      // Store temporarily and return URL
      const tempUrl = await this.storeTempAudio(audioBuffer);

      return {
        id: generateId(),
        audio_url: tempUrl,
        duration: await getAudioDuration(audioBuffer)
      };
    }

    return response.json();
  }

  protected estimateCost(body: any): number {
    // ElevenLabs pricing: ~$0.30 per 1000 characters
    const charCount = body.text?.length || 0;
    return (charCount / 1000) * 0.30;
  }

  protected calculateCost(response: any): number {
    // Actual cost based on generated audio length
    return response.duration ? (response.duration / 60) * 0.18 : 0;
  }

  protected sanitizeResponse(response: any): any {
    return {
      id: response.id,
      audio_url: response.audio_url,
      duration: response.duration
    };
  }

  private async storeTempAudio(buffer: ArrayBuffer): Promise<string> {
    const fileName = `temp-${Date.now()}.mp3`;
    const path = `temp/audio/${fileName}`;

    const { data } = await supabase.storage
      .from('temp-assets')
      .upload(path, buffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600' // 1 hour cache
      });

    const { data: publicUrl } = supabase.storage
      .from('temp-assets')
      .getPublicUrl(path);

    return publicUrl.publicUrl;
  }
}
```

### Sound Generator Hook
```typescript
// hooks/useSoundGenerator.ts
export function useSoundGenerator(projectId: string) {
  const [generating, setGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const generator = new SoundGenerator();
      const available = await generator.getAvailableVoices();
      setVoices(available);
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const generateAudio = async (prompt: string, options: AudioGenerationOptions) => {
    setGenerating(true);
    setError(null);

    try {
      const generator = new SoundGenerator();
      const audio = await generator.generateAudio(prompt, projectId, options);
      setGeneratedAudio(audio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const addToProject = async (assetName: string) => {
    if (!generatedAudio) return;

    try {
      const generator = new SoundGenerator();
      await generator.addToProject(projectId, generatedAudio.localPath, assetName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to project');
    }
  };

  return {
    generating,
    generatedAudio,
    voices,
    error,
    generateAudio,
    addToProject
  };
}
```

### Sound Generator UI
```typescript
// components/SoundGenerator.tsx
export function SoundGenerator({ projectId }: { projectId: string }) {
  const [prompt, setPrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('default');
  const [assetName, setAssetName] = useState('');
  const [generationType, setGenerationType] = useState<'sfx' | 'voice'>('sfx');

  const {
    generating,
    generatedAudio,
    voices,
    error,
    generateAudio,
    addToProject
  } = useSoundGenerator(projectId);

  const handleGenerate = () => {
    const options: AudioGenerationOptions = {
      voiceId: generationType === 'voice' ? selectedVoice : undefined,
      modelId: generationType === 'sfx'
        ? 'eleven_sound_effects_v1'
        : 'eleven_monolingual_v1',
      stability: 0.5,
      similarityBoost: 0.5
    };

    generateAudio(prompt, options);
  };

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4">Generate Sound Assets</Text>

      {/* Generation Type */}
      <View className="mb-6">
        <Text className="text-sm font-medium mb-2">Type</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setGenerationType('sfx')}
            className={`flex-1 p-3 rounded-lg border ${
              generationType === 'sfx'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <Text className="text-center font-medium">Sound Effects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setGenerationType('voice')}
            className={`flex-1 p-3 rounded-lg border ${
              generationType === 'voice'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <Text className="text-center font-medium">Voice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice Selection (for voice type) */}
      {generationType === 'voice' && (
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2">Voice</Text>
          <Picker
            selectedValue={selectedVoice}
            onValueChange={setSelectedVoice}
            className="border border-gray-300 rounded-lg"
          >
            {voices.map(voice => (
              <Picker.Item key={voice.id} label={voice.name} value={voice.id} />
            ))}
          </Picker>
        </View>
      )}

      {/* Prompt Input */}
      <View className="mb-6">
        <Text className="text-sm font-medium mb-2">
          {generationType === 'sfx'
            ? 'Describe the sound effect'
            : 'Enter text to speak'}
        </Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder={
            generationType === 'sfx'
              ? 'e.g., door creaking open slowly'
              : 'e.g., Welcome to the app!'
          }
          className="border border-gray-300 rounded-lg p-3 mb-2"
          multiline
          numberOfLines={3}
        />
        <Text className="text-xs text-gray-500">
          {generationType === 'sfx'
            ? 'Describe the sound in detail for best results'
            : 'Keep it under 100 words for quick generation'}
        </Text>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={!prompt.trim() || generating}
        className={`p-4 rounded-lg mb-6 ${
          !prompt.trim() || generating ? 'bg-gray-300' : 'bg-blue-500'
        }`}
      >
        <Text className="text-white text-center font-medium">
          {generating ? 'Generating...' : 'Generate Audio'}
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
          <Text className="mt-4 text-gray-600">Generating audio...</Text>
        </View>
      )}

      {/* Audio Preview & Save */}
      {generatedAudio && (
        <View className="border border-gray-200 rounded-lg p-4">
          <Text className="font-medium mb-4">Preview & Save</Text>

          {/* Audio Player */}
          <AudioPlayer audio={generatedAudio} />

          {/* Asset Name Input */}
          <View className="mt-4">
            <Text className="text-sm font-medium mb-2">Asset Name</Text>
            <TextInput
              value={assetName}
              onChangeText={setAssetName}
              placeholder="e.g., button-click"
              className="border border-gray-300 rounded-lg p-3 mb-2"
            />
            <Text className="text-xs text-gray-500">
              This will be saved as {assetName || 'asset-name'}.mp3
            </Text>
          </View>

          {/* Add to Project Button */}
          <TouchableOpacity
            onPress={() => addToProject(assetName)}
            disabled={!assetName.trim()}
            className={`p-4 rounded-lg mt-4 ${
              !assetName.trim() ? 'bg-gray-300' : 'bg-green-500'
            }`}
          >
            <Text className="text-white text-center font-medium">
              Add to Project
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

### Audio Player Component
```typescript
// components/AudioPlayer.tsx
import { Audio } from 'expo-av';

export function AudioPlayer({ audio }: { audio: GeneratedAudio }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playPause = async () => {
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audio.localPath },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const formatTime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <View className="bg-gray-50 p-4 rounded-lg">
      {/* Waveform Visual (simplified) */}
      <View className="h-16 bg-gray-200 rounded mb-4 items-center justify-center">
        <Text className="text-gray-500">Audio Waveform</Text>
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-gray-600">
          {formatTime(position)} / {formatTime(audio.duration * 1000)}
        </Text>

        <TouchableOpacity
          onPress={playPause}
          className="bg-blue-500 rounded-full p-4"
        >
          <Text className="text-white text-lg">
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            if (sound) {
              await sound.setPositionAsync(0);
              setPosition(0);
            }
          }}
          className="bg-gray-300 rounded-full p-3"
        >
          <Text className="text-gray-700">↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

## Implementation Steps

1. **API Integration** (4h)
   - Build SoundGenerator class
   - Implement ElevenLabs proxy
   - Add audio storage to Supabase
   - Handle voice/SFX generation

2. **Audio Storage** (2h)
   - Store audio in project assets
   - Generate public URLs
   - Update project manifest

3. **Generator UI** (4h)
   - Build SoundGenerator component
   - Create type selection (SFX/voice)
   - Add voice picker
   - Implement prompt input

4. **Audio Player** (3h)
   - Build AudioPlayer component
   - Add play/pause/replay controls
   - Show playback progress
   - Handle audio lifecycle

5. **Testing & Polish** (3h)
   - Test generation flow
   - Handle errors gracefully
   - Add loading states
   - Optimize audio playback

## Testing Requirements

### Unit Tests
```typescript
describe('SoundGenerator', () => {
  it('should generate audio from text', async () => {
    const generator = new SoundGenerator();
    const audio = await generator.generateAudio('test', 'project-123', {});
    expect(audio.localPath).toBeDefined();
  });

  it('should add audio to project', async () => {
    // Test add to project logic
  });

  it('should fetch available voices', async () => {
    // Test voice fetching
  });
});
```

### Integration Tests
- Generation completes in <20 seconds
- Audio plays correctly in player
- Added audio appears in project assets
- Voice selection affects output

## Files Changed
```
lib/sound-generator.ts                [new]
hooks/useSoundGenerator.ts            [new]
components/SoundGenerator.tsx         [new]
components/AudioPlayer.tsx            [new]
backend/src/proxies/elevenlabs.ts     [new]
app/(project)/[id]/assets.tsx         [modified - add sound generator]
```

## Database Schema
```sql
-- Audio generation tracking
CREATE TABLE audio_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generation_type TEXT CHECK(generation_type IN ('sfx', 'voice')),
  voice_id TEXT,
  audio_url TEXT NOT NULL,
  local_path TEXT NOT NULL,
  duration DECIMAL(10, 2),
  cost DECIMAL(10, 6),
  asset_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audio_generations_project ON audio_generations(project_id, created_at DESC);
```

## Notes
- Research ElevenLabs API pricing & character limits
- Support multiple models (sound effects vs voice)
- Add voice preview samples
- Consider audio compression for storage
- Implement waveform visualization
- Add batch generation for multiple sounds
- Support audio trimming/editing
- Consider voice cloning for custom voices
