
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const SlideshowPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadPhotos = useCallback(async () => {
    if (!albumId) {
      toast({
        title: "Error",
        description: "Album ID is missing",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    try {
      console.log("Fetching album with ID:", albumId);
      // Check if album exists
      const album = await supabaseService.getAlbumById(albumId);
      console.log("Album data result:", album);
      
      if (!album) {
        console.error("Album not found for ID:", albumId);
        toast({
          title: "Album not found",
          description: "The album you're looking for doesn't exist",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      
      // Get approved photos for this album
      const approvedPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
      console.log("Approved photos:", approvedPhotos);
      setPhotos(approvedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  }, [albumId, navigate, toast]);
  
  useEffect(() => {
    loadPhotos();
    
    // Set up real-time subscription for new or updated photos
    const channel = supabase
      .channel('public:photos')
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`
        }, 
        (payload) => {
          console.log("Real-time photo update detected:", payload);
          loadPhotos(); // Reload all photos when any change is detected
        }
      )
      .subscribe();
    
    // Log subscription success
    console.log("Real-time subscription activated for album:", albumId);
    
    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [albumId, loadPhotos]);
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <p>Loading slideshow...</p>
      </div>
    );
  }
  
  if (!albumId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid album</p>
      </div>
    );
  }
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <Slideshow photos={photos} albumId={albumId} interval={15000} />
    </div>
  );
};

export default SlideshowPage;
