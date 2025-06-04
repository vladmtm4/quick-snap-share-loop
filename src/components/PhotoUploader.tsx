
import React, { useState, useEffect, useRef } from "react";
import { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Upload, Image as ImageIcon, Trophy, Camera, FolderOpen, Sparkles, CheckCircle, X, Plus } from "lucide-react";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);
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
  
  // Check if we've already completed a challenge for this guest
  useEffect(() => {
    if (isGameMode && guestAssignment) {
      const hasCompleted = localStorage.getItem(`completed_challenge_${album.id}_${guestAssignment}`);
      setChallengeCompleted(hasCompleted === 'true');
    }
  }, [album.id, isGameMode, guestAssignment]);
  
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement> | DragEvent) => {
    const fileList = 'dataTransfer' in e ? e.dataTransfer?.files : e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const filesArr = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (filesArr.length === 0) {
      toast({ title: "Invalid file", description: "Please select image files only", variant: "destructive" });
      setDragActive(false);
      return;
    }
    
    // Add new files to existing selection instead of replacing
    const newFiles = [...selectedFiles, ...filesArr];
    setSelectedFiles(newFiles);
    
    // Generate previews for new files and add to existing previews
    const newUrls = await Promise.all(filesArr.map(f => fileToDataUrl(f)));
    setPreviewUrls(prev => [...prev, ...newUrls]);
     
    setDragActive(false);
    setUploadProgress({ uploaded: 0, total: newFiles.length });
    setShowOptionsDialog(false);
    
    toast({ 
      title: "Files added", 
      description: `Added ${filesArr.length} photo(s). Total: ${newFiles.length}` 
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelection(e.nativeEvent as unknown as DragEvent);
  }, [handleFileSelection]);
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
     
    setIsUploading(true);
    setUploadProgress({ uploaded: 0, total: selectedFiles.length });
     
    try {
      // sequentially upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const storage = await supabaseService.uploadImageToStorage(album.id, file);
        if (!storage) throw new Error("Storage upload failed");
        await supabaseService.addPhoto({ 
          albumId: album.id, 
          url: storage.url, 
          thumbnailUrl: storage.thumbnailUrl, 
          approved: !album.moderationEnabled, 
          metadata: isGameMode ? { gameChallenge: true, assignment: guestAssignment } : undefined 
        });
        setUploadProgress(prev => ({ ...prev, uploaded: prev.uploaded + 1 }));
      }
       
      toast({ title: "Success", description: `Uploaded ${selectedFiles.length} photo(s) successfully!` });
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadProgress({ uploaded: 0, total: 0 });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
       
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload some photos", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancelUpload = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadProgress({ uploaded: 0, total: 0 });
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => ({ ...prev, total: prev.total - 1 }));
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
    
    // Clear game mode parameters to switch to regular upload mode
    navigate(`/upload/${album.id}`, { replace: true });
  };
  
  // Render challenge completion view
  if (isGameMode && challengeCompleted && guestAssignment) {
    return (
      <Card className="w-full animate-fade-in shadow-lg overflow-hidden border-0">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-1">
          <CardContent className="p-0">
            <div className="bg-white rounded-lg p-8 text-center space-y-6">
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full opacity-10 animate-pulse" />
                <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Challenge Completed!
                </h2>
                
                <p className="text-gray-600 text-lg mb-2">
                  Great photo with {guestAssignment}!
                </p>
                
                <p className="text-gray-500 text-sm">
                  Your photo has been added to the album
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Camera className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-blue-700 mb-1">Keep capturing memories!</h3>
                    <p className="text-sm text-blue-600">
                      Continue taking photos of the event to build an amazing collection of memories.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-6 h-auto transition-all"
                onClick={handleBackToUpload}
              >
                <Camera className="mr-2 h-5 w-5" />
                Capture More Moments
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="w-full animate-fade-in">
      <CardContent className="p-6">
        {isGameMode && guestAssignment && !challengeCompleted && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-center gap-2">
            <Trophy className="text-yellow-500 h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-medium">Photo Challenge:</span> Take a cool picture with {guestAssignment}!
            </p>
          </div>
        )}
        
        {previewUrls.length === 0 ? (
          <div className="w-full">
            <div 
              className={`border-2 border-dashed rounded-lg p-12 w-full flex flex-col items-center justify-center transition-colors ${
                dragActive ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
              } cursor-pointer`} 
              onClick={handleAddPhotoClick} 
              onDragOver={handleDragOver} 
              onDragLeave={handleDragLeave} 
              onDrop={handleDrop}
            >
              <Upload size={40} className="text-gray-400 mb-2" />
              <p className="font-medium text-lg">Drag & drop or click to add photos</p>
              <p className="text-sm text-gray-500">Select multiple images at once</p>
            </div>

            {/* Hidden file inputs */}
            <input
              multiple
              type="file"
              accept="image/*"
              className="hidden"
              id="gallery-upload"
              ref={fileInputRef}
              onChange={handleFileSelection}
            />
            <input
              type="file"
              multiple
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Selected Photos ({selectedFiles.length})</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAddPhotoClick}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More
              </Button>
            </div>
            
            {/* previews grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt={`preview-${idx}`} 
                    className="w-full h-32 object-cover rounded border-2 border-gray-200 group-hover:border-primary transition-colors" 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeFile(idx)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* progress bar */}
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${(uploadProgress.uploaded/uploadProgress.total)*100}%` }} 
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Uploading {uploadProgress.uploaded} of {uploadProgress.total} photos...
                </p>
              </div>
            )}
             
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelUpload}
                disabled={isUploading}
              >
                Clear All
              </Button>
              <Button
                className="flex-1 bg-brand-blue hover:bg-brand-darkBlue"
                onClick={handleUpload}
                disabled={isUploading || selectedFiles.length === 0}
              >
                {isUploading ? `Uploading...` : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
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
              <span>Take photos with camera</span>
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
