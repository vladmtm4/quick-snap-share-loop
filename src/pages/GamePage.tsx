
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import FindGuestGame from "@/components/FindGuestGame";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n";
import { Camera } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header showBackButton />
        <div className="container max-w-3xl py-12 px-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-blue-600 font-medium">{translate("loading")}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header showBackButton />
        <div className="container max-w-3xl py-12 px-4 text-center">
          <p className="text-gray-600">Album not found</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header showBackButton hideAuthButtons />
      <div className="container max-w-3xl py-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            {translate("photoGame")}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Find other guests and take photos together to earn points!
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <FindGuestGame albumId={album.id} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
};

export default GamePage;
