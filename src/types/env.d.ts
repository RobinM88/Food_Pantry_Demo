/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string

  // Application Configuration
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_API_URL: string

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_ENABLE_NOTIFICATIONS?: string
  readonly VITE_ENABLE_DARK_MODE?: string
  readonly VITE_ENABLE_BETA_FEATURES?: string
  
  // PWA Configuration
  readonly VITE_PWA_ENABLED?: string
  readonly VITE_PWA_THEME_COLOR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 