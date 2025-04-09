
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Camera, User, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FindGuestGameProps {
  albumId: string;
}

const FindGuestGame: React.FC<FindGuestGameProps> = ({ albumId }) => {
  const [assignment, setAssignment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Generate a random guest assignment on component mount
  useEffect(() => {
    async function loadGuestNames() {
      try {
        setIsLoading(true);
        
        // Fetch guest names from album metadata
        const { data, error } = await supabase
          .from('albums')
          .select('guest_list')
          .eq('id', albumId)
          .single();
        
        if (error) {
          console.error("Error loading guest list:", error);
          toast({
            title: "Couldn't load the game",
            description: "Please try again later",
            variant: "destructive"
          });
          setAssignment("Someone special");
          return;
        }
        
        // If we have guest names in the metadata, pick a random one
        const guestList = data?.guest_list;
        if (guestList && Array.isArray(guestList) && guestList.length > 0) {
          const randomIndex = Math.floor(Math.random() * guestList.length);
          setAssignment(guestList[randomIndex]);
        } else {
          // Default assignment if no guest list is available
          setAssignment("Someone special");
        }
      } catch (error) {
        console.error("Error in game setup:", error);
        setAssignment("Someone special");
      } finally {
        setIsLoading(false);
      }
    }

    loadGuestNames();
  }, [albumId, toast]);

  const handleTakePhoto = () => {
    // Navigate to the upload page with special game parameter
    navigate(`/upload/${albumId}?gameMode=true&assignment=${encodeURIComponent(assignment || '')}`);
  };

  const handleComplete = () => {
    setGameComplete(true);
    toast({
      title: "Mission accomplished!",
      description: "You've completed the challenge!",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl">Wedding Photo Challenge</CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center space-y-6 text-center p-6">
        {isLoading ? (
          <p>Finding your photo mission...</p>
        ) : gameComplete ? (
          <div className="text-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center">
              <CheckCheck className="h-10 w-10 text-green-600" />
            </div>
            <p className="text-lg font-medium">Challenge completed!</p>
            <p className="text-muted-foreground">
              Thanks for participating in the wedding photo game!
            </p>
          </div>
        ) : (
          <>
            <div className="bg-blue-100 p-4 rounded-full mx-auto w-20 h-20 flex items-center justify-center">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium">Your mission (should you choose to accept it):</p>
              <p className="text-2xl font-bold text-brand-blue">
                Find {assignment}
              </p>
              <p className="text-muted-foreground">
                Take the coolest photo you can with them and upload it!
              </p>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3 pt-2">
        {!gameComplete && (
          <>
            <Button 
              className="w-full bg-brand-blue hover:bg-brand-darkBlue gap-2"
              onClick={handleTakePhoto}
              disabled={isLoading}
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleComplete}
              disabled={isLoading}
            >
              Mark as Completed
            </Button>
          </>
        )}
        
        <Button 
          variant="ghost"
          className="w-full"
          onClick={() => navigate(`/album/${albumId}`)}
        >
          Return to Album
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FindGuestGame;
