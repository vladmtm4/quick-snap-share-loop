
import { SupportedLanguage, TranslationCache } from './types';

// Core translations that we keep locally to avoid API calls for common text
export const coreTranslations: TranslationCache = {
  appName: {
    en: 'QuickSnap',
    he: 'קוויקסנאפ'
  },
  loading: {
    en: 'Loading...',
    he: 'טוען...'
  },
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
  },
  // Registration page translations
  weddingGuestRegistration: {
    en: 'Wedding Photo Game 📸',
    he: 'משחק תמונות החתונה 📸'
  },
  registrationWelcome: {
    en: "We've prepared a little surprise for you! During the wedding there will be a game. To participate, register here. Don't forget your full name and photo! 😊\n\nWith love,\nVlad and Orin 💕",
    he: "אז הכנו לכם הפתעה קטנה 🎉\nבמהלך החתונה יתקיים משחק\nכדי להשתתף בו הירשמו כאן 📝\nלא לשכוח שם מלא ותמונה! 📸😊\n\nבאהבה,\nולד ואורין 💕"
  },
  yourName: {
    en: 'Your Name',
    he: 'השם שלך'
  },
  enterFullName: {
    en: 'Enter your full name',
    he: 'הכנס את שמך המלא'
  },
  yourPhoto: {
    en: 'Your Photo (Optional)',
    he: 'התמונה שלך (חובה! 📸)'
  },
  photoHelp: {
    en: 'Add a photo so other guests can recognize you during the game!',
    he: 'הוסף תמונה כדי שאורחים אחרים יוכלו לזהות אותך במהלך המשחק! 😄'
  },
  registerForEvent: {
    en: 'Join the Game',
    he: 'הצטרף למשחק 🎮'
  },
  processing: {
    en: 'Registering...',
    he: 'נרשם...'
  },
  registrationComplete: {
    en: 'You\'re All Set!',
    he: 'הכל מוכן! 🎉'
  },
  thankYouRegistration: {
    en: 'Thanks for joining our photo game at',
    he: 'תודה שהצטרפת למשחק התמונות שלנו ב'
  },
  lookForwardSeeing: {
    en: 'Look for QR codes around the venue to start playing!',
    he: 'חפש קודי QR ברחבי המקום כדי להתחיל לשחק!'
  },
  dontForgetPhone: {
    en: "Keep your phone handy to scan QR codes and play the photo challenges throughout the wedding!",
    he: 'שמור את הטלפון בהישג יד כדי לסרוק קודי QR ולשחק באתגרי הצילום במהלך החתונה! 📱'
  },
  nameRequired: {
    en: 'Name Required',
    he: 'שם נדרש'
  },
  pleaseEnterName: {
    en: 'Please enter your name to join',
    he: 'אנא הכנס את שמך כדי להצטרף'
  },
  registrationSuccessful: {
    en: 'Registration successful!',
    he: 'הרישום בוצע בהצלחה! 🎉'
  },
  addedToGuestList: {
    en: "You're registered for the photo game!",
    he: 'נרשמת למשחק התמונות! 📸'
  },
  registrationFailed: {
    en: 'Registration failed',
    he: 'הרישום נכשל'
  },
  couldNotComplete: {
    en: 'Something went wrong. Please try again.',
    he: 'משהו השתבש. אנא נסה שוב.'
  },
  signOut: {
    en: 'Sign Out',
    he: 'התנתק'
  },
  signIn: {
    en: 'Sign In',
    he: 'התחבר'
  },
  photoGame: {
    en: 'Wedding Photo Game',
    he: 'משחק תמונות חתונה'
  },
  findGuestChallenge: {
    en: 'Find and Photograph Challenge',
    he: 'אתגר מציאת וצילום אורחים'
  },
  resetAllGuests: {
    en: 'Reset All Guests',
    he: 'איפוס כל האורחים'
  },
  resetConfirmation: {
    en: 'Are you sure you want to reset all guest assignments?',
    he: 'האם אתה בטוח שברצונך לאפס את כל שיוכי האורחים?'
  },
  thisWillReset: {
    en: 'This will make all guests available again for assignments.',
    he: 'פעולה זו תהפוך את כל האורחים לזמינים שוב לשיוכים.'
  },
  guestManagement: {
    en: 'Guest Management',
    he: 'ניהול אורחים'
  }
};

// Translation cache to avoid unnecessary API calls
export const translationCache: TranslationCache = { ...coreTranslations };

// Helper function for external modules
export function t(key: string, language: SupportedLanguage = 'he'): string {
  if (coreTranslations[key]?.[language]) {
    return coreTranslations[key][language];
  }
  
  if (translationCache[key]?.[language]) {
    return translationCache[key][language];
  }
  
  return key;
}
