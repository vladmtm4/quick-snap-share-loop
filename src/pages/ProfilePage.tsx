import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

const ProfilePage: React.FC = () => {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return;
    }
    
    if (newPassword.length < 6) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await changePassword(newPassword);
      if (!result.error) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />
      <div className="container max-w-md py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Profile Settings</CardTitle>
            <CardDescription className="text-center">
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email || ""} disabled className="bg-gray-100" />
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-lg font-medium">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || newPassword !== confirmPassword || newPassword.length < 6}
              >
                {isSubmitting ? "Changing Password..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;