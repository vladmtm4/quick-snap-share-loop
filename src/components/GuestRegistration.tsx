
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { guestService } from "@/lib/guest-service";
import { Upload } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface GuestRegistrationProps {
  albumId: string;
  onRegistrationComplete?: () => void;
}

const GuestRegistration: React.FC<GuestRegistrationProps> = ({ albumId, onRegistrationComplete }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { translate, language } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: translate("nameRequired"),
        description: translate("pleaseEnterName"),
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
        title: translate("registrationSuccessful"),
        description: translate("addedToGuestList"),
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
        title: translate("registrationFailed"),
        description: translate("couldNotComplete"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{translate("weddingGuestRegistration")}</CardTitle>
        <CardDescription className="text-base mt-2">
          {translate("registrationWelcome")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <div className="space-y-2">
            <Label htmlFor="name">{translate("yourName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate("enterFullName")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">{translate("yourPhoto")}</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {translate("photoHelp")}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>{translate("processing")}</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {translate("registerForEvent")}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default GuestRegistration;
