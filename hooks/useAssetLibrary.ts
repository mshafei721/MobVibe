import { useEffect, useCallback } from 'react';
import { useAssetStore, Asset } from '@/store/assetStore';

export interface UseAssetLibraryResult {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  fetchAssets: (projectId: string) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  regenerateAsset: (assetId: string) => Promise<void>;
  getAssetsByType: (type: 'icon' | 'sound' | 'image') => Asset[];
}

export function useAssetLibrary(projectId?: string): UseAssetLibraryResult {
  const {
    assets,
    loading,
    error,
    fetchAssets: storeFetchAssets,
    deleteAsset: storeDeleteAsset,
    regenerateAsset: storeRegenerateAsset,
  } = useAssetStore();

  // Auto-fetch on mount if projectId provided
  useEffect(() => {
    if (projectId) {
      storeFetchAssets(projectId);
    }
  }, [projectId]);

  const fetchAssets = useCallback(
    async (pid: string) => {
      return storeFetchAssets(pid);
    },
    [storeFetchAssets]
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      return storeDeleteAsset(assetId);
    },
    [storeDeleteAsset]
  );

  const regenerateAsset = useCallback(
    async (assetId: string) => {
      return storeRegenerateAsset(assetId);
    },
    [storeRegenerateAsset]
  );

  const getAssetsByType = useCallback(
    (type: 'icon' | 'sound' | 'image') => {
      return assets.filter((asset) => asset.type === type);
    },
    [assets]
  );

  return {
    assets,
    loading,
    error,
    fetchAssets,
    deleteAsset,
    regenerateAsset,
    getAssetsByType,
  };
}
