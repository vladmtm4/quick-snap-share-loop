
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
import { Upload, Camera, PlusCircle, Users, QrCode, Share } from "lucide-react";
import AlbumQRCode from "@/components/AlbumQRCode";
import AlbumShareLink from "@/components/AlbumShareLink";

function AlbumPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showModeration, setShowModeration] = useState(false);

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
        </div>
      </div>

      {showQRCode && <AlbumQRCode albumId={albumId || ""} />}

      <Tabs defaultValue="all" className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Photos</TabsTrigger>
          {album.moderationEnabled && album.ownerId === user?.id && (
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-2">
          {/* Photo gallery goes here */}
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
