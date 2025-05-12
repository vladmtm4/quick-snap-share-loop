import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Photo } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SlideshowProps {
  photos: Photo[];
  albumId: string;
  autoRefresh?: boolean;
  interval?: number;
  updateSignal?: number;
}

const Slideshow: React.FC<SlideshowProps> = ({ 
  photos: initialPhotos, 
  albumId,
  autoRefresh = true, 
  interval = 5000,
  updateSignal = 0
}) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use a ref to keep track of photo IDs for quick comparison
  const photoIdsRef = useRef<Set<string>>(new Set());
  
  // Update photos state when props change or updateSignal changes
  useEffect(() => {
    console.log(`Slideshow: Received ${initialPhotos.length} photos from props (updateSignal: ${updateSignal})`);
    
    // Check if the photos array has actually changed
    const newPhotoIds = new Set(initialPhotos.map(photo => photo.id));
    const currentPhotoIds = photoIdsRef.current;
    
    // Compare photo IDs to see if we have changes
    let hasChanges = initialPhotos.length !== photos.length;
    
    if (!hasChanges) {
      // Check if there are any new IDs that weren't in our previous set
      initialPhotos.forEach(photo => {
        if (!currentPhotoIds.has(photo.id)) {
          hasChanges = true;
        }
      });
    }
    
    if (hasChanges || updateSignal > 0) {
      console.log('Slideshow: Photos array has changed, updating...');
      setPhotos(initialPhotos);
      
      // Update our ref with the new photo IDs
      photoIdsRef.current = newPhotoIds;
      
      // If we had photos before and now have more, it means new photos were added
      if (photos.length > 0 && initialPhotos.length > photos.length) {
        toast({
          title: "Photos Updated",
          description: "The slideshow has been updated with new photos",
        });
      }
    }
  }, [initialPhotos, updateSignal, toast, photos.length]);
  
  // Set up direct real-time listener in the Slideshow component as a backup
  useEffect(() => {
    if (!albumId) return;
    
    console.log("Slideshow: Setting up backup real-time subscription for photo changes");
    
    const channelName = `slideshow-photos-${albumId}-${Date.now()}`;
    console.log(`Slideshow: Creating backup channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId} AND approved=eq.true`,
        },
        (payload) => {
          console.log("Slideshow: New approved photo inserted:", payload);
          if (payload.new) {
            // Check if we already have this photo
            if (!photoIdsRef.current.has(payload.new.id)) {
              // Create a photo object from the payload
              const newPhoto: Photo = {
                id: payload.new.id,
                albumId: payload.new.album_id,
                url: payload.new.url,
                thumbnailUrl: payload.new.thumbnail_url,
                createdAt: payload.new.created_at,
                approved: payload.new.approved,
                metadata: payload.new.metadata,
              };
              
              // Add the photo to the state
              setPhotos(prevPhotos => {
                const updatedPhotos = [...prevPhotos, newPhoto];
                photoIdsRef.current.add(newPhoto.id); // Update our ID tracking
                return updatedPhotos;
              });
              
              toast({
                title: "New Photo",
                description: "A new photo has been added to the slideshow",
              });
            }
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
          console.log("Slideshow: Photo updated:", payload);
          // If photo was just approved, add it to the slideshow
          if (payload.new && payload.old && !payload.old.approved && payload.new.approved) {
            console.log("Slideshow: Photo was just approved, adding to slideshow");
            
            // Check if we already have this photo
            if (!photoIdsRef.current.has(payload.new.id)) {
              const newPhoto: Photo = {
                id: payload.new.id,
                albumId: payload.new.album_id,
                url: payload.new.url,
                thumbnailUrl: payload.new.thumbnail_url,
                createdAt: payload.new.created_at,
                approved: payload.new.approved,
                metadata: payload.new.metadata,
              };
              
              // Add the photo to the state
              setPhotos(prevPhotos => {
                const updatedPhotos = [...prevPhotos, newPhoto];
                photoIdsRef.current.add(newPhoto.id); // Update our ID tracking
                return updatedPhotos;
              });
              
              toast({
                title: "New Photo",
                description: "A new photo has been approved and added to the slideshow",
              });
            }
          }
          // If photo was unapproved, remove it from the slideshow
          else if (payload.new && payload.old && payload.old.approved && !payload.new.approved) {
            setPhotos(prevPhotos => {
              const updatedPhotos = prevPhotos.filter(photo => photo.id !== payload.new.id);
              photoIdsRef.current.delete(payload.new.id); // Update our ID tracking
              return updatedPhotos;
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
          console.log("Slideshow: Photo deleted:", payload);
          if (payload.old) {
            setPhotos(prevPhotos => {
              const updatedPhotos = prevPhotos.filter(photo => photo.id !== payload.old.id);
              photoIdsRef.current.delete(payload.old.id); // Update our ID tracking
              return updatedPhotos;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log(`Slideshow: Backup subscription status: ${status}`);
      });
      
    return () => {
      console.log("Slideshow: Cleaning up backup real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [albumId, toast]);
  
  const goBack = () => {
    navigate(`/album/${albumId}`);
  };
  
  const goToNextSlide = useCallback(() => {
    if (photos.length === 0) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % photos.length;
      return newIndex;
    });
  }, [photos.length]);
  
  // Handle auto-advancing slides when playing
  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      const timer = setTimeout(goToNextSlide, interval);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, photos.length, interval, goToNextSlide]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Reset current index if it goes out of bounds when photos array changes
  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(0);
    }
  }, [photos.length, currentIndex]);
  
  if (photos.length === 0) {
    return (
      <div className="photo-slideshow-container flex flex-col items-center justify-center p-4 min-h-screen bg-black">
        <p className="text-white text-xl mb-4">No photos in this album yet.</p>
        <Button onClick={goBack} variant="outline" className="text-white border-white hover:bg-white/10">
          Back to Album
        </Button>
      </div>
    );
  }
  
  return (
    <div className="photo-slideshow-container min-h-screen bg-black relative">
      {photos.map((photo, index) => (
        <div 
          key={photo.id}
          className={`photo-slide absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img 
            src={photo.url} 
            alt={`Slide ${index + 1}`} 
            className="max-h-screen max-w-full object-contain"
          />
        </div>
      ))}
      
      <div className="absolute top-4 left-4 z-20">
        <Button 
          variant="outline" 
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 border-none"
          onClick={goBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute bottom-4 right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 border-none"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {photos.length > 0 && (
        <div className="absolute bottom-4 left-0 right-0 mx-auto text-center z-20">
          <span className="bg-black/50 text-white px-3 py-1.5 rounded-md text-sm">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default Slideshow;
