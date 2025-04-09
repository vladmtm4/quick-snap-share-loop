
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";

interface ModerationPanelProps {
  albumId: string;
  onClose: () => void;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ 
  albumId, 
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPhotoId, setProcessingPhotoId] = useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadPendingPhotos = async () => {
      try {
        setLoading(true);
        const allPhotos = await supabaseService.getPhotosByAlbumId(albumId);
        const pending = allPhotos.filter(p => !p.approved);
        setPendingPhotos(pending);
      } catch (error) {
        console.error("Error loading pending photos:", error);
        toast({
          title: "Error",
          description: "Failed to load pending photos",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadPendingPhotos();
  }, [albumId, toast]);
  
  const handleAction = async (photoId: string, approved: boolean) => {
    setIsSubmitting(true);
    setProcessingPhotoId(photoId);
    
    try {
      await supabaseService.moderatePhoto(photoId, approved);
      
      toast({
        title: approved ? "Photo approved" : "Photo rejected",
        description: approved 
          ? "The photo will now appear in the slideshow" 
          : "The photo has been rejected"
      });
      
      // Update the local state to remove the moderated photo
      setPendingPhotos(prev => prev.filter(p => p.id !== photoId));
      
      // If no more photos to moderate, close the panel
      if (pendingPhotos.length === 1) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error("Error moderating photo:", error);
      toast({
        title: "Error",
        description: "Failed to moderate photo",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setProcessingPhotoId(null);
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full animate-fade-in">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading photos...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (pendingPhotos.length === 0) {
    return (
      <Card className="w-full animate-fade-in">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No photos pending moderation</p>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full animate-fade-in">
      <CardHeader>
        <CardTitle>Moderation Panel</CardTitle>
        <CardDescription>
          {pendingPhotos.length} photo{pendingPhotos.length !== 1 ? 's' : ''} pending review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingPhotos.map((photo) => (
            <div key={photo.id} className="border rounded-lg p-4 space-y-4">
              <div className="aspect-square bg-black rounded-md overflow-hidden">
                <img 
                  src={photo.url} 
                  alt="Pending photo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAction(photo.id, false)}
                  disabled={isSubmitting && processingPhotoId === photo.id}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-brand-blue hover:bg-brand-darkBlue"
                  onClick={() => handleAction(photo.id, true)}
                  disabled={isSubmitting && processingPhotoId === photo.id}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModerationPanel;
