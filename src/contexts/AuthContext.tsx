import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withTimeout } from '@/lib/async';
import {
  clampProfileCompleteness,
  DEFAULT_VERIFICATION_BADGES,
  normalizeAccessState,
  normalizeOnboardingStep,
  normalizeVerificationBadges,
  type AccessState,
  type OnboardingStep,
  type VerificationBadges,
} from '@/lib/access-state';
import type { Tables } from '@/integrations/supabase/types';

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
  accessState: AccessState;
  onboardingStep: OnboardingStep;
  profileCompleteness: number;
  verificationBadges: VerificationBadges;
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

interface SignupResult {
  email: string;
  needsEmailConfirmation: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<SignupResult>;
  logout: () => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type UserRow = Tables<'users'>;

function buildAuthUser(authUser: User, profile: UserRow | null): AuthUser {
  return {
    id: authUser.id,
    name: profile?.name || authUser.user_metadata?.name || '',
    email: authUser.email || profile?.college_email || '',
    college: profile?.college_name || undefined,
    branch: profile?.branch || undefined,
    year: profile?.year || undefined,
    relationshipLevel: 1,
    trustScore: 75,
    heartsGiven: 0,
    heartsReceived: 0,
    accessState: normalizeAccessState(profile?.access_state),
    onboardingStep: normalizeOnboardingStep(profile?.onboarding_step),
    profileCompleteness: clampProfileCompleteness(profile?.profile_completeness),
    verificationBadges: normalizeVerificationBadges(profile?.verification_badges),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const syncAccessState = async (): Promise<UserRow | null> => {
    const { data, error } = await withTimeout(
      supabase.rpc('sync_user_access_state'),
      8000,
      'Syncing HeartPath access state'
    );

    if (error) {
      throw error;
    }

    return data;
  };

  const loadUserProfile = async (authUser: User) => {
    let retries = 3;
    let profile: UserRow | null = null;

    while (retries > 0) {
      try {
        profile = await syncAccessState();
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

    setUser(buildAuthUser(authUser, profile));
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

      const domainCheck = await withTimeout(
        supabase.rpc('check_college_email_domain', { email: data.email }),
        8000,
        'Checking college email eligibility'
      );

      if (domainCheck.error) {
        throw domainCheck.error;
      }

      const domainResult = domainCheck.data?.[0];
      if (!domainResult?.approved) {
        const message = domainResult?.domain
          ? `HeartPath currently supports approved college domains only. ${domainResult.domain} is not in the allowlist yet.`
          : 'Please use an approved college email address to join HeartPath.';
        throw new Error(message);
      }

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
          title: authData.session ? 'Account created' : 'Check your college email',
          description: authData.session
            ? 'Please complete your verification and profile to activate HeartPath.'
            : 'We sent a confirmation link to your approved college email. Verify it to continue.',
        });
      }

      return {
        email: data.email,
        needsEmailConfirmation: !authData.session,
      };
    } catch (error: any) {
      console.error('Signup error:', error);

      let errorMessage = 'Failed to create account. Please try again.';
      if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('approved college domains only')) {
        errorMessage = error.message;
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

  const resendVerificationEmail = async (email: string) => {
    const { error } = await withTimeout(
      supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      }),
      8000,
      'Resending verification email'
    );

    if (error) {
      throw error;
    }

    toast({
      title: 'Verification email sent',
      description: 'Check your college inbox for a fresh confirmation link.',
    });
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

  const deleteAccount = async (confirmation: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: {
          confirmation,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Account deletion failed.');
      }

      await supabase.auth.signOut().catch(() => undefined);
      setUser(null);

      toast({
        title: 'Account deleted',
        description: 'Your HeartPath account and related data have been permanently removed.',
      });
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: 'Account deletion failed',
        description:
          error.message ||
          'Unable to delete this account right now. If the delete-account function is not deployed yet, deploy it in Supabase first.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
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
        deleteAccount,
        refreshUser,
        resendVerificationEmail,
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
