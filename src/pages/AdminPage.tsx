
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  is_admin: boolean;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  email?: string;
  display_name?: string;
}

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsers();
    fetchAlbums();
  }, []);
  
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setUsers(data as Profile[]);
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAlbums = async () => {
    try {
      // Get all albums with user info
      const { data, error } = await supabase
        .from("albums")
        .select(`
          *,
          profiles:user_id (
            email,
            display_name
          )
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to flatten the profiles
      const transformedData = data.map((item: any) => ({
        ...item,
        email: item.profiles?.email,
        display_name: item.profiles?.display_name,
      }));
      
      setAlbums(transformedData as Album[]);
    } catch (error: any) {
      toast({
        title: "Error fetching albums",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !currentStatus })
        .eq("id", userId);
        
      if (error) throw error;
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentStatus } : user
      ));
      
      toast({
        title: "Success",
        description: `Admin status ${!currentStatus ? "granted" : "revoked"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating admin status",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="mb-4">You don't have permission to view this page.</p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBackButton />
      
      <div className="container max-w-6xl py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">All Users</h2>
              
              {loading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.display_name || user.email}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                          <TableCell>{user.is_admin ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <Button 
                              variant={user.is_admin ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                            >
                              {user.is_admin ? "Revoke Admin" : "Make Admin"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="albums">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">All Albums</h2>
              
              {loading ? (
                <div className="text-center py-4">Loading albums...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Private</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {albums.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No albums found</TableCell>
                      </TableRow>
                    ) : (
                      albums.map(album => (
                        <TableRow key={album.id}>
                          <TableCell>{album.title}</TableCell>
                          <TableCell>{album.display_name || album.email || "Unknown"}</TableCell>
                          <TableCell>{new Date(album.created_at).toLocaleString()}</TableCell>
                          <TableCell>{album.is_private ? "Yes" : "No"}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/album/${album.id}`}>View Album</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
