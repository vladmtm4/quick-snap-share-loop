
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import AlbumCreationForm from "@/components/AlbumCreationForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from '@/components/ui/skeleton';

const HomePage: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    async function loadAlbums() {
      if (!user || authLoading) return;
      
      setLoading(true);
      try {
        console.log("HomePage: Loading albums");
        const allAlbums = await supabaseService.getAllAlbums();
        console.log("HomePage: All albums loaded:", allAlbums);
        setAlbums(allAlbums);
      } catch (error) {
        console.error("HomePage: Error loading albums:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbums();
  }, [user, authLoading]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container max-w-3xl py-8 px-4">
          <div className="mb-8 text-center prose prose-lg mx-auto">
            <h1 className="font-bold">QuickSnap</h1>
            <p>Create shared photo albums that everyone can contribute to</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container max-w-3xl py-8 px-4">
        <div className="mb-8 text-center prose prose-lg mx-auto">
          <h1 className="font-bold">QuickSnap</h1>
          <p>Create shared photo albums that everyone can contribute to</p>
        </div>
        
        {isAdmin && (
          <div className="mb-4 text-center">
            <Link to="/admin">
              <Button variant="outline">
                Go to Admin Dashboard
              </Button>
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : albums.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Albums</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {albums.map(album => (
                <Link 
                  key={album.id} 
                  to={`/album/${album.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow animate-fade-in">
                    <h3 className="font-medium text-lg">{album.title}</h3>
                    {album.description && (
                      <p className="prose-sm text-gray-500 line-clamp-2 mt-1">
                        {album.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="mr-2">
                        {new Date(album.createdAt).toLocaleDateString()}
                      </span>
                      {album.moderationEnabled && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          Moderated
                        </span>
                      )}
                      {album.isPrivate && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded ml-1">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : user ? (
          <div className="mb-8 text-center">
            <p className="text-gray-500 mb-4">No albums yet. Create your first album below!</p>
          </div>
        ) : null}
        
        {user && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Create a New Album</h2>
            <AlbumCreationForm />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
