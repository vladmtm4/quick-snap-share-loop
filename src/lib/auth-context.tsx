import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const authCheckComplete = useRef(false);

  // Function to check admin status - simplified
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await fetchProfile(supabase, userId);
      return !!data?.is_admin;
    } catch (error) {
      console.error('Admin check failed:', error);
      return false;
    }
  };

  // One-time initialization
  useEffect(() => {
    console.log("QuickSnap: Starting auth initialization");
    
    let mounted = true;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    const initAuth = async () => {
      if (authCheckComplete.current) return;
      
      try {
        setIsLoading(true);
        
        // Get current session directly
        const sessionResult = await supabase.auth.getSession();
        const currentSession = sessionResult.data.session;
        
        if (mounted) {
          if (currentSession) {
            console.log("QuickSnap: Found existing session");
            setSession(currentSession);
            setUser(currentSession.user);
            const adminStatus = await checkAdminStatus(currentSession.user.id);
            setIsAdmin(adminStatus);
          } else {
            console.log("QuickSnap: No existing session");
          }
          
          // Set up auth state listener
          const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`QuickSnap: Auth changed (${event})`, !!newSession);
            
            if (mounted) {
              setSession(newSession);
              setUser(newSession?.user || null);
              
              if (newSession?.user) {
                const adminStatus = await checkAdminStatus(newSession.user.id);
                setIsAdmin(adminStatus);
              } else {
                setIsAdmin(false);
              }
            }
          });
          
          authListener = data;
          authCheckComplete.current = true;
        }
      } catch (error) {
        console.error("QuickSnap: Auth init error", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initAuth();
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.error) {
        toast({
          title: "Sign in failed",
          description: result.error.message,
          variant: "destructive",
        });
        return { error: result.error };
      }
      
      // Update state directly for immediate feedback
      setSession(result.data.session);
      setUser(result.data.user);
      
      if (result.data.user) {
        const adminStatus = await checkAdminStatus(result.data.user.id);
        setIsAdmin(adminStatus);
      }
      
      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (result.error) {
        toast({
          title: "Registration failed",
          description: result.error.message,
          variant: "destructive",
        });
        return { error: result.error };
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email for confirmation",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Registration error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      await supabase.auth.signOut();
      
      // Immediately clear state
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sign out error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
