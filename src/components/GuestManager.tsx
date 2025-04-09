import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { guestService } from '@/lib/guest-service';
import { Loader2, X, Check, UserPlus, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Guest } from '@/types';

interface GuestManagerProps {
  albumId: string;
}

const GuestManager: React.FC<GuestManagerProps> = ({ albumId }) => {
  const { toast } = useToast();
  const [newGuest, setNewGuest] = useState('');
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [adding, setAdding] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadGuests();
  }, [albumId]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const { data, error } = await guestService.getAllGuestsForAlbum(albumId);
      if (error) throw error;
      
      setGuests(data || []);
    } catch (error) {
      console.error('Error loading guests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load guests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.trim()) return;
    
    setAdding(true);
    try {
      const { data, error } = await guestService.addGuestToAlbum(albumId, {
        guestName: newGuest.trim(),
      });
      
      if (error) throw error;
      
      setNewGuest('');
      loadGuests();
      toast({
        title: 'Guest added',
        description: `${newGuest} was added to the guest list`,
      });
    } catch (error) {
      console.error('Error adding guest:', error);
      toast({
        title: 'Error',
        description: 'Failed to add guest',
        variant: 'destructive',
      });
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    setLoadingGuests(prev => ({ ...prev, [guestId]: true }));
    try {
      const { error } = await guestService.deleteGuest(guestId);
      if (error) throw error;
      
      loadGuests();
      toast({
        title: 'Guest removed',
        description: 'Guest was removed from the album',
      });
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove guest',
        variant: 'destructive',
      });
    } finally {
      setLoadingGuests(prev => ({ ...prev, [guestId]: false }));
    }
  };

  const handleApproveGuest = async (guestId: string) => {
    setLoadingGuests(prev => ({ ...prev, [guestId]: true }));
    try {
      const { error } = await guestService.approveGuest(guestId);
      if (error) throw error;
      
      loadGuests();
      toast({
        title: 'Guest approved',
        description: 'Guest was approved successfully',
      });
    } catch (error) {
      console.error('Error approving guest:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve guest',
        variant: 'destructive',
      });
    } finally {
      setLoadingGuests(prev => ({ ...prev, [guestId]: false }));
    }
  };

  const handleSendInvite = (guest: Guest) => {
    toast({
      title: 'Invite sent',
      description: `An invite was sent to ${guest.guestName}`,
    });
  };

  const approvedGuests = guests.filter(guest => guest.approved !== false);
  const pendingGuests = guests.filter(guest => guest.approved === false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New guest name"
          value={newGuest}
          onChange={(e) => setNewGuest(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
        />
        <Button onClick={handleAddGuest} disabled={adding || !newGuest.trim()}>
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </div>

      <Tabs defaultValue="approved">
        <TabsList className="w-full">
          <TabsTrigger value="approved" className="flex-1">
            Approved Guests ({approvedGuests.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending ({pendingGuests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="space-y-2 pt-2">
          {approvedGuests.length === 0 && !loading ? (
            <Card>
              <CardContent className="text-center py-6 text-muted-foreground">
                No approved guests yet
              </CardContent>
            </Card>
          ) : (
            approvedGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between border p-2 rounded-md"
              >
                <div className="truncate flex-1">{guest.guestName}</div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSendInvite(guest)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGuest(guest.id)}
                    disabled={loadingGuests[guest.id]}
                  >
                    {loadingGuests[guest.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-2 pt-2">
          {pendingGuests.length === 0 && !loading ? (
            <Card>
              <CardContent className="text-center py-6 text-muted-foreground">
                No pending guests
              </CardContent>
            </Card>
          ) : (
            pendingGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between border p-2 rounded-md"
              >
                <div className="truncate flex-1">{guest.guestName}</div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleApproveGuest(guest.id)}
                    disabled={loadingGuests[guest.id]}
                  >
                    {loadingGuests[guest.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGuest(guest.id)}
                    disabled={loadingGuests[guest.id]}
                  >
                    {loadingGuests[guest.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuestManager;
