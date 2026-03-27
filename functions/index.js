/**
 * Apex OS — Firebase Cloud Functions v1
 *
 * morningBriefingV1: draait elke dag om 08:00 Amsterdam-tijd,
 * haalt de dagagenda en training op uit Firestore + weer via Open-Meteo,
 * en verstuurt een e-mail via Gmail SMTP (Nodemailer).
 *
 * Vereiste environment config:
 *   firebase functions:config:set gmail.user="jouw@gmail.com" gmail.app_password="xxxx"
 *
 * Deploy:
 *   cd functions && npm install
 *   firebase deploy --only functions
 */

const functions   = require('firebase-functions/v1');
const { initializeApp }  = require('firebase-admin/app');
const { getFirestore }   = require('firebase-admin/firestore');
const { getAuth }        = require('firebase-admin/auth');
const nodemailer         = require('nodemailer');
const https              = require('https');

initializeApp();

const db = getFirestore();

// Gmail SMTP transporter — credentials via environment variables
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

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
    const transporter = createTransporter();

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
    const today = formatter.format(now);

    // Haal weer op via Open-Meteo
    let weatherLine = '';
    try {
      const data = await httpsGet(
        'https://api.open-meteo.com/v1/forecast' +
        '?latitude=52.37&longitude=4.9&current_weather=true&timezone=Europe%2FAmsterdam'
      );
      const temp = Math.round(data.current_weather.temperature);
      const desc = weatherCodeToText(data.current_weather.weathercode);
      weatherLine = `${temp}°C — ${desc}`;
    } catch (e) {
      console.warn('Weer ophalen mislukt:', e.message);
    }

    // Stuur e-mail aan elke user
    const sends = usersSnap.docs.map(async (userDoc) => {
      const uid = userDoc.id;

      // E-mailadres ophalen uit Firebase Auth
      let email;
      try {
        const authUser = await getAuth().getUser(uid);
        email = authUser.email;
      } catch (e) {
        console.warn(`[morningBriefing] Geen Auth-gebruiker voor uid=${uid}:`, e.message);
        return;
      }
      if (!email) return;

      // Agenda-events van vandaag ophalen
      const eventsSnap = await db
        .collection(`users/${uid}/agendaEvents`)
        .where('date', '==', today)
        .get();

      const events = eventsSnap.docs.map((d) => d.data());
      const normalEvents = events.filter((e) => !isTrainingEvent(e));
      const training = events.find(isTrainingEvent);

      // E-mail opbouwen
      const agendaLines = normalEvents.length > 0
        ? normalEvents.map((e) => `• ${e.time ? e.time + ' ' : ''}${e.title}`).join('\n')
        : 'Geen afspraken vandaag.';

      const trainingLine = training
        ? `\n💪 Training: ${training.title}`
        : '\nGeen training gepland.';

      const textBody = [
        `Goedemorgen! Hier is je Apex OS briefing voor ${today}.`,
        '',
        weatherLine ? `🌡️ Weer: ${weatherLine}` : '',
        '',
        '📅 Agenda vandaag:',
        agendaLines,
        trainingLine,
        '',
        '— Apex OS',
      ].filter((l) => l !== null).join('\n');

      const htmlBody = `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
          <h2 style="margin-bottom:4px">☀️ Goedemorgen</h2>
          <p style="color:#666;margin-top:0">${today}</p>
          ${weatherLine ? `<p>🌡️ ${weatherLine}</p>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <h3 style="margin-bottom:8px">📅 Agenda vandaag</h3>
          <pre style="font-family:sans-serif;white-space:pre-wrap;margin:0">${agendaLines}</pre>
          <p>${trainingLine.trim()}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="color:#999;font-size:12px">Apex OS — automatische briefing</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Apex OS" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `☀️ Apex OS Briefing — ${today}`,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[morningBriefing] E-mail verstuurd naar ${email} (uid=${uid})`);
    });

    await Promise.allSettled(sends);
    return null;
  });
