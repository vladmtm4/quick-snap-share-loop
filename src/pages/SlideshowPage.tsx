
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";
import { ArrowLeft } from "lucide-react";

const SlideshowPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [photosUpdated, setPhotosUpdated] = useState(0); // Track when photos update
  
  const loadPhotos = useCallback(async () => {
    if (!albumId) {
      console.error("Album ID is missing");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Loading approved photos for album:", albumId);
      const approvedPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
      console.log("Approved photos loaded:", approvedPhotos.length);
      setPhotos(approvedPhotos);
      setPhotosUpdated(prev => prev + 1); // Increment update signal
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  }, [albumId]);
  
  // Initial load
  useEffect(() => {
    if (!albumId) {
      console.error("Album ID is missing");
      navigate("/");
      return;
    }
    
    loadPhotos();
  }, [albumId, loadPhotos, navigate]);
  
  // Set up real-time subscription to photos table
  useEffect(() => {
    if (!albumId) return;
    
    console.log("Setting up real-time subscription for album:", albumId);
    
    // Create a Supabase channel to listen for changes
    const channel = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("Real-time INSERT event received:", payload);
          // Check if the inserted photo is approved
          if (payload.new && payload.new.approved === true) {
            console.log("New approved photo detected, adding to slideshow");
            
            const newPhoto: Photo = {
              id: payload.new.id,
              albumId: payload.new.album_id,
              url: payload.new.url,
              thumbnailUrl: payload.new.thumbnail_url,
              createdAt: payload.new.created_at,
              approved: payload.new.approved,
              metadata: payload.new.metadata,
            };
            
            setPhotos((currentPhotos) => [...currentPhotos, newPhoto]);
            setPhotosUpdated(prev => prev + 1); // Increment update signal
            
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
          console.log("Real-time UPDATE event received:", payload);
          
          if (payload.new) {
            // If a photo was just approved, add it to the slideshow
            if (payload.old && payload.old.approved === false && payload.new.approved === true) {
              console.log("Photo was just approved, adding to slideshow");
              
              const newPhoto: Photo = {
                id: payload.new.id,
                albumId: payload.new.album_id,
                url: payload.new.url,
                thumbnailUrl: payload.new.thumbnail_url,
                createdAt: payload.new.created_at,
                approved: payload.new.approved,
                metadata: payload.new.metadata,
              };
              
              setPhotos((currentPhotos) => {
                if (currentPhotos.some(p => p.id === newPhoto.id)) {
                  return currentPhotos;
                }
                return [...currentPhotos, newPhoto];
              });
              setPhotosUpdated(prev => prev + 1); // Increment update signal
            }
            // If a photo was unapproved, remove it from the slideshow
            else if (payload.old && payload.old.approved === true && payload.new.approved === false) {
              console.log("Photo was unapproved, removing from slideshow");
              setPhotos((currentPhotos) => currentPhotos.filter(p => p.id !== payload.new.id));
              setPhotosUpdated(prev => prev + 1); // Increment update signal
            }
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
          console.log("Real-time DELETE event received:", payload);
          if (payload.old) {
            console.log("Photo was deleted, removing from slideshow");
            setPhotos((currentPhotos) => currentPhotos.filter(p => p.id !== payload.old.id));
            setPhotosUpdated(prev => prev + 1); // Increment update signal
          }
        }
      )
      .subscribe((status) => {
        console.log("Supabase channel subscription status:", status);
      });
    
    // Log subscription success
    console.log("Real-time subscription activated for album:", albumId);
    
    // Refresh photos every 30 seconds as a backup mechanism
    const refreshInterval = setInterval(() => {
      console.log("Periodic refresh of photos");
      loadPhotos();
    }, 30000);
    
    return () => {
      console.log("Cleaning up real-time subscription and intervals");
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [albumId, loadPhotos, toast]);
  
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
        updateSignal={photosUpdated}
      />
    </div>
  );
};

export default SlideshowPage;
