import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestoreCollection } from './hooks/useFirestoreCollection';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import Hub from './components/Hub';
import Agenda from './components/Agenda';
import Focus from './components/Focus';
import Logbook from './components/Logbook';
import Forge from './components/Forge';
import Projects from './components/Projects';
import Achievements from './components/Achievements';
import Settings from './components/Settings';
import Nutrition from './components/Nutrition';
import Habits from './components/Habits';
import { 
  CheckCircle2, Circle, Sparkles, Target, FolderKanban, Bell,
  Activity, Plus, Send, Loader2, Clock, Trophy, TrendingUp,
  CheckSquare, Square, ChevronDown, ChevronUp, Heart,
  CloudRain, BookOpen, CalendarDays,
  Dumbbell, Flame, MapPin, Menu, X, Command, Camera, FileText,
  ArrowRight, Timer, Play, Pause, RotateCcw, Edit3, Triangle,
  Zap, Quote, BookMarked, Smile, Meh, Frown, Trash2, RefreshCw, Settings as SettingsIcon, Link as LinkIcon, Calendar, ChevronLeft, ChevronRight,
  Info, Medal, Award, Utensils, PieChart, BrainCircuit
} from 'lucide-react';

// --- INITIAL DATA ---
const initialProjects = [];
const initialHabits = [
  { id: 1, title: 'Koud Douchen', streak: 12, completedToday: false },
  { id: 2, title: 'Ochtend Run', streak: 4, completedToday: false }
];
const initialGoals = [];
const initialLogs = [];

const forgeQuotes = [
  { text: "No man has the right to be an amateur in the matter of physical training. It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable.", author: "Socrates" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" }
];

// --- HELPER FUNCTIES VOOR ICS KALENDERS ---
const parseICSDate = (icsDateStr) => {
  // Verwerkt bijv. "20231025T090000Z" of "TZID=Europe/Amsterdam:20231025T090000"
  const datePart = icsDateStr.split(':').pop();
  if (!datePart || datePart.length < 8) return { date: '', time: '00:00' };
  
  const year = datePart.substring(0, 4);
  const month = datePart.substring(4, 6);
  const day = datePart.substring(6, 8);
  const date = `${year}-${month}-${day}`;
  
  let time = '00:00';
  if (datePart.includes('T') && datePart.length >= 15) {
    const timeIndex = datePart.indexOf('T');
    const hour = datePart.substring(timeIndex + 1, timeIndex + 3);
    const min = datePart.substring(timeIndex + 3, timeIndex + 5);
    time = `${hour}:${min}`;
  }
  return { date, time };
};

const parseICSData = (icsText, provider) => {
  const events = [];
  // .ics bestanden breken soms lange regels af door de volgende regel met een spatie te beginnen. Dat herstellen we eerst.
  const lines = icsText.replace(/\r\n /g, '').replace(/\n /g, '').split(/\r\n|\n|\r/);
  let currentEvent = null;

  lines.forEach(line => {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = { id: Date.now() + Math.random(), type: provider, completed: false, description: '', location: '' };
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      if (currentEvent.title && currentEvent.date) events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8);
      } else if (line.startsWith('DTSTART')) {
        const { date, time } = parseICSDate(line);
        currentEvent.date = date;
        currentEvent.time = time;
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9);
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12).replace(/\\n/g, '\n');
      }
    }
  });
  return events;
};

// --- ALGEMENE HELPER FUNCTIES ---
const isTrainingEvent = (e, splitStr = '') => {
  if (e.type === 'Training') return true;
  if (!e.title) return false;
  const t = e.title.toLowerCase();
  if (t.includes('training') || t.includes('gym') || t.includes('workout') || t.includes('fitness') || t.includes('sport') || t.includes('leg') || t.includes('push') || t.includes('pull') || t.includes('full body')) return true;
  if (splitStr) {
    const splits = splitStr.toLowerCase().split('/').map(s => s.trim()).filter(Boolean);
    if (splits.length > 0 && splits.some(split => t.includes(split))) return true;
  }
  return false;
};

const getAIGeneratedSteps = (title, type) => {
  const lower = title.toLowerCase();
  let steps = [];
  if (type === 'goal') {
    if (lower.includes('afvallen') || lower.includes('kilo') || lower.includes('gewicht')) steps = ['Huidige inname tracken', 'Calorietekort bepalen', 'Wekelijks weegmoment plannen'];
    else if (lower.includes('lezen') || lower.includes('boek')) steps = ['Boekenlijst maken', 'Vast leesmoment inplannen', 'Eerste 20 pagina\'s lezen'];
    else steps = [`Nulmeting voor '${title}' uitvoeren`, 'Subdoelen bepalen', 'Eerste actie uitvoeren'];
  } else {
    if (lower.includes('website') || lower.includes('app')) steps = ['Wireframes schetsen', 'Tech stack bepalen', 'Domeinnaam vastleggen', 'MVP bouwen'];
    else if (lower.includes('vakantie') || lower.includes('reis')) steps = ['Bestemming en budget bepalen', 'Vluchten en verblijf boeken', 'Reisplan maken'];
    else steps = ['Project scope definiëren', 'Benodigdheden verzamelen', 'Eerste fase starten', 'Review moment inplannen'];
  }
  return steps.map((t, i) => ({ id: Date.now() + i + 1, title: t, completed: false }));
};

