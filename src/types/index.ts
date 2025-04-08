
export interface Album {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  moderationEnabled: boolean;
  isPrivate: boolean;
  ownerId?: string;
}

export interface Photo {
  id: string;
  albumId: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
  approved: boolean;
}

export interface UploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}
