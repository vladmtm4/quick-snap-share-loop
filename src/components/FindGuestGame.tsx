
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, User, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";

interface FindGuestGameProps {
  albumId: string;
}

interface GuestPhoto {
  id: string;
  name: string;
  photoUrl: string;
  thumbnailUrl: string;
}

const FindGuestGame: React.FC<FindGuestGameProps> = ({ albumId }) => {
  const [guestPhoto, setGuestPhoto] = useState<GuestPhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [playerName, setPlayerName] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { translate, language } = useLanguage();

  // Generate a unique identifier for this player if not exists
  useEffect(() => {
    const storedName = localStorage.getItem("playerName");
    if (storedName) {
      setPlayerName(storedName);
    } else {
      const newName = `Player_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem("playerName", newName);
      setPlayerName(newName);
    }
  }, []);

  // Find an unassigned guest photo
  useEffect(() => {
    async function assignGuestPhoto() {
      try {
        setIsLoading(true);
        
        // Try to get an unassigned guest photo
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('album_id', albumId)
          .eq('metadata->isGuest', true)
          .eq('game_assigned', false)
          .limit(1);
        
        if (error) {
          console.error("Error loading guest photos:", error);
          toast({
            title: "Couldn't load the game",
            description: "Please try again later",
            variant: "destructive"
          });
          return;
        }
        
        // If we found an unassigned guest photo
        if (data && data.length > 0) {
          const photo = data[0];
          
          // Mark this photo as assigned to this player
          await supabase
            .from('photos')
            .update({ 
              game_assigned: true,
              assigned_to: playerName
            })
            .eq('id', photo.id);
          
          // Set the guest photo for the challenge
          setGuestPhoto({
            id: photo.id,
            name: photo.metadata?.guestName || "Guest",
            photoUrl: photo.url,
            thumbnailUrl: photo.thumbnail_url
          });
        } else {
          // All photos are assigned, show a message
          toast({
            title: "All guests are assigned",
            description: "No more guests available for the game",
            variant: "destructive"
          });
          setGameComplete(true);
        }
      } catch (error) {
        console.error("Error in game setup:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (playerName) {
      assignGuestPhoto();
    }
  }, [albumId, toast, playerName]);

  const handleTakePhoto = () => {
    // Navigate to the upload page with special game parameter
    if (guestPhoto) {
      navigate(`/upload/${albumId}?gameMode=true&assignment=${encodeURIComponent(guestPhoto.name)}`);
    }
  };

  const handleComplete = async () => {
    setGameComplete(true);
    toast({
      title: "Mission accomplished!",
      description: "You've completed the challenge!",
    });
  };

  return (
    <Card className={`w-full max-w-md mx-auto animate-fade-in ${language === 'he' ? 'text-right' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl">{translate("photoGame")}</CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center space-y-6 text-center p-6">
        {isLoading ? (
          <p>{translate("loading")}</p>
        ) : gameComplete ? (
          <div className="text-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center">
              <CheckCheck className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-lg font-medium">{translate("challengeComplete")}</p>
            <p className="text-muted-foreground">
              {translate("thanksForParticipating")}
            </p>
          </div>
        ) : guestPhoto ? (
          <>
            <div className="bg-gray-200 p-2 rounded-full mx-auto w-32 h-32 flex items-center justify-center overflow-hidden">
              <img 
                src={guestPhoto.photoUrl} 
                alt={guestPhoto.name}
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">{translate("youMission")}</p>
              <p className="text-2xl font-bold text-brand-blue">
                {translate("guestChallenge")} {guestPhoto.name}
              </p>
              <p className="text-muted-foreground">
                {translate("takePhotoWithGuest")}
              </p>
            </div>
          </>
        ) : (
          <p>{translate("noGuestsFound")}</p>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3 pt-2">
        {!gameComplete && guestPhoto && (
          <>
            <Button 
              className="w-full bg-brand-blue hover:bg-brand-darkBlue gap-2"
              onClick={handleTakePhoto}
              disabled={isLoading || !guestPhoto}
            >
              <Camera className="h-4 w-4" />
              {translate("takePhoto")}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleComplete}
              disabled={isLoading}
            >
              {translate("markComplete")}
            </Button>
          </>
        )}
        
        <Button 
          variant="ghost"
          className="w-full"
          onClick={() => navigate(`/album/${albumId}`)}
        >
          {translate("returnToAlbum")}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FindGuestGame;
