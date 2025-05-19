
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { guestService } from "@/lib/guest-service";
import { Upload, PartyPopper } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface GuestRegistrationProps {
  albumId: string;
  onRegistrationComplete?: () => void;
}

const GuestRegistration: React.FC<GuestRegistrationProps> = ({ albumId, onRegistrationComplete }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { translate, language } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      setPreviewUrl(null);
      
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
    <Card className="w-full max-w-md mx-auto border-2 border-primary shadow-lg backdrop-blur-sm bg-white/90">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-t-lg pb-6">
        <div className="flex justify-center mb-4">
          <PartyPopper className="h-12 w-12 text-primary animate-bounce" />
        </div>
        <CardTitle className="text-2xl md:text-3xl text-center font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          {translate("weddingGuestRegistration")}
        </CardTitle>
        <CardDescription className="text-base mt-4 text-gray-700">
          {translate("registrationWelcome")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <div className="space-y-3">
            <Label htmlFor="name" className="text-lg font-medium">
              {translate("yourName")}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={translate("enterFullName")}
              required
              className="border-2 border-gray-200 focus:border-primary transition-all duration-300"
              // Fix the input field issue - ensure no pointer-events are blocked
              style={{ pointerEvents: 'auto' }}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="photo" className="text-lg font-medium">
              {translate("yourPhoto")}
            </Label>
            
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-primary cursor-pointer transition-all duration-200 relative">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="opacity-0 absolute w-full h-full top-0 left-0 cursor-pointer z-10"
                style={{ pointerEvents: 'auto' }}
              />
              <div className="text-center py-4">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  {previewUrl ? 'Change photo' : 'Click to upload or drag and drop'}
                </p>
              </div>
            </div>
            
            {previewUrl && (
              <div className="mt-4 relative">
                <div className="relative w-40 h-40 mx-auto overflow-hidden rounded-full border-4 border-primary shadow-lg">
                  <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                </div>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-2">
              {translate("photoHelp")}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300" 
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <span className="animate-spin mr-2">✨</span>
                {translate("processing")}
              </div>
            ) : (
              <>
                <PartyPopper className="mr-2 h-5 w-5" />
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
