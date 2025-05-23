
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { Album } from '@/types';
import { Camera, Users, Image, GamepadIcon } from 'lucide-react';

interface ModeratorTabsProps {
  album: Album;
  currentTab: string;
}

const ModeratorTabs: React.FC<ModeratorTabsProps> = ({ album, currentTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'photos':
        navigate(`/album/${album.id}`);
        break;
      case 'upload':
        navigate(`/upload/${album.id}`);
        break;
      case 'guests':
        navigate(`/guests/${album.id}`);
        break;
      case 'game':
        navigate(`/game/${album.id}`);
        break;
    }
  };
  
  return (
    <div className="mb-6">
      <Tabs defaultValue={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="photos" className="flex-1 flex items-center justify-center">
            <Image className="mr-2 h-4 w-4" />
            <span>Photos</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 flex items-center justify-center">
            <Camera className="mr-2 h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger value="guests" className="flex-1 flex items-center justify-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Guests</span>
          </TabsTrigger>
          <TabsTrigger value="game" className="flex-1 flex items-center justify-center">
            <GamepadIcon className="mr-2 h-4 w-4" />
            <span>Game</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ModeratorTabs;
