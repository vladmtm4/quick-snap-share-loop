
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { fetchProfile } from "@/types/supabase-types";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AuthProvider: Starting initialization");
    
    let isMounted = true;

    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (currentSession?.user) {
          console.log("Found existing session for user:", currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch admin status
          try {
            const { data } = await fetchProfile(supabase, currentSession.user.id);
            if (isMounted) {
              setIsAdmin(data?.is_admin || false);
            }
          } catch (error) {
            console.error("Error fetching admin status:", error);
            if (isMounted) {
              setIsAdmin(false);
            }
          }
        } else {
          console.log("No existing session found");
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          console.log("Auth initialization complete");
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event, newSession ? "session exists" : "no session");
        
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          // Fetch admin status for new session
          try {
            const { data } = await fetchProfile(supabase, newSession.user.id);
            if (isMounted) {
              setIsAdmin(data?.is_admin || false);
            }
          } catch (error) {
            console.error("Error fetching admin status on auth change:", error);
            if (isMounted) {
              setIsAdmin(false);
            }
          }
        } else {
          if (isMounted) {
            setIsAdmin(false);
          }
        }
      }
    );

    // Initialize
    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Signed in successfully",
        variant: "default",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email for the confirmation link",
        variant: "default",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
