
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import { useToast } from "@/components/ui/use-toast";
import { dbService } from "@/lib/db-service";

const SlideshowPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState([]);
  
  const loadPhotos = useCallback(() => {
    if (!albumId) return;
    
    // Check if album exists
    const album = dbService.getAlbumById(albumId);
    if (!album) {
      toast({
        title: "Album not found",
        description: "The album you're looking for doesn't exist",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    // Get approved photos for this album
    const approvedPhotos = dbService.getApprovedPhotosByAlbumId(albumId);
    setPhotos(approvedPhotos);
  }, [albumId, navigate, toast]);
  
  useEffect(() => {
    loadPhotos();
    
    // Set up polling for new photos
    const intervalId = setInterval(() => {
      loadPhotos();
    }, 10000); // Check for new photos every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [albumId, loadPhotos]);
  
  if (!albumId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid album</p>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <Slideshow photos={photos} albumId={albumId} />
    </div>
  );
};

export default SlideshowPage;
