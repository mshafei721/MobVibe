import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { sanitizePrompt } from '@/utils/input-sanitization';

export interface Asset {
  id: string;
  user_id: string;
  project_id: string;
  type: 'icon' | 'sound' | 'image';
  url: string;
  prompt: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GenerationProgress {
  status: 'idle' | 'generating' | 'uploading' | 'complete' | 'error';
  progress: number;
  message: string;
}

interface AssetStore {
  assets: Asset[];
  generatedIcons: string[];
  generatedSounds: string[];
  selectedIcon: string | null;
  selectedSound: string | null;
  loading: boolean;
  error: string | null;
  generationProgress: GenerationProgress;

  // Icon Actions
  generateIcons: (projectId: string, prompt: string, count?: number) => Promise<string[]>;
  selectIcon: (iconUrl: string) => void;
  applyIcon: (projectId: string, iconUrl: string) => Promise<void>;
  clearGeneratedIcons: () => void;

  // Sound Actions
  generateSounds: (projectId: string, prompt: string, count?: number) => Promise<string[]>;
  selectSound: (soundUrl: string) => void;
  applySound: (projectId: string, soundUrl: string) => Promise<void>;
  clearGeneratedSounds: () => void;

  // Asset Library Actions
  fetchAssets: (projectId: string) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  regenerateAsset: (assetId: string) => Promise<void>;

  // Utility Actions
  setGenerationProgress: (progress: GenerationProgress) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  generatedIcons: [],
  generatedSounds: [],
  selectedIcon: null,
  selectedSound: null,
  loading: false,
  error: null,
  generationProgress: {
    status: 'idle',
    progress: 0,
    message: '',
  },

  generateIcons: async (projectId: string, prompt: string, count = 6) => {
    set({
      loading: true,
      error: null,
      generationProgress: {
        status: 'generating',
        progress: 0,
        message: 'Starting icon generation...',
      },
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check rate limit before proceeding
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('check_generation_limit', {
          p_project_id: projectId,
          p_asset_type: 'icon'
        })
        .single();

      if (limitError) {
        throw new Error('Failed to check rate limit: ' + limitError.message);
      }

      if (!limitCheck.allowed) {
        const resetTime = new Date(limitCheck.reset_at).toLocaleTimeString();
        throw new Error(`${limitCheck.reason}. Try again after ${resetTime}.`);
      }

      // Update progress
      set({
        generationProgress: {
          status: 'generating',
          progress: 20,
          message: `Generating ${count} icon variations... (${limitCheck.remaining} remaining this hour)`,
        },
      });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-icons`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: sanitizePrompt(prompt, 500), // Sanitize user input
            count,
            projectId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate icons');
      }

      const { icons, generationTime } = await response.json();

      set({
        generatedIcons: icons,
        loading: false,
        generationProgress: {
          status: 'complete',
          progress: 100,
          message: `Generated ${icons.length} icons in ${(generationTime / 1000).toFixed(1)}s`,
        },
      });

      return icons;
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
        generationProgress: {
          status: 'error',
          progress: 0,
          message: error.message,
        },
      });
      throw error;
    }
  },

  selectIcon: (iconUrl: string) => {
    set({ selectedIcon: iconUrl });
  },

  applyIcon: async (projectId: string, iconUrl: string) => {
    set({ loading: true, error: null });
    try {
      // Update project with new icon URL
      const { error } = await supabase
        .from('projects')
        .update({ icon_url: iconUrl })
        .eq('id', projectId);

      if (error) throw error;

      // Store asset record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('assets').insert({
          user_id: user.id,
          project_id: projectId,
          type: 'icon',
          url: iconUrl,
          prompt: '', // Could be stored from generation
          metadata: { applied: true },
        });
      }

      set({ loading: false, selectedIcon: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearGeneratedIcons: () => {
    set({ generatedIcons: [], selectedIcon: null });
  },

  generateSounds: async (projectId: string, prompt: string, count = 4) => {
    set({
      loading: true,
      error: null,
      generationProgress: {
        status: 'generating',
        progress: 0,
        message: 'Starting sound generation...',
      },
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Check rate limit before proceeding
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('check_generation_limit', {
          p_project_id: projectId,
          p_asset_type: 'sound'
        })
        .single();

      if (limitError) {
        throw new Error('Failed to check rate limit: ' + limitError.message);
      }

      if (!limitCheck.allowed) {
        const resetTime = new Date(limitCheck.reset_at).toLocaleTimeString();
        throw new Error(`${limitCheck.reason}. Try again after ${resetTime}.`);
      }

      set({
        generationProgress: {
          status: 'generating',
          progress: 20,
          message: `Generating ${count} sound variations... (${limitCheck.remaining} remaining this hour)`,
        },
      });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-sounds`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: sanitizePrompt(prompt, 500), // Sanitize user input
            count,
            projectId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate sounds');
      }

      const { sounds, generationTime } = await response.json();

      set({
        generatedSounds: sounds,
        loading: false,
        generationProgress: {
          status: 'complete',
          progress: 100,
          message: `Generated ${sounds.length} sounds in ${(generationTime / 1000).toFixed(1)}s`,
        },
      });

      return sounds;
    } catch (error: any) {
      set({
        error: error.message,
        loading: false,
        generationProgress: {
          status: 'error',
          progress: 0,
          message: error.message,
        },
      });
      throw error;
    }
  },

  selectSound: (soundUrl: string) => {
    set({ selectedSound: soundUrl });
  },

  applySound: async (projectId: string, soundUrl: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('assets').insert({
        user_id: user.id,
        project_id: projectId,
        type: 'sound',
        url: soundUrl,
        prompt: '',
        metadata: { applied: true },
      });

      set({ loading: false, selectedSound: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearGeneratedSounds: () => {
    set({ generatedSounds: [], selectedSound: null });
  },

  fetchAssets: async (projectId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ assets: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteAsset: async (assetId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      set(state => ({
        assets: state.assets.filter(a => a.id !== assetId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  regenerateAsset: async (assetId: string) => {
    const asset = get().assets.find(a => a.id === assetId);
    if (!asset) throw new Error('Asset not found');

    if (asset.type === 'icon') {
      await get().generateIcons(asset.project_id, asset.prompt);
    } else if (asset.type === 'sound') {
      await get().generateSounds(asset.project_id, asset.prompt);
    }
  },

  setGenerationProgress: (progress: GenerationProgress) => {
    set({ generationProgress: progress });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      assets: [],
      generatedIcons: [],
      generatedSounds: [],
      selectedIcon: null,
      selectedSound: null,
      loading: false,
      error: null,
      generationProgress: {
        status: 'idle',
        progress: 0,
        message: '',
      },
    });
  },
}));
