
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/lib/supabase-service";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const AlbumCreationForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create an album",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) {
      setError("Please enter an album title");
      toast({
        title: "Error",
        description: "Please enter an album title",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      setError("You must be signed in to create an album");
      toast({
        title: "Authentication required",
        description: "You must be signed in to create an album",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting album creation with:", {
        title,
        description,
        isPrivate,
        moderationEnabled
      });
      
      const { data: newAlbum, error: createError } = await supabaseService.createAlbum({
        title,
        description: description.trim() ? description : undefined,
        isPrivate,
        moderationEnabled
      });
      
      if (createError) {
        throw new Error(createError.message || "Failed to create album");
      }
      
      if (!newAlbum) {
        throw new Error("Album creation failed - no data returned");
      }
      
      console.log("Album created successfully:", newAlbum);
      
      toast({
        title: "Success",
        description: "Album created successfully!"
      });
      
      if (newAlbum && newAlbum.id) {
        console.log("Navigating to album page:", `/album/${newAlbum.id}`);
        navigate(`/album/${newAlbum.id}`);
      } else {
        console.error("Cannot navigate: newAlbum or newAlbum.id is undefined", newAlbum);
        setError("Album was created but there was an issue loading it");
        toast({
          title: "Warning",
          description: "Album was created but there was an issue loading it",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error creating album:", error);
      setError(error.message || "Failed to create album. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to create album. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="title">Album Title*</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summer Party 2025"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Share your photos from our summer party!"
          rows={3}
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="moderation" className="text-sm font-medium">
              Enable Moderation
            </Label>
            <p className="text-sm text-muted-foreground">
              Review photos before they appear in the slideshow
            </p>
          </div>
          <Switch
            id="moderation"
            checked={moderationEnabled}
            onCheckedChange={setModerationEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="private" className="text-sm font-medium">
              Private Album
            </Label>
            <p className="text-sm text-muted-foreground">
              Only accessible via link
            </p>
          </div>
          <Switch
            id="private"
            checked={isPrivate}
            onCheckedChange={setIsPrivate}
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-brand-blue hover:bg-brand-darkBlue"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating Album..." : "Create Album"}
      </Button>
    </form>
  );
};

export default AlbumCreationForm;
