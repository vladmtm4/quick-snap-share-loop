
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Guest, GuestResponse, SingleGuestResponse } from "@/types";

// Define a more specific type for the database response to include photo_url
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
};

// Guest service using raw queries to avoid type errors
export const guestService = {
  async getAllGuestsForAlbum(albumId: string): Promise<GuestResponse> {
    console.log("Fetching guests for album:", albumId);
    
    try {
      // Use a raw query since the guests table isn't in the Database type definition yet
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('albumid', albumId);
      
      if (error) {
        console.error("Error fetching guests:", error);
        return { data: null, error };
      }
      
      // Map the DB response to our Guest type
      const guests: Guest[] = (data || []).map((item: GuestDatabaseResponse) => ({
        id: item.id,
        albumId: item.albumid,
        guestName: item.guestname,
        email: item.email || undefined,
        phone: item.phone || undefined,
        approved: item.approved,
        created_at: item.created_at,
        assigned: item.assigned || false,
        photoUrl: item.photo_url || undefined
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
      // Get device ID for assignment tracking
      const deviceId = localStorage.getItem('device_id') || '';
      
      // Get a random unassigned guest - excluding the currently assigned guest to this device ID
      const currentAssignedId = localStorage.getItem(`album_${albumId}_device_${deviceId}`);
      
      // Use a database query to find unassigned guests with photos
      let query = supabase
        .from('guests')
        .select('*')
        .eq('albumid', albumId)
        .eq('approved', true)
        .eq('assigned', false) // Look for guests not assigned in DB
        .not('photo_url', 'is', null); // Make sure we only get guests with photos
      
      // Add a filter to exclude the current guest if one is assigned
      if (currentAssignedId) {
        query = query.neq('id', currentAssignedId);
      }
      
      const { data, error } = await query
        .limit(1)
        .single();
      
      if (error) {
        // If no unassigned guests are found, reset all assignments and try again
        if (error.code === 'PGRST116') {
          await this.resetAllGuestAssignments(albumId);
          
          // Get a new guest but exclude current one to avoid reassigning the same guest
          const queryAfterReset = supabase
            .from('guests')
            .select('*')
            .eq('albumid', albumId)
            .eq('approved', true)
            .not('photo_url', 'is', null); // Make sure we only get guests with photos
            
          // Add filter to exclude current guest
          if (currentAssignedId) {
            queryAfterReset.neq('id', currentAssignedId);
          }
          
          const { data: resetData, error: resetError } = await queryAfterReset
            .limit(1)
            .single();
            
          if (resetError) {
            // If we still can't find a guest after reset, try without the exclusion filter
            // as a last resort (better to possibly get same guest than no guest at all)
            const lastResortQuery = await supabase
              .from('guests')
              .select('*')
              .eq('albumid', albumId)
              .eq('approved', true)
              .not('photo_url', 'is', null)
              .limit(1)
              .single();
              
            if (lastResortQuery.error) {
              console.error("Error fetching guest after all attempts:", lastResortQuery.error);
              return { data: null, error: lastResortQuery.error };
            }
            
            if (!lastResortQuery.data) {
              return { data: null, error: new Error("No approved guests available") };
            }
            
            // Mark this guest as assigned in the database
            await this.markGuestAsAssigned(lastResortQuery.data.id);
            
            const guest: Guest = {
              id: lastResortQuery.data.id,
              albumId: lastResortQuery.data.albumid,
              guestName: lastResortQuery.data.guestname,
              email: lastResortQuery.data.email || undefined,
              phone: lastResortQuery.data.phone || undefined,
              approved: lastResortQuery.data.approved,
              created_at: lastResortQuery.data.created_at,
              assigned: true,
              photoUrl: lastResortQuery.data.photo_url || undefined
            };
            
            return { data: guest, error: null };
          }
          
          if (!resetData) {
            return { data: null, error: new Error("No approved guests available") };
          }
          
          // Mark this guest as assigned in the database
          await this.markGuestAsAssigned(resetData.id);
          
          const guest: Guest = {
            id: resetData.id,
            albumId: resetData.albumid,
            guestName: resetData.guestname,
            email: resetData.email || undefined,
            phone: resetData.phone || undefined,
            approved: resetData.approved,
            created_at: resetData.created_at,
            assigned: true,
            photoUrl: resetData.photo_url || undefined
          };
          
          return { data: guest, error: null };
        }
        
        console.error("Error fetching unassigned guest:", error);
        return { data: null, error };
      }
      
      if (!data) {
        return { data: null, error: new Error("No unassigned guests available") };
      }
      
      // Mark this guest as assigned in the database
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
        photoUrl: data.photo_url || undefined
      };
      
      return { data: guest, error: null };
    } catch (error) {
      console.error("Error in getUnassignedGuest:", error);
      return { data: null, error };
    }
  },

  // Get a previously assigned guest by device ID (stored in localStorage)
  async getGuestByDeviceId(albumId: string, deviceId: string): Promise<SingleGuestResponse> {
    try {
      // Look up the guest assignment in local storage first
      const storedGuestId = localStorage.getItem(`album_${albumId}_device_${deviceId}`);
      
      if (storedGuestId) {
        // Fetch the guest by ID
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
          const guest: Guest = {
            id: data.id,
            albumId: data.albumid,
            guestName: data.guestname,
            email: data.email || undefined,
            phone: data.phone || undefined,
            approved: data.approved,
            created_at: data.created_at,
            assigned: true,
            photoUrl: data.photo_url || undefined
          };
          
          return { data: guest, error: null };
        }
      }
      
      // If no stored guest or guest not found, return null
      return { data: null, error: null };
    } catch (error) {
      console.error("Error in getGuestByDeviceId:", error);
      return { data: null, error };
    }
  },
  
  // Store guest assignment to device
  storeGuestAssignment(albumId: string, guestId: string): void {
    try {
      // Generate a unique device ID or use existing one
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('device_id', deviceId);
      }
      
      // Store the guest assignment
      localStorage.setItem(`album_${albumId}_device_${deviceId}`, guestId);
    } catch (error) {
      console.error("Error storing guest assignment:", error);
    }
  },
  
  // Clear guest assignment for current device
  clearGuestAssignment(albumId: string): boolean {
    try {
      const deviceId = localStorage.getItem('device_id');
      if (deviceId) {
        const storedGuestId = localStorage.getItem(`album_${albumId}_device_${deviceId}`);
        if (storedGuestId) {
          // Remove from localStorage
          localStorage.removeItem(`album_${albumId}_device_${deviceId}`);
          
          // Update the guest's assigned status in the database
          this.markGuestAsUnassigned(storedGuestId);
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
      // Try using a direct update query instead of RPC
      const { error } = await supabase
        .from('guests')
        .update({ assigned: false } as any) // Using 'as any' to bypass type checking
        .eq('albumid', albumId);
      
      if (error) {
        console.error("Error resetting guest assignments:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in resetAllGuestAssignments:", error);
      return false;
    }
  },
  
  async markGuestAsAssigned(guestId: string): Promise<boolean> {
    console.log("Marking guest as assigned:", guestId);
    
    try {
      const { error } = await supabase
        .from('guests')
        .update({ assigned: true } as any) // Using 'as any' to bypass type checking
        .eq('id', guestId);
      
      if (error) {
        console.error("Error marking guest as assigned:", error);
        return false;
      }
      
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
        .update({ assigned: false } as any) // Using 'as any' to bypass type checking
        .eq('id', guestId);
      
      if (error) {
        console.error("Error marking guest as unassigned:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in markGuestAsUnassigned:", error);
      return false;
    }
  },
  
  async addGuestToAlbum(albumId: string, guestData: { 
    guestName: string, 
    email?: string, 
    phone?: string,
    photoUrl?: string 
  }): Promise<SingleGuestResponse> {
    console.log("Adding guest to album:", albumId, guestData);
    
    try {
      const newGuest = {
        id: uuidv4(),
        albumid: albumId,
        guestname: guestData.guestName,
        email: guestData.email || null,
        phone: guestData.phone || null,
        approved: false,
        assigned: false,
        created_at: new Date().toISOString(),
        photo_url: guestData.photoUrl || null
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
        phone: data.phone || undefined,
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
        .update({ photo_url: photoUrl } as any) // Using 'as any' to bypass type checking
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
  }
};
