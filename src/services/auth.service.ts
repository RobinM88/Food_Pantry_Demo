import { api } from './api';

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

export const AuthService = {
  async signUp({ email, password, firstName, lastName }: SignUpData) {
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
    const { data, error } = await api.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await api.supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await api.supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async isAuthenticated() {
    const { data: { session }, error } = await api.supabase.auth.getSession();
    if (error) throw error;
    return !!session;
  },

  async isVolunteer() {
    const { data: { user }, error } = await api.supabase.auth.getUser();
    if (error) throw error;
    return user?.user_metadata?.role === 'volunteer';
  }
}; 