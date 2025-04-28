
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
  
  // Load initial photos
  useEffect(() => {
    if (!albumId) {
      console.error("Album ID is missing");
      navigate("/");
      return;
    }
    
    async function loadPhotos() {
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
    }
    
    loadPhotos();
  }, [albumId, navigate, toast]);
  
  // Set up real-time listener for updates specifically for this page
  useEffect(() => {
    if (!albumId) return;
    
    console.log("SlideshowPage: Setting up real-time subscription");
    
    const channel = supabase
      .channel('slideshowpage-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("SlideshowPage: Database change detected:", payload);
          
          // Refresh photos list when any change is detected
          // This is a backup to ensure the slideshow component gets the latest data
          supabaseService.getApprovedPhotosByAlbumId(albumId)
            .then(updatedPhotos => {
              console.log("SlideshowPage: Refreshed photos from database:", updatedPhotos.length);
              setPhotos(updatedPhotos);
              setUpdateSignal(prev => prev + 1);
            })
            .catch(error => {
              console.error("Error refreshing photos:", error);
            });
        }
      )
      .subscribe((status) => {
        console.log(`SlideshowPage: Subscription status: ${status}`);
      });
      
    return () => {
      console.log("SlideshowPage: Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [albumId]);
  
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
