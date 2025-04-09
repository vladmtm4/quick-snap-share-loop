
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FindGuestGame from "@/components/FindGuestGame";
import ModeratorTabs from "@/components/ModeratorTabs";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import PhotoUploader from "@/components/PhotoUploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const GamePage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  // For guest access mode, we'll assume every non-admin user is a guest
  const isGuestMode = true; // Non-admin users are always in guest mode
  
  useEffect(() => {
    async function loadAlbum() {
      if (!albumId) return;
      
      try {
        const albumData = await supabaseService.getAlbumById(albumId);
        setAlbum(albumData);
      } catch (error) {
        console.error("Error loading album:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbum();
  }, [albumId]);

  const handleClose = () => {
    // Navigate back to album page
    if (albumId) {
      navigate(`/album/${albumId}`);
    } else {
      navigate('/');
    }
  };
  
  const handleUploadComplete = () => {
    // Refresh the page or show a success message
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container max-w-3xl py-8 px-4 text-center">
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  if (!album) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container max-w-3xl py-8 px-4 text-center">
          <p>Album not found or you don't have access to it.</p>
        </div>
      </div>
    );
  }
  
  // If in guest mode, show a simplified version focused on photo uploads
  if (isGuestMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container max-w-lg py-8 px-4">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Photo Challenge</h1>
            <p className="text-gray-600">
              Take a fun photo with your assigned guest!
            </p>
          </div>
          
          <FindGuestGame albumId={album.id} onClose={handleClose} />
          
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Upload Photos</CardTitle>
                <CardDescription>
                  Add your photos to "{album.title}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoUploader 
                  album={album} 
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // For admin users (this won't be shown to guests with our current logic)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container max-w-3xl py-8 px-4">
        <ModeratorTabs album={album} currentTab="game" />
        <FindGuestGame albumId={album.id} onClose={handleClose} />
      </div>
    </div>
  );
};

export default GamePage;
