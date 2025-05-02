/**
 * Application configuration derived from environment variables.
 * This provides a centralized way to access configuration values.
 */

// Validate required environment variables on startup
function validateEnv() {
  const required = [
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
  },
  
  /**
   * Supabase configuration
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },

  /**
   * Feature flags
   */
  features: {
    offlineMode: true, // Default to true for testing
    notifications: (import.meta.env.VITE_ENABLE_NOTIFICATIONS as string) === 'true',
  },
}; 