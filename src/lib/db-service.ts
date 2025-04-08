
import { Album, Photo } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Simulated database using localStorage
class DBService {
  private getItem<T>(key: string, defaultValue: T): T {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setItem(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Album methods
  getAllAlbums(): Album[] {
    return this.getItem<Album[]>("albums", []);
  }

  getAlbumById(id: string): Album | undefined {
    return this.getAllAlbums().find(album => album.id === id);
  }

  createAlbum(albumData: Omit<Album, "id" | "createdAt">): Album {
    const albums = this.getAllAlbums();
    const newAlbum: Album = {
      id: uuidv4(),
      ...albumData,
      createdAt: new Date().toISOString()
    };
    
    this.setItem("albums", [...albums, newAlbum]);
    return newAlbum;
  }

  // Photo methods
  getPhotosByAlbumId(albumId: string): Photo[] {
    return this.getItem<Photo[]>("photos", []).filter(
      photo => photo.albumId === albumId
    );
  }

  getApprovedPhotosByAlbumId(albumId: string): Photo[] {
    return this.getPhotosByAlbumId(albumId).filter(photo => photo.approved);
  }

  addPhoto(photoData: Omit<Photo, "id" | "createdAt">): Photo {
    const photos = this.getItem<Photo[]>("photos", []);
    const newPhoto: Photo = {
      id: uuidv4(),
      ...photoData,
      createdAt: new Date().toISOString()
    };
    
    this.setItem("photos", [...photos, newPhoto]);
    return newPhoto;
  }

  moderatePhoto(photoId: string, approved: boolean): Photo | undefined {
    const photos = this.getItem<Photo[]>("photos", []);
    const updatedPhotos = photos.map(photo => 
      photo.id === photoId ? { ...photo, approved } : photo
    );
    
    this.setItem("photos", updatedPhotos);
    return updatedPhotos.find(photo => photo.id === photoId);
  }
}

export const dbService = new DBService();
