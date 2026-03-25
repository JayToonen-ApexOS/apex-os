import { getMessaging, isSupported, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Lazy initialisatie van Firebase Messaging.
 * Wordt pas aangeroepen als de gebruiker notificaties accepteert.
 * Geeft null terug als de browser geen messaging ondersteunt.
 */
export async function getMessagingInstance() {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export { getToken, onMessage };
