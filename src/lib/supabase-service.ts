
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Album, Photo, UploadResponse } from "@/types";

export const supabaseService = {
  // Album methods
  async getAllAlbums(): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*');
    
    if (error) {
      console.error('Error fetching albums:', error);
      return [];
    }
    
    return data.map(album => ({
      id: album.id,
      title: album.title,
      description: album.description || undefined,
      createdAt: album.created_at,
      moderationEnabled: album.moderation_enabled || false,
      isPrivate: album.is_private || false,
      ownerId: album.owner_id || undefined
    }));
  },
  
  async getAlbumById(id: string): Promise<Album | null> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching album:', error);
      return null;
    }
    
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      createdAt: data.created_at,
      moderationEnabled: data.moderation_enabled || false,
      isPrivate: data.is_private || false,
      ownerId: data.owner_id || undefined
    };
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
    
    return data.map(photo => ({
      id: photo.id,
      albumId: photo.album_id,
      url: photo.url,
      thumbnailUrl: photo.thumbnail_url,
      createdAt: photo.created_at,
      approved: photo.approved || false
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
    
    return data.map(photo => ({
      id: photo.id,
      albumId: photo.album_id,
      url: photo.url,
      thumbnailUrl: photo.thumbnail_url,
      createdAt: photo.created_at,
      approved: photo.approved || false
    }));
  },
  
  async addPhoto(photoData: { 
    albumId: string; 
    url: string; 
    thumbnailUrl: string; 
    approved?: boolean;
  }): Promise<UploadResponse> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert({
          album_id: photoData.albumId,
          url: photoData.url,
          thumbnail_url: photoData.thumbnailUrl,
          approved: photoData.approved ?? true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const photo: Photo = {
        id: data.id,
        albumId: data.album_id,
        url: data.url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at,
        approved: data.approved || false
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
      
      if (error) throw error;
      
      return {
        id: data.id,
        albumId: data.album_id,
        url: data.url,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at,
        approved: data.approved || false
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
