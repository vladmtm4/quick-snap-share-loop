
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Share, Copy } from "lucide-react";

interface AlbumShareLinkProps {
  albumId: string;
}

const AlbumShareLink: React.FC<AlbumShareLinkProps> = ({ albumId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Generate a link to the album selfie share page
  const shareLink = `${window.location.origin}/upload/${albumId}?selfie=true`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Share link copied to clipboard",
        });
      })
      .catch((error) => {
        console.error("Error copying link:", error);
        toast({
          title: "Error",
          description: "Could not copy link to clipboard",
          variant: "destructive"
        });
      });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share className="h-4 w-4" />
          Share Album
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this album</DialogTitle>
          <DialogDescription>
            Share this link so others can take selfies and find their photos
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-lg border mb-4">
            <QRCodeSVG 
              value={shareLink} 
              size={180} 
              level="L"
              includeMargin={true}
              imageSettings={{
                src: "/logo.png",
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
          
          <p className="text-sm text-center text-gray-500 mb-4">
            Anyone can scan this QR code or use the link below to upload selfies and find photos they appear in
          </p>
          
          <div className="flex items-center space-x-2 w-full">
            <Input
              readOnly
              value={shareLink}
              className="flex-1"
            />
            <Button onClick={copyToClipboard} size="sm" variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlbumShareLink;
