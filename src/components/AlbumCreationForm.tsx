
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { supabaseService } from "@/lib/supabase-service";

const AlbumCreationForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [moderationEnabled, setModerationEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an album title",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newAlbum = await supabaseService.createAlbum({
        title,
        description: description.trim() ? description : undefined,
        isPrivate,
        moderationEnabled
      });
      
      console.log("Album created successfully:", newAlbum);
      
      toast({
        title: "Success",
        description: "Album created successfully!"
      });
      
      navigate(`/album/${newAlbum.id}`);
    } catch (error) {
      console.error("Error creating album:", error);
      toast({
        title: "Error",
        description: "Failed to create album",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
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
