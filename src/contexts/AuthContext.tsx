
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      // Add retry logic for network issues
      let retries = 3;
      let profile = null;
      
      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
          }
          
          profile = data;
          break;
        } catch (error: any) {
          retries--;
          if (retries === 0) {
            console.error('Error loading profile after retries:', error);
            // Continue with basic auth data even if profile fetch fails
            break;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Check if user needs onboarding (profile not complete)
      const needsOnboarding = !profile || !profile.name || !profile.college_name;

      setUser({
        id: authUser.id,
        name: profile?.name || authUser.user_metadata?.name || '',
        email: authUser.email || '',
        college: profile?.college_name,
        branch: profile?.branch,
        year: profile?.year,
        relationshipLevel: 1, // Default or fetch from relationships
        trustScore: 75, // Default or calculate
        heartsGiven: 0, // Will be calculated from relationships
        heartsReceived: 0, // Will be calculated from relationships
        needsOnboarding,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await loadUserProfile(data.user);
        toast({
          title: "Welcome back! 💖",
          description: "You've successfully signed in to CampusHeart.",
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = "Failed to sign in. Please try again.";
      if (error.message === "Email not confirmed") {
        errorMessage = "Please check your email and confirm your account before signing in.";
      } else if (error.message === "Invalid login credentials") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    try {
      setIsLoading(true);
      
      // Sign up the user with email confirmation disabled for development
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // If email confirmation is disabled, the user will be automatically logged in
        // If email confirmation is enabled, they'll need to confirm first
        if (authData.session) {
          // User is automatically logged in (email confirmation disabled)
          toast({
            title: "Account created! 🎉",
            description: "Please complete your profile to start connecting.",
          });
        } else {
          // User needs to confirm email
          toast({
            title: "Account created! 📧",
            description: "Please check your email and confirm your account, then sign in.",
          });
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = "Failed to create account. Please try again.";
      if (error.message?.includes("already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      setUser(null);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to sign out.",
        variant: "destructive",
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
