/**
 * Apex OS — Firebase Cloud Functions v1
 *
 * morningBriefing: draait elke dag om 08:00 Amsterdam-tijd,
 * haalt de dagagenda en training op uit Firestore + weer via Open-Meteo,
 * en verstuurt een FCM pushmelding naar alle geregistreerde apparaten.
 *
 * Deploy:
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const functions = require('firebase-functions/v1');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const https = require('https');

initializeApp();

const db = getFirestore();
const fcm = getMessaging();

// Weercode → leesbare tekst (Open-Meteo WMO codes)
function weatherCodeToText(code) {
  if (code === 0)  return 'Zonnig';
  if (code <= 3)   return 'Bewolkt';
  if (code <= 48)  return 'Mistig';
  if (code <= 57)  return 'Motregen';
  if (code <= 67)  return 'Regen';
  if (code <= 77)  return 'Sneeuw';
  if (code <= 82)  return 'Regenbuien';
  if (code <= 99)  return 'Onweer';
  return '';
}

// Controleer of een agenda-event een training is
function isTrainingEvent(event) {
  if (event.type === 'Training') return true;
  const t = (event.title ?? '').toLowerCase();
  return /training|gym|workout|sport|leg|push|pull|full body/.test(t);
}

// HTTPS GET helper (Node.js native, geen fetch nodig in v1 runtime)
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

exports.morningBriefingV1 = functions
  .region('europe-west1')
  .pubsub.schedule('0 8 * * *')
  .timeZone('Europe/Amsterdam')
  .onRun(async () => {
    // Haal alle users op
    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) return null;

    // Vandaag in YYYY-MM-DD formaat (Amsterdam-tijd)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const today = formatter.format(now); // geeft "YYYY-MM-DD" via en-CA locale

    // Haal weer op via Open-Meteo
    let weatherLine = '';
    try {
      const data = await httpsGet(
        'https://api.open-meteo.com/v1/forecast' +
        '?latitude=52.37&longitude=4.9&current_weather=true&timezone=Europe%2FAmsterdam'
      );
      const temp = Math.round(data.current_weather.temperature);
      const desc = weatherCodeToText(data.current_weather.weathercode);
      weatherLine = `🌡️ ${temp}°C — ${desc}`;
    } catch (e) {
      console.warn('Weer ophalen mislukt:', e.message);
    }

    // Stuur melding aan elke user
    const sends = usersSnap.docs.map(async (userDoc) => {
      const uid = userDoc.id;

      // FCM-token ophalen
      const fcmDoc = await db.doc(`users/${uid}/settings/fcm`).get();
      if (!fcmDoc.exists) return;
      const { token } = fcmDoc.data();
      if (!token) return;

      // Agenda-events van vandaag ophalen
      const eventsSnap = await db
        .collection(`users/${uid}/agendaEvents`)
        .where('date', '==', today)
        .get();

      const events = eventsSnap.docs.map((d) => d.data());
      const normalEvents = events.filter((e) => !isTrainingEvent(e));
      const training = events.find(isTrainingEvent);

      // Berichtregels opbouwen
      const lines = [];
      lines.push(
        normalEvents.length > 0
          ? `📅 ${normalEvents.length} afspraak${normalEvents.length > 1 ? 'en' : ''} vandaag`
          : '📅 Geen afspraken vandaag'
      );
      if (training) lines.push(`💪 Training: ${training.title}`);
      if (weatherLine) lines.push(weatherLine);

      // FCM melding versturen
      await fcm.send({
        token,
        notification: {
          title: '☀️ Goedemorgen — Apex OS Briefing',
          body: lines.join('\n'),
        },
        data: { type: 'morning-briefing', date: today },
        webpush: {
          notification: {
            icon:    'https://apexos-a0163.web.app/favicon.svg',
            badge:   'https://apexos-a0163.web.app/favicon.svg',
            vibrate: [200, 100, 200],
            tag:     'morning-briefing',
          },
          fcmOptions: { link: 'https://apexos-a0163.web.app/' },
        },
      });

      console.log(`[morningBriefing] Melding verstuurd naar uid=${uid}`);
    });

    await Promise.allSettled(sends);
    return null;
  });
