
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
    if (!albumId) return;
    
    try {
      // Check if album exists
      const album = await supabaseService.getAlbumById(albumId);
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
      const approvedPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
      setPhotos(approvedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  }, [albumId, navigate, toast]);
  
  useEffect(() => {
    loadPhotos();
    
    // Set up real-time subscription for new photos
    const channel = supabase
      .channel('public:photos')
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`
        }, 
        () => {
          loadPhotos();
        }
      )
      .subscribe();
    
    return () => {
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
      <Slideshow photos={photos} albumId={albumId} />
    </div>
  );
};

export default SlideshowPage;
