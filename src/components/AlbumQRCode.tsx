
import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, GamepadIcon } from "lucide-react";

interface AlbumQRCodeProps {
  albumId: string;
  title: string;
}

const AlbumQRCode: React.FC<AlbumQRCodeProps> = ({ albumId, title }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  const uploadUrl = `${window.location.origin}/upload/${albumId}`;
  const gameUrl = `${window.location.origin}/game/${albumId}`;

  const handleCopyLink = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: `Share this ${type} link with others`
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl">Share</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Tabs 
          defaultValue="upload" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Upload Photos
            </TabsTrigger>
            <TabsTrigger value="game" className="flex items-center gap-2">
              <GamepadIcon className="h-4 w-4" />
              Photo Game
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG value={uploadUrl} size={200} />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan to upload photos to "{title}"
              </p>
              <Button 
                onClick={() => handleCopyLink(uploadUrl, "upload")} 
                className="w-full bg-brand-blue hover:bg-brand-darkBlue"
              >
                Copy Upload Link
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="game" className="mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG value={gameUrl} size={200} />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan to play the wedding photo challenge game!
              </p>
              <Button 
                onClick={() => handleCopyLink(gameUrl, "game")} 
                className="w-full bg-brand-blue hover:bg-brand-darkBlue"
              >
                Copy Game Link
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AlbumQRCode;
