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

const TEST_EMAIL = 'j.toonen04@gmail.com';

async function runBriefing() {
  console.log('[briefing] START');
  console.log('[briefing] GMAIL_USER:', process.env.GMAIL_USER);
  console.log('[briefing] GMAIL_APP_PASSWORD length:', process.env.GMAIL_APP_PASSWORD?.length ?? 0);

  const transporter = createTransporter();

  // Verify SMTP credentials before doing anything else
  try {
    await transporter.verify();
    console.log('[briefing] SMTP verify OK');
  } catch (verifyErr) {
    console.error('[briefing] SMTP verify FOUT:', verifyErr.message);
    return;
  }

  // Vandaag in YYYY-MM-DD formaat (Amsterdam-tijd)
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  console.log('[briefing] today:', today);

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
    console.log('[briefing] weer:', weatherLine);
  } catch (e) {
    console.warn('[briefing] weer ophalen mislukt:', e.message);
  }

  // Haal alle users op uit Firestore
  const usersSnap = await db.collection('users').get();
  console.log('[briefing] users gevonden:', usersSnap.size);
  if (usersSnap.empty) {
    console.warn('[briefing] Geen users in Firestore — stuur test-mail naar', TEST_EMAIL);
  }

  // Bepaal de lijst van ontvangers: gebruikers uit Firestore + altijd TEST_EMAIL als fallback
  const uids = usersSnap.empty ? [null] : usersSnap.docs.map((d) => d.id);

  const sends = uids.map(async (uid) => {
    // E-mailadres ophalen
    let email = TEST_EMAIL;
    if (uid) {
      try {
        const authUser = await getAuth().getUser(uid);
        email = authUser.email || TEST_EMAIL;
      } catch (e) {
        console.warn(`[briefing] Auth lookup mislukt voor uid=${uid}:`, e.message);
      }
    }
    console.log('[briefing] ontvanger:', email, uid ? `(uid=${uid})` : '(fallback)');

    // Agenda-events van vandaag
    let agendaLines = 'Geen afspraken vandaag.';
    let trainingLine = 'Geen training gepland.';
    if (uid) {
      // Debug: log alle events om datumformaat te controleren
      const allEventsSnap = await db.collection(`users/${uid}/agendaEvents`).get();
      console.log(`[debug] Totaal events in Firestore voor uid=${uid}: ${allEventsSnap.size}`);
      allEventsSnap.docs.forEach((d) => console.log('[debug] event:', JSON.stringify(d.data())));

      // Gefilterde query op vandaag
      const eventsSnap = await db
        .collection(`users/${uid}/agendaEvents`)
        .where('date', '==', today)
        .get();
      console.log(`[debug] Events voor vandaag (${today}): ${eventsSnap.size}`);
      const events = eventsSnap.docs.map((d) => d.data());
      const normalEvents = events.filter((e) => !isTrainingEvent(e));
      const training = events.find(isTrainingEvent);
      if (normalEvents.length > 0) {
        agendaLines = normalEvents.map((e) => `• ${e.time ? e.time + ' ' : ''}${e.title}`).join('\n');
      }
      if (training) trainingLine = `💪 Training: ${training.title}`;
      console.log(`[briefing] events: ${events.length} totaal, ${normalEvents.length} normaal`);
    }

    const subject = `☀️ Apex OS Briefing — ${today}`;
    const textBody = [
      `Goedemorgen! Apex OS briefing voor ${today}.`,
      '',
      weatherLine ? `🌡️ Weer: ${weatherLine}` : '',
      '',
      '📅 Agenda vandaag:',
      agendaLines,
      '',
      trainingLine,
      '',
      '— Apex OS',
    ].join('\n');

    const htmlBody = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
        <h2 style="margin-bottom:4px">☀️ Goedemorgen</h2>
        <p style="color:#666;margin-top:0">${today}</p>
        ${weatherLine ? `<p>🌡️ ${weatherLine}</p>` : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <h3 style="margin-bottom:8px">📅 Agenda vandaag</h3>
        <pre style="font-family:sans-serif;white-space:pre-wrap;margin:0">${agendaLines}</pre>
        <p>${trainingLine}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <p style="color:#999;font-size:12px">Apex OS — automatische briefing</p>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"Apex OS" <${process.env.GMAIL_USER}>`,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });
      console.log('[briefing] sendMail OK naar', email, '— response:', info.response);
    } catch (mailErr) {
      console.error('[briefing] sendMail FOUT naar', email);
      console.error('[briefing] error message:', mailErr.message);
      console.error('[briefing] error code:', mailErr.code);
      console.error('[briefing] error response:', mailErr.response);
    }
  });

  await Promise.allSettled(sends);
  console.log('[briefing] DONE');
}

exports.morningBriefingV1 = functions
  .region('europe-west1')
  .pubsub.schedule('0 8 * * *')
  .timeZone('Europe/Amsterdam')
  .onRun(() => runBriefing());

// HTTP trigger voor handmatig testen
exports.triggerBriefing = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    await runBriefing();
    res.send('Briefing verstuurd — check de logs.');
  });
