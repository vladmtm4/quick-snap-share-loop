
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";
import { ArrowLeft } from "lucide-react";

const SlideshowPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!albumId) {
      console.error("Album ID is missing");
      navigate("/");
      return;
    }
    
    async function loadPhotos() {
      try {
        setLoading(true);
        console.log("SlideshowPage: Loading approved photos for album:", albumId);
        const approvedPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
        console.log("SlideshowPage: Approved photos loaded:", approvedPhotos.length);
        setPhotos(approvedPhotos);
      } catch (error) {
        console.error("Error loading photos:", error);
        toast({
          title: "Error",
          description: "Failed to load photos. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadPhotos();
  }, [albumId, navigate, toast]);
  
  const handleGoBack = () => {
    navigate(`/album/${albumId}`);
  };
  
  if (loading && photos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-white mb-4">Loading slideshow...</div>
        <Button variant="outline" onClick={handleGoBack} className="text-white border-white hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Album
        </Button>
      </div>
    );
  }
  
  return (
    <div className="slideshow-page">
      <Slideshow 
        photos={photos} 
        albumId={albumId || ""}
      />
    </div>
  );
};

export default SlideshowPage;
