import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthService } from '../services/auth.service';
import { api } from '../services/api';

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

    // Subscribe to auth state changes
    const { data: { subscription } } = api.supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setIsVolunteer(session?.user?.user_metadata?.role === 'volunteer');
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { session } = await AuthService.signIn({ email, password });
    if (session) {
      setUser(session.user);
      setIsAuthenticated(true);
      setIsVolunteer(session.user.user_metadata?.role === 'volunteer');
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    await AuthService.signUp({ email, password, firstName, lastName });
  };

  const signOut = async () => {
    await AuthService.signOut();
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