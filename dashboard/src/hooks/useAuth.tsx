import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: any;
  token: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Development mode - create a default user and token
    const devToken = 'dev-token';
    const devUser = {
      id: "dev-user-1",
      email: "dev@example.com",
      tenantId: "dev-tenant-1",
      role: "ADMIN"
    };

    // Store token in localStorage for API calls
    localStorage.setItem('auth_token', devToken);
    
    setToken(devToken);
    setUser(devUser);
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setToken('');
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}