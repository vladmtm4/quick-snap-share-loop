
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import FindGuestGame from "@/components/FindGuestGame";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";

const GamePage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container max-w-3xl py-8 px-4">
        <FindGuestGame albumId={album.id} />
      </div>
    </div>
  );
};

export default GamePage;
