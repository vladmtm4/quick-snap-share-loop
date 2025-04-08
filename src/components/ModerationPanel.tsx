
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Photo } from "@/types";

interface ModerationPanelProps {
  albumId: string;
  pendingPhotos: Photo[];
  onPhotoApproved: () => void;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ 
  albumId, 
  pendingPhotos,
  onPhotoApproved
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPhotoId, setProcessingPhotoId] = useState<string | null>(null);
  const { toast } = useToast();
  
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
      
      onPhotoApproved();
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
  
  if (pendingPhotos.length === 0) {
    return null;
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
