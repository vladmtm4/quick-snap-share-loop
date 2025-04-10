import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { guestService } from '@/lib/guest-service';
import { useLanguage } from '@/lib/i18n';
import { Guest } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { ChevronsRight, Camera, UserSearch, UserRound, RefreshCw, Check, MousePointer } from 'lucide-react';

interface FindGuestGameProps {
  albumId: string;
  onClose: () => void;
}

const FindGuestGame: React.FC<FindGuestGameProps> = ({ albumId, onClose }) => {
  const navigate = useNavigate();
  const { translate } = useLanguage();
  const { toast } = useToast();
  
  const [guestData, setGuestData] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [allFoundGuests, setAllFoundGuests] = useState<Record<string, boolean>>({});
  const [gameMode, setGameMode] = useState<'find' | 'list'>('find');
  const [randomGuest, setRandomGuest] = useState<Guest | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [changingGuest, setChangingGuest] = useState(false);
  const [guestAssigned, setGuestAssigned] = useState(false);
  const [hasRejectedSelf, setHasRejectedSelf] = useState(false);
  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchGuests = async () => {
      try {
        setLoading(true);
        const { data, error } = await guestService.getAllGuestsForAlbum(albumId);
        
        if (error) {
          throw new Error(error.message);
        }
        
        const guestsList = data || [];
        setGuestData(guestsList);
        
        checkForPreviousAssignment();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuests();
  }, [albumId]);
  
  const checkForPreviousAssignment = async () => {
    try {
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('device_id', deviceId);
      }
      
      console.log("Checking for previously assigned guest with device ID:", deviceId);
      
      const { data: assignedGuest, error } = await guestService.getGuestByDeviceId(albumId, deviceId);
      
      if (error) {
        console.error("Error checking for previous assignment:", error);
        setGuestAssigned(false);
        return;
      }
      
      if (assignedGuest) {
        setRandomGuest(assignedGuest);
        setGuestAssigned(true);
        console.log("Found previously assigned guest:", assignedGuest);
        
        const hasRejected = localStorage.getItem(`rejected_self_${albumId}`) === 'true';
        setHasRejectedSelf(hasRejected);
        
        const hasAccepted = localStorage.getItem(`accepted_challenge_${albumId}`) === 'true';
        setChallengeAccepted(hasAccepted);
        
        if (hasAccepted) {
          toast({
            title: "Welcome Back!",
            description: `Find ${assignedGuest.guestName} and take a photo!`,
          });
        } else {
          toast({
            title: "Welcome Back!",
            description: `Your challenge: Find ${assignedGuest.guestName}!`,
          });
        }
      } else {
        setGuestAssigned(false);
      }
    } catch (err) {
      console.error("Error in checkForPreviousAssignment:", err);
      setGuestAssigned(false);
    }
  };
  
  const getOrAssignRandomGuest = async (initialLoad = false, forceNew = false) => {
    try {
      if (!initialLoad) {
        setChangingGuest(true);
      } else {
        setLoading(true);
      }
      
      if (forceNew && randomGuest) {
        console.log("Force new guest requested, clearing current assignment");
        await guestService.clearGuestAssignment(albumId);
      }
      
      console.log("Getting unassigned guest");
      const { data: guest, error } = await guestService.getUnassignedGuest(albumId);
      
      if (error) {
        console.error("Error getting unassigned guest:", error);
        toast({
          title: "Error",
          description: "Failed to assign a guest. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (guest) {
        console.log("Got unassigned guest:", guest);
        guestService.storeGuestAssignment(albumId, guest.id);
        setRandomGuest(guest);
        setGuestAssigned(true);
        
        toast({
          title: "Challenge Assigned!",
          description: `Find ${guest.guestName} and take a photo together!`,
        });
      } else {
        console.log("No guests available to assign");
        toast({
          title: "No Guests Available",
          description: "There are no guests with photos available to assign right now.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error getting random guest:", err);
      toast({
        title: "Error",
        description: "Failed to assign a guest. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (!initialLoad) {
        setChangingGuest(false);
      } else {
        setLoading(false);
      }
    }
  };
  
  const handleGuestSelected = (guest: Guest) => {
    setSelectedGuest(guest);
    
    if (randomGuest && guest.id === randomGuest.id) {
      const newFoundGuests = { ...allFoundGuests, [guest.id]: true };
      setAllFoundGuests(newFoundGuests);
      setScore(score + 1);
    }
  };
  
  const handleResetGame = async () => {
    setAllFoundGuests({});
    setScore(0);
    setHasRejectedSelf(false);
    setChallengeAccepted(false);
    
    localStorage.removeItem(`rejected_self_${albumId}`);
    localStorage.removeItem(`accepted_challenge_${albumId}`);
    
    localStorage.removeItem(`album_${albumId}_device_${localStorage.getItem('device_id')}`);
    
    await guestService.resetAllGuestAssignments(albumId);
    getOrAssignRandomGuest();
  };
  
  const handleChangeGuest = async () => {
    setHasRejectedSelf(true);
    localStorage.setItem(`rejected_self_${albumId}`, 'true');
    
    await getOrAssignRandomGuest(false, true);
  };
  
  const handleAcceptChallenge = async () => {
    setChallengeAccepted(true);
    localStorage.setItem(`accepted_challenge_${albumId}`, 'true');
    toast({
      title: "Challenge Accepted!",
      description: `Find ${randomGuest?.guestName} and take an awesome photo together!`,
    });
  };
  
  const handleTakePhoto = () => {
    if (randomGuest) {
      navigate(`/upload/${albumId}?gameMode=true&assignment=${randomGuest.guestName}`);
    }
  };
  
  const handleClickHere = async () => {
    if (!guestAssigned) {
      await getOrAssignRandomGuest(false);
    } else {
      toast({
        title: "Challenge Already Assigned",
        description: "You already have a guest to find. Click 'Accept Challenge' to confirm or 'Change Guest' to get a different guest.",
      });
    }
  };
  
  if (loading && guestData.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isAdmin = false;
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="find" onValueChange={(value) => setGameMode(value as 'find' | 'list')}>
        <TabsList className="w-full">
          <TabsTrigger value="find" className="flex-1">
            <UserSearch className="mr-2 h-4 w-4" />
            Find a Guest
          </TabsTrigger>
          <TabsTrigger value="list" disabled className="flex-1">Guest List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="find" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Score: {score}</CardTitle>
              <CardDescription>Your photo challenge:</CardDescription>
            </CardHeader>
            <CardContent>
              {!guestAssigned ? (
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6">Get your photo challenge!</h3>
                  <Button 
                    onClick={handleClickHere}
                    className="bg-brand-blue hover:bg-brand-darkBlue py-6 px-8 text-lg"
                  >
                    <MousePointer className="mr-2 h-5 w-5" />
                    Click Here
                  </Button>
                </div>
              ) : randomGuest ? (
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Find {randomGuest.guestName}</h3>
                  
                  {randomGuest.photoUrl ? (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={randomGuest.photoUrl} 
                        alt={randomGuest.guestName}
                        className="w-48 h-48 object-cover rounded-lg shadow-md border border-gray-200" 
                      />
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-100 w-48 h-48 mx-auto rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No photo available</p>
                    </div>
                  )}
                  
                  {challengeAccepted ? (
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleTakePhoto} 
                        className="bg-brand-blue hover:bg-brand-darkBlue px-8 py-3 text-lg"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Take Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      {!hasRejectedSelf && (
                        <Button 
                          onClick={handleChangeGuest} 
                          variant="outline"
                          disabled={changingGuest}
                          className="sm:flex-1"
                        >
                          <UserRound className="mr-2 h-4 w-4" />
                          {changingGuest ? "Changing..." : "This is me"}
                        </Button>
                      )}
                      
                      {hasRejectedSelf ? (
                        <Button 
                          onClick={handleTakePhoto} 
                          className="bg-brand-blue hover:bg-brand-darkBlue sm:flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Take Photo
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleAcceptChallenge}
                            className="bg-green-600 hover:bg-green-700 sm:flex-1"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Accept Challenge
                          </Button>
                          
                          <Button 
                            onClick={handleTakePhoto} 
                            className="bg-brand-blue hover:bg-brand-darkBlue sm:flex-1"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Take Photo
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        onClick={handleResetGame} 
                        variant="outline" 
                        className="sm:flex-1"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset Game
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p>No guests available for the game.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default FindGuestGame;
