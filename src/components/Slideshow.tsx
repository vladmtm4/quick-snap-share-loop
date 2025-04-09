
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Photo } from "@/types";

interface SlideshowProps {
  photos: Photo[];
  albumId: string;
  autoRefresh?: boolean;
  interval?: number;
}

const Slideshow: React.FC<SlideshowProps> = ({ 
  photos, 
  albumId,
  autoRefresh = true, 
  interval = 8000 // 8 seconds interval
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();
  
  const goBack = () => {
    navigate(`/album/${albumId}`);
  };
  
  const goToNextSlide = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  }, [photos.length]);
  
  // When photos array changes (new photos added), update the slideshow accordingly
  useEffect(() => {
    // If we're at the end of the slides and new photos are added, we can continue with new photos
    if (currentIndex >= photos.length && photos.length > 0) {
      setCurrentIndex(0);
    }
    console.log(`Slideshow photos updated: ${photos.length} photos available`);
  }, [photos, currentIndex]);
  
  // Handle auto-advancing slides when playing
  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      console.log(`Setting up timer for ${interval}ms`);
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
      <div className="photo-slideshow-container flex flex-col items-center justify-center p-4">
        <p className="text-white text-xl mb-4">No photos in this album yet.</p>
        <Button onClick={goBack} variant="outline">
          Back to Album
        </Button>
      </div>
    );
  }
  
  return (
    <div className="photo-slideshow-container">
      {photos.map((photo, index) => (
        <div 
          key={photo.id}
          className={`photo-slide ${index === currentIndex ? 'active' : ''}`}
        >
          <img src={photo.url} alt={`Slide ${index + 1}`} />
        </div>
      ))}
      
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="outline" 
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 border-none"
          onClick={goBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10">
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
        <div className="absolute bottom-4 left-0 right-0 mx-auto text-center">
          <span className="bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default Slideshow;
