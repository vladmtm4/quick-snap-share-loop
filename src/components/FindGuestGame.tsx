
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabaseService } from '@/lib/supabase-service';
import { useLanguage } from '@/lib/i18n';

// Define a Guest type to ensure proper typings
interface Guest {
  id: string;
  albumId: string;
  guestName: string;
  email?: string;
  phone?: string;
  approved?: boolean;
}

interface FindGuestGameProps {
  albumId: string;
  onClose: () => void;
}

const FindGuestGame: React.FC<FindGuestGameProps> = ({ albumId, onClose }) => {
  const navigate = useNavigate();
  const { translate } = useLanguage();
  
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
        const { data, error } = await supabaseService.getAllGuestsForAlbum(albumId);
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Convert data to proper Guest type
        const guestsList: Guest[] = data.map((item: any) => ({
          id: item.id,
          albumId: item.albumId,
          guestName: item.guestName || '',
          email: item.email || '',
          phone: item.phone || '',
          approved: item.approved
        }));
        
        setGuestData(guestsList);
        pickRandomGuest(guestsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuests();
  }, [albumId]);
  
  const pickRandomGuest = (guests: Guest[]) => {
    if (guests.length === 0) return;
    
    const approvedGuests = guests.filter(guest => guest.approved !== false);
    if (approvedGuests.length === 0) {
      setRandomGuest(null);
      return;
    }
    
    // Filter out already found guests if possible
    const notFoundGuests = approvedGuests.filter(g => !allFoundGuests[g.id]);
    
    if (notFoundGuests.length === 0) {
      // All guests have been found, reset or end game
      setAllFoundGuests({});
      setRandomGuest(approvedGuests[Math.floor(Math.random() * approvedGuests.length)]);
    } else {
      setRandomGuest(notFoundGuests[Math.floor(Math.random() * notFoundGuests.length)]);
    }
  };
  
  const handleGuestSelected = (guest: Guest) => {
    setSelectedGuest(guest);
    
    if (randomGuest && guest.id === randomGuest.id) {
      // Correct guess
      const newFoundGuests = { ...allFoundGuests, [guest.id]: true };
      setAllFoundGuests(newFoundGuests);
      setScore(score + 1);
      
      // Pick next guest
      pickRandomGuest(guestData);
    }
  };
  
  const handleResetGame = () => {
    setAllFoundGuests({});
    setScore(0);
    pickRandomGuest(guestData);
  };
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="find" onValueChange={(value) => setGameMode(value as 'find' | 'list')}>
        <TabsList className="w-full">
          <TabsTrigger value="find" className="flex-1">Find a Guest</TabsTrigger>
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
                  <Button onClick={handleResetGame} variant="outline">Reset Game</Button>
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
