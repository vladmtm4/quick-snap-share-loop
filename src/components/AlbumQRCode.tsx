
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface AlbumQRCodeProps {
  albumId: string;
  title: string;
}

const AlbumQRCode: React.FC<AlbumQRCodeProps> = ({ albumId, title }) => {
  const { toast } = useToast();
  const uploadUrl = `${window.location.origin}/upload/${albumId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(uploadUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with others to let them upload photos"
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl">Share QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCodeSVG value={uploadUrl} size={200} />
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Scan this QR code to upload photos to "{title}"
        </p>
        <Button 
          onClick={handleCopyLink} 
          className="w-full bg-brand-blue hover:bg-brand-darkBlue"
        >
          Copy Upload Link
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlbumQRCode;
