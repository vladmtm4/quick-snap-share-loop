
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SlideshowPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateSignal, setUpdateSignal] = useState(0);
  
  // Function to load photos that can be called anytime we need fresh data
  const loadPhotos = useCallback(async () => {
    if (!albumId) {
      console.error("Album ID is missing");
      navigate("/");
      return;
    }
    
    try {
      setLoading(true);
      console.log("SlideshowPage: Loading approved photos for album:", albumId);
      const approvedPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
      console.log("SlideshowPage: Approved photos loaded:", approvedPhotos.length);
      setPhotos(approvedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
      toast({
        title: "Error",
        description: "Failed to load photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [albumId, navigate, toast]);
  
  // Load initial photos
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);
  
  // Set up real-time listener for updates
  useEffect(() => {
    if (!albumId) return;
    
    console.log("SlideshowPage: Setting up real-time subscription for album:", albumId);
    
    // Create a dedicated channel for this slideshow page
    const channel = supabase
      .channel(`slideshow-updates-${albumId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("SlideshowPage: New photo inserted:", payload);
          // If the new photo is already approved, add it to the slideshow immediately
          if (payload.new && payload.new.approved === true) {
            console.log("SlideshowPage: New approved photo detected, adding to slideshow");
            loadPhotos();
            toast({
              title: "New Photo",
              description: "A new photo has been added to the slideshow",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("SlideshowPage: Photo updated:", payload);
          // If photo was just approved, refresh the slideshow
          if (payload.new && payload.old && !payload.old.approved && payload.new.approved) {
            console.log("SlideshowPage: Photo was just approved, refreshing slideshow");
            loadPhotos();
            toast({
              title: "New Photo",
              description: "A new photo has been approved and added to the slideshow",
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("SlideshowPage: Photo deleted:", payload);
          loadPhotos();
        }
      )
      .subscribe((status) => {
        console.log(`SlideshowPage: Supabase subscription status: ${status}`);
      });
      
    return () => {
      console.log("SlideshowPage: Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [albumId, toast, loadPhotos]);
  
  const handleGoBack = () => {
    navigate(`/album/${albumId}`);
  };
  
  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-white mb-4">Loading slideshow...</div>
        <Button variant="outline" onClick={handleGoBack} className="text-white border-white hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Album
        </Button>
      </div>
    );
  }
  
  return (
    <div className="slideshow-page">
      <Slideshow 
        photos={photos} 
        albumId={albumId || ""}
        updateSignal={updateSignal}
      />
    </div>
  );
};

export default SlideshowPage;
