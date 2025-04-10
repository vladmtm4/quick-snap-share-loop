
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
  const [photosUpdated, setPhotosUpdated] = useState(0); // Counter to track updates
  
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
      console.log("Approved photos loaded:", approvedPhotos.length);
      setPhotos(approvedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  }, [albumId, navigate, toast]);
  
  useEffect(() => {
    loadPhotos();
    
    // Set up real-time subscription for new or updated photos with enhanced logging
    const channel = supabase
      .channel(`photos-album-${albumId}`) // Use unique channel name for this album
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`
        }, 
        (payload) => {
          console.log("Real-time photo update detected:", payload);
          
          // For insertions or updates with approved=true, add them to the current photos
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && 
              payload.new && payload.new.approved) {
            
            // Check if this is a new photo or an update to an existing one
            if (payload.eventType === 'INSERT') {
              console.log("New photo detected, adding to slideshow:", payload.new);
              
              // Use the functional update pattern to ensure we're working with the latest state
              setPhotos(currentPhotos => {
                const newPhoto = payload.new as Photo;
                
                // Check if the photo already exists in our array to prevent duplicates
                if (currentPhotos.some(photo => photo.id === newPhoto.id)) {
                  console.log("Photo already exists in slideshow, skipping");
                  return currentPhotos;
                }
                
                console.log("Adding new photo to slideshow state, current count:", currentPhotos.length);
                // Create a new array to ensure React detects the state change
                const updatedPhotos = [...currentPhotos, newPhoto];
                console.log("New photo count:", updatedPhotos.length);
                
                // Also increment the update counter to signal to child components
                setPhotosUpdated(prevCount => prevCount + 1);
                
                return updatedPhotos;
              });
              
              // Notify about new photo
              toast({
                title: "New photo added",
                description: "A new photo was added to the slideshow",
              });
            } else {
              // For updates, replace the existing photo
              console.log("Updated photo detected:", payload.new);
              setPhotos(currentPhotos => {
                const updatedPhotos = currentPhotos.map(photo => 
                  photo.id === payload.new.id ? {...photo, ...payload.new as Photo} : photo
                );
                setPhotosUpdated(prevCount => prevCount + 1);
                return updatedPhotos;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted photos
            console.log("Deleted photo detected:", payload.old);
            setPhotos(currentPhotos => {
              const updatedPhotos = currentPhotos.filter(photo => photo.id !== payload.old.id);
              setPhotosUpdated(prevCount => prevCount + 1);
              return updatedPhotos;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to real-time updates for album: ${albumId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error("Error subscribing to real-time updates");
        }
      });
    
    // Log subscription success
    console.log("Real-time subscription activated for album:", albumId);
    
    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [albumId, loadPhotos, toast]);
  
  // Add debug logging whenever photos state changes
  useEffect(() => {
    console.log(`Photos state updated: ${photos.length} photos available`);
  }, [photos]);
  
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
      <Slideshow 
        photos={photos} 
        albumId={albumId} 
        interval={8000}
        updateSignal={photosUpdated} // Pass a signal to the component when photos change
      />
    </div>
  );
};

export default SlideshowPage;
