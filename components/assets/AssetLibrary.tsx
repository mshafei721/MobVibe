import React, { useEffect, useState } from 'react';
import { View, FlatList, Image, Alert, Pressable, Modal } from 'react-native';
import { Audio } from 'expo-av';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useAssetStore, Asset } from '@/store/assetStore';
import { Button } from '@/src/ui/primitives/Button';
import { Text } from '@/src/ui/primitives/Text';
import { Card } from '@/src/ui/primitives/Card';
import { tokens } from '@/src/ui/tokens';
import { logger } from '@/utils/logger';

interface AssetLibraryProps {
  projectId: string;
}

export function AssetLibrary({ projectId }: AssetLibraryProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);

  const { assets, loading, error, fetchAssets, deleteAsset, regenerateAsset } = useAssetStore();

  useEffect(() => {
    fetchAssets(projectId);
  }, [projectId]);

  useEffect(() => {
    // Cleanup sound on unmount
    return () => {
      if (playingSound) {
        playingSound.unloadAsync();
      }
    };
  }, [playingSound]);

  const handlePreviewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setPreviewModalVisible(true);
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  };

  const handlePlaySound = async (soundUrl: string) => {
    try {
      // Stop currently playing sound
      if (playingSound) {
        await playingSound.stopAsync();
        await playingSound.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUrl },
        { shouldPlay: true }
      );

      setPlayingSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingSound(null);
        }
      });
    } catch (err) {
      Alert.alert('Playback Error', 'Failed to play sound');
      logger.error('Sound playback error', err as Error);
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    Alert.alert(
      'Delete Asset',
      'Are you sure you want to delete this asset? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAsset(assetId);
              setPreviewModalVisible(false);
              setSelectedAsset(null);
              Alert.alert('Success', 'Asset deleted successfully');
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Failed to delete asset');
            }
          },
        },
      ]
    );
  };

  const handleRegenerateAsset = async (assetId: string) => {
    try {
      setPreviewModalVisible(false);
      await regenerateAsset(assetId);
      Alert.alert('Success', 'Regeneration started');
    } catch (err: any) {
      Alert.alert('Regeneration Failed', err.message || 'Failed to regenerate asset');
    }
  };

  const renderAssetItem = ({ item }: { item: Asset }) => {
    const isIcon = item.type === 'icon';
    const isSound = item.type === 'sound';

    return (
      <Pressable onPress={() => handlePreviewAsset(item)}>
        <Card
          style={{
            marginBottom: tokens.spacing[3],
            padding: tokens.spacing[4],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Asset Preview */}
            {isIcon && (
              <Image
                source={{ uri: item.url }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: tokens.spacing.borderRadius.md,
                  marginRight: tokens.spacing[3],
                }}
                resizeMode="cover"
              />
            )}

            {isSound && (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: tokens.spacing.borderRadius.md,
                  backgroundColor: tokens.colors.primary[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: tokens.spacing[3],
                }}
              >
                <Text style={{ fontSize: 30 }}>🔊</Text>
              </View>
            )}

            {/* Asset Info */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.base,
                  fontWeight: tokens.typography.fontWeight.semibold as any,
                  color: tokens.colors.text.primary,
                  marginBottom: tokens.spacing[1],
                }}
              >
                {item.type === 'icon' ? 'App Icon' : 'Sound Effect'}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: tokens.colors.text.secondary,
                  marginBottom: tokens.spacing[1],
                }}
              >
                {item.prompt || 'No description'}
              </Text>
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: tokens.colors.text.tertiary,
                }}
              >
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            {/* Action Icon */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: tokens.spacing.borderRadius.full,
                backgroundColor: tokens.colors.surface[2],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>›</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing[8],
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: tokens.spacing[4] }}>📦</Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.xl,
          fontWeight: tokens.typography.fontWeight.bold as any,
          color: tokens.colors.text.primary,
          marginBottom: tokens.spacing[2],
          textAlign: 'center',
        }}
      >
        No Assets Yet
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.text.secondary,
          textAlign: 'center',
        }}
      >
        Generate icons and sounds to see them here
      </Text>
    </View>
  );

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
        Asset Library
      </Text>
      <Text
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: tokens.colors.text.secondary,
          marginBottom: tokens.spacing[6],
        }}
      >
        All generated assets for this project
      </Text>

      {/* Error State */}
      {error && (
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

      {/* Asset List */}
      <FlatList
        data={assets}
        keyExtractor={(item) => item.id}
        renderItem={renderAssetItem}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshing={loading}
        onRefresh={() => fetchAssets(projectId)}
      />

      {/* Asset Preview Modal */}
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing[4],
          }}
        >
          <View
            style={{
              backgroundColor: tokens.colors.background.base,
              borderRadius: tokens.spacing.borderRadius.xl,
              padding: tokens.spacing[6],
              width: '100%',
              maxWidth: 400,
            }}
          >
            {selectedAsset && (
              <>
                {/* Preview Content */}
                {selectedAsset.type === 'icon' && (
                  <Image
                    source={{ uri: selectedAsset.url }}
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: tokens.spacing.borderRadius.lg,
                      marginBottom: tokens.spacing[4],
                    }}
                    resizeMode="contain"
                  />
                )}

                {selectedAsset.type === 'sound' && (
                  <View
                    style={{
                      alignItems: 'center',
                      marginBottom: tokens.spacing[4],
                    }}
                  >
                    <Text style={{ fontSize: 80, marginBottom: tokens.spacing[4] }}>🔊</Text>
                    <Button
                      variant="primary"
                      size="lg"
                      onPress={() => handlePlaySound(selectedAsset.url)}
                      accessibilityLabel="Play sound preview"
                      fullWidth
                    >
                      {playingSound ? 'Stop' : 'Play Sound'}
                    </Button>
                  </View>
                )}

                {/* Asset Info */}
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.xl,
                    fontWeight: tokens.typography.fontWeight.bold as any,
                    color: tokens.colors.text.primary,
                    marginBottom: tokens.spacing[2],
                  }}
                >
                  {selectedAsset.type === 'icon' ? 'App Icon' : 'Sound Effect'}
                </Text>
                <Text
                  style={{
                    fontSize: tokens.typography.fontSize.base,
                    color: tokens.colors.text.secondary,
                    marginBottom: tokens.spacing[4],
                  }}
                >
                  {selectedAsset.prompt || 'No description available'}
                </Text>

                {/* Actions */}
                <View style={{ gap: tokens.spacing[3] }}>
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => handleRegenerateAsset(selectedAsset.id)}
                    accessibilityLabel="Regenerate asset"
                    fullWidth
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => handleDeleteAsset(selectedAsset.id)}
                    accessibilityLabel="Delete asset"
                    fullWidth
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onPress={() => setPreviewModalVisible(false)}
                    accessibilityLabel="Close preview"
                    fullWidth
                  >
                    Close
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
