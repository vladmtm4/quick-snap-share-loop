import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";

const AuthPage: React.FC = () => {
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirectedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Add timeout for auth loading to prevent infinite loading
  useEffect(() => {
    if (authLoading) {
      timeoutRef.current = setTimeout(() => {
        console.warn("Auth loading timeout reached");
        if (hasRedirectedRef.current) return;
        
        // Force a redirect to prevent infinite loading
        if (user) {
          hasRedirectedRef.current = true;
          navigate(from, { replace: true });
        }
      }, 10000); // 10 second timeout
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [authLoading, user, navigate, from]);

  // Redirect if user is already authenticated - fixed dependency array
  useEffect(() => {
    console.log("AuthPage: User state updated", { user, authLoading, hasRedirected: hasRedirectedRef.current });
    
    if (!authLoading && user && !hasRedirectedRef.current) {
      console.log("User is already authenticated, redirecting to:", from);
      hasRedirectedRef.current = true;
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]); // Removed redirectionAttempted from dependencies

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (!error) {
        console.log("Sign in successful, navigating to:", from);
        // Small delay to ensure state updates are processed
        setTimeout(() => {
          hasRedirectedRef.current = true;
          navigate(from, { replace: true });
        }, 100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (!error) {
        console.log("Sign up successful, navigating to:", from);
        // Small delay to ensure state updates are processed
        setTimeout(() => {
          hasRedirectedRef.current = true;
          navigate(from, { replace: true });
        }, 100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while checking session with timeout protection
  if (authLoading && !hasRedirectedRef.current) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Checking authentication...</p>
          <p className="mt-1 text-sm text-gray-400">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // Don't render the form if we're in the process of redirecting
  if (user && hasRedirectedRef.current) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />
      <div className="container max-w-md py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to QuickSnap</CardTitle>
            <CardDescription className="text-center">
              Log in or create an account to access and create photo albums
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
