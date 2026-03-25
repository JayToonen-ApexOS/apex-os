import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
console.log('VAPID:', VAPID_KEY);

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Messaging is alleen beschikbaar in browsers die het ondersteunen
// (niet in Safari zonder WebPush, niet in incognito)
export const messagingPromise = isSupported().then((supported) =>
  supported ? getMessaging(app) : null
);

// Directe messaging export (kan null zijn als niet ondersteund)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) messaging = getMessaging(app);
});
