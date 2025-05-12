import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Slideshow from "@/components/Slideshow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SlideshowPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Function to load photos that can be called anytime we need fresh data
  const loadPhotos = useCallback(async () => {
    if (!albumId) {
      console.error("Album ID is missing");
      navigate("/");
      return;
    }
    
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
  }, [albumId, navigate, toast]);
  
  // Load initial photos
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);
  
  // Set up real-time listener for updates
  useEffect(() => {
    if (!albumId) return;
    console.log("SlideshowPage: Setting up real-time channel for album:", albumId);
    const channel = supabase.channel(`slideshow-${albumId}`)
      .on('postgres_changes', { schema: 'public', table: 'photos', event: 'INSERT', filter: `album_id=eq.${albumId}` }, ({ new: newRec }) => {
        console.log("SlideshowPage: New photo inserted", newRec);
        if (newRec.approved) {
          const photo: Photo = {
            id: newRec.id,
            albumId: newRec.album_id,
            url: newRec.url,
            thumbnailUrl: newRec.thumbnail_url,
            createdAt: newRec.created_at,
            approved: newRec.approved,
            metadata: newRec.metadata,
          };
          setPhotos(prev => {
            const arr = [...prev];
            arr.splice(Math.floor(Math.random() * (arr.length + 1)), 0, photo);
            return arr;
          });
          toast({ title: 'New Photo', description: 'Photo uploaded' });
        }
      })
      .on('postgres_changes', { schema: 'public', table: 'photos', event: 'UPDATE', filter: `album_id=eq.${albumId}` }, ({ old: oldRec, new: newRec }) => {
        if (oldRec && !oldRec.approved && newRec.approved) {
          const photo: Photo = {
            id: newRec.id,
            albumId: newRec.album_id,
            url: newRec.url,
            thumbnailUrl: newRec.thumbnail_url,
            createdAt: newRec.created_at,
            approved: newRec.approved,
            metadata: newRec.metadata,
          };
          setPhotos(prev => {
            const arr = [...prev];
            arr.splice(Math.floor(Math.random() * (arr.length + 1)), 0, photo);
            return arr;
          });
          toast({ title: 'Photo Approved', description: 'Photo approved and added' });
        }
      })
      .on('postgres_changes', { schema: 'public', table: 'photos', event: 'DELETE', filter: `album_id=eq.${albumId}` }, ({ old }) => {
        setPhotos(prev => prev.filter(p => p.id !== old?.id));
      })
      .subscribe();
    return () => {
      console.log("SlideshowPage: Removing real-time channel");
      supabase.removeChannel(channel);
    };
  }, [albumId, toast]);
  
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
        interval={5000}
      />
    </div>
  );
};

export default SlideshowPage;
