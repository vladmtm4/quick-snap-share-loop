
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { supabase } from "@/integrations/supabase/client";
import { Photo, Album } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

interface PhotoGalleryProps {
  albumId: string;
  album?: Album;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ albumId, album }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingPhotoId(photoId);
    try {
      const success = await supabaseService.deletePhoto(photoId);
      if (success) {
        toast({
          title: "Photo deleted",
          description: "The photo has been permanently deleted",
        });
        // Photo will be automatically removed from UI via realtime subscription
      } else {
        throw new Error("Failed to delete photo");
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Error",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // Check if current user can delete photos (album owner)
  const canDeletePhotos = album && user && album.ownerId === user.id;
  
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
          <Card key={photo.id} className="overflow-hidden relative group">
            <CardContent className="p-0">
              <img
                src={photo.thumbnailUrl || photo.url}
                alt="Album photo"
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigate(`/slideshow/${albumId}`)}
              />
              {canDeletePhotos && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    disabled={deletingPhotoId === photo.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;
