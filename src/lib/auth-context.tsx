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

  // Function to fetch admin status
  const fetchAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await fetchProfile(supabase, userId);
      
      if (error) {
        console.error('Error fetching admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin || false);
      }
    } catch (error) {
      console.error('Error fetching admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Initializing...");
    setIsLoading(true);
    
    let authStateSubscription: { unsubscribe: () => void } | null = null;
    let initializationTimeout: NodeJS.Timeout;

    const initialize = async () => {
      try {
        // Add timeout protection for initialization
        initializationTimeout = setTimeout(() => {
          console.warn("Auth initialization timeout reached, forcing completion");
          setIsLoading(false);
        }, 8000); // 8 second timeout

        // First check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log("Current session check:", Boolean(sessionData.session));
        
        if (sessionError) {
          console.error("Session check error:", sessionError);
          setIsLoading(false);
          return;
        }
        
        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          
          // Fetch admin status if user is logged in
          await fetchAdminStatus(sessionData.session.user.id);
        }

        // Clear the timeout since we completed successfully
        clearTimeout(initializationTimeout);
        
      } catch (error) {
        console.error("Error checking session:", error);
        clearTimeout(initializationTimeout);
      } finally {
        // Setup auth state listener after initial session check
        try {
          authStateSubscription = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
              console.log("Auth state changed:", event, Boolean(currentSession));
              
              setSession(currentSession);
              setUser(currentSession?.user ?? null);
              
              // Fetch admin status if user is logged in
              if (currentSession?.user) {
                await fetchAdminStatus(currentSession.user.id);
              } else {
                setIsAdmin(false);
              }
            }
          ).data.subscription;
        } catch (error) {
          console.error("Error setting up auth state listener:", error);
        }
        
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
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
      
      // Immediately update the user state with the returned data
      if (data.session) {
        console.log("Sign in successful, updating user state:", data.session.user.id);
        setSession(data.session);
        setUser(data.session.user);
        
        // Fetch admin status
        await fetchAdminStatus(data.session.user.id);
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
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
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
