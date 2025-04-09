
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Plus, Upload, User, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/lib/supabase-service";
import { Album, Photo } from "@/types";
import { useLanguage } from "@/lib/i18n";
import { v4 as uuidv4 } from "uuid";

interface GuestManagerProps {
  albumId: string;
}

interface GuestPhotoRow {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  assignedTo: string | null;
  gameAssigned: boolean;
}

const GuestManager: React.FC<GuestManagerProps> = ({ albumId }) => {
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [guestName, setGuestName] = useState("");
  const [guestPhotos, setGuestPhotos] = useState<GuestPhotoRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [album, setAlbum] = useState<Album | null>(null);

  // Load album and guest photos
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const albumData = await supabaseService.getAlbumById(albumId);
        setAlbum(albumData);

        // Get guest photos from the database
        const { data, error } = await supabase
          .from("photos")
          .select("*")
          .eq("album_id", albumId)
          .eq("metadata->isGuest", true);

        if (error) throw error;

        const mappedGuests = data.map((photo) => ({
          id: photo.id,
          name: photo.metadata?.guestName || "Unknown",
          url: photo.url,
          thumbnailUrl: photo.thumbnail_url,
          assignedTo: photo.assigned_to,
          gameAssigned: photo.game_assigned || false
        }));

        setGuestPhotos(mappedGuests);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load guest photos",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [albumId, toast]);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview image",
        variant: "destructive"
      });
    }
  };

  const handleGuestPhotoUpload = async () => {
    if (!selectedFile || !guestName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a guest name and select an image",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload the file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `guest_photos/${albumId}/${uuidv4()}.${fileExt}`;
      const thumbPath = `guest_photos/${albumId}/${uuidv4()}_thumb.${fileExt}`;
      
      // Upload original
      const { error: uploadError } = await supabase.storage
        .from("guest_photos")
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // For simplicity, use the same image for thumbnail
      const { error: thumbError } = await supabase.storage
        .from("guest_photos")
        .upload(thumbPath, selectedFile);
      
      if (thumbError) throw thumbError;
      
      // Get URLs
      const { data: imageUrlData } = supabase.storage
        .from("guest_photos")
        .getPublicUrl(filePath);
      
      const { data: thumbUrlData } = supabase.storage
        .from("guest_photos")
        .getPublicUrl(thumbPath);

      // 2. Add photo to the database with guest metadata
      const result = await supabaseService.addPhoto({
        albumId: albumId,
        url: imageUrlData.publicUrl,
        thumbnailUrl: thumbUrlData.publicUrl,
        approved: true,
        metadata: {
          isGuest: true,
          guestName: guestName
        }
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // 3. Update local state
      setGuestPhotos(prev => [...prev, {
        id: result.photo!.id,
        name: guestName,
        url: imageUrlData.publicUrl,
        thumbnailUrl: thumbUrlData.publicUrl,
        assignedTo: null,
        gameAssigned: false
      }]);

      // 4. Clear form
      setGuestName("");
      setSelectedFile(null);
      setPreviewUrl(null);

      toast({
        title: translate("guestPhotoUploaded"),
        description: guestName + " " + translate("addGuest")
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload guest photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        {translate("loading")}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{translate("uploadGuestPhoto")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!previewUrl ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="guestName">{translate("guestName")}</Label>
                <Input 
                  id="guestName" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                  className="mt-1"
                />
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-blue transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="guest-photo-upload"
                  onChange={handleFileSelection}
                />
                <label 
                  htmlFor="guest-photo-upload" 
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={40} className="text-gray-400 mb-2" />
                  <p className="font-medium text-lg">{translate("uploadGuestPhoto")}</p>
                  <p className="text-sm text-gray-500">Click to select an image</p>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="guestName">{translate("guestName")}</Label>
                <Input 
                  id="guestName" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter guest name"
                  className="mt-1"
                />
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square max-h-60">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelUpload}
                  disabled={isUploading}
                >
                  {translate("cancel")}
                </Button>
                <Button
                  className="flex-1 bg-brand-blue hover:bg-brand-darkBlue"
                  onClick={handleGuestPhotoUpload}
                  disabled={isUploading || !guestName.trim()}
                >
                  {isUploading ? translate("loading") : translate("save")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{translate("guestList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {guestPhotos.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              {translate("noGuestsFound")}
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{translate("guestName")}</th>
                    <th className="text-left py-2">{translate("photo")}</th>
                    <th className="text-left py-2">{translate("assignedTo")}</th>
                  </tr>
                </thead>
                <tbody>
                  {guestPhotos.map((guest) => (
                    <tr key={guest.id} className="border-b">
                      <td className="py-2">{guest.name}</td>
                      <td className="py-2">
                        <div className="h-12 w-12 rounded overflow-hidden">
                          <img 
                            src={guest.thumbnailUrl} 
                            alt={guest.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-2">
                        {guest.assignedTo ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            {guest.assignedTo}
                          </span>
                        ) : (
                          <span className="text-gray-400">{translate("notAssigned")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestManager;
