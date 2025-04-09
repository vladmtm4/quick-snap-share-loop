
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Image as ImageIcon, Trophy } from "lucide-react";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { useSearchParams, useNavigate } from "react-router-dom";

interface PhotoUploaderProps {
  album: Album;
  onUploadComplete?: () => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ album, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isGameMode = searchParams.get('gameMode') === 'true';
  const guestAssignment = searchParams.get('assignment');
  
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
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
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Upload to Supabase storage
      const storageResult = await supabaseService.uploadImageToStorage(
        album.id,
        selectedFile
      );
      
      if (!storageResult) {
        throw new Error("Failed to upload to storage");
      }
      
      // Add photo record to database
      const result = await supabaseService.addPhoto({
        albumId: album.id,
        url: storageResult.url,
        thumbnailUrl: storageResult.thumbnailUrl,
        approved: !album.moderationEnabled, // Auto-approve if moderation is disabled
        metadata: isGameMode ? { gameChallenge: true, assignment: guestAssignment } : undefined
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Success",
        description: isGameMode
          ? "Challenge photo uploaded successfully!"
          : album.moderationEnabled
            ? "Photo uploaded and will appear after review"
            : "Photo uploaded successfully!"
      });
      
      setPreviewUrl(null);
      setSelectedFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // If in game mode, navigate back to game page after successful upload
      if (isGameMode) {
        setTimeout(() => {
          navigate(`/game/${album.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancelUpload = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
  };
  
  return (
    <Card className="w-full animate-fade-in">
      <CardContent className="p-6">
        {isGameMode && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-center gap-2">
            <Trophy className="text-yellow-500 h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-medium">Photo Challenge:</span> Take a cool picture with {guestAssignment}!
            </p>
          </div>
        )}
        
        {!previewUrl ? (
          <div className="flex flex-col items-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="photo-upload"
                onChange={handleFileSelection}
              />
              <label 
                htmlFor="photo-upload" 
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload size={40} className="text-gray-400 mb-2" />
                <p className="font-medium text-lg">Add a photo</p>
                <p className="text-sm text-gray-500">Click to select an image or use your camera</p>
              </label>
            </div>
            
            {album.moderationEnabled && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Note: Photos will be reviewed before appearing in the album
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
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
                Cancel
              </Button>
              <Button
                className="flex-1 bg-brand-blue hover:bg-brand-darkBlue"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotoUploader;
