
export interface Album {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  moderationEnabled: boolean;
  isPrivate: boolean;
  ownerId?: string;
  guest_list?: string[]; // For the find-a-guest game
}

export interface Photo {
  id: string;
  albumId: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
  approved: boolean;
  metadata?: {
    gameChallenge?: boolean;
    assignment?: string;
    [key: string]: any;
  };
}

export interface UploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}
