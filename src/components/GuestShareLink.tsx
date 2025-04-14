
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
import { Guest } from "@/types";
import { guestService } from "@/lib/guest-service";
import { Share, Copy, QrCode } from "lucide-react";

interface GuestShareLinkProps {
  guest: Guest;
}

const GuestShareLink: React.FC<GuestShareLinkProps> = ({ guest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  if (!guest.id || !guest.albumId) return null;
  
  const shareLink = guestService.generateShareLink(guest.albumId, guest.id);
  
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
        <Button size="sm" variant="outline">
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share with {guest.guestName}</DialogTitle>
          <DialogDescription>
            Send this link to {guest.guestName} so they can see their photos
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
            {guest.guestName} can scan this QR code or use the link below to access their photos
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

export default GuestShareLink;
