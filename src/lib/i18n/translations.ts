
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
    en: 'Wedding Guest Registration',
    he: 'רישום אורחי חתונה'
  },
  registrationWelcome: {
    en: "Welcome to our wedding celebration! We're planning a special photo-finding game during the reception where guests will try to locate each other in photos. To participate, please register your name and upload a photo of yourself that other guests can use to find you during the game.",
    he: "ברוכים הבאים לחגיגת החתונה שלנו! אנו מתכננים משחק מיוחד של מציאת תמונות במהלך קבלת הפנים, שבו אורחים ינסו לאתר זה את זה בתמונות. כדי להשתתף, אנא הירשמו עם שמכם והעלו תמונה של עצמכם שאורחים אחרים יוכלו להשתמש בה כדי למצוא אתכם במהלך המשחק."
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
    en: 'Your Photo',
    he: 'התמונה שלך'
  },
  photoHelp: {
    en: 'This photo will help other guests find you during the reception game',
    he: 'תמונה זו תעזור לאורחים אחרים למצוא אותך במהלך משחק קבלת הפנים'
  },
  registerForEvent: {
    en: 'Register for the Event',
    he: 'הירשם לאירוע'
  },
  processing: {
    en: 'Processing...',
    he: 'מעבד...'
  },
  registrationComplete: {
    en: 'Registration Complete!',
    he: 'הרישום הושלם!'
  },
  thankYouRegistration: {
    en: 'Thank you for registering for the photo-finding game at',
    he: 'תודה שנרשמת למשחק מציאת התמונות ב'
  },
  lookForwardSeeing: {
    en: 'We look forward to seeing you at the reception.',
    he: 'אנו מצפים לראותך בקבלת הפנים.'
  },
  dontForgetPhone: {
    en: "Don't forget to bring your phone to participate in the game during the reception!",
    he: 'אל תשכח להביא את הטלפון שלך כדי להשתתף במשחק במהלך קבלת הפנים!'
  },
  nameRequired: {
    en: 'Name required',
    he: 'שם נדרש'
  },
  pleaseEnterName: {
    en: 'Please enter your name to continue',
    he: 'אנא הכנס את שמך כדי להמשיך'
  },
  registrationSuccessful: {
    en: 'Registration successful',
    he: 'הרישום בוצע בהצלחה'
  },
  addedToGuestList: {
    en: "You've been added to the guest list",
    he: 'נוספת לרשימת האורחים'
  },
  registrationFailed: {
    en: 'Registration failed',
    he: 'הרישום נכשל'
  },
  couldNotComplete: {
    en: 'Could not complete registration. Please try again.',
    he: 'לא ניתן להשלים את הרישום. אנא נסה שוב.'
  },
  signOut: {
    en: 'Sign Out',
    he: 'התנתק'
  },
  signIn: {
    en: 'Sign In',
    he: 'התחבר'
  },
};

// Translation cache to avoid unnecessary API calls
export const translationCache: TranslationCache = { ...coreTranslations };

// Helper function for external modules
export function t(key: string, language: SupportedLanguage = 'en'): string {
  if (coreTranslations[key]?.[language]) {
    return coreTranslations[key][language];
  }
  
  if (translationCache[key]?.[language]) {
    return translationCache[key][language];
  }
  
  return key;
}
