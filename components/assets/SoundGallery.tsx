import React, { useState } from 'react';
import { View, FlatList, Alert, ActivityIndicator, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useAssetStore } from '@/store/assetStore';
import { Button } from '@/src/ui/primitives/Button';
import { Input } from '@/src/ui/primitives/Input';
import { Text } from '@/src/ui/primitives/Text';
import { tokens } from '@/src/ui/tokens';
import { logger } from '@/utils/logger';

interface SoundGalleryProps {
  projectId: string;
  onSoundApplied?: (soundUrl: string) => void;
}

export function SoundGallery({ projectId, onSoundApplied }: SoundGalleryProps) {
  const [prompt, setPrompt] = useState('');
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [soundObjects, setSoundObjects] = useState<Map<string, Audio.Sound>>(new Map());

  const {
    generatedSounds,
    selectedSound,
    loading,
    error,
    generationProgress,
    generateSounds,
    selectSound,
    applySound,
    clearGeneratedSounds,
  } = useAssetStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Input Required', 'Please describe the sound effect');
      return;
    }

    try {
      await generateSounds(projectId, prompt.trim(), 4);
    } catch (err: any) {
      Alert.alert('Generation Failed', err.message || 'Failed to generate sounds');
    }
  };

  const handlePlaySound = async (soundUrl: string) => {
    try {
      // Stop currently playing sound
      if (playingSound && soundObjects.has(playingSound)) {
        const currentSound = soundObjects.get(playingSound);
        await currentSound?.stopAsync();
      }

      // If clicking the same sound, just stop it
      if (playingSound === soundUrl) {
        setPlayingSound(null);
        return;
      }

      // Load and play new sound
      let sound: Audio.Sound;
      if (soundObjects.has(soundUrl)) {
        sound = soundObjects.get(soundUrl)!;
        await sound.replayAsync();
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: soundUrl },
          { shouldPlay: true }
        );
        sound = newSound;
        setSoundObjects(new Map(soundObjects.set(soundUrl, sound)));

        // Auto-stop when finished
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingSound(null);
          }
        });
      }

      setPlayingSound(soundUrl);

      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (err: any) {
      Alert.alert('Playback Error', 'Failed to play sound');
      logger.error('Sound playback error', err as Error);
    }
  };

  const handleSelectSound = (soundUrl: string) => {
    selectSound(soundUrl);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const handleApply = async () => {
    if (!selectedSound) return;

    try {
      await applySound(projectId, selectedSound);
      Alert.alert('Success', 'Sound added to your project!');
      onSoundApplied?.(selectedSound);

      // Cleanup
      soundObjects.forEach((sound) => sound.unloadAsync());
      clearGeneratedSounds();
    } catch (err: any) {
      Alert.alert('Apply Failed', err.message || 'Failed to apply sound');
    }
  };

  const handleRegenerate = () => {
    soundObjects.forEach((sound) => sound.unloadAsync());
    setSoundObjects(new Map());
    setPlayingSound(null);
    clearGeneratedSounds();
  };

  React.useEffect(() => {
    // Cleanup on unmount
    return () => {
      soundObjects.forEach((sound) => sound.unloadAsync());
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: tokens.spacing[4] }}>
      {/* Header */}
      <Text
        style={{
          fontSize: tokens.typography.fontSize['2xl'],
          fontWeight: tokens.typography.fontWeight.bold as any,
          color: tokens.colors.text.primary,
          marginBottom: tokens.spacing[2],
        }}
      >
        Generate Sound Effects
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.text.secondary,
          marginBottom: tokens.spacing[6],
        }}
      >
        Describe a sound effect and we'll generate 4 variations
      </Text>

      {/* Generation Form */}
      {generatedSounds.length === 0 && (
        <View style={{ marginBottom: tokens.spacing[6] }}>
          <Input
            label="Sound Description"
            placeholder="E.g., button click, notification chime, success sound"
            value={prompt}
            onChangeText={setPrompt}
            accessibilityLabel="Sound description input"
            accessibilityHint="Describe the sound effect you want to generate"
            disabled={loading}
          />
          <Button
            variant="primary"
            size="lg"
            onPress={handleGenerate}
            disabled={loading || !prompt.trim()}
            accessibilityLabel="Generate sounds button"
            accessibilityHint="Generate 4 sound variations based on your description"
            fullWidth
          >
            {loading ? 'Generating...' : 'Generate Sounds'}
          </Button>
        </View>
      )}

      {/* Loading State with Progress */}
      {loading && (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: tokens.spacing[8],
          }}
        >
          <ActivityIndicator size="large" color={tokens.colors.primary[500]} />
          <Text
            style={{
              marginTop: tokens.spacing[4],
              fontSize: tokens.typography.fontSize.base,
              color: tokens.colors.text.secondary,
            }}
          >
            {generationProgress.message}
          </Text>
          <View
            style={{
              width: '100%',
              height: 4,
              backgroundColor: tokens.colors.surface[2],
              borderRadius: tokens.spacing.borderRadius.full,
              marginTop: tokens.spacing[4],
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${generationProgress.progress}%`,
                height: '100%',
                backgroundColor: tokens.colors.primary[500],
              }}
            />
          </View>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View
          style={{
            padding: tokens.spacing[4],
            backgroundColor: tokens.colors.error[50],
            borderRadius: tokens.spacing.borderRadius.md,
            marginBottom: tokens.spacing[4],
          }}
        >
          <Text
            style={{
              color: tokens.colors.error[700],
              fontSize: tokens.typography.fontSize.base,
            }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Sound List */}
      {generatedSounds.length > 0 && !loading && (
        <>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: tokens.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold as any,
                color: tokens.colors.text.primary,
              }}
            >
              Select a Sound
            </Text>
            <Pressable onPress={handleRegenerate}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.primary[500],
                  fontWeight: tokens.typography.fontWeight.medium as any,
                }}
              >
                Regenerate
              </Text>
            </Pressable>
          </View>

          <FlatList
            data={generatedSounds}
            keyExtractor={(item, index) => `${item}-${index}`}
            contentContainerStyle={{ paddingBottom: 100 }}
            style={{ marginBottom: tokens.spacing[4] }}
            renderItem={({ item, index }) => (
              <View
                style={{
                  marginBottom: tokens.spacing[3],
                  borderRadius: tokens.spacing.borderRadius.lg,
                  borderWidth: selectedSound === item ? 2 : 1,
                  borderColor:
                    selectedSound === item
                      ? tokens.colors.primary[500]
                      : tokens.colors.border.subtle,
                  backgroundColor: tokens.colors.surface[0],
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => handleSelectSound(item)}
                  style={{
                    padding: tokens.spacing[4],
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.base,
                        fontWeight: tokens.typography.fontWeight.medium as any,
                        color: tokens.colors.text.primary,
                        marginBottom: tokens.spacing[1],
                      }}
                    >
                      Sound Variation {index + 1}
                    </Text>
                    <Text
                      style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: tokens.colors.text.secondary,
                      }}
                    >
                      Tap to select, play button to preview
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handlePlaySound(item)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: tokens.spacing.borderRadius.full,
                      backgroundColor:
                        playingSound === item
                          ? tokens.colors.error[500]
                          : tokens.colors.primary[500],
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: tokens.spacing[3],
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {playingSound === item ? '⏸' : '▶️'}
                    </Text>
                  </Pressable>
                </Pressable>

                {selectedSound === item && (
                  <View
                    style={{
                      position: 'absolute',
                      top: tokens.spacing[2],
                      right: tokens.spacing[2],
                      backgroundColor: tokens.colors.primary[500],
                      borderRadius: tokens.spacing.borderRadius.full,
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 14 }}>✓</Text>
                  </View>
                )}
              </View>
            )}
          />
        </>
      )}

      {/* Apply Button - Fixed at Bottom */}
      {selectedSound && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: tokens.spacing[4],
            backgroundColor: tokens.colors.background.base,
            borderTopWidth: 1,
            borderTopColor: tokens.colors.border.subtle,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onPress={handleApply}
            disabled={loading}
            accessibilityLabel="Apply selected sound"
            accessibilityHint="Apply the selected sound to your project"
            fullWidth
          >
            Apply Sound
          </Button>
        </View>
      )}
    </View>
  );
}
