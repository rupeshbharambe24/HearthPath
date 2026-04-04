import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withTimeout } from '@/lib/async';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  college?: string;
  branch?: string;
  year?: number;
  relationshipLevel?: number;
  trustScore?: number;
  heartsGiven?: number;
  heartsReceived?: number;
  needsOnboarding?: boolean;
}

interface SignupData {
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  password: string;
  photo: File | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUserProfile = async (authUser: User) => {
    let profile = null;
    let retries = 3;

    while (retries > 0) {
      try {
        const { data, error } = await withTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle(),
          8000,
          'Loading user profile'
        );

        if (error) throw error;
        profile = data;
        break;
      } catch (error) {
        retries -= 1;
        if (retries === 0) {
          console.error('Error loading profile after retries:', error);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const needsOnboarding = !profile || !profile.name || !profile.college_name;

    setUser({
      id: authUser.id,
      name: profile?.name || authUser.user_metadata?.name || '',
      email: authUser.email || '',
      college: profile?.college_name,
      branch: profile?.branch,
      year: profile?.year,
      relationshipLevel: 1,
      trustScore: 75,
      heartsGiven: 0,
      heartsReceived: 0,
      needsOnboarding,
    });
  };

  const refreshUser = async () => {
    const {
      data: { user: authUser },
      error,
    } = await withTimeout(supabase.auth.getUser(), 10000, 'Refreshing authenticated user');

    if (error) {
      console.error('Error refreshing authenticated user:', error);
      return;
    }

    if (authUser) {
      await loadUserProfile(authUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
          error,
        } = await withTimeout(supabase.auth.getSession(), 10000, 'Loading auth session');

        if (error) throw error;
        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      console.log('Auth state changed:', event, session?.user?.email);

      setTimeout(async () => {
        if (!mounted) return;

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }

        setIsLoading(false);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user);
        toast({
          title: 'Welcome back',
          description: "You've successfully signed in to HeartPath.",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Failed to sign in. Please try again.';
      if (error.message === 'Email not confirmed') {
        errorMessage = 'Please check your email and confirm your account before signing in.';
      } else if (error.message === 'Invalid login credentials') {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      }

      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.name },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        toast({
          title: authData.session ? 'Account created' : 'Account created',
          description: authData.session
            ? 'Please complete your profile to start connecting.'
            : 'Please confirm your email, then sign in to continue.',
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'Failed to create account. Please try again.';
      if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      }

      toast({
        title: 'Signup failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      toast({
        title: 'Signed out',
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: error.message || 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
