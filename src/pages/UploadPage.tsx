
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PhotoUploader from "../components/PhotoUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { guestService } from "@/lib/guest-service";
import { Camera, User } from "lucide-react";
import Header from "@/components/Header";
import { Album } from "@/types";

const UploadPage = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [searchParams] = useSearchParams();
  const isSelfieMode = searchParams.get('selfie') === 'true';
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [isTakingSelfie, setIsTakingSelfie] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return;

      try {
        const albumData = await supabaseService.getAlbumById(albumId);
        setAlbum(albumData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching album:', error);
        setIsLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  const handleSelfieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestName || !albumId) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a guest record
      const response = await guestService.addGuestToAlbum(albumId, { guestName });
      
      if (response.error || !response.data) {
        toast({
          title: "Error",
          description: "Could not create guest record",
          variant: "destructive"
        });
        return;
      }
      
      // Redirect to the guest selfie share page
      window.location.href = `/guest/${albumId}/${response.data.id}`;
    } catch (error) {
      console.error('Error creating guest:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Album not found</h1>
          <p className="text-gray-500">The album you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // If in selfie mode, show a form to enter name and take selfie
  if (isSelfieMode) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="flex flex-col items-center max-w-md mx-auto mt-10">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">{album.title}</h1>
                <p className="text-gray-500">Find photos you appear in</p>
              </div>
              
              <form onSubmit={handleSelfieSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <input 
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Continue to Take Selfie
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular upload mode
  return (
    <div className="container mx-auto p-4">
      <Header />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{album.title}</h1>
        <p className="text-gray-500">Upload photos to this album</p>
      </div>
      
      <PhotoUploader albumId={albumId || ''} />
    </div>
  );
};

export default UploadPage;
