import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Guest, GuestResponse, SingleGuestResponse } from "@/types";

type GuestDatabaseResponse = {
  id: string;
  albumid: string;
  guestname: string;
  email: string | null;
  phone: string | null;
  approved: boolean | null;
  created_at: string | null;
  assigned: boolean | null;
  photo_url: string | null;
  instagram: string | null;
};

export const guestService = {
  async getAllGuestsForAlbum(albumId: string): Promise<GuestResponse> {
    console.log("Fetching guests for album:", albumId);
    
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('albumid', albumId);
      
      if (error) {
        console.error("Error fetching guests:", error);
        return { data: null, error };
      }
      
      const guests: Guest[] = (data || []).map((item: GuestDatabaseResponse) => ({
        id: item.id,
        albumId: item.albumid,
        guestName: item.guestname,
        email: item.email || undefined,
        phone: item.phone || undefined,
        approved: item.approved,
        created_at: item.created_at,
        assigned: item.assigned || false,
        photoUrl: item.photo_url || undefined,
        instagram: item.instagram || undefined
      }));
      
      return { data: guests, error: null };
    } catch (error) {
      console.error("Error in getAllGuestsForAlbum:", error);
      return { data: null, error };
    }
  },
  
  async getUnassignedGuest(albumId: string): Promise<SingleGuestResponse> {
    console.log("Fetching unassigned guest for album:", albumId);
    
    try {
      const deviceId = localStorage.getItem('device_id') || '';
      
      const currentAssignedId = localStorage.getItem(`album_${albumId}_device_${deviceId}`);
      
      console.log("Looking for unassigned guest with photo, current assigned ID:", currentAssignedId);
      
      // Get all eligible guests (approved, with photo, not assigned)
      const { data: eligibleGuests, error: eligibleError } = await supabase
        .from('guests')
        .select('*')
        .eq('albumid', albumId)
        .eq('approved', true)
        .eq('assigned', false)
        .not('photo_url', 'is', null);
      
      if (eligibleError) {
        console.error("Error fetching eligible guests:", eligibleError);
        return { data: null, error: eligibleError };
      }
      
      // If no eligible guests are found, attempt to reset assignments and try again
      if (!eligibleGuests || eligibleGuests.length === 0) {
        console.log("No unassigned guests found, attempting to reset assignments");
        
        // We won't automatically reset all assignments here - this will be a specific action by the album owner
        // Inform the client that no guests are available
        return { data: null, error: new Error("No approved guests available for assignment") };
      }
      
      // Randomly select a guest from eligible guests
      // This ensures better randomization of guest assignments
      const randomIndex = Math.floor(Math.random() * eligibleGuests.length);
      const selectedGuest = eligibleGuests[randomIndex];
      
      // If we somehow didn't get a guest, return null
      if (!selectedGuest) {
        return { data: null, error: new Error("No guest was selected from eligible guests") };
      }
      
      // Mark the selected guest as assigned
      const markSuccess = await this.markGuestAsAssigned(selectedGuest.id);
      console.log("Guest assigned successfully:", markSuccess, selectedGuest.id);
      
      const guest: Guest = {
        id: selectedGuest.id,
        albumId: selectedGuest.albumid,
        guestName: selectedGuest.guestname,
        email: selectedGuest.email || undefined,
        phone: selectedGuest.phone || undefined,
        approved: selectedGuest.approved,
        created_at: selectedGuest.created_at,
        assigned: true,
        photoUrl: selectedGuest.photo_url || undefined,
        instagram: selectedGuest.instagram || undefined
      };
      
      return { data: guest, error: null };
    } catch (error) {
      console.error("Error in getUnassignedGuest:", error);
      return { data: null, error };
    }
  },
  
  async getGuestById(guestId: string): Promise<SingleGuestResponse> {
    console.log("Fetching guest by ID:", guestId);
    
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', guestId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching guest by ID:", error);
        return { data: null, error };
      }
      
      if (!data) {
        return { data: null, error: null };
      }
      
      const guest: Guest = {
        id: data.id,
        albumId: data.albumid,
        guestName: data.guestname,
        email: data.email || undefined,
        phone: data.phone || undefined,
        approved: data.approved,
        created_at: data.created_at,
        assigned: data.assigned || false,
        photoUrl: data.photo_url || undefined,
        instagram: data.instagram || undefined
      };
      
      return { data: guest, error: null };
    } catch (error) {
      console.error("Error in getGuestById:", error);
      return { data: null, error };
    }
  },
  
  async getGuestByDeviceId(albumId: string, deviceId: string): Promise<SingleGuestResponse> {
    try {
      const storedGuestId = localStorage.getItem(`album_${albumId}_device_${deviceId}`);
      
      if (storedGuestId) {
        const { data, error } = await supabase
          .from('guests')
          .select('*')
          .eq('id', storedGuestId)
          .eq('albumid', albumId)
          .eq('approved', true)
          .single();
          
        if (error) {
          console.error("Error fetching assigned guest:", error);
          return { data: null, error };
        }
        
        if (data) {
          await this.markGuestAsAssigned(data.id);
          
          const guest: Guest = {
            id: data.id,
            albumId: data.albumid,
            guestName: data.guestname,
            email: data.email || undefined,
            phone: data.phone || undefined,
            approved: data.approved,
            created_at: data.created_at,
            assigned: true,
            photoUrl: data.photo_url || undefined,
            instagram: data.instagram || undefined
          };
          
          return { data: guest, error: null };
        }
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error("Error in getGuestByDeviceId:", error);
      return { data: null, error };
    }
  },
  
  storeGuestAssignment(albumId: string, guestId: string): void {
    try {
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('device_id', deviceId);
      }
      
      console.log("Storing guest assignment:", albumId, guestId, "for device", deviceId);
      
      localStorage.setItem(`album_${albumId}_device_${deviceId}`, guestId);
      
      this.markGuestAsAssigned(guestId);
    } catch (error) {
      console.error("Error storing guest assignment:", error);
    }
  },
  
  async clearGuestAssignment(albumId: string): Promise<boolean> {
    try {
      const deviceId = localStorage.getItem('device_id');
      if (deviceId) {
        const storedGuestId = localStorage.getItem(`album_${albumId}_device_${deviceId}`);
        if (storedGuestId) {
          localStorage.removeItem(`album_${albumId}_device_${deviceId}`);
          
          await this.markGuestAsUnassigned(storedGuestId);
          console.log("Cleared assignment for guest:", storedGuestId);
        }
      }
      return true;
    } catch (error) {
      console.error("Error clearing guest assignment:", error);
      return false;
    }
  },
  
  async resetAllGuestAssignments(albumId: string): Promise<boolean> {
    console.log("Resetting all guest assignments for album:", albumId);
    
    try {
      const { error } = await supabase
        .from('guests')
        .update({ assigned: false })
        .eq('albumid', albumId);
      
      if (error) {
        console.error("Error resetting guest assignments:", error);
        return false;
      }
      
      console.log("Successfully reset all guest assignments for album:", albumId);
      
      // Clear local storage assignments for this album
      // This is important so local devices don't think they still have an assignment
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`album_${albumId}_device_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(`accepted_challenge_${albumId}`);
      localStorage.removeItem(`rejected_self_${albumId}`);
      localStorage.removeItem(`completed_challenge_${albumId}`);
      
      return true;
    } catch (error) {
      console.error("Error in resetAllGuestAssignments:", error);
      return false;
    }
  },
  
  async isAlbumOwner(albumId: string): Promise<boolean> {
    try {
      const { data: album, error } = await supabase
        .from('albums')
        .select('owner_id, user_id')
        .eq('id', albumId)
        .single();
      
      if (error) {
        console.error("Error checking album ownership:", error);
        return false;
      }
      
      const { data: session } = await supabase.auth.getSession();
      const currentUserId = session?.session?.user?.id;
      
      // Check if current user is the album owner
      if (currentUserId && (album.owner_id === currentUserId || album.user_id === currentUserId)) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error in isAlbumOwner:", error);
      return false;
    }
  },
  
  async markGuestAsAssigned(guestId: string): Promise<boolean> {
    console.log("Marking guest as assigned:", guestId);
    
    try {
      const { error } = await supabase
        .from('guests')
        .update({ assigned: true })
        .eq('id', guestId);
      
      if (error) {
        console.error("Error marking guest as assigned:", error);
        return false;
      }
      
      console.log("Successfully marked guest as assigned:", guestId);
      return true;
    } catch (error) {
      console.error("Error in markGuestAsAssigned:", error);
      return false;
    }
  },
  
  async markGuestAsUnassigned(guestId: string): Promise<boolean> {
    console.log("Marking guest as unassigned:", guestId);
    
    try {
      const { error } = await supabase
        .from('guests')
        .update({ assigned: false })
        .eq('id', guestId);
      
      if (error) {
        console.error("Error marking guest as unassigned:", error);
        return false;
      }
      
      console.log("Successfully marked guest as unassigned:", guestId);
      return true;
    } catch (error) {
      console.error("Error in markGuestAsUnassigned:", error);
      return false;
    }
  },
  
  async addGuestToAlbum(albumId: string, guestData: { 
    guestName: string, 
    email?: string, 
    instagram?: string,
    photoUrl?: string 
  }): Promise<SingleGuestResponse> {
    console.log("Adding guest to album:", albumId, guestData);
    
    try {
      const newGuest = {
        id: uuidv4(),
        albumid: albumId,
        guestname: guestData.guestName,
        email: guestData.email || null,
        instagram: guestData.instagram || null,
        photo_url: guestData.photoUrl || null,
        approved: false,
        assigned: false,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('guests')
        .insert(newGuest)
        .select()
        .single();
      
      if (error) {
        console.error("Error adding guest:", error);
        return { data: null, error };
      }
      
      const guest: Guest = {
        id: data.id,
        albumId: data.albumid,
        guestName: data.guestname,
        email: data.email || undefined,
        instagram: data.instagram || undefined,
        approved: data.approved,
        created_at: data.created_at,
        assigned: data.assigned || false,
        photoUrl: data.photo_url || undefined
      };
      
      return { data: guest, error: null };
    } catch (error) {
      console.error("Error in addGuestToAlbum:", error);
      return { data: null, error };
    }
  },
  
  async updateGuestPhoto(guestId: string, photoUrl: string): Promise<{success: boolean, error?: any}> {
    console.log("Updating guest photo:", guestId, photoUrl);
    
    try {
      const { error } = await supabase
        .from('guests')
        .update({ photo_url: photoUrl } as any)
        .eq('id', guestId);
      
      if (error) {
        console.error("Error updating guest photo:", error);
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error in updateGuestPhoto:", error);
      return { success: false, error };
    }
  },
  
  async deleteGuest(guestId: string): Promise<{ success: boolean, error?: any }> {
    console.log("Deleting guest:", guestId);
    
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);
      
      if (error) {
        console.error("Error deleting guest:", error);
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error in deleteGuest:", error);
      return { success: false, error };
    }
  },
  
  async approveGuest(guestId: string): Promise<{ success: boolean, error?: any }> {
    console.log("Approving guest:", guestId);
    
    try {
      const { error } = await supabase
        .from('guests')
        .update({ approved: true })
        .eq('id', guestId);
      
      if (error) {
        console.error("Error approving guest:", error);
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error in approveGuest:", error);
      return { success: false, error };
    }
  },
  
  generateShareLink(albumId: string, guestId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/guest/${albumId}/${guestId}`;
  },
  
  async uploadImageToStorage(guestId: string, file: File, filePath: string): Promise<{ url: string } | null> {
    console.log("Uploading guest profile image:", guestId, filePath);
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error("Error uploading guest profile image:", uploadError);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        console.error("Could not get public URL for uploaded image");
        return null;
      }
      
      return {
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error("Error in uploadImageToStorage:", error);
      return null;
    }
  }
};
