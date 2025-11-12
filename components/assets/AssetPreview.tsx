import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { Text } from '@/src/ui/primitives/Text';
import { tokens } from '@/src/ui/tokens';

interface AssetPreviewProps {
  type: 'icon' | 'sound' | 'image';
  url: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AssetPreview({ type, url, onPress, size = 'md' }: AssetPreviewProps) {
  const sizeMap = {
    sm: 48,
    md: 80,
    lg: 120,
  };

  const dimension = sizeMap[size];

  const renderPreview = () => {
    switch (type) {
      case 'icon':
      case 'image':
        return (
          <Image
            source={{ uri: url }}
            style={{
              width: dimension,
              height: dimension,
              borderRadius: tokens.spacing.borderRadius.md,
            }}
            resizeMode="cover"
          />
        );

      case 'sound':
        return (
          <View
            style={{
              width: dimension,
              height: dimension,
              borderRadius: tokens.spacing.borderRadius.md,
              backgroundColor: tokens.colors.primary[100],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: dimension * 0.5 }}>🔊</Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          borderRadius: tokens.spacing.borderRadius.md,
          overflow: 'hidden',
        }}
      >
        {renderPreview()}
      </Pressable>
    );
  }

  return <View>{renderPreview()}</View>;
}
