
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import AlbumQRCode from "@/components/AlbumQRCode";
import ModerationPanel from "@/components/ModerationPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { dbService } from "@/lib/db-service";
import { Album, Photo } from "@/types";
import { Images, QrCode, Share } from "lucide-react";

const AlbumPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [activeTab, setActiveTab] = useState("gallery");
  
  useEffect(() => {
    if (!albumId) return;
    
    // Get album data
    const albumData = dbService.getAlbumById(albumId);
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
    
    // Load photos
    loadPhotos();
  }, [albumId, navigate, toast]);
  
  const loadPhotos = () => {
    if (!albumId) return;
    
    const allPhotos = dbService.getPhotosByAlbumId(albumId);
    const approved = allPhotos.filter(p => p.approved);
    const pending = allPhotos.filter(p => !p.approved);
    
    setPhotos(approved);
    setPendingPhotos(pending);
  };
  
  const handlePhotoModerated = () => {
    loadPhotos();
  };
  
  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />
      
      <div className="container max-w-3xl py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{album.title}</h1>
          {album.description && (
            <p className="text-gray-600">{album.description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button 
            onClick={() => navigate(`/slideshow/${album.id}`)}
            className="bg-brand-blue hover:bg-brand-darkBlue"
            disabled={photos.length === 0}
          >
            <Images className="mr-2 h-4 w-4" />
            View Slideshow
          </Button>
          
          <Button 
            onClick={() => navigate(`/upload/${album.id}`)}
            variant="outline"
          >
            <Share className="mr-2 h-4 w-4" />
            Upload Page
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="share">Share Album</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery" className="space-y-6 mt-4">
            {album.moderationEnabled && pendingPhotos.length > 0 && (
              <ModerationPanel 
                albumId={album.id}
                pendingPhotos={pendingPhotos}
                onPhotoApproved={handlePhotoModerated}
              />
            )}
            
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-black rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.thumbnailUrl}
                      alt="Album"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No photos in this album yet.</p>
                <Button 
                  onClick={() => navigate(`/upload/${album.id}`)}
                  className="bg-brand-blue hover:bg-brand-darkBlue"
                >
                  Add Photos
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="share" className="mt-4">
            <AlbumQRCode albumId={album.id} title={album.title} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AlbumPage;
