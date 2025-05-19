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
    en: "Get ready for a fun photo adventure at our wedding! 📸 We're planning an exciting photo-finding game during the reception where you'll search for other guests in photos. Register your name and upload your best selfie to join the fun!",
    he: "התכוננו להרפתקת תמונות מהנה בחתונה שלנו! 📸 אנחנו מתכננים משחק מלהיב של מציאת תמונות במהלך קבלת הפנים שבו תחפשו אחר אורחים אחרים בתמונות. הירשמו עם השם שלכם והעלו את הסלפי הטוב ביותר שלכם כדי להצטרף לכיף!"
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
    en: 'Upload a clear, fun photo so others can easily find you during the game!',
    he: 'העלה תמונה ברורה ומהנה כדי שאחרים יוכלו למצוא אותך בקלות במהלך המשחק!'
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
    en: 'Thanks for joining our photo-finding adventure at',
    he: 'תודה שהצטרפת להרפתקת מציאת התמונות ב'
  },
  lookForwardSeeing: {
    en: 'We can\'t wait to see you at the reception!',
    he: 'אנחנו לא יכולים לחכות לראות אותך בקבלת הפנים!'
  },
  dontForgetPhone: {
    en: "Don't forget your phone to play the photo game - it's going to be awesome! 📱✨",
    he: 'אל תשכח להביא את הטלפון שלך כדי לשחק במשחק התמונות - זה הולך להיות מדהים! 📱✨'
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
