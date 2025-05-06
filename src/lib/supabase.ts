// @ts-nocheck
/* This file is intentionally bypassing TypeScript checks because it's creating a
   mock Supabase client for demo mode that doesn't need to implement the full interface */
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
  // In demo mode, create a mock Supabase client
  // @ts-ignore - We're intentionally creating a mock client
  supabaseInstance = {
    // Mock the basic functionality needed by our app
    from: (_table) => {
      const mockBuilder = {
        select: () => mockBuilder,
        insert: () => mockBuilder,
        update: () => mockBuilder,
        delete: () => mockBuilder,
        eq: () => mockBuilder,
        neq: () => mockBuilder,
        gt: () => mockBuilder,
        lt: () => mockBuilder,
        gte: () => mockBuilder,
        lte: () => mockBuilder,
        like: () => mockBuilder,
        in: () => mockBuilder,
        is: () => mockBuilder,
        single: () => mockBuilder,
        limit: () => mockBuilder,
        order: () => mockBuilder,
        range: () => mockBuilder,
        then: () => Promise.resolve({ data: [], error: null }),
      };
      return mockBuilder;
    },
    auth: {
      // Just the minimum needed auth methods
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
    const { error } = await supabase.from('healthcheck').select('*').limit(1).then();
    return !error;
  } catch (error) {
    return false;
  }
} 