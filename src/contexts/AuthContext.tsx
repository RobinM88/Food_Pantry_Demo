import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../services/auth.service';
import { api } from '../services/api';
import { config } from '../config';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVolunteer: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);

  useEffect(() => {
    // In demo mode, automatically set authentication without checking Supabase
    if (config.app.isDemoMode) {
      console.log('Demo mode: Auto-authenticating as demo user');
      AuthService.getCurrentUser().then(demoUser => {
        setUser(demoUser as User);
        setIsAuthenticated(true);
        setIsVolunteer(true);
        setIsLoading(false);
      });
      return;
    }
    
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await api.supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          setIsVolunteer(session.user.user_metadata?.role === 'volunteer');
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth state changes (only in non-demo mode)
    const { data: { subscription } } = api.supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setIsVolunteer(session?.user?.user_metadata?.role === 'volunteer');
      }
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { session, user: authUser } = await AuthService.signIn({ email, password });
    
    // Handle demo mode where session might be structured differently
    if (config.app.isDemoMode && authUser) {
      setUser(authUser as User);
      setIsAuthenticated(true);
      setIsVolunteer(true);
      return;
    }
    
    if (session) {
      setUser(session.user);
      setIsAuthenticated(true);
      setIsVolunteer(session.user.user_metadata?.role === 'volunteer');
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    await AuthService.signUp({ email, password, firstName, lastName });
    
    // In demo mode, auto-sign in after sign up
    if (config.app.isDemoMode) {
      await signIn(email, password);
    }
  };

  const signOut = async () => {
    await AuthService.signOut();
    
    // Always clear local state regardless of demo mode
    setUser(null);
    setIsAuthenticated(false);
    setIsVolunteer(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isVolunteer,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 