export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: process.env.EXPO_PUBLIC_APP_NAME || 'MobVibe',
    scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'mobvibe',
  },
  env: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
};