export default function App() {
  // --- AUTH ---
  const { user, loading: authLoading, signIn } = useAuth();
  const uid = user?.uid ?? null;


  // --- STATE ---
  const [activeTab, setActiveTab] = useState('hub');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const [todayISO, setTodayISO] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  // Refs
  const scrollContainerRef = useRef(null);
  const aiInputRef = useRef(null);
  const logbookEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasAutoPlannedRef = useRef(false);
  const lastAgendaLengthRef = useRef(0);
  const lastPlannedWeekRef = useRef(null);
  const globalSplitIndexRef = useRef(0);
  
  const [projects, setProjects] = useFirestoreCollection(uid ? `users/${uid}/projects` : null, initialProjects);
  const [habits, setHabits] = useFirestoreCollection(uid ? `users/${uid}/habits` : null, initialHabits);
  const [goals, setGoals] = useFirestoreCollection(uid ? `users/${uid}/goals` : null, initialGoals);
  const [isYasminMode, setIsYasminMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('isYasminMode')) ?? false; } catch { return false; }
  });
  useEffect(() => { localStorage.setItem('isYasminMode', JSON.stringify(isYasminMode)); }, [isYasminMode]);

  const [scratchpad, setScratchpadState] = useState(() => localStorage.getItem('scratchpad') ?? '');
  useEffect(() => { localStorage.setItem('scratchpad', scratchpad); }, [scratchpad]);
  const setScratchpad = (v) => setScratchpadState(prev => typeof v === 'function' ? v(prev) : v);
  
  // Logbook State
  const [logs, setLogs] = useFirestoreCollection(uid ? `users/${uid}/logs` : null, initialLogs);
  const [newLogText, setNewLogText] = useState('');
  const [newLogMood, setNewLogMood] = useState('good');

  // Forge / Health State — persisted to localStorage
  const [healthStats, setHealthStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('healthStats')) ?? { weight: '75', height: '180' }; } catch { return { weight: '75', height: '180' }; }
  });
  useEffect(() => { localStorage.setItem('healthStats', JSON.stringify(healthStats)); }, [healthStats]);

  const [trainingGoal, setTrainingGoal] = useState(() => localStorage.getItem('trainingGoal') ?? 'Spieropbouw (Bulk)');
  useEffect(() => { localStorage.setItem('trainingGoal', trainingGoal); }, [trainingGoal]);

  const [workoutSplit, setWorkoutSplit] = useState(() => localStorage.getItem('workoutSplit') ?? 'Push / Pull / Legs');
  useEffect(() => { localStorage.setItem('workoutSplit', workoutSplit); }, [workoutSplit]);

  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trainingDaysPerWeek')) ?? 3; } catch { return 3; }
  });
  useEffect(() => { localStorage.setItem('trainingDaysPerWeek', JSON.stringify(trainingDaysPerWeek)); }, [trainingDaysPerWeek]);

  const [autoScheduleTrainings, setAutoScheduleTrainings] = useState(() => {
    try { const v = localStorage.getItem('autoScheduleTrainings'); return v === null ? true : JSON.parse(v); } catch { return true; }
  });
  useEffect(() => { localStorage.setItem('autoScheduleTrainings', JSON.stringify(autoScheduleTrainings)); }, [autoScheduleTrainings]);
  const [currentSession, setCurrentSession] = useState('');
  
  // Nutrition State
  const [dailyMacros, setDailyMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [newMacroEntry, setNewMacroEntry] = useState({ calories: '', protein: '', carbs: '', fats: '' });

  // --- WORKOUT LOGS ---
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [activeForgeEventId, setActiveForgeEventId] = useState(null);
  const [newExercise, setNewExercise] = useState({ name: '', sets: 3, reps: 10, weight: '' });
  
  const [fitnessAdvice, setFitnessAdvice] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  
  // AI Response Modal
  const [aiResponse, setAiResponse] = useState(null);

  // Camera State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);

  // Focus Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // UI State
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [expandedGoalId, setExpandedGoalId] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [toastTimer, setToastTimer] = useState(null);
  
  // Popup / Event Modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // --- DYNAMISCHE DATA ---
  const [weather, setWeather] = useState({ temp: '--', condition: 'Zoeken...', location: 'Locatie bepalen...' });
  const [currentTime, setCurrentTime] = useState('');
  
  const [agendaEvents, setAgendaEvents] = useFirestoreCollection(uid ? `users/${uid}/agendaEvents` : null, []);
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventSource, setNewEventSource] = useState('Privé');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Agenda settings — persisted to localStorage
  const [connectedAgendas, setConnectedAgendas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('connectedAgendas')) ?? { Google: false, Apple: false, Outlook: false, 'Andere Agenda': false }; } catch { return { Google: false, Apple: false, Outlook: false, 'Andere Agenda': false }; }
  });
  useEffect(() => { localStorage.setItem('connectedAgendas', JSON.stringify(connectedAgendas)); }, [connectedAgendas]);

  const [agendaUrls, setAgendaUrls] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agendaUrls')) ?? { Apple: '', 'Andere Agenda': '' }; } catch { return { Apple: '', 'Andere Agenda': '' }; }
  });
  useEffect(() => { localStorage.setItem('agendaUrls', JSON.stringify(agendaUrls)); }, [agendaUrls]);
  const [isConnecting, setIsConnecting] = useState(null);

  // Init Data & Live Klok
  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    setCurrentDateFormatted(now.toLocaleDateString('nl-NL', options));
    
    const offset = now.getTimezoneOffset();
    const localISO = new Date(now.getTime() - (offset*60*1000)).toISOString().split('T')[0];
    setTodayISO(localISO);
    setNewEventDate(localISO);

    setQuoteIndex(Math.floor(Math.random() * forgeQuotes.length));
    
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Echte Locatie & Weer ophalen
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=nl`);
          const geoData = await geoRes.json();
          const city = geoData.city || geoData.locality || "Onbekend";

          const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const weatherData = await weatherRes.json();
          const temp = Math.round(weatherData.current_weather.temperature);
          const code = weatherData.current_weather.weathercode;
          
          let condition = 'Helder';
          if (code > 0 && code <= 3) condition = 'Bewolkt';
          if (code >= 45 && code <= 48) condition = 'Mist';
          if (code >= 51 && code <= 67) condition = 'Regen';
          if (code >= 71 && code <= 77) condition = 'Sneeuw';
          if (code >= 95) condition = 'Onweer';

          setWeather({ temp, condition, location: city });
        } catch (error) {
          setWeather({ temp: '--', condition: 'Fout', location: 'Offline' });
        }
      }, () => {
        setWeather({ temp: '--', condition: 'Geen toegang', location: 'Locatie geblokkeerd' });
      });
    }
  }, []);

  // HABITS NAAR AGENDA SYNC ENGINE
  useEffect(() => {
    if (!todayISO) return;
    setAgendaEvents(prev => {
      let updated = [...prev];
      let changed = false;
      habits.forEach(habit => {
        const eventIndex = updated.findIndex(e => e.habitId === habit.id && e.date === todayISO);
        if (eventIndex === -1) {
          updated.push({ 
            id: `habit-${habit.id}-${todayISO}`, 
            habitId: habit.id, 
            date: todayISO, 
            time: '08:00', 
            title: habit.title, 
            type: 'Habit', 
            completed: habit.completedToday 
          });
          changed = true;
        } else if (updated[eventIndex].completed !== habit.completedToday) {
          updated[eventIndex] = { ...updated[eventIndex], completed: habit.completedToday };
          changed = true;
        }
      });
      if (changed) {
        return updated.sort((a, b) => { 
          const dateCompare = a.date.localeCompare(b.date); 
          return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time); 
        });
      }
      return prev;
    });
  }, [habits, todayISO]);

  // Scroll Fix & Body Lock
  useEffect(() => { 
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  }, [activeTab]);

  useEffect(() => { 
    document.body.style.overflow = (isMobileMenuOpen || isMoreMenuOpen || selectedEvent || aiResponse) ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen, isMoreMenuOpen, selectedEvent, aiResponse]);

  // Cmd+K Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { 
        e.preventDefault(); 
        if (aiInputRef.current) aiInputRef.current.focus(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus Timer Logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Training Data Computed Properties
  const trainingEvents = useMemo(() => {
    if (!todayISO) return [];
    const now = new Date();
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); 
    const currentWeekDates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - currentDayOfWeek + i);
      const offset = d.getTimezoneOffset();
      currentWeekDates.push(new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0]);
    }
    return agendaEvents
      .filter(e => isTrainingEvent(e, workoutSplit) && currentWeekDates.includes(e.date))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [agendaEvents, workoutSplit, todayISO]);

  useEffect(() => {
    const todaysTraining = agendaEvents.find(e => e.date === todayISO && isTrainingEvent(e, workoutSplit));
    if (todaysTraining && todaysTraining.title !== currentSession) {
      setCurrentSession(todaysTraining.title);
    } else if (!todaysTraining && currentSession) {
      setCurrentSession('');
    }
  }, [agendaEvents, todayISO, workoutSplit]);

  // Macro Calculation Science-Based Logic
  const calculateMacroTargets = () => {
    const weight = parseFloat(healthStats.weight) || 75;
    let calories = 0, protein = 0, fats = 0, carbs = 0;

    if (trainingGoal === 'Spieropbouw (Bulk)') {
      calories = Math.round(weight * 32 + 300); 
      protein = Math.round(weight * 2.2);
      fats = Math.round(weight * 1.0);
    } else if (trainingGoal === 'Droogtrainen (Cut)') {
      calories = Math.round(weight * 26);
      protein = Math.round(weight * 2.5);
      fats = Math.round(weight * 0.8);
    } else {
      calories = Math.round(weight * 30);
      protein = Math.round(weight * 2.0);
      fats = Math.round(weight * 1.0);
    }
    
    carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
    
    return { calories, protein, carbs, fats };
  };

  const macroTargets = calculateMacroTargets();

  // --- ACTIONS ---
  const triggerToast = (message) => {
    setLastAction(message);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => setLastAction(null), 4000);
    setToastTimer(timer);
  };

  // --- SMART AI BOT ---
  const handleAIQuestion = (query) => {
    const lowerQ = query.toLowerCase();
    const weight = parseFloat(healthStats.weight) || 75;
    const targetPro = calculateMacroTargets().protein;
    
    let answer = "";

    if (lowerQ.includes('eiwit') || lowerQ.includes('proteine') || lowerQ.includes('macros')) {
      answer = `**Macro Analyse voor ${trainingGoal}:**\nJe weegt momenteel ${weight}kg. Voor jouw doelstelling adviseert de literatuur (o.a. Schoenfeld) ongeveer ${targetPro}g eiwit per dag te eten om spiereiwitsynthese te maximaliseren.\n\nJe hebt vandaag **${dailyMacros.protein}g** gelogd.\n\n${dailyMacros.protein < targetPro ? `*Advies:* Je komt nog ${targetPro - dailyMacros.protein}g tekort. Probeer nog een eiwitrijke maaltijd (zoals kwark, kip, of een shake) toe te voegen.` : '*Advies:* Perfect! Je zit uitstekend op je eiwitdoel voor vandaag.'}`;
    } else if (lowerQ.includes('rust') || lowerQ.includes('sets') || lowerQ.includes('tussen')) {
      answer = `**Science-Based Advies (Rusttijden):**\nVoor optimale spiergroei (${trainingGoal}) adviseren recente systematische reviews 2 tot 3 minuten rust voor zware samengestelde oefeningen (bijv. Squats of Bench Press). Dit geeft je centraal zenuwstelsel en ATP-reserves genoeg tijd om te herstellen voor de volgende set.\n\nVoor isolatieoefeningen (bijv. Bicep Curls) is 60-90 seconden vaak voldoende.`;
    } else if (lowerQ.includes('bulk') || lowerQ.includes('aankomen')) {
      answer = `**Bulk Protocol Check:**\nJe huidige doel staat ingesteld op ${trainingGoal}. Een verantwoorde "Lean Bulk" richt zich op een calorie-overschot van 200-300 kcal boven je onderhoud. Zo minimaliseer je vetopslag terwijl je spierweefsel opbouwt.\n\nJe doel is ~${macroTargets.calories} kcal. Je hebt er vandaag ${dailyMacros.calories} gelogd. Blijf consistent trainen (${trainingDaysPerWeek}x per week)!`;
    } else if (lowerQ.includes('spierpijn') || lowerQ.includes('pijn') || lowerQ.includes('doms')) {
      answer = `**Fysiologische Analyse (Spierpijn/DOMS):**\nDelayed Onset Muscle Soreness (DOMS) piekt meestal 24-48 uur na de training. Het betekent dat je spiervezels microscheurtjes hebben opgelopen.\n\n*Wat te doen?*\nZorg dat je vandaag je eiwitdoel (${targetPro}g) haalt voor optimaal herstel, blijf gehydrateerd, en overweeg actieve herstelbewegingen (wandelen, licht fietsen) om de doorbloeding te stimuleren. Train een spiergroep niet zwaar als deze nog erg pijnlijk is.`;
    } else {
      answer = `**Algemeen AI Advies:**\nIk zie dat je doel ${trainingGoal} is, je ${weight}kg weegt en een ${workoutSplit} schema volgt.\n\nOm je specifieke vraag goed te beantwoorden, kijk ik naar evidence-based richtlijnen voor krachttraining en voeding. Zorg er in ieder geval voor dat je progressieve overload toepast in de gym en je ${macroTargets.calories} kcal budget in de gaten houdt via het Nutrition tabblad!`;
    }

    setAiResponse({ query: query.replace(/vraag:|advies:/i, '').trim() + "?", answer });
  };

  const handleAISubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      const inputLower = aiInput.toLowerCase();
      let actionTaken = '';
      const cleanInput = (regex) => aiInput.replace(regex, '').trim();

      if (inputLower.startsWith('vraag') || inputLower.includes('advies') || inputLower.includes('hoeveel') || inputLower.includes('waarom') || inputLower.includes('?')) {
        handleAIQuestion(aiInput);
        actionTaken = 'AI Analyse gegenereerd.';
      }
      else if (inputLower.includes('hub') || inputLower.includes('morning')) { 
        setActiveTab('hub'); actionTaken = 'Morning Hub geopend.'; 
      }
      else if (inputLower.includes('forge') || inputLower.includes('fitness') || inputLower.includes('gym') || inputLower.includes('train')) { 
        setActiveTab('forge'); actionTaken = 'The Forge geopend.'; 
      }
      else if (inputLower.includes('macro') || inputLower.includes('voeding') || inputLower.includes('eten') || inputLower.includes('food')) { 
        setActiveTab('nutrition'); actionTaken = 'Nutrition Tracker geopend.'; 
      }
      else if (inputLower.includes('focus') || inputLower.includes('timer') || inputLower.includes('work')) { 
        setActiveTab('focus'); actionTaken = 'Focus Mode gestart.'; 
        if (inputLower.includes('start')) setIsTimerRunning(true); 
      }
      else if (inputLower.includes('settings') || inputLower.includes('instellingen')) { 
        setActiveTab('settings'); actionTaken = 'Instellingen geopend.'; 
      }
      else if (inputLower.includes('agenda') || inputLower.includes('calendar')) { 
        setActiveTab('agenda'); actionTaken = 'Agenda geopend.'; 
      }
      else if (inputLower.includes('habit') || inputLower.includes('gewoonte')) {
        const title = cleanInput(/maak|start|daily|nieuwe|nieuw|habit:|habit|gewoonte:|gewoonte/gi);
        setHabits([{ id: Date.now(), title: title.charAt(0).toUpperCase() + title.slice(1), streak: 0, completedToday: false }, ...habits]);
        setActiveTab('habits'); actionTaken = 'Habit toegevoegd en gesynchroniseerd met agenda.';
      } else if (inputLower.includes('goal') || inputLower.includes('doel')) {
        const title = cleanInput(/maak|start|nieuwe|nieuw|goal:|goal|doel:|doel/gi);
        const cleanTitle = title.charAt(0).toUpperCase() + title.slice(1);
        const newGoal = { id: Date.now(), title: cleanTitle, category: 'Personal', progress: 0, steps: getAIGeneratedSteps(cleanTitle, 'goal') };
        setGoals([newGoal, ...goals]); setExpandedGoalId(newGoal.id);
        setActiveTab('goals'); actionTaken = 'Doel aangemaakt met AI actiestappen.';
      } else if (inputLower.includes('project')) {
        const title = cleanInput(/maak|start|nieuwe|nieuw|project:|project/gi);
        const cleanTitle = title.charAt(0).toUpperCase() + title.slice(1);
        const newProject = { id: Date.now(), title: cleanTitle, category: 'Work', tags: ['AI Generated'], progress: 0, tasks: getAIGeneratedSteps(cleanTitle, 'project') };
        setProjects([newProject, ...projects]); setExpandedProjectId(newProject.id);
        setActiveTab('projects'); actionTaken = 'Project aangemaakt met AI planning.';
      } else if (inputLower.includes('journal') || inputLower.includes('log') || inputLower.includes('dagboek')) {
        const text = cleanInput(/journal:|log:|journal|log|dagboek:|dagboek/gi);
        handleAddLog(text); setActiveTab('logbook'); actionTaken = 'Opgeslagen in Logbook.';
      } else {
        setScratchpad(prev => prev + (prev ? '\n' : '') + `• ${aiInput.charAt(0).toUpperCase() + aiInput.slice(1)}`);
        setActiveTab('hub'); actionTaken = 'Notitie toegevoegd aan Brain Dump.';
      }

      if (!inputLower.includes('?')) triggerToast(actionTaken);
      setAiInput(''); setIsProcessing(false);
      if(aiInputRef.current) aiInputRef.current.blur();
    }, 1200);
  };

  const handleAddLog = (overrideText = null) => {
    const textToSave = overrideText || newLogText;
    if (!textToSave.trim()) return;
    const now = new Date();
    setLogs(prev => [{ 
      id: Date.now(), 
      date: currentDateFormatted, 
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), 
      mood: newLogMood, 
      text: textToSave 
    }, ...prev]);
    
    if (!overrideText) { 
      setNewLogText(''); 
      triggerToast('Journal entry saved successfully.'); 
    }
    
    setTimeout(() => { 
      if (logbookEndRef.current) {
        logbookEndRef.current.scrollIntoView({ behavior: 'smooth' }); 
      }
    }, 100);
  };

  const handleGenerateFitnessPlan = () => {
    if (!healthStats.weight || !healthStats.height) { 
      triggerToast("Vul eerst je gewicht en lengte in bij Settings!"); 
      return; 
    }
    setIsGeneratingPlan(true); 
    setFitnessAdvice('');
    setTimeout(() => {
      const bmi = (parseFloat(healthStats.weight) / Math.pow(parseFloat(healthStats.height)/100, 2)).toFixed(1);
      const dayName = new Date().toLocaleDateString('nl-NL', { weekday: 'long' });
      
      let advice = `**Lichaamsanalyse:** BMI is ${bmi}. Doelstelling: **${trainingGoal}**.\n\n**AI Protocol Directive:**\n`;
      advice += `• Voeding Target Vandaag: Neem ongeveer **${macroTargets.calories} kcal** met **${macroTargets.protein}g eiwit** om je doel te ondersteunen.\n`;
      
      if (currentSession) {
        advice += `• Workout: Het is ${dayName}, vandaag staat **${currentSession}** op het schema.\n`;
        advice += `• Omgevingsfactor: ${weather.temp}°C in ${weather.location}.\n`;
        advice += `• Focus: Train dicht tegen spierfalen aan voor optimale stimulus en zorg dat je pre-workout maaltijd genoeg koolhydraten bevat voor energie.`;
      } else if (workoutSplit) {
        advice += `• Tip: Macro Cyclus **${workoutSplit}** is actief, maar geen sessie gepland vandaag. Rust goed of gebruik Auto-Plan.`;
      }

      setFitnessAdvice(advice);
      setIsGeneratingPlan(false);
    }, 1500);
  };

  const handleAIAutoPlan = (isSilent = false) => {
    if (!workoutSplit) return;
    setIsProcessing(true);
    setTimeout(() => {
      setAgendaEvents(prevAgenda => {
        let splits = workoutSplit.split('/').map(s => s.trim()).filter(Boolean);
        if (splits.length === 0) splits = ['Full Body'];

        // Local helper: matches any training event including manually added split-named events
        const isOccupiedByTraining = (e) => {
          if (e.type === 'Training') return true;
          const t = (e.title ?? '').toLowerCase();
          const splitKeywords = splits.map(s => s.toLowerCase());
          return splitKeywords.some(k => t.includes(k)) || /gym|workout|sport|full body/.test(t);
        };

        const now = new Date();
        const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

        // Build current week (Mon–Sun)
        const currentWeekDates = [];
        for (let i = 1; i <= 7; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - currentDayOfWeek + i);
          const offset = d.getTimezoneOffset();
          currentWeekDates.push(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
        }

        // Build next week (Mon–Sun)
        const nextWeekDates = [];
        for (let i = 8; i <= 14; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - currentDayOfWeek + i);
          const offset = d.getTimezoneOffset();
          nextWeekDates.push(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]);
        }

        const allTwoWeekDates = [...currentWeekDates, ...nextWeekDates];
        const todayIndex = currentDayOfWeek - 1;
        const futureWeekDates = [...currentWeekDates.slice(todayIndex), ...nextWeekDates];

        const cleanedAgenda = prevAgenda.filter(e => !(e.isAI && futureWeekDates.includes(e.date)));
        const daysWithFixedTraining = cleanedAgenda.filter(e => isOccupiedByTraining(e) && allTwoWeekDates.includes(e.date)).map(e => e.date);
        const daysWithTrainingThisWeek = new Set(daysWithFixedTraining.filter(d => currentWeekDates.includes(d))).size;
        const daysWithTrainingNextWeek = new Set(daysWithFixedTraining.filter(d => nextWeekDates.includes(d))).size;
        const neededThisWeek = Math.max(0, trainingDaysPerWeek - daysWithTrainingThisWeek);
        const neededNextWeek = Math.max(0, trainingDaysPerWeek - daysWithTrainingNextWeek);
        const neededTrainings = neededThisWeek + neededNextWeek;

        if (neededTrainings === 0) return cleanedAgenda;

        const selectBestDays = (candidateDates, needed, alreadyPlanned) => {
          if (needed === 0) return [];

          const scoreDays = (candidates, planned) => {
            return candidates.map(date => {
              const dayIndex = allTwoWeekDates.indexOf(date);
              const eventsOnDay = cleanedAgenda.filter(e => e.date === date && !isOccupiedByTraining(e) && !e.isAI).length;

              let penalty = 0;
              const prevDate = dayIndex > 0 ? allTwoWeekDates[dayIndex - 1] : null;
              const nextDate = dayIndex < 13 ? allTwoWeekDates[dayIndex + 1] : null;
              if (prevDate && planned.includes(prevDate)) penalty += 1000;
              if (nextDate && planned.includes(nextDate)) penalty += 1000;

              const weekPos = dayIndex % 7;
              const spreadBonus = Math.abs(weekPos - 3) * 10;

              return { date, score: eventsOnDay + penalty + spreadBonus };
            });
          };

          const selected = [];
          const planned = [...alreadyPlanned];
          const remaining = [...candidateDates];

          for (let i = 0; i < needed; i++) {
            if (remaining.length === 0) break;
            const scored = scoreDays(remaining, planned);
            scored.sort((a, b) => a.score - b.score);
            const best = scored[0];
            selected.push({ date: best.date });
            planned.push(best.date);
            remaining.splice(remaining.indexOf(best.date), 1);
          }

          return selected;
        };

        // Select days for this week and next week separately
        const thisWeekAvailable = futureWeekDates.filter(d => currentWeekDates.includes(d) && !daysWithFixedTraining.includes(d));
        const nextWeekAvailable = nextWeekDates.filter(d => !daysWithFixedTraining.includes(d));

        const thisWeekFixed = daysWithFixedTraining.filter(d => currentWeekDates.includes(d));
        const nextWeekFixed = daysWithFixedTraining.filter(d => nextWeekDates.includes(d));

        const selectedThisWeek = selectBestDays(thisWeekAvailable, neededThisWeek, thisWeekFixed);
        const selectedNextWeek = selectBestDays(nextWeekAvailable, neededNextWeek, nextWeekFixed);
        const selectedDays = [...selectedThisWeek, ...selectedNextWeek];
        
        // Split rotation is continuous across both weeks — count ALL existing training events in order
        const allExistingTrainings = cleanedAgenda
          .filter(e => isOccupiedByTraining(e) && allTwoWeekDates.includes(e.date))
          .sort((a, b) => a.date.localeCompare(b.date));
        // Count ALL training events ever planned (across all weeks in agenda) to determine rotation position
        const allTrainingsEver = prevAgenda
          .filter(e => isOccupiedByTraining(e))
          .sort((a, b) => a.date.localeCompare(b.date));
        let globalSplitIndex = allTrainingsEver.length % splits.length;

        // Sort selectedDays chronologically so rotation is in date order
        const sortedSelectedDays = [...selectedDays].sort((a, b) => a.date.localeCompare(b.date));

        const newEvents = sortedSelectedDays.map((dayObj) => {
          const splitIndex = globalSplitIndex;
          globalSplitIndex = (globalSplitIndex + 1) % splits.length;
          return {
            id: Date.now() + Math.random(),
            date: dayObj.date,
            time: '18:00',
            title: splits[splitIndex],
            type: 'Training',
            isAI: true,
            completed: false
          };
        });
        
        if (!isSilent) setTimeout(() => triggerToast(`Slim herpland: ${selectedDays.length} missende sessie(s) optimaal ingepland!`), 100);
        return [...cleanedAgenda, ...newEvents].sort((a, b) => a.date.localeCompare(b.date));
      });
      setIsProcessing(false);
    }, 800);
  };

  useEffect(() => {
    if (!autoScheduleTrainings || !workoutSplit || !todayISO) return;

    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - day + 1);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - day + 14);
    const fmt = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const weekKey = `${fmt(weekStart)}_${fmt(weekEnd)}`;

    const nonAICount = agendaEvents.filter(e => !e.isAI).length;

    if (lastPlannedWeekRef.current === weekKey && nonAICount === lastAgendaLengthRef.current) return;

    lastPlannedWeekRef.current = weekKey;
    lastAgendaLengthRef.current = nonAICount;

    const timer = setTimeout(() => { handleAIAutoPlan(true); }, 500);
    return () => clearTimeout(timer);
  }, [autoScheduleTrainings, workoutSplit, todayISO, trainingDaysPerWeek, agendaEvents]);

  const handleImageUpload = (e) => {
    if (!activeForgeEventId) return;
    const file = e.target.files[0]; 
    if (!file) return;
    
    setScannedImage(URL.createObjectURL(file)); 
    setIsScanning(true);
    
    setTimeout(() => {
      setWorkoutLogs(prev => ({ 
        ...prev, 
        [activeForgeEventId]: [...(prev[activeForgeEventId] || []), { id: Date.now(), name: 'Gescande Oefening (Vul aan)', sets: 3, reps: 10, weight: '-', completed: false }] 
      }));
      setIsScanning(false); 
      setScannedImage(null); 
      triggerToast('Foto geanalyseerd: Oefening klaargezet in log.');
    }, 3500);
  };

  const addExercise = () => { 
    if (newExercise.name.trim() && activeForgeEventId) { 
      setWorkoutLogs(prev => ({ 
        ...prev, 
        [activeForgeEventId]: [...(prev[activeForgeEventId] || []), { ...newExercise, id: Date.now(), completed: false }] 
      }));
      setNewExercise({ name: '', sets: 3, reps: 10, weight: '' }); 
    } 
  };

  const toggleExercise = (id) => { 
    if (!activeForgeEventId) return;
    setWorkoutLogs(prev => ({ 
      ...prev, 
      [activeForgeEventId]: prev[activeForgeEventId].map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex) 
    }));
  };

  const handleDeleteExercise = (id) => {
    if (!activeForgeEventId) return;
    setWorkoutLogs(prev => ({ 
      ...prev, 
      [activeForgeEventId]: prev[activeForgeEventId].filter(ex => ex.id !== id) 
    }));
  };

  const toggleHabit = (id, e) => {
    if (e) e.stopPropagation();
    setHabits(prevHabits => prevHabits.map(h => 
      h.id === id ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1) } : h 
    ));
  };

  const handleDeleteHabit = (id, e) => {
    if (e) e.stopPropagation();
    setHabits(prev => prev.filter(h => h.id !== id));
    setAgendaEvents(prev => prev.filter(event => !(event.type === 'Habit' && event.habitId === id)));
    triggerToast('Gewoonte succesvol verwijderd.');
  };
  
  const toggleProjectTask = (projectId, taskId, e) => { 
    if (e) e.stopPropagation(); 
    setProjects(projects.map(p => { 
      if (p.id === projectId) { 
        const newTasks = p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t); 
        return { ...p, tasks: newTasks, progress: newTasks.length > 0 ? Math.round((newTasks.filter(t => t.completed).length / newTasks.length) * 100) : 0 }; 
      } 
      return p; 
    })); 
  };

  const handleDeleteProject = (projectId, e) => { 
    e.stopPropagation(); 
    setProjects(projects.filter(p => p.id !== projectId)); 
  };
  
  const toggleGoalStep = (goalId, stepId, e) => { 
    if (e) e.stopPropagation(); 
    setGoals(goals.map(g => { 
      if (g.id === goalId) { 
        const newSteps = g.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s); 
        return { ...g, steps: newSteps, progress: newSteps.length > 0 ? Math.round((newSteps.filter(s => s.completed).length / newSteps.length) * 100) : 0 }; 
      } 
      return g; 
    })); 
  };

  const handleAddAgendaEvent = (e) => {
    e.preventDefault(); 
    if (!newEventTime || !newEventTitle || !newEventDate) return;
    const newEvent = { 
      id: Date.now(), 
      date: newEventDate, 
      time: newEventTime, 
      title: newEventTitle, 
      type: newEventSource, 
      location: newEventLocation, 
      description: newEventDescription, 
      completed: false 
    };
    setAgendaEvents(prev => [...prev, newEvent].sort((a, b) => { 
      const dateCompare = a.date.localeCompare(b.date); 
      return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time); 
    }));
    setNewEventTitle(''); setNewEventTime(''); setNewEventLocation(''); setNewEventDescription('');
  };

  const handleDeleteAgendaEvent = (id) => setAgendaEvents(agendaEvents.filter(event => event.id !== id));

  const toggleAgendaEventCompleted = (id, e) => {
    if (e) e.stopPropagation();
    let toggledHabitId = null; 
    let newCompletedStatus = false;
    
    setAgendaEvents(prev => {
      return prev.map(event => {
        if (event.id === id) {
          if (event.type === 'Habit' && event.habitId) { 
            toggledHabitId = event.habitId; 
            newCompletedStatus = !event.completed; 
          }
          return { ...event, completed: !event.completed };
        } 
        return event;
      });
    });

    if (toggledHabitId) {
      setHabits(currentHabits => currentHabits.map(h => {
        if (h.id === toggledHabitId) {
          return { ...h, completedToday: newCompletedStatus, streak: newCompletedStatus ? h.streak + 1 : Math.max(0, h.streak - 1) };
        }
        return h;
      }));
    }
  };

  // --- AGENDA CONNECTIES (ECHTE FETCH & PARSE) ---
  const handleConnectApiAgenda = (provider) => {
    setIsConnecting(provider);
    setTimeout(() => {
      setConnectedAgendas(prev => ({ ...prev, [provider]: true })); 
      setIsConnecting(null);
      setAgendaEvents(prev => {
        const newEvent = { 
          id: Date.now() + Math.random(), 
          date: todayISO, 
          time: `10:00`, 
          title: `Gesimuleerde afspraak via OAuth van ${provider}`, 
          type: provider, 
          completed: false 
        };
        return [...prev, newEvent].sort((a,b) => {
          const dateCompare = a.date.localeCompare(b.date); 
          return dateCompare !== 0 ? dateCompare : a.time.localeCompare(b.time);
        });
      });
      triggerToast(`${provider} succesvol gekoppeld!`);
    }, 2500);
  };

  const handleConnectUrlAgenda = async (provider) => {
    const url = agendaUrls[provider];
    if (!url) return;
    setIsConnecting(provider);

    const normalizedUrl = url.replace(/^webcal:\/\//i, 'https://');

    try {
      const response = await fetch(`/api/proxy-ics?url=${encodeURIComponent(normalizedUrl)}`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error(`Server fout: ${response.status}`);

      const icsText = await response.text();

      if (!icsText.includes('BEGIN:VCALENDAR') && !icsText.includes('BEGIN:VEVENT')) {
        throw new Error('Ongeldig kalender formaat. Dit lijkt geen .ics bestand te zijn.');
      }

      const parsedEvents = parseICSData(icsText, provider);

      if (parsedEvents.length === 0) {
        triggerToast('Agenda ingeladen, maar er werden geen (toekomstige/leesbare) afspraken gevonden.');
        setIsConnecting(null);
        return;
      }

      setConnectedAgendas(prev => ({ ...prev, [provider]: true }));
      setAgendaEvents(prev => {
        const filtered = prev.filter(e => e.type !== provider);
        return [...filtered, ...parsedEvents].sort((a, b) => {
          const dc = a.date.localeCompare(b.date);
          return dc !== 0 ? dc : a.time.localeCompare(b.time);
        });
      });

      triggerToast(`Succes! ${parsedEvents.length} afspraken ingeladen vanuit de link.`);
    } catch (error) {
      console.error('ICS Sync Error:', error);
      triggerToast(`Fout bij koppelen: ${error.message}`);
    } finally {
      setIsConnecting(null);
    }
  };

  // Auto-hersync ICS agenda's bij reload
  useEffect(() => {
    if (!uid || !agendaUrls || !connectedAgendas) return;
    const providers = ['Apple', 'Andere Agenda'];
    providers.forEach(async (provider) => {
      const url = (agendaUrls[provider] || '').trim();
      const isConnected = connectedAgendas[provider];
      if (!url || !isConnected) return;
      const normalizedUrl = url.replace(/^webcal:\/\//i, 'https://');
      try {
        const response = await fetch(`/api/proxy-ics?url=${encodeURIComponent(normalizedUrl)}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return;
        const icsText = await response.text();
        if (!icsText.includes('BEGIN:VCALENDAR')) return;
        const parsedEvents = parseICSData(icsText, provider);
        if (parsedEvents.length === 0) return;
        setAgendaEvents(prev => {
          const filtered = prev.filter(e => e.type !== provider);
          return [...filtered, ...parsedEvents].sort((a, b) => {
            const dc = a.date.localeCompare(b.date);
            return dc !== 0 ? dc : a.time.localeCompare(b.time);
          });
        });
      } catch (e) {
        console.error('Auto-hersync mislukt voor', provider, e);
      }
    });
  }, [uid]);

  const handleDisconnectAgenda = (provider) => {
    setConnectedAgendas(prev => ({ ...prev, [provider]: false }));
    setAgendaEvents(prev => prev.filter(event => event.type !== provider));
    setAgendaUrls(prev => ({ ...prev, [provider]: '' }));
    triggerToast(`${provider} ontkoppeld en alle gerelateerde afspraken opgeschoond.`);
  };

  const addMacros = (e) => {
    e.preventDefault();
    setDailyMacros({
      calories: dailyMacros.calories + (parseInt(newMacroEntry.calories) || 0),
      protein: dailyMacros.protein + (parseInt(newMacroEntry.protein) || 0),
      carbs: dailyMacros.carbs + (parseInt(newMacroEntry.carbs) || 0),
      fats: dailyMacros.fats + (parseInt(newMacroEntry.fats) || 0)
    });
    setNewMacroEntry({ calories: '', protein: '', carbs: '', fats: '' });
    triggerToast('Macro\'s toegevoegd aan vandaag.');
  };

  const getEventColor = (type) => {
    switch(type) {
      case 'Habit': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]';
      case 'Google': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]';
      case 'Apple': return 'bg-zinc-100 shadow-[0_0_10px_rgba(244,244,245,0.6)]';
      case 'Outlook': return 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.6)]';
      case 'Andere Agenda': return 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]';
      case 'Werk': return 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)]';
      case 'Privé': return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]';
      case 'Training': return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]';
      default: return 'bg-cyan-500';
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => { setIsTimerRunning(false); setTimeLeft(25 * 60); };

  const pendingTasks = useMemo(() => projects.flatMap(p => p.tasks.map(t => ({...t, projectName: p.title, projectId: p.id}))).filter(t => !t.completed), [projects]);
  const todaysEvents = useMemo(() => agendaEvents.filter(e => e.date === todayISO), [agendaEvents, todayISO]);
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = new Date(currentYear, currentMonth, 1).getDay() === 0 ? 6 : new Date(currentYear, currentMonth, 1).getDay() - 1; 
  const monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];
  
  const handlePrevMonth = () => currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(currentYear - 1)) : setCurrentMonth(currentMonth - 1);
  const handleNextMonth = () => currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(currentYear + 1)) : setCurrentMonth(currentMonth + 1);

  // --- UI RENDERERS ---

  const NavButton = ({ id, icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? isYasminMode ? 'bg-white/10 text-white' : 'bg-white/10 text-white'
            : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
        }`}
      >
        <span className={`shrink-0 ${isActive ? (isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]') : ''}`}>
          {icon}
        </span>
        {label}
      </button>
    );
  };

  // Auth loading / login gate
  if (authLoading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/10 border-t-[#00D4FF] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <LoginScreen onSignIn={signIn} />;
  }

  return (
    <div className={`flex h-screen ${isYasminMode ? 'bg-[#0d0010]' : 'bg-black'} text-white font-sans overflow-hidden`} style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        ::selection { background: rgba(0,212,255,0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 2px; height: 2px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.15); border-radius: 99px; }
        @media (max-width: 768px) { .custom-scrollbar::-webkit-scrollbar { width: 0; } }
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.3); }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.3); }
      `}} />

      {/* Mobile overlay for sidebar (unused but kept for safety) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] md:hidden" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR — desktop only (md+) */}
      <div className={`hidden md:flex fixed inset-y-0 left-0 z-30 w-[220px] border-r flex-col ${isYasminMode ? 'bg-[#0d0010] border-white/[0.06]' : 'bg-black border-white/[0.06]'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <Triangle className={`w-4 h-4 fill-current ${isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]'}`} />
            <span className="font-black tracking-[0.15em] text-sm text-white">APEX</span>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          <NavButton id="hub"      icon={<Command className="w-4 h-4" />}      label="Hub" />
          <NavButton id="agenda"   icon={<Calendar className="w-4 h-4" />}     label="Agenda" />
          <NavButton id="focus"    icon={<Timer className="w-4 h-4" />}        label="Focus" />
          <NavButton id="projects" icon={<FolderKanban className="w-4 h-4" />} label="Projects" />

          {/* Divider */}
          <div className="my-3 border-t border-white/[0.06]" />

          <NavButton id="forge"     icon={<Dumbbell className="w-4 h-4" />}     label="Forge" />
          <NavButton id="nutrition" icon={<PieChart className="w-4 h-4" />}     label="Nutrition" />
          <NavButton id="habits"    icon={<CheckCircle2 className="w-4 h-4" />} label="Habits" />
          <NavButton id="logbook"   icon={<BookMarked className="w-4 h-4" />}   label="Logbook" />
        </nav>

        {/* Settings pinned at bottom */}
        <div className="p-3 border-t border-white/[0.06] shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
              activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
            }`}
          >
            <SettingsIcon className={`w-4 h-4 ${activeTab === 'settings' ? (isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]') : ''}`} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex flex-col h-screen w-full relative overflow-hidden md:ml-[220px] ${isYasminMode ? 'bg-[#0d0010]' : 'bg-black'}`}>
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar" style={{ padding: '0' }}>
          {/* Inner padding: 16px mobile, 32px 40px desktop. Bottom: 80px mobile (nav), 32px desktop */}
          <div className="px-4 py-4 pb-24 md:px-10 md:py-8 md:pb-8">
          <div className="max-w-5xl mx-auto w-full flex flex-col min-h-full">
            {activeTab === 'hub' && <Hub isYasminMode={isYasminMode} todaysEvents={todaysEvents} currentSession={currentSession} weather={weather} trainingEvents={trainingEvents} trainingDaysPerWeek={trainingDaysPerWeek} todayISO={todayISO} habits={habits} scratchpad={scratchpad} setScratchpad={setScratchpad} agendaEvents={agendaEvents} setActiveTab={setActiveTab} toggleHabit={toggleHabit} toggleAgendaEventCompleted={toggleAgendaEventCompleted} setSelectedEvent={setSelectedEvent} getEventColor={getEventColor} currentTime={currentTime} currentDateFormatted={currentDateFormatted} pendingTasks={pendingTasks} />}
            {activeTab === 'agenda' && <Agenda todayISO={todayISO} agendaEvents={agendaEvents} connectedAgendas={connectedAgendas} newEventTitle={newEventTitle} setNewEventTitle={setNewEventTitle} newEventDate={newEventDate} setNewEventDate={setNewEventDate} newEventTime={newEventTime} setNewEventTime={setNewEventTime} newEventSource={newEventSource} setNewEventSource={setNewEventSource} newEventLocation={newEventLocation} setNewEventLocation={setNewEventLocation} newEventDescription={newEventDescription} setNewEventDescription={setNewEventDescription} currentMonth={currentMonth} currentYear={currentYear} daysInMonth={daysInMonth} startOffset={startOffset} monthNames={monthNames} handleAddAgendaEvent={handleAddAgendaEvent} handlePrevMonth={handlePrevMonth} handleNextMonth={handleNextMonth} setSelectedEvent={setSelectedEvent} getEventColor={getEventColor} />}
            {activeTab === 'focus' && <Focus timeLeft={timeLeft} isTimerRunning={isTimerRunning} pendingTasks={pendingTasks} toggleTimer={toggleTimer} resetTimer={resetTimer} formatTime={formatTime} toggleProjectTask={toggleProjectTask} />}
            {activeTab === 'logbook' && <Logbook logs={logs} newLogText={newLogText} setNewLogText={setNewLogText} newLogMood={newLogMood} setNewLogMood={setNewLogMood} logbookEndRef={logbookEndRef} handleAddLog={handleAddLog} />}
            {activeTab === 'projects' && <Projects projects={projects} expandedProjectId={expandedProjectId} setExpandedProjectId={setExpandedProjectId} toggleProjectTask={toggleProjectTask} handleDeleteProject={handleDeleteProject} />}
            {activeTab === 'forge' && <Forge trainingEvents={trainingEvents} todayISO={todayISO} activeForgeEventId={activeForgeEventId} setActiveForgeEventId={setActiveForgeEventId} workoutLogs={workoutLogs} newExercise={newExercise} setNewExercise={setNewExercise} isScanning={isScanning} scannedImage={scannedImage} fitnessAdvice={fitnessAdvice} isGeneratingPlan={isGeneratingPlan} healthStats={healthStats} trainingGoal={trainingGoal} quoteIndex={quoteIndex} weather={weather} fileInputRef={fileInputRef} handleImageUpload={handleImageUpload} handleGenerateFitnessPlan={handleGenerateFitnessPlan} addExercise={addExercise} toggleExercise={toggleExercise} handleDeleteExercise={handleDeleteExercise} setSelectedEvent={setSelectedEvent} setActiveTab={setActiveTab} forgeQuotes={forgeQuotes} />}
            {activeTab === 'nutrition' && <Nutrition trainingGoal={trainingGoal} dailyMacros={dailyMacros} macroTargets={macroTargets} newMacroEntry={newMacroEntry} setNewMacroEntry={setNewMacroEntry} isYasminMode={isYasminMode} addMacros={addMacros} setActiveTab={setActiveTab} />}
            {activeTab === 'achievements' && <Achievements />}
            {activeTab === 'settings' && <Settings isYasminMode={isYasminMode} setIsYasminMode={setIsYasminMode} healthStats={healthStats} setHealthStats={setHealthStats} trainingGoal={trainingGoal} setTrainingGoal={setTrainingGoal} workoutSplit={workoutSplit} setWorkoutSplit={setWorkoutSplit} trainingDaysPerWeek={trainingDaysPerWeek} setTrainingDaysPerWeek={setTrainingDaysPerWeek} autoScheduleTrainings={autoScheduleTrainings} setAutoScheduleTrainings={setAutoScheduleTrainings} connectedAgendas={connectedAgendas} agendaUrls={agendaUrls} setAgendaUrls={setAgendaUrls} isConnecting={isConnecting} hasAutoPlannedRef={hasAutoPlannedRef} lastPlannedWeekRef={lastPlannedWeekRef} lastAgendaLengthRef={lastAgendaLengthRef} handleConnectApiAgenda={handleConnectApiAgenda} handleConnectUrlAgenda={handleConnectUrlAgenda} handleDisconnectAgenda={handleDisconnectAgenda} handleAIAutoPlan={handleAIAutoPlan} getEventColor={getEventColor} />}
            {activeTab === 'habits' && <Habits habits={habits} isYasminMode={isYasminMode} toggleHabit={toggleHabit} handleDeleteHabit={handleDeleteHabit} />}
            
            {activeTab === 'goals' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-3xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
                  <Target className="text-fuchsia-400" /> Goals
                </h2>
                {goals.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-zinc-500 italic">Nog geen doelen ingesteld.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
                      <div key={goal.id} className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden relative shadow-xl">
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                          <Trophy className="w-64 h-64 text-cyan-500" />
                        </div>
                        <div className="p-6 cursor-pointer relative z-10" onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-zinc-800 text-cyan-400">
                              {goal.category}
                            </span>
                            <ChevronDown className={`text-zinc-500 transition-transform ${expandedGoalId===goal.id ? 'rotate-180':''}`}/>
                          </div>
                          <h3 className="text-2xl font-bold text-zinc-100 mb-6">{goal.title}</h3>
                          <div>
                            <div className="flex justify-between text-sm font-semibold text-zinc-400 mb-2">
                              <span>Progress</span>
                              <span>{goal.progress}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1.5">
                              <div className="bg-fuchsia-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${goal.progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                        {expandedGoalId === goal.id && (
                          <div className="bg-zinc-950/50 p-6 border-t border-zinc-800 relative z-10 space-y-2">
                            {goal.steps.map(step => (
                              <div key={step.id} onClick={(e) => toggleGoalStep(goal.id, step.id, e)} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer ${step.completed ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-zinc-800/50 border border-zinc-700/50'}`}>
                                <button className={step.completed ? 'text-emerald-400' : 'text-zinc-500'}>
                                  {step.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                </button>
                                <span className={`text-sm ${step.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                  {step.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          </div>{/* end padding wrapper */}
        </main>

        {/* COMMAND BAR */}
        <div className="absolute bottom-20 md:bottom-5 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none flex justify-center">
          <form onSubmit={handleAISubmit} className="w-full max-w-xl pointer-events-auto relative">
            {lastAction && (
              <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 whitespace-nowrap z-[60]" style={{ backdropFilter: 'blur(16px)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {lastAction}
              </div>
            )}
            <div className={`flex items-center border rounded-xl px-4 py-3 transition-all duration-150 focus-within:border-white/20 ${isYasminMode ? 'bg-[#1a0b2e]/90 border-white/[0.08]' : 'bg-[#111]/90 border-white/[0.08]'}`} style={{ backdropFilter: 'blur(24px)' }}>
              <Sparkles className={`w-4 h-4 mr-3 shrink-0 ${isProcessing ? (isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]') + ' animate-pulse' : 'text-white/30'}`} />
              <input
                ref={aiInputRef}
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Commando of AI-vraag..."
                className="flex-1 bg-transparent text-white placeholder-white/25 outline-none text-sm font-medium"
                disabled={isProcessing}
              />
              <button type="submit" disabled={isProcessing || !aiInput.trim()} className={`ml-3 shrink-0 p-1.5 rounded-lg transition-all duration-150 disabled:opacity-30 ${isYasminMode ? 'bg-purple-500 hover:bg-purple-400 text-white' : 'bg-[#00D4FF] hover:bg-[#00b8d9] text-black'}`}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* MOBILE BOTTOM NAV — hidden on md+ */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t ${isYasminMode ? 'bg-[#0d0010]/90 border-white/[0.06]' : 'bg-black/90 border-white/[0.06]'}`}
        style={{ backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">
          {[
            { id: 'hub',      icon: <Command className="w-6 h-6" />,      label: 'Hub'      },
            { id: 'agenda',   icon: <Calendar className="w-6 h-6" />,     label: 'Agenda'   },
            { id: 'focus',    icon: <Timer className="w-6 h-6" />,        label: 'Focus'    },
            { id: 'projects', icon: <FolderKanban className="w-6 h-6" />, label: 'Projects' },
          ].map(({ id, icon, label }) => {
            const isActive = activeTab === id;
            const accent = isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]';
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setIsMoreMenuOpen(false); }}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150"
              >
                <span className={isActive ? accent : 'text-white/30'}>{icon}</span>
                <span className={`text-[10px] font-semibold ${isActive ? accent : 'text-white/25'}`}>{label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setIsMoreMenuOpen(v => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150"
          >
            {(() => {
              const isActive = isMoreMenuOpen || ['forge','nutrition','habits','logbook','achievements','settings'].includes(activeTab);
              const accent = isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]';
              return (<>
                <span className={isActive ? accent : 'text-white/30'}><Menu className="w-6 h-6" /></span>
                <span className={`text-[10px] font-semibold ${isActive ? accent : 'text-white/25'}`}>Meer</span>
              </>);
            })()}
          </button>
        </div>
      </div>

      {/* MORE OVERFLOW SHEET */}
      {isMoreMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-[55] bg-black/60" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setIsMoreMenuOpen(false)} />
          <div className={`md:hidden fixed bottom-16 left-0 right-0 z-[56] border-t rounded-t-2xl`} style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: isYasminMode ? '#0d0010' : '#0a0a0a', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Meer</span>
              <button onClick={() => setIsMoreMenuOpen(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-5">
              {[
                { id: 'forge',     icon: <Dumbbell className="w-5 h-5" />,     label: 'Forge'     },
                { id: 'nutrition', icon: <PieChart className="w-5 h-5" />,     label: 'Nutrition' },
                { id: 'habits',    icon: <CheckCircle2 className="w-5 h-5" />, label: 'Habits'    },
                { id: 'logbook',   icon: <BookMarked className="w-5 h-5" />,   label: 'Logbook'   },
                { id: 'settings',  icon: <SettingsIcon className="w-5 h-5" />, label: 'Settings'  },
              ].map(({ id, icon, label }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); setIsMoreMenuOpen(false); }}
                    className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-semibold tracking-wider transition-all duration-150 border ${
                      isActive
                        ? (isYasminMode ? 'bg-white/10 text-purple-400 border-white/10' : 'bg-white/10 text-[#00D4FF] border-white/10')
                        : 'text-white/40 border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/70'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150" style={{ backdropFilter: 'blur(8px)' }} onClick={() => setSelectedEvent(null)}>
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-150">
              <X className="w-4 h-4"/>
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${getEventColor(selectedEvent.type)}`} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1em]">{selectedEvent.type}</span>
            </div>

            <h3 className={`text-xl font-bold mb-1 leading-tight ${selectedEvent.completed ? 'text-emerald-400 line-through' : 'text-white'}`}>
              {selectedEvent.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-white/40 mb-5 mt-2">
              <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {selectedEvent.date}</span>
              {selectedEvent.time && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {selectedEvent.time}</span>}
            </div>

            {selectedEvent.location && (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Locatie</p>
                <p className="text-sm text-white/70 flex items-start gap-2 bg-white/[0.03] p-3 rounded-lg border border-white/[0.06] break-all">
                  <MapPin className="w-3.5 h-3.5 text-[#00D4FF] shrink-0 mt-0.5" /> {selectedEvent.location}
                </p>
              </div>
            )}

            {selectedEvent.description && (
              <div className="mb-5">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Notities</p>
                <div className="text-sm text-white/60 whitespace-pre-wrap bg-white/[0.03] p-3 rounded-lg border border-white/[0.06] max-h-40 overflow-y-auto custom-scrollbar">
                  {selectedEvent.description}
                </div>
              </div>
            )}

            {!selectedEvent.location && !selectedEvent.description && (
              <p className="text-sm text-white/30 italic mb-5">Geen extra details beschikbaar.</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <button onClick={(e) => { toggleAgendaEventCompleted(selectedEvent.id, e); setSelectedEvent({...selectedEvent, completed: !selectedEvent.completed}); }} className={`text-sm font-semibold flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-150 ${selectedEvent.completed ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15' : 'bg-white/[0.06] text-white/70 hover:bg-white/10'}`}>
                {selectedEvent.completed ? <><CheckCircle2 className="w-4 h-4" /> Voltooid</> : <><Circle className="w-4 h-4" /> Afvinken</>}
              </button>
              <button onClick={() => { handleDeleteAgendaEvent(selectedEvent.id); setSelectedEvent(null); }} className="text-xs font-semibold text-rose-400/70 hover:text-rose-400 flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-rose-500/10 transition-all duration-150">
                <Trash2 className="w-3.5 h-3.5" /> Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI RESPONSE MODAL */}
      {aiResponse && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150" style={{ backdropFilter: 'blur(8px)' }} onClick={() => setAiResponse(null)}>
          <div className="bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-6 max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setAiResponse(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-150">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-lg ${isYasminMode ? 'bg-purple-500/10' : 'bg-[#00D4FF]/10'}`}>
                <BrainCircuit className={`w-5 h-5 ${isYasminMode ? 'text-purple-400' : 'text-[#00D4FF]'}`} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Apex AI Analyse</h3>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isYasminMode ? 'text-purple-400/60' : 'text-[#00D4FF]/60'}`}>Science-Based Protocol</p>
              </div>
            </div>

            <div className={`mb-5 pl-3 border-l-2 ${isYasminMode ? 'border-purple-500/40' : 'border-[#00D4FF]/30'}`}>
              <p className="text-sm text-white/40 italic">"{aiResponse.query}"</p>
            </div>

            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              {aiResponse.answer.split('\n').map((line, i) => (
                <p key={i}>{line.includes('**') ? <strong className="text-white font-semibold">{line.replace(/\*\*/g, '')}</strong> : line}</p>
              ))}
            </div>

            <button onClick={() => setAiResponse(null)} className={`w-full mt-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${isYasminMode ? 'bg-purple-500 hover:bg-purple-400 text-white' : 'bg-[#00D4FF] hover:bg-[#00b8d9] text-black'}`}>
              Begrepen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}