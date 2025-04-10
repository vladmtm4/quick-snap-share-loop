import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Album, Photo, UploadResponse } from "@/types";
import { Database } from "@/integrations/supabase/types";

// Type aliases for Supabase tables
type AlbumsRow = Database['public']['Tables']['albums']['Row'];
type PhotosRow = Database['public']['Tables']['photos']['Row'];

export const supabaseService = {
  // Album methods
  async getAllAlbums(): Promise<Album[]> {
    console.log("Fetching albums for authenticated user");
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No authenticated user found");
      return [];
    }
    
    // First, check if the user is an admin
    const { data: profileData } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
      
    const isAdmin = profileData?.is_admin || false;
    
    let query = supabase
      .from('albums')
      .select('*');
      
    // If not admin, only show albums owned by the current user
    if (!isAdmin) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
    
    console.log("Albums fetched successfully:", data?.length || 0, "albums found");
    return (data || []).map(album => ({
      id: album.id,
      title: album.title,
      description: album.description || undefined,
      createdAt: album.created_at || '',
      moderationEnabled: album.moderation_enabled || false,
      isPrivate: album.is_private || false,
      ownerId: album.owner_id || album.user_id || undefined,
      guest_list: album.guest_list || undefined
    }));
  },
  
  async createAlbum(albumData: {
    title: string;
    description?: string;
    isPrivate?: boolean;
    moderationEnabled?: boolean;
    guest_list?: string[];
  }): Promise<Album> {
    console.log("Creating album with data:", albumData);
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error("You must be logged in to create an album");
    }
    
    // Create a new object with the data to insert
    const newAlbum = {
      title: albumData.title,
      description: albumData.description || null,
      is_private: albumData.isPrivate || false,
      moderation_enabled: albumData.moderationEnabled || false,
      guest_list: albumData.guest_list || null,
      created_at: new Date().toISOString(),
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
      throw new Error(error?.message || 'Failed to create album');
    }
    
    if (!data) {
      console.error('No data returned after creating album');
      throw new Error('Failed to create album - no data returned');
    }
    
    console.log("Album created successfully:", data);
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      createdAt: data.created_at || '',
      moderationEnabled: data.moderation_enabled || false,
      isPrivate: data.is_private || false,
      ownerId: data.owner_id || data.user_id || undefined,
      guest_list: data.guest_list || undefined
    };
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
