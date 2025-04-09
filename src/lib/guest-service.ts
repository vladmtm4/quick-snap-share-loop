
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Guest, GuestResponse, SingleGuestResponse } from "@/types";

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
      const guests: Guest[] = (data || []).map((item: any) => ({
        id: item.id,
        albumId: item.albumid,
        guestName: item.guestname,
        email: item.email || undefined,
        phone: item.phone || undefined,
        approved: item.approved,
        created_at: item.created_at
      }));
      
      return { data: guests, error: null };
    } catch (error) {
      console.error("Error in getAllGuestsForAlbum:", error);
      return { data: null, error };
    }
  },
  
  async addGuestToAlbum(albumId: string, guestData: { guestName: string, email?: string, phone?: string }): Promise<SingleGuestResponse> {
    console.log("Adding guest to album:", albumId, guestData);
    
    try {
      const newGuest = {
        id: uuidv4(),
        albumid: albumId,
        guestname: guestData.guestName,
        email: guestData.email || null,
        phone: guestData.phone || null,
        approved: false,
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
        phone: data.phone || undefined,
        approved: data.approved,
        created_at: data.created_at
      };
      
      return { data: guest, error: null };
    } catch (error) {
      console.error("Error in addGuestToAlbum:", error);
      return { data: null, error };
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
