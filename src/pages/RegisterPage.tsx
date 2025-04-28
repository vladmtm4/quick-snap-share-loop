
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";
import GuestRegistration from "@/components/GuestRegistration";
import { supabaseService } from "@/lib/supabase-service";

function RegisterPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const [isRegistered, setIsRegistered] = useState(false);
  const [albumTitle, setAlbumTitle] = useState<string>("");

  React.useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return;
      const album = await supabaseService.getAlbumById(albumId);
      if (album) {
        setAlbumTitle(album.title);
      }
    };
    fetchAlbum();
  }, [albumId]);

  if (isRegistered) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <PartyPopper className="w-12 h-12 mx-auto text-green-500" />
              <CardTitle className="text-2xl">Registration Complete!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for registering for the photo-finding game at {albumTitle}! We look forward to seeing you at the reception.
              </CardDescription>
              <p className="text-sm text-muted-foreground">
                Don't forget to bring your phone to participate in the game during the reception!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {albumId && <GuestRegistration albumId={albumId} onRegistrationComplete={() => setIsRegistered(true)} />}
    </div>
  );
}

export default RegisterPage;
