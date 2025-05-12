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
  interval = 5000, // Changed from 8000 to 5000 (5 seconds)
  updateSignal = 0
}) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const prevPhotoCount = useRef(initialPhotos.length);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Update photos state when props change
  useEffect(() => {
    console.log(`Slideshow: Received ${initialPhotos.length} photos from props`);
    
    // Directly update photos array when new data comes in
    if (initialPhotos.length > 0) {
      setPhotos(initialPhotos);
    }
  }, [initialPhotos, updateSignal]);
  
  // Insert a new photo at a random position in the array
  const insertPhotoRandomly = useCallback((newPhoto: Photo) => {
    setPhotos(prevPhotos => {
      // Create a copy of the current photos array
      const updatedPhotos = [...prevPhotos];
      
      // Generate a random position (including beginning and end)
      const randomPosition = Math.floor(Math.random() * (updatedPhotos.length + 1));
      
      // Insert the new photo at the random position
      updatedPhotos.splice(randomPosition, 0, newPhoto);
      
      console.log(`Slideshow: Inserted new photo at position ${randomPosition} of ${updatedPhotos.length}`);
      return updatedPhotos;
    });
  }, []);
  
  // Effect to handle changes in the photos array
  useEffect(() => {
    console.log(`Slideshow: Photos array changed - now ${photos.length} photos`);
    
    // If new photos were added and we're already at the end, we might want to let the slideshow continue
    if (photos.length !== prevPhotoCount.current) {
      console.log(`Slideshow: Photo count changed: ${prevPhotoCount.current} -> ${photos.length}`);
      
      // If photos were removed, ensure current index is valid
      if (photos.length < prevPhotoCount.current) {
        if (currentIndex >= photos.length && photos.length > 0) {
          console.log("Slideshow: Current index out of bounds after photos were removed, adjusting");
          setCurrentIndex(Math.max(photos.length - 1, 0));
        }
      } else if (photos.length > prevPhotoCount.current) {
        // New photo was added - notify user
        toast({
          title: "New Photo",
          description: "A new photo has been added to the slideshow",
        });
      }
      
      // Update our reference
      prevPhotoCount.current = photos.length;
    }
  }, [photos, currentIndex, toast]);
  
  // Set up real-time listener for photo updates
  useEffect(() => {
    if (!albumId) return;
    
    console.log("Slideshow: Setting up real-time subscription for photo changes");
    
    const channel = supabase
      .channel(`slideshow-photos-${albumId}`)
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
            
            // Insert the new photo at a random position
            insertPhotoRandomly(newPhoto);
            
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
          console.log("Slideshow: Photo updated:", payload);
          // If photo was just approved, add it to the slideshow at a random position
          if (payload.new && payload.old && !payload.old.approved && payload.new.approved) {
            console.log("Slideshow: Photo was just approved, adding to slideshow");
            
            const newPhoto: Photo = {
              id: payload.new.id,
              albumId: payload.new.album_id,
              url: payload.new.url,
              thumbnailUrl: payload.new.thumbnail_url,
              createdAt: payload.new.created_at,
              approved: payload.new.approved,
              metadata: payload.new.metadata,
            };
            
            // Insert the new photo at a random position
            insertPhotoRandomly(newPhoto);
            
            toast({
              title: "New Photo",
              description: "A new photo has been approved and added to the slideshow",
            });
          }
          // If photo was unapproved, remove it from the slideshow
          else if (payload.new && payload.old && payload.old.approved && !payload.new.approved) {
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== payload.new.id));
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
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log(`Slideshow: Supabase subscription status: ${status}`);
      });
      
    return () => {
      console.log("Slideshow: Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [albumId, toast, insertPhotoRandomly]);
  
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
