/**
 * Application configuration derived from environment variables.
 * This provides a centralized way to access configuration values.
 */

// Determine if we're running in demo mode
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Validate required environment variables on startup
function validateEnv() {
  // In demo mode, we don't need Supabase credentials
  const required = isDemoMode 
    ? ['VITE_APP_NAME', 'VITE_APP_DESCRIPTION'] 
    : [
        'VITE_SUPABASE_URL', 
        'VITE_SUPABASE_ANON_KEY',
        'VITE_APP_NAME',
        'VITE_APP_DESCRIPTION',
      ];
  
  const missing = required.filter(variable => !import.meta.env[variable]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate environment variables immediately
validateEnv();

/**
 * Application configuration
 */
export const config = {
  /**
   * Application information
   */
  app: {
    name: import.meta.env.VITE_APP_NAME as string,
    description: import.meta.env.VITE_APP_DESCRIPTION as string,
    themeColor: import.meta.env.VITE_PWA_THEME_COLOR as string || '#2E3766',
    environment: import.meta.env.MODE as string,
    isProduction: import.meta.env.PROD as boolean,
    isDevelopment: import.meta.env.DEV as boolean,
    isDemoMode: isDemoMode,
  },
  
  /**
   * Supabase configuration
   */
  supabase: {
    url: isDemoMode ? 'demo-mode-no-supabase' : (import.meta.env.VITE_SUPABASE_URL as string),
    anonKey: isDemoMode ? 'demo-mode-no-supabase-key' : (import.meta.env.VITE_SUPABASE_ANON_KEY as string),
  },

  /**
   * Feature flags
   */
  features: {
    // Always enable offline mode in demo mode
    offlineMode: isDemoMode ? true : (import.meta.env.VITE_OFFLINE_MODE === 'true' || true),
    notifications: (import.meta.env.VITE_ENABLE_NOTIFICATIONS as string) === 'true',
    forceOfflineOnly: isDemoMode, // New flag to force offline-only operation
    seedDemoData: isDemoMode, // Flag to enable demo data seeding
  },
}; 