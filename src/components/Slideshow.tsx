
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
  interval = 8000,
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
    
    // Only update photos if there's a change in the array
    if (JSON.stringify(initialPhotos) !== JSON.stringify(photos)) {
      console.log("Slideshow: Photos array actually changed, updating state");
      setPhotos(initialPhotos);
    }
  }, [initialPhotos, updateSignal]);
  
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
