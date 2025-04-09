import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Upload, 
  Play, 
  QrCode, 
  Settings, 
  Users,
  Trophy 
} from "lucide-react";
import Header from "@/components/Header";
import { Album, Photo } from "@/types";
import { supabaseService } from "@/lib/supabase-service";
import { useLanguage } from "@/lib/i18n";

const AlbumPage: React.FC = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translate } = useLanguage();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [activeTab, setActiveTab] = useState("gallery");
  const [loading, setLoading] = useState(true);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
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
    
    async function loadAlbumData() {
      setLoading(true);
      try {
        const albumData = await supabaseService.getAlbumById(albumId);
        console.log("Album data:", albumData);
        
        if (!albumData) {
          console.error("Album not found for ID:", albumId);
          toast({
            title: "Album not found",
            description: "The album you're looking for doesn't exist",
            variant: "destructive"
          });
          navigate("/");
          return;
        }
        
        setAlbum(albumData);
        
        await loadPhotos();
      } catch (error) {
        console.error("Error loading album:", error);
        toast({
          title: "Error",
          description: "Failed to load album data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbumData();
  }, [albumId, navigate, toast]);
  
  const loadPhotos = async () => {
    if (!albumId) return;
    
    try {
      const allPhotos = await supabaseService.getPhotosByAlbumId(albumId);
      console.log("All photos:", allPhotos);
      
      const approved = allPhotos.filter(p => p.approved);
      const pending = allPhotos.filter(p => !p.approved);
      
      setPhotos(approved);
      setPendingPhotos(pending);
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };
  
  const handlePhotoModerated = () => {
    loadPhotos();
  };
  
  const handleShowQRCode = () => {
    setShowQRCode(true);
  };
  
  const handleOpenModeration = () => {
    setModerationOpen(true);
  };
  
  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
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
      
      <div className="container max-w-4xl py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{album.title}</h1>
            {album.description && (
              <p className="text-gray-500 mt-1">{album.description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-1">
              <Link to={`/upload/${album.id}`}>
                <Upload className="h-4 w-4" /> 
                {translate("uploadPhotos")}
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="gap-1">
              <Link to={`/slideshow/${album.id}`}>
                <Play className="h-4 w-4" /> 
                {translate("slideshow")}
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Button 
            variant="outline" 
            size="lg"
            className="flex flex-col items-center justify-center h-24 gap-2"
            asChild
          >
            <Link to={`/game/${album.id}`}>
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>{translate("photoGame")}</span>
            </Link>
          </Button>

          <Button 
            variant="outline" 
            size="lg"
            className="flex flex-col items-center justify-center h-24 gap-2"
            asChild
          >
            <Link to={`/guests/${album.id}`}>
              <Users className="h-6 w-6 text-blue-500" />
              <span>{translate("guestManagement")}</span>
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="flex flex-col items-center justify-center h-24 gap-2"
            onClick={handleShowQRCode}
          >
            <QrCode className="h-6 w-6 text-purple-500" />
            <span>{translate("shareQR")}</span>
          </Button>
          
          {album.moderationEnabled && (
            <Button 
              variant="outline" 
              size="lg"
              className="flex flex-col items-center justify-center h-24 gap-2"
              onClick={handleOpenModeration}
            >
              <Settings className="h-6 w-6 text-gray-500" />
              <span>{translate("moderation")}</span>
            </Button>
          )}
        </div>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{translate("loading")}</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <Camera className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium mb-2">
              {translate("noPhotosYet")}
            </h2>
            <p className="text-gray-500 mb-4">
              {translate("beTheFirst")}
            </p>
            <Button asChild>
              <Link to={`/upload/${album.id}`}>
                <Upload className="h-4 w-4 mr-2" />
                {translate("uploadPhotos")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div 
                key={photo.id} 
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handlePhotoClick(photo)}
              >
                <img 
                  src={photo.thumbnailUrl} 
                  alt="Album photo" 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        
        {moderationOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-4 border-b sticky top-0 bg-white flex justify-between items-center">
                <h2 className="text-lg font-bold">{translate("moderation")}</h2>
                <Button variant="ghost" size="icon" onClick={() => setModerationOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <ModerationPanel albumId={album.id} onClose={() => setModerationOpen(false)} />
            </div>
          </div>
        )}
        
        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-sm text-center p-6">
              <h2 className="text-lg font-bold mb-4">{translate("scanToJoin")}</h2>
              <div className="mb-4">
                <AlbumQRCode albumId={album.id} size={200} />
              </div>
              <Button onClick={() => setShowQRCode(false)}>
                {translate("close")}
              </Button>
            </div>
          </div>
        )}
        
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <img 
              src={selectedPhoto.url} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumPage;
