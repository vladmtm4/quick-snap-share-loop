
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import AlbumCreationForm from "@/components/AlbumCreationForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabaseService } from "@/lib/supabase-service";
import { Album } from "@/types";

const HomePage: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadAlbums() {
      setLoading(true);
      try {
        const allAlbums = await supabaseService.getAllAlbums();
        console.log("All albums loaded:", allAlbums);
        setAlbums(allAlbums);
      } catch (error) {
        console.error("Error loading albums:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadAlbums();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container max-w-3xl py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">QuickSnap</h1>
          <p className="text-lg text-gray-600">
            Create shared photo albums that everyone can contribute to
          </p>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <p>Loading albums...</p>
          </div>
        ) : albums.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Albums</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {albums.map(album => (
                <Link 
                  key={album.id} 
                  to={`/album/${album.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-lg">{album.title}</h3>
                    {album.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
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
        ) : (
          <div className="mb-8 text-center">
            <p className="text-gray-500 mb-4">No albums yet. Create your first album below!</p>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Create a New Album</h2>
          <AlbumCreationForm />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
