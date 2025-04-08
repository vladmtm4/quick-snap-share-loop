
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import PhotoUploader from "@/components/PhotoUploader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { Images } from "lucide-react";

const UploadPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!albumId) return;
    
    async function loadAlbum() {
      try {
        setLoading(true);
        const albumData = await supabaseService.getAlbumById(albumId);
        if (!albumData) {
          toast({
            title: "Album not found",
            description: "The album you're trying to upload to doesn't exist",
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
  
  const handleUploadComplete = () => {
    setUploadCount(prev => prev + 1);
    // After 3 uploads, prompt to view slideshow
    if (uploadCount + 1 >= 3) {
      toast({
        title: "Great uploads!",
        description: "Would you like to view the slideshow?",
        action: (
          <Button 
            onClick={() => navigate(`/slideshow/${albumId}`)}
            className="bg-brand-blue hover:bg-brand-darkBlue"
          >
            View Now
          </Button>
        ),
      });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Album not found</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />
      
      <div className="container max-w-lg py-8 px-4">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Add Photos</h1>
          <p className="text-gray-600">
            Upload your photos to "{album.title}"
          </p>
        </div>
        
        <PhotoUploader 
          album={album} 
          onUploadComplete={handleUploadComplete}
        />
        
        {uploadCount > 0 && (
          <div className="mt-8 text-center">
            <p className="mb-4 text-gray-600">
              {uploadCount} photo{uploadCount !== 1 ? 's' : ''} uploaded successfully!
            </p>
            
            <Button 
              onClick={() => navigate(`/slideshow/${albumId}`)}
              className="bg-brand-blue hover:bg-brand-darkBlue"
            >
              <Images className="mr-2 h-4 w-4" />
              View Slideshow
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
