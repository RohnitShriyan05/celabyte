import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    const initAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (session?.access_token) {
          const authUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            tenantId: session.user.user_metadata?.tenant_id || session.user.id,
            role: session.user.user_metadata?.role || "USER",
          };

          setUser(authUser);
          setToken(session.access_token);
          localStorage.setItem("auth_token", session.access_token);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const authUser: User = {
          id: session.user.id,
          email: session.user.email || "",
          tenantId: session.user.user_metadata?.tenant_id || session.user.id,
          role: session.user.user_metadata?.role || "USER",
        };

        setUser(authUser);
        setToken(session.access_token);
        localStorage.setItem("auth_token", session.access_token);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setToken("");
        localStorage.removeItem("auth_token");
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split("@")[0],
          role: "USER",
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
    localStorage.removeItem("auth_token");
    setToken("");
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
