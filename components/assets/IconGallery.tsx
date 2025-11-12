import React, { useState } from 'react';
import { View, FlatList, Image, Alert, ActivityIndicator, Pressable } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useAssetStore } from '@/store/assetStore';
import { Button } from '@/src/ui/primitives/Button';
import { Input } from '@/src/ui/primitives/Input';
import { Text } from '@/src/ui/primitives/Text';
import { tokens } from '@/src/ui/tokens';

interface IconGalleryProps {
  projectId: string;
  onIconApplied?: (iconUrl: string) => void;
}

export function IconGallery({ projectId, onIconApplied }: IconGalleryProps) {
  const [prompt, setPrompt] = useState('');
  const {
    generatedIcons,
    selectedIcon,
    loading,
    error,
    generationProgress,
    generateIcons,
    selectIcon,
    applyIcon,
    clearGeneratedIcons,
  } = useAssetStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Input Required', 'Please describe your app icon');
      return;
    }

    try {
      await generateIcons(projectId, prompt.trim());
    } catch (err: any) {
      Alert.alert('Generation Failed', err.message || 'Failed to generate icons');
    }
  };

  const handleSelectIcon = (iconUrl: string) => {
    selectIcon(iconUrl);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const handleApply = async () => {
    if (!selectedIcon) return;

    try {
      await applyIcon(projectId, selectedIcon);
      Alert.alert('Success', 'Icon applied to your project!');
      onIconApplied?.(selectedIcon);
      clearGeneratedIcons();
    } catch (err: any) {
      Alert.alert('Apply Failed', err.message || 'Failed to apply icon');
    }
  };

  const handleRegenerate = () => {
    clearGeneratedIcons();
  };

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
        Generate App Icon
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.text.secondary,
          marginBottom: tokens.spacing[6],
        }}
      >
        Describe your app icon and we'll generate 6 unique variations
      </Text>

      {/* Generation Form */}
      {generatedIcons.length === 0 && (
        <View style={{ marginBottom: tokens.spacing[6] }}>
          <Input
            label="Icon Description"
            placeholder="E.g., fitness app, green dumbbell, minimal"
            value={prompt}
            onChangeText={setPrompt}
            accessibilityLabel="Icon description input"
            accessibilityHint="Describe the app icon you want to generate"
            disabled={loading}
          />
          <Button
            variant="primary"
            size="lg"
            onPress={handleGenerate}
            disabled={loading || !prompt.trim()}
            accessibilityLabel="Generate icons button"
            accessibilityHint="Generate 6 icon variations based on your description"
            fullWidth
          >
            {loading ? 'Generating...' : 'Generate Icons'}
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

      {/* Icon Grid */}
      {generatedIcons.length > 0 && !loading && (
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
              Select an Icon
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
            data={generatedIcons}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={3}
            contentContainerStyle={{ paddingBottom: 100 }}
            columnWrapperStyle={{ gap: tokens.spacing[3] }}
            style={{ marginBottom: tokens.spacing[4] }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelectIcon(item)}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: tokens.spacing.borderRadius.lg,
                  overflow: 'hidden',
                  borderWidth: selectedIcon === item ? 3 : 1,
                  borderColor:
                    selectedIcon === item
                      ? tokens.colors.primary[500]
                      : tokens.colors.border.subtle,
                  marginBottom: tokens.spacing[3],
                }}
              >
                <Image
                  source={{ uri: item }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {selectedIcon === item && (
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
                    <Text style={{ color: 'white', fontSize: 16 }}>✓</Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        </>
      )}

      {/* Apply Button - Fixed at Bottom */}
      {selectedIcon && (
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
            accessibilityLabel="Apply selected icon"
            accessibilityHint="Apply the selected icon to your project"
            fullWidth
          >
            Apply Icon
          </Button>
        </View>
      )}
    </View>
  );
}
