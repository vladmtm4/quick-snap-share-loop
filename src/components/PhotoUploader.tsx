
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Image as ImageIcon, Trophy, Camera, FolderOpen, Sparkles, Projector } from "lucide-react";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fileToDataUrl } from "@/lib/file-service";

interface PhotoUploaderProps {
  album: Album;
  onUploadComplete?: () => void;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ album, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [captureMode, setCaptureMode] = useState<"camera" | "gallery" | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isGameMode = searchParams.get('gameMode') === 'true';
  const guestAssignment = searchParams.get('assignment');
  
  // Reset the challenge completed state when changing albums or assignments
  useEffect(() => {
    setChallengeCompleted(false);
  }, [album.id, guestAssignment]);
  
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
      const dataUrl = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview image",
        variant: "destructive"
      });
    }
    
    // Close the dialog if it was open
    setShowOptionsDialog(false);
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
      
      // Show success message
      if (!isGameMode) {
        toast({
          title: "Success",
          description: album.moderationEnabled
            ? "Photo uploaded and will appear after review"
            : "Photo uploaded successfully!"
        });
      }
      
      setPreviewUrl(null);
      setSelectedFile(null);
      
      // If in game mode, set challenge completed flag
      if (isGameMode) {
        setChallengeCompleted(true);
        localStorage.setItem(`completed_challenge_${album.id}_${guestAssignment}`, "true");
      }
      
      if (onUploadComplete) {
        onUploadComplete();
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
  
  const handleAddPhotoClick = () => {
    setShowOptionsDialog(true);
  };
  
  const handleCameraOption = () => {
    setCaptureMode("camera");
    setShowOptionsDialog(false);
    
    // Slight delay to ensure dialog animation completes
    setTimeout(() => {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }, 100);
  };
  
  const handleGalleryOption = () => {
    setCaptureMode("gallery");
    setShowOptionsDialog(false);
    
    // Slight delay to ensure dialog animation completes
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };
  
  const handleBackToUpload = () => {
    setChallengeCompleted(false);
  };
  
  const handleGoToSlideshow = () => {
    navigate(`/slideshow/${album.id}`);
  };
  
  // Render challenge completion view
  if (isGameMode && challengeCompleted) {
    return (
      <Card className="w-full animate-fade-in">
        <CardContent className="p-6">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-purple-500 animate-pulse" />
                <Trophy className="absolute top-1 left-1 h-10 w-10 text-yellow-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-purple-700 mb-3">
              Challenge Completed!
            </h2>
            
            <p className="text-purple-600 mb-6">
              Amazing! You found {guestAssignment} and took a great photo together!
            </p>
            
            <Alert className="mb-6 bg-blue-50 border-blue-100">
              <AlertDescription className="text-blue-700 flex flex-col gap-2">
                <p>Your photo will appear in the slideshow soon.</p>
                <p className="font-medium">Keep taking photos of the event and check the slideshows on the screens!</p>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                className="border-purple-200 hover:bg-purple-50"
                onClick={handleBackToUpload}
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload More Photos
              </Button>
              
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleGoToSlideshow}
              >
                <Projector className="mr-2 h-4 w-4" />
                View Slideshow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue transition-colors"
              onClick={handleAddPhotoClick}
            >
              <Upload size={40} className="text-gray-400 mb-2" />
              <p className="font-medium text-lg">Add a photo</p>
              <p className="text-sm text-gray-500">Click to take a photo or select from gallery</p>
            </div>
            
            {/* Hidden file inputs */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="gallery-upload"
              ref={fileInputRef}
              onChange={handleFileSelection}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              id="camera-upload"
              ref={cameraInputRef}
              onChange={handleFileSelection}
            />
            
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
      
      {/* Photo Source Selection Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose photo source</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button 
              className="flex items-center gap-2 h-14 justify-start px-6"
              onClick={handleCameraOption}
            >
              <Camera className="h-5 w-5" />
              <span>Take a new photo</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 h-14 justify-start px-6"
              onClick={handleGalleryOption}
            >
              <FolderOpen className="h-5 w-5" />
              <span>Choose from gallery</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PhotoUploader;
