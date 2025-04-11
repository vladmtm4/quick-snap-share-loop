import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Photo } from "@/types";

interface SlideshowProps {
  photos: Photo[];
  albumId: string;
  autoRefresh?: boolean;
  interval?: number;
  updateSignal?: number; // Signal to detect when photos array changes
}

const Slideshow: React.FC<SlideshowProps> = ({ 
  photos, 
  albumId,
  autoRefresh = true, 
  interval = 8000, // 8 seconds interval
  updateSignal = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const prevPhotoCount = useRef(photos.length);
  const photosRef = useRef<Photo[]>(photos);
  const navigate = useNavigate();
  
  // Update the ref when photos change
  useEffect(() => {
    photosRef.current = photos;
    console.log(`Slideshow photos updated: ${photos.length} photos available`);
  }, [photos]);
  
  // Add logging when photos prop changes
  useEffect(() => {
    console.log(`Slideshow component received ${photos.length} photos (previous: ${prevPhotoCount.current})`);
    
    // Handle changes in the photos array while preserving current position
    if (photos.length !== prevPhotoCount.current) {
      console.log(`Photo bucket size changed: ${prevPhotoCount.current} -> ${photos.length}`);
      
      // If new photos were added and we're already at the end, we might want to let the slideshow
      // continue from current position instead of jumping
      if (photos.length > prevPhotoCount.current) {
        console.log("New photos have been added to the slideshow");
        // Keep the current index unless it's now out of bounds
        if (currentIndex >= photos.length) {
          console.log("Current index out of bounds, resetting to 0");
          setCurrentIndex(0);
        } else {
          console.log(`Maintaining current position at index ${currentIndex}`);
          // We keep the current index (no need to update it)
        }
      } else if (photos.length < prevPhotoCount.current) {
        // If photos were removed, ensure current index is valid
        if (currentIndex >= photos.length && photos.length > 0) {
          console.log("Current index out of bounds after photos were removed, adjusting");
          setCurrentIndex(Math.max(photos.length - 1, 0));
        }
      }
      
      // Update our reference
      prevPhotoCount.current = photos.length;
    }
  }, [photos, updateSignal, currentIndex]);
  
  const goBack = () => {
    navigate(`/album/${albumId}`);
  };
  
  const goToNextSlide = useCallback(() => {
    if (photosRef.current.length === 0) return;
    
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % photosRef.current.length;
      console.log(`Moving to next slide: ${prevIndex} -> ${newIndex}`);
      return newIndex;
    });
  }, []);
  
  // Handle auto-advancing slides when playing
  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      console.log(`Setting up timer for ${interval}ms, current index: ${currentIndex}, total photos: ${photos.length}`);
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
