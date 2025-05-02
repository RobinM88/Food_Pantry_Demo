import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Supabase client instance.
 * In demo mode, we create a mock client that does nothing.
 */
let supabaseInstance: SupabaseClient;

// Only create a real Supabase client if not in demo mode
if (!config.app.isDemoMode) {
  supabaseInstance = createClient(config.supabase.url, config.supabase.anonKey);
} else {
  // In demo mode, create a mock Supabase client that returns empty results
  // This prevents errors when code tries to use Supabase
  // @ts-ignore - We're intentionally creating a partial mock
  supabaseInstance = {
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null }),
      eq: () => ({ data: [], error: null }),
      in: () => ({ data: [], error: null }),
      single: () => ({ data: null, error: null }),
      limit: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  };
}

export const supabase = supabaseInstance;

/**
 * Helper function to determine if we're connected to Supabase.
 * In demo mode, this always returns false.
 */
export async function isSupabaseConnected(): Promise<boolean> {
  // Always return false in demo mode
  if (config.app.isDemoMode) {
    return false;
  }
  
  try {
    const { error } = await supabase.from('healthcheck').select('*').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
} 