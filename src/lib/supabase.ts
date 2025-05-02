import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Supabase client instance.
 * Configuration is loaded from the centralized config module.
 */
export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

/**
 * Helper function to determine if we're connected to Supabase.
 * This can be used to check connection status for offline handling.
 */
export async function isSupabaseConnected(): Promise<boolean> {
  try {
    const { error } = await supabase.from('healthcheck').select('*').limit(1);
    return !error;
  } catch (error) {
    return false;
  }
} 