
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
import { ChevronsRight, Camera, UserSearch } from 'lucide-react';

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
        getOrAssignRandomGuest();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuests();
  }, [albumId]);
  
  const getOrAssignRandomGuest = async () => {
    try {
      setLoading(true);
      
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
      
      setRandomGuest(guest);
    } catch (err) {
      console.error("Error getting random guest:", err);
      toast({
        title: "Error",
        description: "Failed to assign a guest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGuestSelected = (guest: Guest) => {
    setSelectedGuest(guest);
    
    if (randomGuest && guest.id === randomGuest.id) {
      const newFoundGuests = { ...allFoundGuests, [guest.id]: true };
      setAllFoundGuests(newFoundGuests);
      setScore(score + 1);
      
      // Get a new random guest
      getOrAssignRandomGuest();
    }
  };
  
  const handleResetGame = async () => {
    setAllFoundGuests({});
    setScore(0);
    await guestService.resetAllGuestAssignments(albumId);
    getOrAssignRandomGuest();
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
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="find" onValueChange={(value) => setGameMode(value as 'find' | 'list')}>
        <TabsList className="w-full">
          <TabsTrigger value="find" className="flex-1">
            <UserSearch className="mr-2 h-4 w-4" />
            Find a Guest
          </TabsTrigger>
          <TabsTrigger value="list" className="flex-1">Guest List</TabsTrigger>
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
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Button onClick={handleResetGame} variant="outline" className="sm:flex-1">Reset Game</Button>
                    <Button 
                      onClick={handleTakePhoto} 
                      className="bg-brand-blue hover:bg-brand-darkBlue sm:flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Take Photo
                    </Button>
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
      </Tabs>
      
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default FindGuestGame;
