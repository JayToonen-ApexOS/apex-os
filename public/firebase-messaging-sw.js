// Firebase Cloud Messaging — Service Worker
// Dit bestand MOET op de root van de site staan (/firebase-messaging-sw.js)
// zodat Firebase het automatisch kan registreren voor achtergrondmeldingen.
//
// Versie: pas FIREBASE_VERSION aan als je Firebase upgradet.
const FIREBASE_VERSION = '12.0.0';

importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`
);
importScripts(
  `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`
);

// Firebase config — dezelfde waarden als in src/firebase.js
// (Firebase config is publiek; beveiliging loopt via Security Rules)
firebase.initializeApp({
  apiKey:            'AIzaSyBztO2lV552pIyGyN3g_k4t450jkR6vSKE',
  authDomain:        'apexos-a0163.firebaseapp.com',
  projectId:         'apexos-a0163',
  storageBucket:     'apexos-a0163.firebasestorage.app',
  messagingSenderId: '464345495611',
  appId:             '1:464345495611:web:cc3b1010b7dfc0d9c7041e',
});

const messaging = firebase.messaging();

// Achtergrondmelding: app is gesloten of in de achtergrond
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Achtergrondmelding ontvangen:', payload);

  const title = payload.notification?.title ?? '☀️ Apex OS';
  const body  = payload.notification?.body  ?? '';

  self.registration.showNotification(title, {
    body,
    icon:    '/favicon.svg',
    badge:   '/favicon.svg',
    vibrate: [200, 100, 200],
    tag:     'morning-briefing',
    data:    payload.data ?? {},
    actions: [{ action: 'open', title: 'Openen' }],
  });
});
