import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Album, Photo, UploadResponse } from "@/types";
import { Database } from "@/integrations/supabase/types";
import { fetchProfile } from "@/types/supabase-types";

// Type aliases for Supabase tables
type AlbumsRow = Database['public']['Tables']['albums']['Row'];
type PhotosRow = Database['public']['Tables']['photos']['Row'];

export const supabaseService = {
  // Album methods
  async getAllAlbums(): Promise<Album[]> {
    console.log("supabaseService: Fetching albums for authenticated user");
    
    try {
      // Get the current user (simplified)
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      
      if (!userId) {
        console.error("supabaseService: No authenticated user found");
        return [];
      }
      
      console.log("supabaseService: Found user ID:", userId);
      
      // Try to check if the user is an admin (simplified)
      let isAdmin = false;
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userId)
          .single();
        
        isAdmin = !!profileData?.is_admin;
      } catch (error) {
        console.warn('supabaseService: Could not check admin status, defaulting to false');
      }
      
      console.log("supabaseService: User is admin:", isAdmin);
      
      // Query albums
      let query = supabase.from('albums').select('*');
      
      // Filter by user ID if not admin
      if (!isAdmin) {
        query = query.eq('user_id', userId);
      }
      
      // Execute query
      const { data: albums, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('supabaseService: Error fetching albums:', error.message);
        return [];
      }
      
      // Always return an array even if data is null
      const albumsList = albums || [];
      console.log("supabaseService: Successfully fetched", albumsList.length, "albums");
      
      // Transform to our Album type
      return albumsList.map(album => ({
        id: album.id,
        title: album.title,
        description: album.description || undefined,
        createdAt: album.created_at || '',
        moderationEnabled: album.moderation_enabled || false,
        isPrivate: album.is_private || false,
        ownerId: album.user_id || undefined,
        guest_list: album.guest_list || undefined
      }));
    } catch (error) {
      console.error('supabaseService: Unexpected error in getAllAlbums:', error);
      return [];
    }
  },
  
  async createAlbum(albumData: {
    title: string;
    description?: string;
    isPrivate?: boolean;
    moderationEnabled?: boolean;
    guest_list?: string[];
  }): Promise<{ data: Album | null, error: Error | null }> {
    console.log("Creating album with data:", albumData);
    
    try {
      // Get the current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        return {
          data: null, 
          error: new Error("You must be logged in to create an album")
        };
      }
      
      // Create a new object with the data to insert
      const newAlbum = {
        title: albumData.title,
        description: albumData.description || null,
        is_private: albumData.isPrivate || false,
        moderation_enabled: albumData.moderationEnabled || false,
        guest_list: albumData.guest_list || null,
        user_id: userId
      };
      
      console.log("Inserting album:", newAlbum);
      
      const { data, error } = await supabase
        .from('albums')
        .insert(newAlbum)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating album:', error);
        return {
          data: null,
          error: new Error(error.message || 'Failed to create album')
        };
      }
      
      if (!data) {
        console.error('No data returned after creating album');
        return {
          data: null,
          error: new Error('Failed to create album - no data returned')
        };
      }
      
      console.log("Album created successfully:", data);
      
      const album: Album = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        createdAt: data.created_at || '',
        moderationEnabled: data.moderation_enabled || false,
        isPrivate: data.is_private || false,
        ownerId: data.user_id || undefined,
        guest_list: data.guest_list || undefined
      };
      
      return { data: album, error: null };
    } catch (error: any) {
      console.error('Error in album creation:', error);
      return { data: null, error };
    }
  },
  
  async getAlbumById(id: string): Promise<Album | null> {
    if (!id) {
      console.error("Cannot fetch album: ID is missing or empty");
      return null;
    }
    
    console.log("Fetching album with ID:", id);
    
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching album:', error);
      return null;
    }
    
    if (!data) {
      console.error('Album not found with ID:', id);
      return null;
    }
    
    const album: Album = {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      createdAt: data.created_at || '',
      moderationEnabled: data.moderation_enabled || false,
      isPrivate: data.is_private || false,
      ownerId: data.owner_id || data.user_id || undefined,
      guest_list: data.guest_list || undefined
    };
    
    console.log("Album fetched successfully:", album);
    return album;
  },
  
  async updateAlbumGuestList(albumId: string, guestList: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ guest_list: guestList })
        .eq('id', albumId);
      
      if (error) {
        console.error('Error updating guest list:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating guest list:', error);
      return false;
    }
  },
  
  // Photo methods
  async getPhotosByAlbumId(albumId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId);
    
    if (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
    
    return (data || []).map(photo => ({
      id: photo.id,
      albumId: photo.album_id,
      url: photo.url,
      thumbnailUrl: photo.thumbnail_url,
      createdAt: photo.created_at || '',
      approved: photo.approved || false,
      metadata: photo.metadata ? photo.metadata as Photo['metadata'] : null
    }));
  },
  
  async getApprovedPhotosByAlbumId(albumId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('album_id', albumId)
      .eq('approved', true);
    
    if (error) {
      console.error('Error fetching approved photos:', error);
      return [];
    }
    
    return (data || []).map(photo => ({
      id: photo.id,
      albumId: photo.album_id,
      url: photo.url,
      thumbnailUrl: photo.thumbnail_url,
      createdAt: photo.created_at || '',
      approved: photo.approved || false,
      metadata: photo.metadata ? photo.metadata as Photo['metadata'] : null
    }));
  },
  
  async addPhoto(photoData: { 
    albumId: string; 
    url: string; 
    thumbnailUrl: string; 
    approved?: boolean;
    metadata?: any;
  }): Promise<UploadResponse> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert({
          album_id: photoData.albumId,
          url: photoData.url,
          thumbnail_url: photoData.thumbnailUrl,
          approved: photoData.approved ?? true,
          metadata: photoData.metadata || null
        })
        .select()
        .single();
      
      if (error || !data) throw error;
      
      const photo: Photo = {
        id: data.id,
        albumId: data.album_id,
        url: data.url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at || '',
        approved: data.approved || false,
        metadata: data.metadata ? data.metadata as Photo['metadata'] : null
      };
      
      return {
        success: true,
        photo
      };
    } catch (error) {
      console.error('Error adding photo:', error);
      return {
        success: false,
        error: 'Failed to upload photo'
      };
    }
  },
  
  async moderatePhoto(photoId: string, approved: boolean): Promise<Photo | null> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ approved })
        .eq('id', photoId)
        .select()
        .single();
      
      if (error || !data) throw error;
      
      return {
        id: data.id,
        albumId: data.album_id,
        url: data.url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at || '',
        approved: data.approved || false,
        metadata: data.metadata ? data.metadata as Photo['metadata'] : null
      };
    } catch (error) {
      console.error('Error moderating photo:', error);
      return null;
    }
  },
  
  // Fixed method to add guest to photo metadata with proper type handling
  async addGuestToPhoto(photoId: string, guestId: string): Promise<boolean> {
    try {
      // First get the current photo
      const { data: photo, error: getError } = await supabase
        .from('photos')
        .select('metadata')
        .eq('id', photoId)
        .single();
      
      if (getError || !photo) {
        console.error("Error getting photo metadata:", getError);
        return false;
      }
      
      // Initialize metadata as a new object if null or not an object
      let metadata: Record<string, any> = {};
      
      // Check if photo.metadata is a valid object
      if (photo.metadata && typeof photo.metadata === 'object' && !Array.isArray(photo.metadata)) {
        metadata = photo.metadata as Record<string, any>;
      }
      
      // Ensure guestIds is an array
      const guestIds: string[] = Array.isArray(metadata.guestIds) ? 
        metadata.guestIds as string[] : [];
      
      // Only add if not already present
      if (!guestIds.includes(guestId)) {
        guestIds.push(guestId);
      }
      
      const newMetadata = {
        ...metadata,
        guestIds
      };
      
      // Update the photo
      const { error: updateError } = await supabase
        .from('photos')
        .update({ metadata: newMetadata })
        .eq('id', photoId);
      
      if (updateError) {
        console.error("Error updating photo metadata:", updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error adding guest to photo:", error);
      return false;
    }
  },

  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      // First get the photo data to get file paths for storage cleanup
      const { data: photo, error: getError } = await supabase
        .from('photos')
        .select('url, thumbnail_url')
        .eq('id', photoId)
        .single();
      
      if (getError || !photo) {
        console.error("Error getting photo data:", getError);
        return false;
      }
      
      // Delete the photo record from database
      const { error: deleteError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      
      if (deleteError) {
        console.error("Error deleting photo from database:", deleteError);
        return false;
      }
      
      // Extract file paths from URLs for storage cleanup
      const extractStoragePath = (url: string): string | null => {
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const storageIndex = pathParts.findIndex(part => part === 'storage');
          if (storageIndex !== -1 && pathParts[storageIndex + 2] === 'photos') {
            return pathParts.slice(storageIndex + 3).join('/');
          }
        } catch (error) {
          console.error("Error parsing URL:", error);
        }
        return null;
      };
      
      // Clean up storage files
      const mainFilePath = extractStoragePath(photo.url);
      const thumbnailFilePath = extractStoragePath(photo.thumbnail_url);
      
      if (mainFilePath) {
        await supabase.storage.from('photos').remove([mainFilePath]);
      }
      
      if (thumbnailFilePath && thumbnailFilePath !== mainFilePath) {
        await supabase.storage.from('photos').remove([thumbnailFilePath]);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting photo:", error);
      return false;
    }
  },

  async togglePhotoVisibility(photoId: string): Promise<boolean> {
    try {
      // First get the current approval status
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('approved')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        console.error('Error fetching photo:', fetchError);
        return false;
      }

      // Toggle the approval status
      const { error: updateError } = await supabase
        .from('photos')
        .update({ approved: !photo.approved })
        .eq('id', photoId);

      if (updateError) {
        console.error('Error updating photo visibility:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in togglePhotoVisibility:', error);
      return false;
    }
  },

  async getAllPhotosByAlbumId(albumId: string): Promise<Photo[]> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all photos:', error);
        return [];
      }

      return (data || []).map(photo => ({
        id: photo.id,
        albumId: photo.album_id,
        url: photo.url,
        thumbnailUrl: photo.thumbnail_url,
        createdAt: photo.created_at || '',
        approved: photo.approved || false,
        metadata: photo.metadata ? photo.metadata as Photo['metadata'] : null
      }));
    } catch (error) {
      console.error('Error in getAllPhotosByAlbumId:', error);
      return [];
    }
  },
  
  // Storage methods
  async uploadImageToStorage(albumId: string, file: File): Promise<{ url: string, thumbnailUrl: string } | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${albumId}/${uuidv4()}.${fileExt}`;
      const thumbnailName = `${albumId}/${uuidv4()}_thumbnail.${fileExt}`;
      
      // Upload original file
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);
      
      // For this example, we'll use the same file for thumbnail
      // In a real app, you'd generate an actual thumbnail
      const { error: thumbError } = await supabase.storage
        .from('photos')
        .upload(thumbnailName, file);
        
      if (thumbError) throw thumbError;
      
      const { data: thumbUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(thumbnailName);
      
      return {
        url: urlData.publicUrl,
        thumbnailUrl: thumbUrlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }
};
