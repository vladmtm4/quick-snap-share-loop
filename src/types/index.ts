
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
  } | null;
}

export interface UploadResponse {
  success: boolean;
  photo?: Photo;
  error?: string;
}

export interface Guest {
  id: string;
  albumId: string;
  guestName: string;
  email?: string;
  phone?: string;
  approved?: boolean;
  created_at?: string;
}

// Responses from supabase guest methods
export interface GuestResponse {
  data: Guest[] | null;
  error: any | null;
}

export interface SingleGuestResponse {
  data: Guest | null;
  error: any | null;
}
