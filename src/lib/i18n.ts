
// A simple i18n system for our app
export type SupportedLanguage = 'en' | 'he';

interface Translations {
  [key: string]: {
    en: string;
    he: string;
  };
}

const translations: Translations = {
  // General
  appName: {
    en: 'QuickSnap',
    he: 'קוויקסנאפ'
  },
  loading: {
    en: 'Loading...',
    he: 'טוען...'
  },
  cancel: {
    en: 'Cancel',
    he: 'ביטול'
  },
  submit: {
    en: 'Submit',
    he: 'שלח'
  },
  save: {
    en: 'Save',
    he: 'שמור'
  },
  delete: {
    en: 'Delete',
    he: 'מחק'
  },
  back: {
    en: 'Back',
    he: 'חזור'
  },
  home: {
    en: 'Home',
    he: 'בית'
  },
  close: {
    en: 'Close',
    he: 'סגור'
  },
  
  // Albums
  album: {
    en: 'Album',
    he: 'אלבום'
  },
  viewAlbum: {
    en: 'View Album',
    he: 'צפה באלבום'
  },
  createAlbum: {
    en: 'Create Album',
    he: 'צור אלבום'
  },
  uploadPhotos: {
    en: 'Upload Photos',
    he: 'העלה תמונות'
  },
  slideshow: {
    en: 'Slideshow',
    he: 'מצגת'
  },
  shareQR: {
    en: 'Share QR Code',
    he: 'שתף קוד QR'
  },
  moderation: {
    en: 'Moderation',
    he: 'ניהול'
  },
  noPhotosYet: {
    en: 'No photos yet',
    he: 'אין תמונות עדיין'
  },
  beTheFirst: {
    en: 'Be the first to upload!',
    he: 'היה הראשון להעלות!'
  },
  scanToJoin: {
    en: 'Scan to join',
    he: 'סרוק להצטרף'
  },
  
  // Photo Game
  photoGame: {
    en: 'Photo Challenge',
    he: 'אתגר תמונות'
  },
  findGuest: {
    en: 'Find This Guest',
    he: 'מצא את האורח הזה'
  },
  guestChallenge: {
    en: 'Take a photo with',
    he: 'צלם תמונה עם'
  },
  youMission: {
    en: 'Your mission (should you choose to accept it):',
    he: 'המשימה שלך (אם תבחר לקבל אותה):'
  },
  takePhoto: {
    en: 'Take Photo',
    he: 'צלם תמונה'
  },
  photoUploaded: {
    en: 'Challenge photo uploaded successfully!',
    he: 'תמונת האתגר הועלתה בהצלחה!'
  },
  markComplete: {
    en: 'Mark as Completed',
    he: 'סמן כהושלם'
  },
  challengeComplete: {
    en: 'Challenge completed!',
    he: 'האתגר הושלם!'
  },
  returnToAlbum: {
    en: 'Return to Album',
    he: 'חזור לאלבום'
  },
  thanksForParticipating: {
    en: 'Thanks for participating in the wedding photo game!',
    he: 'תודה שהשתתפת במשחק תמונות החתונה!'
  },
  takePhotoWithGuest: {
    en: 'Take the coolest photo you can with them and upload it!',
    he: 'צלם את התמונה המגניבה ביותר שאתה יכול איתם והעלה אותה!'
  },
  
  // Guest Management
  guestManagement: {
    en: 'Guest Management',
    he: 'ניהול אורחים'
  },
  addGuest: {
    en: 'Guest added',
    he: 'אורח נוסף'
  },
  uploadGuestPhoto: {
    en: 'Upload Guest Photo',
    he: 'העלה תמונת אורח'
  },
  guestName: {
    en: 'Guest Name',
    he: 'שם אורח'
  },
  photo: {
    en: 'Photo',
    he: 'תמונה'
  },
  assignedTo: {
    en: 'Assigned To',
    he: 'הוקצה ל'
  },
  notAssigned: {
    en: 'Not Assigned',
    he: 'לא הוקצה'
  },
  guestPhotoUploaded: {
    en: 'Guest photo uploaded successfully!',
    he: 'תמונת האורח הועלתה בהצלחה!'
  },
  guestList: {
    en: 'Guest List',
    he: 'רשימת אורחים'
  },
  noGuestsFound: {
    en: 'No guests found',
    he: 'לא נמצאו אורחים'
  },
  
  // Language
  language: {
    en: 'Language',
    he: 'שפה'
  },
  english: {
    en: 'English',
    he: 'אנגלית'
  },
  hebrew: {
    en: 'Hebrew',
    he: 'עברית'
  }
};

// Create a function to get translations for the selected language
export function t(key: string, language: SupportedLanguage = 'en'): string {
  if (!translations[key]) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  return translations[key][language];
}

// Create a React context for language
import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  translate: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  translate: (key) => key
});

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  
  const translate = (key: string): string => {
    return t(key, language);
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      <div dir={language === 'he' ? 'rtl' : 'ltr'} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
