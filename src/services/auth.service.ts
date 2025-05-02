import { api } from './api';
import { config } from '../config';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Demo mode mock user
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  user_metadata: {
    first_name: 'Demo',
    last_name: 'User',
    role: 'volunteer'
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

// Demo mode mock session
const DEMO_SESSION = {
  user: DEMO_USER,
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
};

export const AuthService = {
  async signUp({ email, password, firstName, lastName }: SignUpData) {
    // In demo mode, return a successful mock response
    if (config.app.isDemoMode) {
      return {
        user: DEMO_USER,
        session: DEMO_SESSION
      };
    }
    
    const { data, error } = await api.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: 'volunteer' // Set role for RLS policies
        }
      }
    });

    if (error) throw error;
    return data;
  },

  async signIn({ email, password }: SignInData) {
    // In demo mode, automatically log in with demo user
    if (config.app.isDemoMode) {
      console.log('Demo mode: Auto-login with demo user');
      return {
        user: DEMO_USER,
        session: DEMO_SESSION
      };
    }
    
    const { data, error } = await api.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    // In demo mode, just return success
    if (config.app.isDemoMode) {
      return;
    }
    
    const { error } = await api.supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    // In demo mode, return the demo user
    if (config.app.isDemoMode) {
      return DEMO_USER;
    }
    
    const { data: { user }, error } = await api.supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async isAuthenticated() {
    // In demo mode, always return authenticated
    if (config.app.isDemoMode) {
      return true;
    }
    
    const { data: { session }, error } = await api.supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  },

  async isVolunteer() {
    // In demo mode, demo user is a volunteer
    if (config.app.isDemoMode) {
      return true;
    }
    
    const { data: { user }, error } = await api.supabase.auth.getUser();
    if (error) throw error;
    return user?.user_metadata?.role === 'volunteer';
  }
}; 