
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { guestService } from "@/lib/guest-service";
import { Upload } from "lucide-react";

interface GuestRegistrationProps {
  albumId: string;
  onRegistrationComplete?: () => void;
}

const GuestRegistration: React.FC<GuestRegistrationProps> = ({ albumId, onRegistrationComplete }) => {
  const [name, setName] = useState("");
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
      setPhotoFile(null);
      
      // Call the completion callback if provided
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }

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
        <CardTitle>Wedding Guest Registration</CardTitle>
        <CardDescription className="text-base mt-2">
          Welcome to our wedding celebration! We're planning a special photo-finding game during the reception where guests will try to locate each other in photos. To participate, please register your name and upload a photo of yourself that other guests can use to find you during the game.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Your Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              This photo will help other guests find you during the reception game
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Register for the Event
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuestRegistration;
