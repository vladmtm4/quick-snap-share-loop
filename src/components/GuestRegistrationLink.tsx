
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
import { useToast } from "@/hooks/use-toast";
import { Share, Copy, Users } from "lucide-react";

interface GuestRegistrationLinkProps {
  albumId: string;
}

const GuestRegistrationLink: React.FC<GuestRegistrationLinkProps> = ({ albumId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const shareLink = `${window.location.origin}/register/${albumId}`;
  
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
          <Users className="h-4 w-4" />
          Share Guest Registration
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Guest Registration</DialogTitle>
          <DialogDescription>
            Share this link with your wedding guests so they can register and participate in the photo-finding game during the reception
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-lg border mb-4">
            <QRCodeSVG 
              value={shareLink} 
              size={180} 
              level="L"
              includeMargin={true}
            />
          </div>
          
          <p className="text-sm text-center text-gray-500 mb-4">
            Guests can scan this QR code or use the link below to register for the photo-finding game
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

export default GuestRegistrationLink;
