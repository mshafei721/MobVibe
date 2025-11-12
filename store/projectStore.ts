import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { logger } from '@/utils/logger';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template_id: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: { name: string; description?: string; template_id: string }) => Promise<Project>;
  updateProject: (id: string, data: Partial<Pick<Project, 'name' | 'description'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  archiveProject: (id: string) => Promise<void>;
  refreshProject: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ projects: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectData.name,
          description: projectData.description || null,
          template_id: projectData.template_id,
          archived: false,
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        projects: [data, ...state.projects],
        loading: false
      }));

      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProject: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        projects: state.projects.map(p => p.id === id ? data : p),
        currentProject: state.currentProject?.id === id ? data : state.currentProject,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  archiveProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('projects')
        .update({ archived: true })
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  refreshProject: async (id) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set(state => ({
        projects: state.projects.map(p => p.id === id ? data : p),
        currentProject: state.currentProject?.id === id ? data : state.currentProject,
      }));
    } catch (error: any) {
      logger.error('Error refreshing project:', error);
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),
}));
