
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { guestService } from "@/lib/guest-service";
import { Upload, PartyPopper, Camera, FolderOpen, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GuestRegistrationProps {
  albumId: string;
  onRegistrationComplete?: () => void;
}

const GuestRegistration: React.FC<GuestRegistrationProps> = ({ albumId, onRegistrationComplete }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
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
      setShowPhotoOptions(false);
    }
  };

  const handlePhotoButtonClick = () => {
    setShowPhotoOptions(true);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handleFileChange(e as any);
    input.click();
    setShowPhotoOptions(false);
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleFileChange(e as any);
    input.click();
    setShowPhotoOptions(false);
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

      // Show success state
      setIsRegistered(true);
      
      toast({
        title: translate("registrationSuccessful"),
        description: translate("addedToGuestList"),
      });

      // Call the completion callback after a delay
      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
      }, 3000);

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

  // Show success confirmation
  if (isRegistered) {
    return (
      <Card className="w-full max-w-md mx-auto border-2 border-green-500 shadow-lg backdrop-blur-sm bg-white/90 animate-fade-in">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-300 opacity-75"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-green-100 rounded-full shadow-lg">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                {translate("registrationComplete")}
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                היי {name}! נרשמת בהצלחה
              </p>
              <p className="text-sm text-gray-500">
                עכשיו חפש קודי QR ברחבי המקום כדי להתחיל לשחק
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                {translate("dontForgetPhone")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              className="border-2 border-gray-200 focus:border-primary transition-all duration-300 text-lg h-12"
              style={{ pointerEvents: 'auto' }}
              autoComplete="name"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="photo" className="text-lg font-medium">
              {translate("yourPhoto")}
            </Label>
            
            {!previewUrl ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary cursor-pointer transition-all duration-200 bg-gray-50 hover:bg-gray-100"
                onClick={handlePhotoButtonClick}
              >
                <div className="text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-lg font-medium text-gray-600 mb-1">
                    הוסף תמונה שלך
                  </p>
                  <p className="text-sm text-gray-500">
                    לחץ כדי לצלם או להעלות תמונה
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative w-40 h-40 mx-auto overflow-hidden rounded-full border-4 border-primary shadow-lg">
                  <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePhotoButtonClick}
                  className="w-full"
                >
                  שנה תמונה
                </Button>
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
                <span className="animate-spin mr-2">⏳</span>
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

      {/* Photo Options Dialog */}
      <Dialog open={showPhotoOptions} onOpenChange={setShowPhotoOptions}>
        <DialogContent className="sm:max-w-md" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">בחר איך להוסיף תמונה</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-6">
            <Button 
              className="flex items-center gap-3 h-16 justify-start px-6 text-lg bg-blue-500 hover:bg-blue-600"
              onClick={handleCameraCapture}
            >
              <Camera className="h-6 w-6" />
              <span>צלם תמונה חדשה</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-3 h-16 justify-start px-6 text-lg border-2"
              onClick={handleGallerySelect}
            >
              <FolderOpen className="h-6 w-6" />
              <span>בחר מהגלריה</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GuestRegistration;
