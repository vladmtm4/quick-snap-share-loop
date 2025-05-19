
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PartyPopper } from "lucide-react";
import GuestRegistration from "@/components/GuestRegistration";
import { supabaseService } from "@/lib/supabase-service";
import { useLanguage } from "@/lib/i18n";
import Header from "@/components/Header";
import LanguageSelector from "@/components/LanguageSelector";

function RegisterPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const [isRegistered, setIsRegistered] = useState(false);
  const [albumTitle, setAlbumTitle] = useState<string>("");
  const { translate, language } = useLanguage();
  const [bgColor, setBgColor] = useState("from-purple-100 to-blue-100");

  // Cycle through background colors for a fun effect
  useEffect(() => {
    const colors = [
      "from-purple-100 to-blue-100",
      "from-pink-100 to-purple-100",
      "from-blue-100 to-teal-100",
      "from-indigo-100 to-pink-100"
    ];
    
    let colorIndex = 0;
    const interval = setInterval(() => {
      colorIndex = (colorIndex + 1) % colors.length;
      setBgColor(colors[colorIndex]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return;
      const album = await supabaseService.getAlbumById(albumId);
      if (album) {
        setAlbumTitle(album.title);
      }
    };
    fetchAlbum();
  }, [albumId]);

  if (isRegistered) {
    return (
      <div dir={language === 'he' ? 'rtl' : 'ltr'} 
           className={`min-h-screen bg-gradient-to-br ${bgColor} transition-colors duration-1000`}>
        <Header hideAuthButtons />
        <div className="container mx-auto p-4">
          <Card className="max-w-md mx-auto mt-20 border-2 border-primary shadow-xl backdrop-blur-sm bg-white/90 animate-fade-in">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20">
                  <div className="absolute inset-0 animate-ping rounded-full bg-green-300 opacity-75"></div>
                  <div className="relative flex items-center justify-center w-full h-full bg-white rounded-full shadow-lg">
                    <PartyPopper className="w-10 h-10 text-green-500" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                  {translate("registrationComplete")}
                </CardTitle>
                <CardDescription className="text-lg text-gray-700">
                  {translate("thankYouRegistration")} <span className="font-bold">{albumTitle}</span>! {translate("lookForwardSeeing")}
                </CardDescription>
                <p className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  {translate("dontForgetPhone")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div dir={language === 'he' ? 'rtl' : 'ltr'} 
         className={`min-h-screen bg-gradient-to-br ${bgColor} transition-colors duration-1000`}>
      <Header hideAuthButtons />
      <div className="container mx-auto p-4 py-8">
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        {albumId && <GuestRegistration albumId={albumId} onRegistrationComplete={() => setIsRegistered(true)} />}
      </div>
    </div>
  );
}

export default RegisterPage;
