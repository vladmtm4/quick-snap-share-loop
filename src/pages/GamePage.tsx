
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FindGuestGame from "@/components/FindGuestGame";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n";
import { Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GamePage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedChallenge, setHasCompletedChallenge] = useState(false);
  
  useEffect(() => {
    if (!albumId) {
      toast({
        title: "Error",
        description: "Album ID is missing",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    async function loadAlbum() {
      try {
        setLoading(true);
        const albumData = await supabaseService.getAlbumById(albumId);
        
        if (!albumData) {
          toast({
            title: "Album not found",
            description: "The album you're looking for doesn't exist",
            variant: "destructive"
          });
          navigate("/");
          return;
        }
        
        setAlbum(albumData);
        
        // Check if user has already completed a challenge
        checkForCompletedChallenge();
      } catch (error) {
        console.error("Error loading album:", error);
        toast({
          title: "Error",
          description: "Failed to load album data",
          variant: "destructive"
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbum();
  }, [albumId, navigate, toast]);
  
  const checkForCompletedChallenge = () => {
    // Check localStorage for completed challenges for this album
    const hasCompleted = localStorage.getItem(`completed_challenge_${albumId}`) === 'true';
    setHasCompletedChallenge(hasCompleted);
  };
  
  const handleClose = () => {
    navigate(`/album/${albumId}`);
  };
  
  const handleGoToUpload = () => {
    navigate(`/upload/${albumId}`);
  };
  
  const handleNewChallenge = () => {
    // We'll clear the completed challenge flag so they can play again
    localStorage.removeItem(`completed_challenge_${albumId}`);
    localStorage.removeItem(`accepted_challenge_${albumId}`);
    localStorage.removeItem(`rejected_self_${albumId}`);
    
    // Remove any previous assignment from local storage
    if (albumId) {
      const deviceId = localStorage.getItem('device_id');
      if (deviceId) {
        localStorage.removeItem(`album_${albumId}_device_${deviceId}`);
      }
    }
    
    setHasCompletedChallenge(false);
    
    toast({
      title: "Ready for a new challenge!",
      description: "Let's find someone new to photograph!",
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header showBackButton />
        <div className="container max-w-3xl py-12 px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-blue-600 font-medium">{translate("loading")}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header showBackButton />
        <div className="container max-w-3xl py-12 px-4 text-center">
          <p className="text-gray-600">Album not found</p>
        </div>
      </div>
    );
  }
  
  // If user has completed a challenge, show upload option instead
  if (hasCompletedChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header showBackButton hideAuthButtons />
        <div className="container max-w-3xl py-8 px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-blue-800 mb-2">
              Challenge Completed!
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">
              You've already completed a photo challenge. What would you like to do next?
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              <Alert className="bg-blue-50">
                <AlertDescription>
                  You can take more photos or start a new challenge to find someone else.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNewChallenge}
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  New Challenge
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleGoToUpload}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Upload More Photos
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header showBackButton hideAuthButtons />
      <div className="container max-w-3xl py-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            {translate("photoGame")}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Find other guests and take photos together for a fun wedding game!
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <FindGuestGame albumId={album.id} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
