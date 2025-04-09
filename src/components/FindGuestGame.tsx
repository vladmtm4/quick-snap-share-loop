
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
import { ChevronsRight, Camera, UserSearch, UserRound, RefreshCw } from 'lucide-react';

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
        
        // Check if we have a previously assigned guest
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
      // Get device ID from localStorage or create one
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('device_id', deviceId);
      }
      
      // Try to get previously assigned guest
      const { data: assignedGuest, error } = await guestService.getGuestByDeviceId(albumId, deviceId);
      
      if (error) {
        console.error("Error checking for previous assignment:", error);
        getOrAssignRandomGuest(true);
        return;
      }
      
      // If we found a previously assigned guest, use it
      if (assignedGuest) {
        setRandomGuest(assignedGuest);
        console.log("Found previously assigned guest:", assignedGuest);
      } else {
        // Otherwise get a new assignment
        getOrAssignRandomGuest(true);
      }
    } catch (err) {
      console.error("Error in checkForPreviousAssignment:", err);
      getOrAssignRandomGuest(true);
    }
  };
  
  const getOrAssignRandomGuest = async (initialLoad = false, forceNew = false) => {
    try {
      if (!initialLoad) {
        setChangingGuest(true);
      } else {
        setLoading(true);
      }
      
      // If forceNew is true, first clear the current assignment
      if (forceNew && randomGuest) {
        await guestService.clearGuestAssignment(albumId);
      }
      
      // Try to get an unassigned guest
      const { data: guest, error } = await guestService.getUnassignedGuest(albumId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to assign a guest. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      if (guest) {
        // Store the assignment so it persists between sessions
        guestService.storeGuestAssignment(albumId, guest.id);
        setRandomGuest(guest);
        
        toast({
          title: "New Guest Assigned",
          description: `You have been assigned ${guest.guestName}!`,
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
    
    // Clear the stored assignment for this album
    localStorage.removeItem(`album_${albumId}_device_${localStorage.getItem('device_id')}`);
    
    await guestService.resetAllGuestAssignments(albumId);
    getOrAssignRandomGuest();
  };
  
  const handleChangeGuest = async () => {
    await getOrAssignRandomGuest(false, true);
  };
  
  const handleTakePhoto = () => {
    if (randomGuest) {
      navigate(`/upload/${albumId}?gameMode=true&assignment=${randomGuest.guestName}`);
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
  
  // Restrict non-admin users to only "find" mode
  const isAdmin = false; // Guest users are never admin

  return (
    <div className="space-y-4">
      <Tabs defaultValue="find" onValueChange={(value) => isAdmin && setGameMode(value as 'find' | 'list')}>
        <TabsList className="w-full">
          <TabsTrigger value="find" className="flex-1">
            <UserSearch className="mr-2 h-4 w-4" />
            Find a Guest
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="list" className="flex-1">Guest List</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="find" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Score: {score}</CardTitle>
              <CardDescription>Find this guest in the event:</CardDescription>
            </CardHeader>
            <CardContent>
              {randomGuest ? (
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">{randomGuest.guestName}</h3>
                  
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
                  
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Button 
                      onClick={handleChangeGuest} 
                      variant="outline"
                      disabled={changingGuest}
                      className="sm:flex-1"
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      {changingGuest ? "Changing..." : "This isn't me"}
                    </Button>
                    
                    <Button 
                      onClick={handleTakePhoto} 
                      className="bg-brand-blue hover:bg-brand-darkBlue sm:flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </Button>
                    
                    {isAdmin && (
                      <Button 
                        onClick={handleResetGame} 
                        variant="outline" 
                        className="sm:flex-1"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset Game
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>No guests available for the game.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="list">
            <div className="grid gap-2">
              {guestData.filter(g => g.approved !== false).map(guest => (
                <Button 
                  key={guest.id}
                  variant={selectedGuest?.id === guest.id ? "default" : "outline"}
                  className="justify-between w-full"
                  onClick={() => handleGuestSelected(guest)}
                >
                  <span>{guest.guestName}</span>
                  {allFoundGuests[guest.id] && <Badge>Found</Badge>}
                </Button>
              ))}
              
              {guestData.length === 0 && !loading && (
                <p className="text-center py-4 text-muted-foreground">No guests in this album yet</p>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default FindGuestGame;
