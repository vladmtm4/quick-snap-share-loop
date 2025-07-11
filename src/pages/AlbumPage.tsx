
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Album } from "@/types";
import { supabaseService } from "@/lib/supabase-service";
import Header from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ModerationPanel from "@/components/ModerationPanel";
import { Upload, Camera, PlusCircle, Users, QrCode, Share, UserPlus, Download } from "lucide-react";
import AlbumQRCode from "@/components/AlbumQRCode";
import AlbumShareLink from "@/components/AlbumShareLink";
import GuestRegistration from "@/components/GuestRegistration";
import GuestRegistrationLink from "@/components/GuestRegistrationLink";
import PhotoGallery from "@/components/PhotoGallery";

function AlbumPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [showGuestRegistration, setShowGuestRegistration] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) {
        setError("No album ID provided");
        setLoading(false);
        return;
      }

      try {
        const albumData = await supabaseService.getAlbumById(albumId);
        if (albumData) {
          setAlbum(albumData);
        } else {
          setError("Album not found");
        }
      } catch (err) {
        console.error("Error fetching album:", err);
        setError("Error fetching album");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  const handleDownloadAll = async () => {
    if (!albumId) return;
    
    setDownloading(true);
    try {
      const photos = await supabaseService.getAllPhotosByAlbumId(albumId);
      
      if (photos.length === 0) {
        alert("No photos to download");
        return;
      }

      // Download each photo
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        try {
          const response = await fetch(photo.url);
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Extract file extension from URL or default to jpg
          const urlParts = photo.url.split('.');
          const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';
          
          link.download = `${album?.title || 'album'}_photo_${i + 1}.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          // Small delay between downloads to avoid overwhelming the browser
          if (i < photos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error downloading photo ${i + 1}:`, error);
        }
      }
      
      alert(`Started download of ${photos.length} photos`);
    } catch (error) {
      console.error("Error downloading photos:", error);
      alert("Error downloading photos. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-gray-500">{error || "Unknown error"}</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Header />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          {album.description && (
            <p className="text-gray-500 mt-1">{album.description}</p>
          )}
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button
            onClick={() => navigate(`/upload/${albumId}`)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Photos
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(`/slideshow/${albumId}`)}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Slideshow
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowQRCode(!showQRCode)}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
          
          <AlbumShareLink albumId={albumId || ''} />
          
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            disabled={downloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Downloading..." : "Download All"}
          </Button>
          
          {album.ownerId === user?.id && (
            <Button
              variant="outline"
              onClick={() => navigate(`/guests/${albumId}`)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Guests
            </Button>
          )}

          {album.ownerId === user?.id && album.moderationEnabled && (
            <Button
              variant="outline"
              onClick={() => navigate(`/game/${albumId}`)}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Photo Game
            </Button>
          )}

          <GuestRegistrationLink albumId={albumId || ""} />
          
          <Button
            variant="outline"
            onClick={() => setShowGuestRegistration(!showGuestRegistration)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Register as Guest
          </Button>
        </div>
      </div>

      {showGuestRegistration && (
        <div className="mb-6">
          <GuestRegistration albumId={albumId || ""} />
        </div>
      )}

      {showQRCode && <AlbumQRCode albumId={albumId || ""} />}

      <Tabs defaultValue="all" className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Photos</TabsTrigger>
          {album.moderationEnabled && album.ownerId === user?.id && (
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-2">
          <PhotoGallery albumId={albumId || ""} album={album} />
        </TabsContent>

        {album.moderationEnabled && album.ownerId === user?.id && (
          <TabsContent value="moderation" className="mt-2">
            <ModerationPanel 
              albumId={albumId || ""} 
              onClose={() => setShowModeration(false)}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default AlbumPage;
