import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconGallery } from '@/components/assets/IconGallery';
import { SoundGallery } from '@/components/assets/SoundGallery';
import { AssetLibrary } from '@/components/assets/AssetLibrary';
import { Text } from '@/src/ui/primitives/Text';
import { tokens } from '@/src/ui/tokens';
import { useProjectStore } from '@/store/projectStore';
import { logger } from '@/utils/logger';

type AssetTab = 'icons' | 'sounds' | 'library';

export default function AssetsScreen() {
  const [activeTab, setActiveTab] = useState<AssetTab>('icons');
  const { currentProject } = useProjectStore();

  if (!currentProject) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background.base }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.xl,
              fontWeight: tokens.typography.fontWeight.bold as any,
              color: tokens.colors.text.primary,
              marginBottom: tokens.spacing[2],
              textAlign: 'center',
            }}
          >
            No Project Selected
          </Text>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.base,
              color: tokens.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Please select or create a project to generate assets
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs: { id: AssetTab; label: string; icon: string }[] = [
    { id: 'icons', label: 'Icons', icon: '🎨' },
    { id: 'sounds', label: 'Sounds', icon: '🔊' },
    { id: 'library', label: 'Library', icon: '📦' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background.base }}>
      {/* Tab Bar */}
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: tokens.colors.border.subtle,
          backgroundColor: tokens.colors.background.base,
        }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              paddingVertical: tokens.spacing[4],
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor:
                activeTab === tab.id ? tokens.colors.primary[500] : 'transparent',
            }}
          >
            <Text style={{ fontSize: 20, marginBottom: tokens.spacing[1] }}>{tab.icon}</Text>
            <Text
              style={{
                fontSize: tokens.typography.fontSize.sm,
                fontWeight:
                  (activeTab === tab.id
                    ? tokens.typography.fontWeight.semibold
                    : tokens.typography.fontWeight.medium) as any,
                color:
                  activeTab === tab.id
                    ? tokens.colors.primary[500]
                    : tokens.colors.text.secondary,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'icons' && (
          <IconGallery
            projectId={currentProject.id}
            onIconApplied={(iconUrl) => {
              logger.info('Icon applied:', iconUrl);
            }}
          />
        )}

        {activeTab === 'sounds' && (
          <SoundGallery
            projectId={currentProject.id}
            onSoundApplied={(soundUrl) => {
              logger.info('Sound applied:', soundUrl);
            }}
          />
        )}

        {activeTab === 'library' && <AssetLibrary projectId={currentProject.id} />}
      </View>
    </SafeAreaView>
  );
}
