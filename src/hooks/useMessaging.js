import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, messagingPromise } from '../firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useMessaging(user) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [fcmToken, setFcmToken] = useState(null);

  // Haal het FCM-token op en sla het op in Firestore
  const fetchToken = useCallback(async (currentUser) => {
    try {
      const messaging = await messagingPromise;
      if (!messaging || !VAPID_KEY || VAPID_KEY === 'your_vapid_key_here') return;

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
      setFcmToken(token);

      if (currentUser) {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'settings', 'fcm'),
          { token, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('[FCM] Token ophalen mislukt:', err.message);
    }
  }, []);

  // Auto-fetch token als toestemming al was gegeven (bijv. vorige sessie)
  useEffect(() => {
    if (permission === 'granted' && user) {
      fetchToken(user);
    }
  }, [permission, user, fetchToken]);

  // Vraag toestemming en haal daarna token op
  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    await fetchToken(user);
  };

  // Luister naar foreground-meldingen
  useEffect(() => {
    if (permission !== 'granted') return;

    let unsubscribe = () => {};

    messagingPromise.then((messaging) => {
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'Apex OS';
        const body  = payload.notification?.body  ?? '';
        new Notification(title, { body, icon: '/favicon.svg' });
      });
    });

    return () => unsubscribe();
  }, [permission]);

  return { permission, requestPermission, fcmToken };
}
