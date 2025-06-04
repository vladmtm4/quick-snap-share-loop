import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, Maximize, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Photo } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface SlideshowProps {
  photos: Photo[];
  albumId: string;
  interval?: number;
  loadPhotos: () => Promise<void>;
}

const Slideshow: React.FC<SlideshowProps> = ({ 
  photos, 
  albumId,
  interval = 5000,
  loadPhotos
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check if we need to reset current index when photos array changes
  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(0);
      setNextIndex(1 % photos.length);
    }
  }, [photos.length, currentIndex]);
  
  // Update next index when current index changes
  useEffect(() => {
    if (photos.length > 0) {
      setNextIndex((currentIndex + 1) % photos.length);
    }
  }, [currentIndex, photos.length]);
  
  const goToNextSlide = useCallback(async () => {
    if (photos.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Load fresh photos from database before changing the slide
    await loadPhotos();
    
    // Wait for transition to complete
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % photos.length;
        return newIndex;
      });
      setIsTransitioning(false);
    }, 300);
  }, [photos.length, loadPhotos, isTransitioning]);
  
  // Handle auto-advancing slides when playing
  useEffect(() => {
    if (isPlaying && photos.length > 0 && !isTransitioning) {
      const timer = setTimeout(goToNextSlide, interval);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isPlaying, photos.length, interval, goToNextSlide, isTransitioning]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const goBack = () => {
    navigate(`/album/${albumId}`);
  };
  
  // Manual navigation between slides with fresh data load
  const handleManualNav = async (direction: 'prev' | 'next') => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Always load fresh photos first
    await loadPhotos();
    
    if (photos.length === 0) return;
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        if (direction === 'prev') {
          return prevIndex === 0 ? photos.length - 1 : prevIndex - 1;
        } else {
          return (prevIndex + 1) % photos.length;
        }
      });
      setIsTransitioning(false);
    }, 300);
  };
  
  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      toast({
        title: "Fullscreen Error",
        description: "Unable to toggle fullscreen mode",
        variant: "destructive",
      });
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
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
  
  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[nextIndex];
  
  return (
    <div className="photo-slideshow-container min-h-screen bg-black relative overflow-hidden">
      {/* Current photo blurred background */}
      <div 
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{
          backgroundImage: `url(${currentPhoto.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Next photo blurred background (for smooth transition) */}
      {nextPhoto && (
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
          style={{
            backgroundImage: `url(${nextPhoto.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      
      {/* Dark overlay to reduce background intensity */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Main photo container with crossfade */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Current photo */}
        <img 
          src={currentPhoto.url} 
          alt={`Slide ${currentIndex + 1}`} 
          className={`max-h-full max-w-full object-contain z-10 relative transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          style={{
            filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 60px rgba(0, 0, 0, 0.4)',
            mask: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
            WebkitMask: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />
        
        {/* Next photo (for crossfade) */}
        {nextPhoto && (
          <img 
            src={nextPhoto.url} 
            alt={`Slide ${nextIndex + 1}`} 
            className={`absolute max-h-full max-w-full object-contain z-10 transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))',
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 60px rgba(0, 0, 0, 0.4)',
              mask: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
              WebkitMask: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 2%, black 98%, transparent 100%)',
              maskComposite: 'intersect',
              WebkitMaskComposite: 'source-in',
            }}
          />
        )}
      </div>
      
      {/* Preload next few images for smoother transitions */}
      {photos.slice(currentIndex + 1, currentIndex + 4).map((photo, index) => (
        <img 
          key={`preload-${currentIndex + index + 1}`}
          src={photo.url} 
          alt="" 
          className="hidden" 
          loading="eager"
        />
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
      
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="outline" 
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 border-none"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Navigation controls */}
      <div className="absolute bottom-4 flex justify-between w-full px-4 z-20">
        <Button 
          variant="outline"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 border-none"
          onClick={() => handleManualNav('prev')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <span className="bg-black/50 text-white px-3 py-1.5 rounded-md text-sm self-center">
          {currentIndex + 1} / {photos.length}
        </span>
        
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
    </div>
  );
};

export default Slideshow;
