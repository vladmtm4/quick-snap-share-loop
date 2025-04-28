export interface Album {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  moderationEnabled: boolean;
  isPrivate: boolean;
  ownerId?: string;
  guest_list?: string[]; // For the find-a-guest game
  email?: string;
  display_name?: string;
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
    guestIds?: string[]; // List of guest IDs who appear in this photo
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
  instagram?: string;
  approved?: boolean;
  created_at?: string;
  assigned?: boolean;
  photoUrl?: string;
}

// Profile interface for admin page
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
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

// New interface for guest photo share page
export interface GuestShareResponse {
  guest: Guest | null;
  photos: Photo[];
  error?: string;
}
