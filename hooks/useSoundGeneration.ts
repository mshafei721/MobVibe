import { useState, useCallback } from 'react';
import { useAssetStore } from '@/store/assetStore';

export interface UseSoundGenerationResult {
  generateSounds: (projectId: string, prompt: string, count?: number) => Promise<string[]>;
  selectSound: (soundUrl: string) => void;
  applySound: (projectId: string, soundUrl: string) => Promise<void>;
  clearSounds: () => void;
  sounds: string[];
  selectedSound: string | null;
  loading: boolean;
  error: string | null;
  progress: {
    status: 'idle' | 'generating' | 'uploading' | 'complete' | 'error';
    progress: number;
    message: string;
  };
}

export function useSoundGeneration(): UseSoundGenerationResult {
  const {
    generatedSounds,
    selectedSound,
    loading,
    error,
    generationProgress,
    generateSounds: storeGenerateSounds,
    selectSound: storeSelectSound,
    applySound: storeApplySound,
    clearGeneratedSounds,
  } = useAssetStore();

  const generateSounds = useCallback(
    async (projectId: string, prompt: string, count: number = 4) => {
      return storeGenerateSounds(projectId, prompt, count);
    },
    [storeGenerateSounds]
  );

  const selectSound = useCallback(
    (soundUrl: string) => {
      storeSelectSound(soundUrl);
    },
    [storeSelectSound]
  );

  const applySound = useCallback(
    async (projectId: string, soundUrl: string) => {
      return storeApplySound(projectId, soundUrl);
    },
    [storeApplySound]
  );

  const clearSounds = useCallback(() => {
    clearGeneratedSounds();
  }, [clearGeneratedSounds]);

  return {
    generateSounds,
    selectSound,
    applySound,
    clearSounds,
    sounds: generatedSounds,
    selectedSound,
    loading,
    error,
    progress: generationProgress,
  };
}
