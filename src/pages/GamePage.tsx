
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FindGuestGame from "@/components/FindGuestGame";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n";

const GamePage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!albumId) {
      toast({
        title: "Error",
        description: "Album ID is missing",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    async function loadAlbum() {
      try {
        setLoading(true);
        const albumData = await supabaseService.getAlbumById(albumId);
        
        if (!albumData) {
          toast({
            title: "Album not found",
            description: "The album you're looking for doesn't exist",
            variant: "destructive"
          });
          navigate("/");
          return;
        }
        
        setAlbum(albumData);
      } catch (error) {
        console.error("Error loading album:", error);
        toast({
          title: "Error",
          description: "Failed to load album data",
          variant: "destructive"
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbum();
  }, [albumId, navigate, toast]);
  
  const handleClose = () => {
    navigate(`/album/${albumId}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton />
        <div className="container max-w-3xl py-8 px-4">
          <p className="text-center">{translate("loading")}</p>
        </div>
      </div>
    );
  }
  
  if (!album) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header showBackButton />
        <div className="container max-w-3xl py-8 px-4">
          <p className="text-center">Album not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton hideAuthButtons />
      <div className="container max-w-3xl py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {translate("photoGame")}
        </h1>
        <FindGuestGame albumId={album.id} onClose={handleClose} />
      </div>
    </div>
  );
};

export default GamePage;
