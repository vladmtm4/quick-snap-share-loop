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
  changePassword: (newPassword: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to fetch admin status - simplified
  const fetchAdminStatus = async (userId: string) => {
    try {
      const { data } = await fetchProfile(supabase, userId);
      return !!data?.is_admin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Simplified initialization
  useEffect(() => {
    // Just check session once
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        fetchAdminStatus(data.session.user.id).then(setIsAdmin);
      }
    });

    // Set up listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      
      if (newSession?.user) {
        fetchAdminStatus(newSession.user.id).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
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
      
      // Manually update state
      setSession(data.session);
      setUser(data.user);
      
      if (data.user) {
        const isUserAdmin = await fetchAdminStatus(data.user.id);
        setIsAdmin(isUserAdmin);
      }
      
      toast({
        title: "Signed in successfully",
        variant: "default",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign in error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
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
    }
  };

  const signOut = async () => {
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
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        toast({
          title: "Password change failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Password changed successfully",
        description: "Your password has been updated",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Password change error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAdmin,
        isLoading: false, // Always set to false to avoid loading issues
        signIn,
        signUp,
        signOut,
        changePassword,
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
