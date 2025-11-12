import { useState, useCallback } from 'react';
import { useAssetStore } from '@/store/assetStore';

export interface UseIconGenerationResult {
  generateIcons: (projectId: string, prompt: string, count?: number) => Promise<string[]>;
  selectIcon: (iconUrl: string) => void;
  applyIcon: (projectId: string, iconUrl: string) => Promise<void>;
  clearIcons: () => void;
  icons: string[];
  selectedIcon: string | null;
  loading: boolean;
  error: string | null;
  progress: {
    status: 'idle' | 'generating' | 'uploading' | 'complete' | 'error';
    progress: number;
    message: string;
  };
}

export function useIconGeneration(): UseIconGenerationResult {
  const {
    generatedIcons,
    selectedIcon,
    loading,
    error,
    generationProgress,
    generateIcons: storeGenerateIcons,
    selectIcon: storeSelectIcon,
    applyIcon: storeApplyIcon,
    clearGeneratedIcons,
  } = useAssetStore();

  const generateIcons = useCallback(
    async (projectId: string, prompt: string, count: number = 6) => {
      return storeGenerateIcons(projectId, prompt, count);
    },
    [storeGenerateIcons]
  );

  const selectIcon = useCallback(
    (iconUrl: string) => {
      storeSelectIcon(iconUrl);
    },
    [storeSelectIcon]
  );

  const applyIcon = useCallback(
    async (projectId: string, iconUrl: string) => {
      return storeApplyIcon(projectId, iconUrl);
    },
    [storeApplyIcon]
  );

  const clearIcons = useCallback(() => {
    clearGeneratedIcons();
  }, [clearGeneratedIcons]);

  return {
    generateIcons,
    selectIcon,
    applyIcon,
    clearIcons,
    icons: generatedIcons,
    selectedIcon,
    loading,
    error,
    progress: generationProgress,
  };
}
