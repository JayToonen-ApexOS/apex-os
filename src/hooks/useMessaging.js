import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, messagingPromise } from '../firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Hook voor Firebase Cloud Messaging.
 * - Vraagt notification-toestemming op aanvraag
 * - Slaat het FCM-token op in Firestore zodat de Cloud Function het kan ophalen
 * - Luistert naar foreground-meldingen en toont ze zelf
 *
 * Returns: { permission, requestPermission }
 */
export function useMessaging(user) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  // Vraag toestemming en haal FCM-token op
  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    try {
      const messaging = await messagingPromise;
      if (!messaging || !VAPID_KEY || VAPID_KEY === 'your_vapid_key_here') return;

      // Registreer de FCM-specifieke service worker expliciet zodat Firebase
      // deze gebruikt voor push (en NIET de algemene sw.js die Firestore blokkeert)
      let swReg = null;
      if ('serviceWorker' in navigator) {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
      }

      const tokenOptions = { vapidKey: VAPID_KEY };
      if (swReg) tokenOptions.serviceWorkerRegistration = swReg;

      const token = await getToken(messaging, tokenOptions);
      if (!token) return;
      console.log('[FCM] Registration token:', token);

      // Sla token op in Firestore zodat de Cloud Function het kan gebruiken
      if (user) {
        await setDoc(
          doc(db, 'users', user.uid, 'settings', 'fcm'),
          { token, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch (err) {
      // FCM is optioneel — app werkt door zonder pushmeldingen
      console.warn('[FCM] Token ophalen mislukt (pushmeldingen niet beschikbaar):', err.message);
    }
  };

  // Luister naar meldingen terwijl de app open is (foreground)
  useEffect(() => {
    if (permission !== 'granted') return;

    let unsubscribe = () => {};

    messagingPromise.then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        // Firebase toont foreground-meldingen niet automatisch — doe het zelf
        const title = payload.notification?.title ?? 'Apex OS';
        const body  = payload.notification?.body  ?? '';
        new Notification(title, { body, icon: '/favicon.svg' });
      });
    });

    return () => unsubscribe();
  }, [permission]);

  return { permission, requestPermission };
}
