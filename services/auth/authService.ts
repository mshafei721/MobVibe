import { supabase } from '../supabase';

export const authService = {
  async signInWithEmail(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'mobvibe://auth',
      },
    });
    return { data, error };
  },

  async signInWithOAuth(provider: 'google' | 'github' | 'apple') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'mobvibe://auth',
      },
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  async refreshSession() {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    return { session, error };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
