
import React, { useState } from 'react';
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

  React.useEffect(() => {
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
      <div dir={language === 'he' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
        <Header hideAuthButtons />
        <div className="container mx-auto p-4">
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <PartyPopper className="w-12 h-12 mx-auto text-green-500" />
                <CardTitle className="text-2xl">{translate("registrationComplete")}</CardTitle>
                <CardDescription className="text-lg">
                  {translate("thankYouRegistration")} {albumTitle}! {translate("lookForwardSeeing")}
                </CardDescription>
                <p className="text-sm text-muted-foreground">
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
    <div dir={language === 'he' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50">
      <Header hideAuthButtons />
      <div className="container mx-auto p-4">
        <div className="flex justify-center mb-4">
          <LanguageSelector />
        </div>
        {albumId && <GuestRegistration albumId={albumId} onRegistrationComplete={() => setIsRegistered(true)} />}
      </div>
    </div>
  );
}

export default RegisterPage;
