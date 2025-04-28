
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { guestService } from "@/lib/guest-service";
import { Image, Upload, Instagram } from "lucide-react";

interface GuestRegistrationProps {
  albumId: string;
}

const GuestRegistration: React.FC<GuestRegistrationProps> = ({ albumId }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const guestData = {
        guestName: name.trim(),
        email: email.trim() || undefined,
        instagram: instagram.trim() || undefined
      };

      // Add guest to album
      const response = await guestService.addGuestToAlbum(albumId, guestData);

      if (response.error || !response.data) {
        throw new Error(response.error?.message || "Failed to register");
      }

      // If a photo was selected, upload it
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${albumId}/${response.data.id}/profile.${fileExt}`;

        const uploadResult = await guestService.uploadImageToStorage(response.data.id, photoFile, filePath);
        if (uploadResult) {
          await guestService.updateGuestPhoto(response.data.id, uploadResult.url);
        }
      }

      toast({
        title: "Registration successful",
        description: "You've been added to the guest list",
      });

      // Clear form
      setName("");
      setEmail("");
      setInstagram("");
      setPhotoFile(null);

    } catch (error) {
      console.error('Error registering guest:', error);
      toast({
        title: "Registration failed",
        description: "Could not complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register as a Guest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle (optional)</Label>
            <div className="relative">
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@yourusername"
                className="pl-10"
              />
              <Instagram className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Profile Photo (optional)</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Register
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuestRegistration;
