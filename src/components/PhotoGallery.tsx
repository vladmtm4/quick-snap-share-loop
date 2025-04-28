
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { supabase } from "@/integrations/supabase/client";
import { Photo } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PhotoGalleryProps {
  albumId: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ albumId }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const approvedPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
      console.log(`PhotoGallery: Loaded ${approvedPhotos.length} approved photos`);
      setPhotos(approvedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
      toast({
        title: "Error",
        description: "Failed to load photos. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [albumId, toast]);
  
  useEffect(() => {
    loadPhotos();
    
    // Set up a subscription to watch for new photos
    const channel = supabase
      .channel('photos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("PhotoGallery: New photo inserted:", payload);
          if (payload.new && payload.new.approved === true) {
            // Add the new photo to the list if it's already approved
            const newPhoto: Photo = {
              id: payload.new.id,
              albumId: payload.new.album_id,
              url: payload.new.url,
              thumbnailUrl: payload.new.thumbnail_url,
              createdAt: payload.new.created_at,
              approved: payload.new.approved,
              metadata: payload.new.metadata,
            };
            setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("PhotoGallery: Photo updated:", payload);
          // If photo was just approved, add it to the gallery
          if (payload.new && payload.old && !payload.old.approved && payload.new.approved) {
            const newPhoto: Photo = {
              id: payload.new.id,
              albumId: payload.new.album_id,
              url: payload.new.url,
              thumbnailUrl: payload.new.thumbnail_url,
              createdAt: payload.new.created_at,
              approved: payload.new.approved,
              metadata: payload.new.metadata,
            };
            setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
          } 
          // If photo was unapproved, remove it from the gallery
          else if (payload.new && payload.old && payload.old.approved && !payload.new.approved) {
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== payload.new.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'photos',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          console.log("PhotoGallery: Photo deleted:", payload);
          // Remove the deleted photo from the list
          if (payload.old) {
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [albumId, loadPhotos]);
  
  const handleViewSlideshow = () => {
    navigate(`/slideshow/${albumId}`);
  };
  
  if (loading && photos.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (photos.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 mb-4">No photos in this album yet.</p>
        <Button onClick={() => navigate(`/upload/${albumId}`)}>Upload Photos</Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" className="flex items-center gap-2" onClick={handleViewSlideshow}>
          <Eye className="h-4 w-4" />
          View as Slideshow
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <CardContent className="p-0">
              <img
                src={photo.thumbnailUrl || photo.url}
                alt="Album photo"
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigate(`/slideshow/${albumId}`)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;
