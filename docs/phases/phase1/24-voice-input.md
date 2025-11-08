# Phase 24: Voice Input Integration

## Overview
Native speech-to-text for prompt input with hold-to-speak interface and cloud fallback.

**Duration:** 2 days
**Dependencies:** [23]
**Owners:** Frontend Engineer

## Objectives
- Native speech recognition (iOS/Android)
- Hold-to-speak button interface
- Cloud fallback (Google Speech-to-Text)
- >90% transcription accuracy

## Technical Approach

### Speech Recognition Stack
```yaml
Native:
  iOS: expo-speech (iOS Speech framework)
  Android: expo-speech (Android Speech Recognizer)

Cloud Fallback:
  Provider: Google Cloud Speech-to-Text API
  Trigger: Native unavailable or poor quality
  Edge Function: /api/speech-to-text
```

### Implementation Steps

#### 1. Native Speech Setup (6h)
```typescript
// hooks/useSpeechRecognition.ts
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

interface SpeechConfig {
  language?: string;
  continuous?: boolean;
  fallbackToCloud?: boolean;
}

export function useSpeechRecognition(config: SpeechConfig) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) throw new Error('Microphone permission denied');

      // Platform-specific implementation
      if (Platform.OS === 'ios') {
        await startIOSRecognition();
      } else {
        await startAndroidRecognition();
      }

      setIsRecording(true);
    } catch (err) {
      if (config.fallbackToCloud) {
        await fallbackToCloudSTT();
      }
      setError(err.message);
    }
  };

  const stopRecording = async () => {
    // Stop recognition
    setIsRecording(false);
  };

  return { isRecording, transcript, error, startRecording, stopRecording };
}
```

#### 2. Hold-to-Speak UI Component (4h)
```typescript
// components/VoiceInputButton.tsx
export function VoiceInputButton({ onTranscript }: Props) {
  const { isRecording, transcript, startRecording, stopRecording } =
    useSpeechRecognition({ fallbackToCloud: true });

  const handlePressIn = async () => {
    await startRecording();
    haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = async () => {
    await stopRecording();
    if (transcript) {
      onTranscript(transcript);
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="w-16 h-16 rounded-full items-center justify-center"
      style={{
        backgroundColor: isRecording ? '#ef4444' : '#8b5cf6',
        transform: [{ scale: isRecording ? 1.1 : 1 }],
      }}
    >
      <MicIcon size={24} color="white" />
      {isRecording && (
        <Animated.View className="absolute -inset-2 rounded-full border-2 border-red-500">
          {/* Pulsing animation */}
        </Animated.View>
      )}
    </Pressable>
  );
}
```

#### 3. Cloud STT Fallback (4h)
```typescript
// supabase/functions/speech-to-text/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SpeechClient } from '@google-cloud/speech';

const client = new SpeechClient({
  credentials: JSON.parse(Deno.env.get('GOOGLE_CLOUD_CREDENTIALS')!),
});

serve(async (req) => {
  const { audioContent, languageCode = 'en-US' } = await req.json();

  const [response] = await client.recognize({
    audio: { content: audioContent },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode,
      enableAutomaticPunctuation: true,
      model: 'default',
    },
  });

  const transcript = response.results
    ?.map(result => result.alternatives?.[0]?.transcript)
    .join(' ') || '';

  return new Response(JSON.stringify({ transcript }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 4. Permission Handling (2h)
```typescript
// utils/permissions.ts
export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Microphone Access',
      'Voice input requires microphone permission. Enable in Settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  return true;
}
```

## Key Tasks

### Core Implementation
- [ ] Install expo-speech & expo-av
- [ ] Implement useSpeechRecognition hook
- [ ] Build hold-to-speak button component
- [ ] Add recording visualization (pulse effect)
- [ ] Handle microphone permissions

### Cloud Fallback
- [ ] Setup Google Cloud Speech-to-Text API
- [ ] Create /api/speech-to-text Edge Function
- [ ] Implement audio recording & encoding
- [ ] Add fallback trigger logic
- [ ] Handle API errors gracefully

### Integration
- [ ] Add voice button to prompt input
- [ ] Insert transcript into text field
- [ ] Show transcription progress
- [ ] Add edit capability post-transcription
- [ ] Test on iOS & Android devices

## Acceptance Criteria
- [ ] Voice input works on iOS & Android
- [ ] Hold-to-speak UX is intuitive
- [ ] Transcription accuracy >90%
- [ ] Cloud fallback triggers automatically
- [ ] Permissions handled gracefully
- [ ] Loading states clear
- [ ] Error messages actionable

## Testing Strategy

### Unit Tests
```typescript
describe('useSpeechRecognition', () => {
  it('requests microphone permission', async () => {
    const { result } = renderHook(() => useSpeechRecognition({}));
    await act(async () => {
      await result.current.startRecording();
    });
    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('falls back to cloud on native failure', async () => {
    mockNativeFailure();
    const { result } = renderHook(() =>
      useSpeechRecognition({ fallbackToCloud: true })
    );
    await act(async () => {
      await result.current.startRecording();
    });
    expect(fetch).toHaveBeenCalledWith('/api/speech-to-text');
  });
});
```

### Integration Tests
- Test hold-to-speak flow end-to-end
- Verify transcript insertion
- Test permission denial scenarios
- Verify cloud fallback trigger
- Test on low-quality audio

### Device Testing
- iOS speech recognition accuracy
- Android speech recognition accuracy
- Background noise handling
- Multiple language support
- Cloud STT latency

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Native API limitations | High | Cloud fallback ready |
| Permission denials | Medium | Clear prompts, Settings link |
| Poor audio quality | Medium | Noise filtering, cloud fallback |
| Cloud API costs | Low | Rate limiting, caching |
| Transcription errors | Medium | Edit capability, confidence scores |

## Success Metrics
- Voice input adoption rate: >30%
- Transcription accuracy: >90%
- Cloud fallback rate: <20%
- Permission grant rate: >80%
- User satisfaction: >4.0/5.0

## Future Enhancements
- Multi-language support
- Custom vocabulary (code terms)
- Voice commands (not just dictation)
- Offline speech recognition
- Speaker diarization
