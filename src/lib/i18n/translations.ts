
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
    en: '✨ Wedding Photo Game Registration ✨',
    he: '✨ הרשמה למשחק תמונות החתונה ✨'
  },
  registrationWelcome: {
    en: "Join our exciting wedding photo game! 📸 We've prepared a fun surprise for you during the reception - sign up now to be part of the adventure! Enter your name and upload a selfie to join in on the fun!",
    he: "הצטרפו למשחק התמונות המלהיב בחתונה שלנו! 📸 הכנו הפתעה כיפית במיוחד עבורכם במהלך קבלת הפנים - הירשמו עכשיו כדי להיות חלק מההרפתקה! הזינו את שמכם והעלו סלפי כדי להצטרף לחגיגה!"
  },
  yourName: {
    en: 'Your Name 👋',
    he: 'השם שלך 👋'
  },
  enterFullName: {
    en: 'Enter your full name here',
    he: 'הכנס את שמך המלא כאן'
  },
  yourPhoto: {
    en: 'Your Photo 🤳',
    he: 'התמונה שלך 🤳'
  },
  photoHelp: {
    en: 'Upload a clear photo so others can easily find you during the wedding game!',
    he: 'העלה תמונה ברורה כדי שאחרים יוכלו למצוא אותך בקלות במהלך משחק החתונה!'
  },
  registerForEvent: {
    en: 'Join The Fun! 🎮',
    he: 'הצטרף לכיף! 🎮'
  },
  processing: {
    en: 'Magic Happening... ✨',
    he: 'קסם קורה... ✨'
  },
  registrationComplete: {
    en: 'Woohoo! You\'re In! 🎉',
    he: 'יש! נרשמת! 🎉'
  },
  thankYouRegistration: {
    en: 'Thanks for joining our wedding adventure at',
    he: 'תודה שהצטרפת להרפתקה בחתונה ב'
  },
  lookForwardSeeing: {
    en: 'We can\'t wait to see you at the reception!',
    he: 'אנחנו לא יכולים לחכות לראות אותך בקבלת הפנים!'
  },
  dontForgetPhone: {
    en: "Don't forget your phone for the special wedding game - it's going to be amazing! 📱✨",
    he: 'אל תשכח להביא את הטלפון שלך למשחק החתונה המיוחד - זה הולך להיות מדהים! 📱✨'
  },
  nameRequired: {
    en: 'Name Needed',
    he: 'שם נדרש'
  },
  pleaseEnterName: {
    en: 'Please enter your name to join the fun',
    he: 'אנא הכנס את שמך כדי להצטרף לחגיגה'
  },
  registrationSuccessful: {
    en: 'Registration successful! 🎊',
    he: 'הרישום בוצע בהצלחה! 🎊'
  },
  addedToGuestList: {
    en: "You've been added to the guest list! Get ready for the fun!",
    he: 'נוספת לרשימת האורחים! התכונן לכיף!'
  },
  registrationFailed: {
    en: 'Oops! Registration hiccup',
    he: 'אופס! בעיה ברישום'
  },
  couldNotComplete: {
    en: 'We hit a small bump. Could you try again?',
    he: 'נתקלנו במכשול קטן. האם תוכל לנסות שוב?'
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
