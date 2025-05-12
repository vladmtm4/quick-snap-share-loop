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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlbumShareLinkProps {
  albumId: string;
}

const AlbumShareLink: React.FC<AlbumShareLinkProps> = ({ albumId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Generate share links:
  const uploadLink = `${window.location.origin}/upload/${albumId}`;
  const selfieLink = `${window.location.origin}/upload/${albumId}?selfie=true`;
  const gameLink = `${window.location.origin}/upload/${albumId}?gameMode=true`;

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Link copied to clipboard",
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
            Use the tabs below to share different experiences: upload photos, find your photos via selfie, or play the photo game
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="selfie">Selfie</TabsTrigger>
            <TabsTrigger value="game">Game</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="py-4">
            <div className="flex flex-col items-center">
              <QRCodeSVG value={uploadLink} size={160} level="L" includeMargin imageSettings={{ src: "/logo.png", height: 30, width: 30, excavate: true }} />
              <p className="text-sm text-center text-gray-500 mt-2">Share this link for others to upload photos</p>
              <div className="flex items-center space-x-2 w-full mt-2">
                <Input readOnly value={uploadLink} className="flex-1" />
                <Button onClick={() => copyToClipboard(uploadLink)} size="sm" variant="outline"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="selfie" className="py-4">
            <div className="flex flex-col items-center">
              <QRCodeSVG value={selfieLink} size={160} level="L" includeMargin imageSettings={{ src: "/logo.png", height: 30, width: 30, excavate: true }} />
              <p className="text-sm text-center text-gray-500 mt-2">Share this link so people can take a selfie and find their photos</p>
              <div className="flex items-center space-x-2 w-full mt-2">
                <Input readOnly value={selfieLink} className="flex-1" />
                <Button onClick={() => copyToClipboard(selfieLink)} size="sm" variant="outline"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="game" className="py-4">
            <div className="flex flex-col items-center">
              <QRCodeSVG value={gameLink} size={160} level="L" includeMargin imageSettings={{ src: "/logo.png", height: 30, width: 30, excavate: true }} />
              <p className="text-sm text-center text-gray-500 mt-2">Share this link to join the photo game challenge</p>
              <div className="flex items-center space-x-2 w-full mt-2">
                <Input readOnly value={gameLink} className="flex-1" />
                <Button onClick={() => copyToClipboard(gameLink)} size="sm" variant="outline"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
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
