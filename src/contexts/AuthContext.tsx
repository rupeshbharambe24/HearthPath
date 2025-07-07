
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  relationshipLevel: number;
  trustScore: number;
  heartsGiven: number;
  heartsReceived: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  signup: (userData: any) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    // Mock login - in real app, this would make API call
    const mockUser: User = {
      id: '1',
      name: 'Alex Johnson',
      email,
      college: 'Stanford University',
      branch: 'Computer Science',
      year: 'Junior',
      relationshipLevel: 3,
      trustScore: 75,
      heartsGiven: 24,
      heartsReceived: 18,
    };
    setUser(mockUser);
  };

  const signup = (userData: any) => {
    // Mock signup - in real app, this would make API call
    const mockUser: User = {
      id: '1',
      name: userData.name,
      email: userData.email,
      college: userData.college,
      branch: userData.branch,
      year: userData.year,
      relationshipLevel: 1,
      trustScore: 10,
      heartsGiven: 0,
      heartsReceived: 0,
    };
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
