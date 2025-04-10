
import { Database } from "@/integrations/supabase/types";

// Extend the Supabase types with our custom tables
export type ProfilesRow = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
};

// This extends the Database type with our custom tables
export interface ExtendedDatabase extends Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    } & Database["public"]["Tables"];
    Views: Database["public"]["Views"];
    Functions: Database["public"]["Functions"];
    Enums: Database["public"]["Enums"];
    CompositeTypes: Database["public"]["CompositeTypes"];
  };
}

// Helper function to safely access profiles data without TypeScript errors
export async function fetchProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}
