import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirestoreCollection } from './hooks/useFirestoreCollection';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import { 
  CheckCircle2, Circle, Sparkles, Target, FolderKanban, Bell,
  Activity, Plus, Send, Loader2, Clock, Trophy, TrendingUp,
  CheckSquare, Square, ChevronDown, ChevronUp, Heart, User, Sun, 
  CloudSun, CloudRain, BookOpen, CalendarDays, Coffee, 
  Dumbbell, Flame, MapPin, Menu, X, Command, Camera, FileText, 
  ArrowRight, Timer, Play, Pause, RotateCcw, Edit3, Triangle,
  Zap, Quote, BookMarked, Smile, Meh, Frown, Keyboard, Trash2, RefreshCw, Settings, Link as LinkIcon, Calendar, ChevronLeft, ChevronRight,
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
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const uid = user?.uid ?? null;


  // --- STATE ---
  const [activeTab, setActiveTab] = useState('hub');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');
  const [todayISO, setTodayISO] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  // Yasmin Mode
  const [isYasminMode, setIsYasminMode] = useState(false);
  
  // Refs
  const scrollContainerRef = useRef(null);
  const aiInputRef = useRef(null);
  const logbookEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasAutoPlannedRef = useRef(false);
  const lastAgendaLengthRef = useRef(0);
  
  const [projects, setProjects] = useFirestoreCollection(uid ? `users/${uid}/projects` : null, initialProjects);
  const [habits, setHabits] = useFirestoreCollection(uid ? `users/${uid}/habits` : null, initialHabits);
  const [goals, setGoals] = useFirestoreCollection(uid ? `users/${uid}/goals` : null, initialGoals);
  const [scratchpad, setScratchpad] = useState("");
  
  // Logbook State
  const [logs, setLogs] = useFirestoreCollection(uid ? `users/${uid}/logs` : null, initialLogs);
  const [newLogText, setNewLogText] = useState('');
  const [newLogMood, setNewLogMood] = useState('good');

  // Forge / Health State
  const [healthStats, setHealthStats] = useState({ weight: '75', height: '180' });
  const [trainingGoal, setTrainingGoal] = useState('Spieropbouw (Bulk)');
  const [workoutSplit, setWorkoutSplit] = useState('Push / Pull / Legs');
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3);
  const [autoScheduleTrainings, setAutoScheduleTrainings] = useState(true);
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

  const [connectedAgendas, setConnectedAgendas] = useState({ Google: false, Apple: false, Outlook: false, 'Andere Agenda': false });
  const [agendaUrls, setAgendaUrls] = useState({ Apple: '', 'Andere Agenda': '' });
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
    document.body.style.overflow = (isMobileMenuOpen || selectedEvent || aiResponse) ? 'hidden' : 'unset'; 
    return () => { document.body.style.overflow = 'unset'; }; 
  }, [isMobileMenuOpen, selectedEvent, aiResponse]);

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
        const currentWeekDates = [];
        for (let i = 1; i <= 7; i++) {
          const d = new Date(now);
          d.setDate(now.getDate() - currentDayOfWeek + i);
          const offset = d.getTimezoneOffset();
          currentWeekDates.push(new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0]);
        }

        const todayIndex = currentDayOfWeek - 1;
        const futureWeekDates = currentWeekDates.slice(todayIndex);

        const cleanedAgenda = prevAgenda.filter(e => !(e.isAI && futureWeekDates.includes(e.date)));
        const daysWithFixedTraining = cleanedAgenda.filter(e => isOccupiedByTraining(e) && currentWeekDates.includes(e.date)).map(e => e.date);
        const neededTrainings = Math.max(0, trainingDaysPerWeek - new Set(daysWithFixedTraining).size);

        if (neededTrainings === 0) return cleanedAgenda;

        let availableDays = futureWeekDates.filter(date => !daysWithFixedTraining.includes(date)).map(date => {
            const eventsOnDay = cleanedAgenda.filter(e => e.date === date && !isOccupiedByTraining(e) && !e.isAI);
            return { date, eventsOnDay, score: eventsOnDay.length };
          });
          
        let selectedDays = []; 
        let tempDaysWithTraining = [...daysWithFixedTraining];
        
        for (let i = 0; i < neededTrainings; i++) {
          if (availableDays.length === 0) break; 
          availableDays.forEach(day => {
            let penalty = 0; 
            const dayIndex = currentWeekDates.indexOf(day.date);
            if (tempDaysWithTraining.includes(dayIndex > 0 ? currentWeekDates[dayIndex - 1] : null)) penalty += 50;
            if (tempDaysWithTraining.includes(dayIndex < 6 ? currentWeekDates[dayIndex + 1] : null)) penalty += 50;
            day.currentScore = day.score + penalty;
          });
          availableDays.sort((a, b) => a.currentScore - b.currentScore);
          const bestDay = availableDays.shift(); 
          selectedDays.push(bestDay); 
          tempDaysWithTraining.push(bestDay.date);
        }
        
        const newEvents = selectedDays.map((dayObj, i) => ({ 
          id: Date.now() + Math.random(), 
          date: dayObj.date, 
          time: '18:00', 
          title: splits[i % splits.length], 
          type: 'Training', 
          isAI: true, 
          completed: false 
        }));
        
        if (!isSilent) setTimeout(() => triggerToast(`Slim herpland: ${selectedDays.length} missende sessie(s) optimaal ingepland!`), 100);
        return [...cleanedAgenda, ...newEvents].sort((a, b) => a.date.localeCompare(b.date));
      });
      setIsProcessing(false);
    }, 800);
  };

  useEffect(() => {
    if (!autoScheduleTrainings || !workoutSplit || !todayISO) return;
    const nonAICount = agendaEvents.filter(e => !e.isAI).length;
    if (nonAICount === lastAgendaLengthRef.current) return;
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

  const ProgressRing = ({ radius, stroke, progress, colorClass, text, label }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    return (
      <div className="flex flex-col items-center justify-center relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle stroke="rgba(255,255,255,0.1)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle 
            className={`transition-all duration-1000 ${colorClass}`} 
            stroke="currentColor" 
            fill="transparent" 
            strokeWidth={stroke} 
            strokeDasharray={circumference + ' ' + circumference} 
            style={{ strokeDashoffset }} 
            strokeLinecap="round" 
            r={normalizedRadius} 
            cx={radius} 
            cy={radius} 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-black text-white text-lg leading-none">{text}</span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">{label}</span>
        </div>
      </div>
    );
  };

  // --- UI RENDERERS ---

  const renderHub = () => {
    const pastAndTodayTrainings = trainingEvents.filter(e => e.date <= todayISO).length;
    const totalTrainingsThisWeek = Math.max(trainingDaysPerWeek, trainingEvents.length);
    const progressPercent = totalTrainingsThisWeek > 0 ? Math.round((pastAndTodayTrainings / totalTrainingsThisWeek) * 100) : 0;
    const upcomingTrainings = trainingEvents.filter(e => e.date >= todayISO);
    const nextTraining = upcomingTrainings.length > 0 ? upcomingTrainings[0] : null;

    const dynamicStreaks = todaysEvents.filter(e => e.type !== 'Habit').map(event => {
      const pastEventsSameTitle = agendaEvents.filter(e => e.title === event.title && e.date <= todayISO).sort((a, b) => b.date.localeCompare(a.date));
      let streak = 0;
      for (const e of pastEventsSameTitle) { 
        if (e.completed) streak++; 
        else if (e.date < todayISO) break; 
      }
      return { title: event.title, streak, completedToday: event.completed };
    }).filter(s => s.streak > 0);

    const habitStreaks = habits.filter(h => h.streak > 0).map(h => ({ title: h.title, streak: h.streak, completedToday: h.completedToday }));
    const allStreaks = [...habitStreaks, ...dynamicStreaks];
    const uniqueStreaksMap = new Map();
    allStreaks.forEach(s => { 
      if (!uniqueStreaksMap.has(s.title) || s.streak > (uniqueStreaksMap.get(s.title).streak || 0)) {
        uniqueStreaksMap.set(s.title, s); 
      }
    });
    const uniqueStreaks = Array.from(uniqueStreaksMap.values());

    return (
      <div className="space-y-6 animate-in fade-in duration-500">


        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div className={`${isYasminMode ? 'bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'bg-cyan-500/20'} p-4 rounded-full shrink-0 relative z-10 transition-colors`}>
            {isYasminMode ? <Heart className="w-8 h-8 text-purple-400" /> : <Sparkles className="w-8 h-8 text-cyan-400" />}
          </div>
          
          <div className="relative z-10">
            {isYasminMode ? (
              <>
                <h3 className="text-purple-400 font-bold text-lg mb-2 flex items-center gap-2">Goedemorgen Yasmin! ✨</h3>
                <p className="text-zinc-200 leading-relaxed text-sm md:text-base">
                  Klaar voor een nieuwe, mooie dag? Je hebt vandaag <strong className="text-white">{todaysEvents.length} leuke afspraken</strong> op de planning staan. 
                  Het is momenteel <strong className="text-white">{weather.temp}°C en {weather.condition.toLowerCase()}</strong> buiten. Pak een lekker drankje en laten we er iets moois van maken! 💜
                </p>
              </>
            ) : (
              <>
                <h3 className="text-cyan-400 font-bold text-lg mb-2">Apex AI Briefing</h3>
                <p className="text-zinc-200 leading-relaxed text-sm md:text-base">
                  Welkom terug. Je hebt <strong>vandaag</strong> <strong className="text-white">{todaysEvents.length} afspraken</strong> op de planning. 
                  {currentSession ? ( <> The Forge staat ingesteld op <strong className="text-white">{currentSession}</strong>.</>) : (<> The Forge is nog niet geconfigureerd voor vandaag.</>)}
                  Het weer in {weather.location} is momenteel <strong className="text-white">{weather.temp}°C en {weather.condition.toLowerCase()}</strong>. Tijd om aan de slag te gaan!
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`col-span-1 md:col-span-2 h-full rounded-3xl p-6 border shadow-xl relative overflow-hidden group transition-colors ${isYasminMode ? 'bg-gradient-to-br from-[#2d1b4e]/80 to-[#1a0b2e]/80 border-purple-500/20' : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CloudRain className={`w-48 h-48 ${isYasminMode ? 'text-purple-400' : 'text-cyan-400'}`} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[160px]">
              <div className={`flex items-center gap-2 mb-4 ${isYasminMode ? 'text-purple-300' : 'text-zinc-400'}`}>
                <MapPin className={`w-4 h-4 ${isYasminMode ? 'text-purple-400' : 'text-cyan-400'}`} /> {weather.location}
              </div>
              <div className="flex items-end justify-between mt-auto">
                <div>
                  <div className="text-6xl font-black text-white tracking-tighter">{weather.temp}°C</div>
                  <div className={`${isYasminMode ? 'text-purple-400' : 'text-cyan-400'} font-medium text-lg mt-1`}>{weather.condition}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`col-span-1 h-full backdrop-blur-xl rounded-3xl p-6 border shadow-xl flex flex-col justify-between transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900/80 border-zinc-800'}`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Dumbbell className="w-4 h-4 text-fuchsia-400" /> Trainingsdoel
                </div>
                <span className="text-xs font-bold bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded-lg uppercase tracking-wider">Deze Week</span>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-6xl font-black text-white tracking-tighter leading-none">{pastAndTodayTrainings}</span>
                <span className="text-zinc-500 font-bold mb-1 text-lg">/ {totalTrainingsThisWeek}</span>
                <span className="text-sm text-zinc-400 ml-1 mb-1.5 uppercase tracking-wider font-bold">Sessies</span>
              </div>
              <div className={`w-full rounded-full h-2 mb-6 mt-4 overflow-hidden ${isYasminMode ? 'bg-[#1a0b2e]' : 'bg-zinc-800'}`}>
                <div className="bg-fuchsia-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <div className="mt-auto">
              <div className={`mb-4 p-3.5 rounded-xl border ${isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/10' : 'bg-zinc-950/50 border-zinc-800/50'}`}>
                <p className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                  {nextTraining && nextTraining.date === todayISO ? 'Vandaag gepland:' : nextTraining ? 'Eerstvolgende sessie:' : 'Status:'}
                </p>
                {nextTraining ? (
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-fuchsia-400 font-black text-lg leading-tight truncate">{nextTraining.title}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${isYasminMode ? 'text-purple-200 bg-[#2d1b4e]' : 'text-zinc-300 bg-zinc-800'}`}>
                      {nextTraining.date === todayISO ? nextTraining.time : `${nextTraining.date.split('-')[2]}/${nextTraining.date.split('-')[1]}`}
                    </span>
                  </div>
                ) : (
                  <p className="text-emerald-400 font-bold text-sm leading-tight flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Doel behaald! Rust goed uit.
                  </p>
                )}
              </div>
              <button onClick={() => setActiveTab('forge')} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                Enter The Forge <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`col-span-1 md:col-span-2 h-full backdrop-blur-xl rounded-3xl p-6 border shadow-xl flex flex-col transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-zinc-100">Vandaag</h3>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('agenda')} className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isYasminMode ? 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
                  <Calendar className="w-3 h-3" /> <span>Volledige Agenda</span>
                </button>
              </div>
            </div>

            {uniqueStreaks.length > 0 && (
              <div className={`flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-4 border-b ${isYasminMode ? 'border-purple-500/20' : 'border-zinc-800/50'}`}>
                {uniqueStreaks.map(s => (
                  <div key={s.title} className={`flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 border transition-all ${s.completedToday ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]' : (isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/10' : 'bg-zinc-950 border-zinc-800')}`}>
                    <Flame className={`w-4 h-4 ${s.completedToday ? 'text-orange-500 animate-pulse' : 'text-zinc-600'}`} />
                    <span className={`text-xs font-bold ${s.completedToday ? 'text-orange-300' : 'text-zinc-400'}`}>{s.title}</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${s.completedToday ? 'text-orange-400' : 'text-zinc-500'} ${isYasminMode && !s.completedToday ? 'bg-[#2d1b4e]' : 'bg-zinc-900'}`}>{s.streak}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
              {todaysEvents.map((event) => (
                <div key={event.id} className="flex gap-3 items-center group transition-colors">
                  <div className="w-14 text-right shrink-0">
                    <span className={`text-sm font-bold transition-colors ${isYasminMode ? 'text-purple-300/60 group-hover:text-purple-300' : 'text-zinc-500 group-hover:text-cyan-400'}`}>{event.time}</span>
                  </div>
                  <button onClick={(e) => toggleAgendaEventCompleted(event.id, e)} className={`shrink-0 transition-all p-1 rounded-full hover:bg-zinc-800 ${event.completed ? 'text-emerald-400' : 'text-zinc-600 hover:text-emerald-400'}`}>
                    {event.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div onClick={() => setSelectedEvent(event)} className={`flex-1 border ${event.completed ? 'border-emerald-500/50 bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : (isYasminMode ? 'border-purple-500/20 bg-[#1a0b2e]/50 group-hover:bg-[#2d1b4e]/50' : 'border-zinc-700/50 bg-zinc-800/50 group-hover:bg-zinc-800/80')} rounded-2xl p-3 transition-all cursor-pointer flex justify-between items-center`}>
                    <div className={`${event.completed ? 'opacity-70' : ''}`}>
                      <p className={`font-semibold ${event.completed ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-zinc-200'}`}>{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`}></div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">{event.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.location && !event.completed && <MapPin className="w-3 h-3 text-zinc-500" />}
                      <Info className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
              {todaysEvents.length === 0 && <p className={`text-sm italic text-center py-4 ${isYasminMode ? 'text-purple-300/60' : 'text-zinc-500'}`}>Je schema is leeg voor vandaag.</p>}
            </div>
          </div>

          <div className={`col-span-1 h-full backdrop-blur-xl rounded-3xl p-6 border shadow-xl flex flex-col justify-between transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-zinc-100">Habits</h3>
                </div>
                <button onClick={() => setActiveTab('habits')} className="text-xs font-bold text-zinc-500 hover:text-emerald-400 transition-colors">Toon Alle</button>
              </div>
              <div className="space-y-3">
                {habits.slice(0,4).map(habit => (
                  <div key={habit.id} onClick={(e) => toggleHabit(habit.id, e)} className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all duration-300 ${habit.completedToday ? 'bg-emerald-500/10 border-emerald-500/30' : (isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/10 hover:border-purple-400/50' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500')}`}>
                    <div className="flex items-center gap-3">
                      {habit.completedToday ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Circle className="w-5 h-5 text-zinc-500 shrink-0" />}
                      <span className={`text-sm font-medium ${habit.completedToday ? 'text-emerald-200 line-through opacity-70' : 'text-zinc-200'}`}>{habit.title}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${habit.streak > 0 ? 'bg-orange-500/10' : (isYasminMode ? 'bg-[#2d1b4e]' : 'bg-zinc-900/50')}`}>
                      <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? 'text-orange-500' : 'text-zinc-600'}`} />
                      <span className={`text-xs font-bold ${habit.streak > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>{habit.streak}</span>
                    </div>
                  </div>
                ))}
                {habits.length === 0 && <p className={`text-sm italic py-4 ${isYasminMode ? 'text-purple-300/60' : 'text-zinc-500'}`}>Geen gewoontes ingesteld.</p>}
              </div>
            </div>
          </div>

          <div className={`col-span-1 md:col-span-3 rounded-3xl p-6 border shadow-xl flex flex-col transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 text-zinc-100 font-bold">
                <Edit3 className="w-5 h-5 text-yellow-400" /> Brain Dump
              </div>
              <span className="text-xs text-zinc-500">Auto-saves instantly</span>
            </div>
            <textarea 
              value={scratchpad} 
              onChange={(e) => setScratchpad(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-zinc-300 resize-none min-h-[120px] leading-relaxed placeholder-zinc-600 focus:ring-0 custom-scrollbar"
              placeholder="Type anything here... thoughts, links, quick tasks."
            />
          </div>
        </div>
      </div>
    );
  };

  const renderNutrition = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
              <Utensils className="text-orange-400" /> Nutrition Tracker
            </h2>
            <p className="text-zinc-400 mt-1">Science-based macro targets berekend voor: <strong className="text-zinc-200">{trainingGoal}</strong>.</p>
          </div>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-colors ${isYasminMode ? 'bg-[#2d1b4e] hover:bg-purple-900/50 text-purple-300' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
            Doel Wijzigen &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className={`rounded-3xl p-6 border shadow-xl flex flex-col items-center justify-center transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
             <ProgressRing radius={45} stroke={6} progress={Math.min(1, dailyMacros.calories / macroTargets.calories)} colorClass="text-cyan-400" text={dailyMacros.calories} label={`/ ${macroTargets.calories} kcal`} />
             <div className="mt-4 font-bold text-zinc-200 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400"/> Calorieën</div>
          </div>
          <div className={`rounded-3xl p-6 border shadow-xl flex flex-col items-center justify-center transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
             <ProgressRing radius={45} stroke={6} progress={Math.min(1, dailyMacros.protein / macroTargets.protein)} colorClass="text-orange-400" text={`${dailyMacros.protein}g`} label={`/ ${macroTargets.protein}g`} />
             <div className="mt-4 font-bold text-zinc-200 flex items-center gap-2"><Target className="w-4 h-4 text-orange-400"/> Eiwitten</div>
          </div>
          <div className={`rounded-3xl p-6 border shadow-xl flex flex-col items-center justify-center transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
             <ProgressRing radius={45} stroke={6} progress={Math.min(1, dailyMacros.carbs / macroTargets.carbs)} colorClass="text-emerald-400" text={`${dailyMacros.carbs}g`} label={`/ ${macroTargets.carbs}g`} />
             <div className="mt-4 font-bold text-zinc-200 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400"/> Koolhydraten</div>
          </div>
          <div className={`rounded-3xl p-6 border shadow-xl flex flex-col items-center justify-center transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
             <ProgressRing radius={45} stroke={6} progress={Math.min(1, dailyMacros.fats / macroTargets.fats)} colorClass="text-yellow-400" text={`${dailyMacros.fats}g`} label={`/ ${macroTargets.fats}g`} />
             <div className="mt-4 font-bold text-zinc-200 flex items-center gap-2"><Flame className="w-4 h-4 text-yellow-400"/> Vetten</div>
          </div>
        </div>

        <div className={`rounded-3xl p-6 md:p-8 border shadow-xl transition-colors ${isYasminMode ? 'bg-[#2d1b4e]/30 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`}>
          <h3 className="font-bold text-xl text-zinc-100 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-400"/> Maaltijd Toevoegen
          </h3>
          <form onSubmit={addMacros} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="col-span-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Kcal</label>
              <input type="number" value={newMacroEntry.calories} onChange={e => setNewMacroEntry({...newMacroEntry, calories: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-zinc-100 outline-none text-sm transition-colors border ${isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/20 focus:border-purple-500' : 'bg-zinc-950 border-zinc-800 focus:border-cyan-500'}`} placeholder="0" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Eiwit (g)</label>
              <input type="number" value={newMacroEntry.protein} onChange={e => setNewMacroEntry({...newMacroEntry, protein: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-zinc-100 outline-none text-sm transition-colors border ${isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/20 focus:border-purple-500' : 'bg-zinc-950 border-zinc-800 focus:border-cyan-500'}`} placeholder="0" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Koolh (g)</label>
              <input type="number" value={newMacroEntry.carbs} onChange={e => setNewMacroEntry({...newMacroEntry, carbs: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-zinc-100 outline-none text-sm transition-colors border ${isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/20 focus:border-purple-500' : 'bg-zinc-950 border-zinc-800 focus:border-cyan-500'}`} placeholder="0" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Vet (g)</label>
              <input type="number" value={newMacroEntry.fats} onChange={e => setNewMacroEntry({...newMacroEntry, fats: e.target.value})} className={`w-full rounded-xl px-4 py-3 text-zinc-100 outline-none text-sm transition-colors border ${isYasminMode ? 'bg-[#1a0b2e]/50 border-purple-500/20 focus:border-purple-500' : 'bg-zinc-950 border-zinc-800 focus:border-cyan-500'}`} placeholder="0" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <button type="submit" disabled={!newMacroEntry.calories && !newMacroEntry.protein && !newMacroEntry.carbs && !newMacroEntry.fats} className={`w-full text-zinc-950 font-bold py-3 rounded-xl transition-colors h-[46px] disabled:opacity-50 disabled:cursor-not-allowed ${isYasminMode ? 'bg-purple-400 hover:bg-purple-300' : 'bg-orange-500 hover:bg-orange-400'}`}>
                Toevoegen
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderAgenda = () => {
    // Bereken de huidige week (Ma t/m Zo) voor de mobiele lijstweergave
    const todayDate = new Date(todayISO);
    const dayOfWeek = todayDate.getDay(); // 0=Zo, 1=Ma, ...
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - daysFromMonday + i);
      const iso = d.toISOString().split('T')[0];
      return { iso, d };
    });
    const dayLabels = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

    const agendaForm = (
      <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl h-fit">
        <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400"/> Nieuwe Afspraak
        </h3>
        <form onSubmit={handleAddAgendaEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Titel</label>
            <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Afspraak..." className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" required />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Datum</label>
              <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" required />
            </div>
            <div className="w-24">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tijd</label>
              <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Locatie (Optioneel)</label>
            <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="Adres of link..." className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Agenda Groep</label>
            <select value={newEventSource} onChange={e => setNewEventSource(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-400 outline-none focus:border-cyan-500 text-sm">
              <option value="Privé">Privé</option>
              <option value="Werk">Werk</option>
              <option value="Training">Training</option>
              <option value="Habit">Habit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Notities (Optioneel)</label>
            <textarea value={newEventDescription} onChange={e => setNewEventDescription(e.target.value)} placeholder="Extra details..." className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm resize-none h-16" />
          </div>
          <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-2 rounded-xl transition-colors text-sm">Toevoegen</button>
        </form>
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h3 className="font-bold text-zinc-100 mb-4 text-sm uppercase tracking-wider text-zinc-500">Filters</h3>
          <div className="space-y-2">
            {['Privé', 'Werk', 'Training', 'Habit', 'Google', 'Apple', 'Outlook', 'Andere Agenda'].map(type => {
              const isActive = ['Privé', 'Werk', 'Training', 'Habit'].includes(type) || connectedAgendas[type];
              if (!isActive) return null;
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getEventColor(type)}`}></div>
                  <span className="text-sm text-zinc-300">{type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
              <Calendar className="text-cyan-400" /> Agenda
            </h2>
            <p className="text-zinc-400 mt-1">Beheer al je afspraken.</p>
          </div>
          {/* Maandnavigatie alleen op tablet/desktop */}
          <div className="hidden md:flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
            <button onClick={handlePrevMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div className="px-4 font-bold text-zinc-100 min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button onClick={handleNextMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* ── MOBIEL: lijstweergave deze week ─────────────────────────────────── */}
        <div className="md:hidden space-y-4">
          {agendaForm}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Deze week</h3>
            {weekDays.map(({ iso, d }) => {
              const dayEvents = agendaEvents
                .filter(e => e.date === iso)
                .sort((a, b) => a.time.localeCompare(b.time));
              const isToday = iso === todayISO;
              const isPast = iso < todayISO;
              return (
                <div key={iso} className={`rounded-2xl border overflow-hidden ${isToday ? 'border-cyan-500/40 bg-cyan-500/5' : isPast ? 'border-zinc-800/40 bg-zinc-900/30' : 'border-zinc-800 bg-zinc-900/60'}`}>
                  <div className={`flex items-center justify-between px-4 py-2.5 ${isToday ? 'bg-cyan-500/10' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isToday ? 'text-cyan-400' : isPast ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        {dayLabels[d.getDay()]}
                      </span>
                      {isToday && <span className="text-[10px] font-bold bg-cyan-500 text-zinc-950 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Vandaag</span>}
                    </div>
                    <span className={`text-xs font-medium ${isToday ? 'text-cyan-400/70' : 'text-zinc-600'}`}>
                      {d.getDate()} {monthNames[d.getMonth()].slice(0, 3)}
                    </span>
                  </div>
                  {dayEvents.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-zinc-600 italic">Geen afspraken</div>
                  ) : (
                    <div className="divide-y divide-zinc-800/50">
                      {dayEvents.map(event => (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-zinc-800/50 transition-colors ${event.completed ? 'opacity-50' : ''}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${getEventColor(event.type)}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${event.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{event.title}</p>
                            <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {event.time}
                              {event.location && <><MapPin className="w-3 h-3 ml-1" /><span className="truncate">{event.location}</span></>}
                            </p>
                          </div>
                          {event.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP/TABLET: maandkalender ───────────────────────────────────── */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="col-span-1">
            {agendaForm}
          </div>
          <div className="col-span-1 lg:col-span-3 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-xs font-bold text-zinc-500 uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-zinc-950/30 rounded-xl border border-transparent p-2 min-h-[100px]"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateString = `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isToday = dateString === todayISO;
                const dayEvents = agendaEvents.filter(e => e.date === dateString);
                return (
                  <div key={day} className={`bg-zinc-950/80 rounded-xl border p-2 flex flex-col min-h-[100px] transition-colors hover:border-zinc-700 ${isToday ? 'border-cyan-500/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]' : 'border-zinc-800/80'}`}>
                    <div className={`text-xs font-bold mb-2 flex items-center justify-between ${isToday ? 'text-cyan-400' : 'text-zinc-500'}`}>
                      {day}
                      {dayEvents.length > 0 && <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-400">{dayEvents.length}</span>}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                      {dayEvents.map(event => (
                        <div key={event.id} onClick={() => setSelectedEvent(event)} className={`text-[10px] leading-tight flex items-start justify-between group cursor-pointer p-0.5 hover:bg-zinc-800/80 rounded transition-colors ${event.completed ? 'opacity-50 line-through text-emerald-400/50' : ''}`} title={`${event.time} - ${event.title}`}>
                          <div className="flex items-start gap-1.5 overflow-hidden">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${getEventColor(event.type)}`}></div>
                            <span className="text-zinc-300 truncate group-hover:text-white transition-colors">{event.time} {event.title}</span>
                          </div>
                          {event.completed ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0 ml-1" /> : event.location && <MapPin className="w-2.5 h-2.5 text-zinc-600 shrink-0 ml-1" />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogbook = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <BookMarked className="text-cyan-400 w-8 h-8" /> Captain's Log
          </h2>
          <p className="text-zinc-400 mt-1">Reflect, record, and review your progress.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl flex flex-col">
          <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-400"/> New Entry
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setNewLogMood('good')} className={`p-2 rounded-full transition-colors ${newLogMood === 'good' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Smile className="w-6 h-6" />
            </button>
            <button onClick={() => setNewLogMood('neutral')} className={`p-2 rounded-full transition-colors ${newLogMood === 'neutral' ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Meh className="w-6 h-6" />
            </button>
            <button onClick={() => setNewLogMood('bad')} className={`p-2 rounded-full transition-colors ${newLogMood === 'bad' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Frown className="w-6 h-6" />
            </button>
          </div>
          <textarea 
            value={newLogText} 
            onChange={(e) => setNewLogText(e.target.value)} 
            className="flex-1 w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 outline-none text-zinc-200 resize-none min-h-[150px] mb-4 focus:border-cyan-500/50 custom-scrollbar" 
            placeholder="What's on your mind today? (Or ask AI to log for you)" 
          />
          <button onClick={() => handleAddLog()} disabled={!newLogText.trim()} className="self-end bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 px-6 py-2.5 rounded-xl font-bold transition-colors">
            Save Entry
          </button>
        </div>
        <div className="col-span-1 h-full bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 shadow-xl">
          <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400"/> Past Records
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            <div ref={logbookEndRef} />
            {logs.length === 0 ? (
              <p className="text-zinc-500 text-sm italic py-4">Nog geen logboeken toegevoegd.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.mood === 'good' ? 'bg-emerald-500' : log.mood === 'neutral' ? 'bg-yellow-500' : 'bg-rose-500'}`}></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-cyan-400">{log.date}</span>
                      <span className="text-xs text-zinc-500">{log.time}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{log.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFocus = () => (
    <div className="space-y-6 animate-in fade-in duration-500 min-h-full flex flex-col items-center justify-center pt-10">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-zinc-100 flex items-center justify-center gap-3">
          <Timer className="text-cyan-400 w-10 h-10" /> Deep Work
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">Silence distractions. Execute.</p>
      </div>
      <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 absolute inset-0">
          <circle cx="50" cy="50" r="45" className="stroke-zinc-800 fill-none" strokeWidth="2" />
          <circle 
            cx="50" cy="50" r="45" 
            className={`fill-none transition-all duration-1000 linear ${isTimerRunning ? 'stroke-cyan-400' : 'stroke-zinc-600'}`} 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeDasharray="282.7" 
            strokeDashoffset={282.7 - (282.7 * (timeLeft / (25 * 60)))} 
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span className={`text-6xl md:text-8xl font-black tracking-tighter tabular-nums ${isTimerRunning ? 'text-white' : 'text-zinc-400'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-zinc-500 uppercase tracking-widest text-sm font-bold mt-2">
            {isTimerRunning ? 'Focusing...' : 'Paused'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 mb-16">
        <button onClick={resetTimer} className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
          <RotateCcw className="w-6 h-6" />
        </button>
        <button onClick={toggleTimer} className={`p-6 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all ${isTimerRunning ? 'bg-zinc-800 text-cyan-400 border border-cyan-500/50' : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'}`}>
          {isTimerRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
        </button>
      </div>
      <div className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" /> Pending Objectives
          </h3>
        </div>
        <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {pendingTasks.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">All clear! No pending tasks right now.</p>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} onClick={(e) => toggleProjectTask(task.projectId, task.id, e)} className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 cursor-pointer hover:border-cyan-500/50 transition-colors group">
                <button className="text-zinc-600 group-hover:text-cyan-400 transition-colors">
                  <Circle className="w-6 h-6" />
                </button>
                <div>
                  <h4 className="font-bold text-zinc-200">{task.title}</h4>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{task.projectName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderForge = () => {
    const activeForgeEvent = trainingEvents.find(e => e.id === activeForgeEventId);
    const activeExercises = activeForgeEventId && workoutLogs[activeForgeEventId] ? workoutLogs[activeForgeEventId] : [];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Flame className="w-64 h-64 text-fuchsia-500" />
          </div>
          <div className="relative z-10 shrink-0">
            <h2 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4 tracking-tight">
              <Dumbbell className="text-fuchsia-500 w-10 h-10 md:w-12 md:h-12" /> The Forge
            </h2>
            <p className="text-fuchsia-400 mt-2 font-bold tracking-wider uppercase text-sm">Where Iron Meets Mind</p>
          </div>
          <div className="relative z-10 flex-1 md:pl-8 md:border-l border-zinc-800">
            <Quote className="w-6 h-6 text-zinc-700 mb-2" />
            <p className="text-lg text-zinc-300 font-serif italic leading-relaxed">"{forgeQuotes[quoteIndex].text}"</p>
            <p className="text-fuchsia-500 font-bold text-sm mt-3">— {forgeQuotes[quoteIndex].author}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800 col-span-1 flex flex-col shadow-xl">
            <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-fuchsia-400"/> Science-Based Check
            </h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Controleer je fysieke profiel en genereer het dagelijkse AI battle plan op basis van je macro's.</p>
            
            <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 mb-3">
              <span className="text-zinc-500 font-bold text-sm">Gewicht</span>
              <span className="text-zinc-100 font-bold">{healthStats.weight ? `${healthStats.weight} kg` : '--'}</span>
            </div>
            <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 mb-3">
              <span className="text-zinc-500 font-bold text-sm">Doel</span>
              <span className="text-fuchsia-400 font-bold text-sm">{trainingGoal.split(' ')[0]}</span>
            </div>

            <button onClick={handleGenerateFitnessPlan} disabled={isGeneratingPlan} className="mt-auto w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-colors border border-zinc-700">
              {isGeneratingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-fuchsia-400" />} Genereer Protocol
            </button>
          </div>

          <div className="h-full bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-xl col-span-1 lg:col-span-2 relative overflow-hidden flex flex-col">
            <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
              <Activity className="w-64 h-64 text-fuchsia-500" />
            </div>
            <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2 relative z-10">
              <Sparkles className="w-5 h-5 text-fuchsia-400"/> AI Protocol Directive
            </h3>
            <div className="relative z-10 text-zinc-300 text-sm leading-relaxed flex-1 bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50 custom-scrollbar overflow-y-auto">
              {isGeneratingPlan ? (
                <div className="flex items-center justify-center h-full gap-3 text-fuchsia-400">
                  <Loader2 className="animate-spin w-6 h-6"/> Analyzing physical profile & nutrition...
                </div> 
              ) : fitnessAdvice ? (
                fitnessAdvice.split('\n').map((line, i) => <p key={i} className="mb-2">{line.includes('**') ? <strong className="text-white font-bold">{line.replace(/\*\*/g, '')}</strong> : line}</p>) 
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-8">
                  <Dumbbell className="w-8 h-8 mb-2 opacity-50" />
                  <p>Awaiting biometrics & nutrition analysis to generate today's battle plan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-100 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-fuchsia-500"/> Schema Deze Week
            </h3>
            <button onClick={() => setActiveTab('agenda')} className="text-xs font-bold text-zinc-500 hover:text-fuchsia-400 transition-colors uppercase tracking-wider">
              Plan in Agenda &rarr;
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
            {trainingEvents.length === 0 ? (
              <p className="text-zinc-500 text-sm italic w-full text-center py-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                Nog geen trainingen gevonden in de agenda voor deze week.
              </p>
            ) : (
              trainingEvents.map(event => {
                 const isPast = event.date < todayISO; 
                 const isToday = event.date === todayISO; 
                 const isActive = activeForgeEventId === event.id;
                 return (
                   <div key={event.id} onClick={() => setActiveForgeEventId(event.id)} className={`group cursor-pointer shrink-0 w-56 p-4 rounded-2xl border transition-all ${isActive ? 'border-fuchsia-500 bg-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.2)]' : isToday ? 'border-fuchsia-500/50 bg-fuchsia-500/5 hover:bg-fuchsia-500/10' : isPast ? 'border-zinc-800 bg-zinc-950/80 opacity-70 hover:opacity-100' : 'border-zinc-700 bg-zinc-900 hover:border-fuchsia-500/50'}`}>
                     <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs font-bold ${isActive ? 'text-fuchsia-300' : 'text-zinc-500'}`}>{event.date}</span>
                       <div className="flex items-center gap-2">
                         {isToday && <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>}
                         <button onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className="text-zinc-500 hover:text-fuchsia-400 transition-colors p-0.5 rounded">
                           <Info className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                     <div className={`font-bold text-lg mb-1 truncate ${isActive || isToday ? 'text-fuchsia-400' : 'text-zinc-200'}`}>{event.title}</div>
                     <div className="text-xs font-medium uppercase tracking-wider flex items-center gap-1 mt-3">
                       {isPast ? <><CheckCircle2 className={`w-3 h-3 ${isActive ? 'text-fuchsia-300' : 'text-zinc-500'}`}/> <span className={isActive ? 'text-fuchsia-300' : 'text-zinc-500'}>Voltooid</span></> : isToday ? <><Activity className="w-3 h-3 text-fuchsia-500"/> <span className="text-fuchsia-500">Vandaag</span></> : <><Clock className={`w-3 h-3 ${isActive ? 'text-fuchsia-300' : 'text-zinc-400'}`}/> <span className={isActive ? 'text-fuchsia-300' : 'text-zinc-400'}>Gepland</span></>}
                     </div>
                   </div>
                 )
              })
            )}
          </div>
        </div>

        <div className={`bg-zinc-900 rounded-3xl border ${activeForgeEventId ? 'border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.1)]' : 'border-zinc-800 shadow-2xl'} overflow-hidden transition-all duration-500`}>
          <div className="bg-zinc-950 p-6 border-b border-zinc-800 flex flex-col xl:flex-row justify-between gap-6 items-start xl:items-center">
            <div>
              <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-fuchsia-500"/> 
                {activeForgeEvent ? `Sessie: ${activeForgeEvent.title} (${activeForgeEvent.date})` : 'Geen sessie geselecteerd'}
              </h3>
              <p className="text-zinc-500 text-sm mt-1">
                {activeForgeEvent ? `Log hier je specifieke oefeningen en gewichten voor deze workout.` : 'Klik op een training hierboven om je logboek voor die dag te openen.'}
              </p>
            </div>
          </div>
          
          {activeForgeEventId ? (
            <div className="p-6 space-y-6">
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

              <div onClick={isScanning ? null : () => fileInputRef.current?.click()} className={`w-full border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative overflow-hidden ${isScanning ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-zinc-700 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5'}`}>
                {scannedImage && (
                  <div className="absolute inset-0 z-0 opacity-20">
                    <img src={scannedImage} alt="Scanned log" className="w-full h-full object-cover" />
                  </div>
                )}
                {isScanning ? (
                  <div className="relative z-10">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,1)] animate-[scan_2s_ease-in-out_infinite]" />
                    <Loader2 className="w-10 h-10 text-fuchsia-400 animate-spin mb-4 mx-auto" />
                    <h4 className="text-fuchsia-400 font-bold text-lg tracking-wide">FOTO ANALYSEREN...</h4>
                    <p className="text-fuchsia-400/70 text-sm mt-1">Systeem is bezig met inlezen.</p>
                  </div>
                ) : (
                  <div className="relative z-10">
                    <div className="bg-zinc-800 p-4 rounded-full mb-4 ring-4 ring-zinc-900 mx-auto w-16 h-16 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-fuchsia-400" />
                    </div>
                    <h4 className="text-zinc-200 font-bold text-lg">Scan Fysiek Logboek</h4>
                    <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto">Tik hier om de camera te openen. De AI leest direct in wat je in deze sessie gedaan hebt.</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {activeExercises.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                    <p className="text-zinc-500 text-sm italic">Nog geen oefeningen geregistreerd in deze sessie.</p>
                  </div>
                ) : (
                  activeExercises.map(ex => (
                    <div key={ex.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${ex.completed ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-zinc-950/50 border-zinc-800'}`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleExercise(ex.id)} className={ex.completed ? 'text-fuchsia-400' : 'text-zinc-600 hover:text-fuchsia-400 transition-colors'}>
                          {ex.completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                        </button>
                        <div>
                          <h4 className={`font-bold text-lg flex items-center gap-2 ${ex.completed ? 'text-fuchsia-200 opacity-60 line-through' : 'text-zinc-100'}`}>
                            {ex.name} {ex.name.includes('(Scanned)') && <FileText className="w-4 h-4 text-fuchsia-500" title="Scanned from Notebook" />}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs font-bold bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Flame className="w-3 h-3 text-fuchsia-500"/> {ex.sets} Sets
                            </span>
                            <span className="text-xs font-bold bg-zinc-900 text-zinc-300 px-3 py-1.5 rounded-lg">{ex.reps} Reps</span>
                            <span className="text-xs font-bold bg-zinc-900 text-fuchsia-400 px-3 py-1.5 rounded-lg border border-fuchsia-900/50">{ex.weight}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteExercise(ex.id)} className="text-zinc-600 hover:text-rose-400 transition-colors p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-800">
                <h4 className="text-zinc-400 font-bold text-xs md:text-sm uppercase tracking-wider mb-4">Handmatige Invoer</h4>
                <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 items-end">
                  <div className="col-span-2 md:col-span-4">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Oefening</label>
                    <input type="text" value={newExercise.name} onChange={(e) => setNewExercise({...newExercise, name: e.target.value})} placeholder="e.g. Squat" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 outline-none focus:border-fuchsia-500 text-sm transition-colors" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Sets</label>
                    <input type="number" value={newExercise.sets} onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-zinc-100 outline-none text-center text-sm transition-colors" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Reps</label>
                    <input type="number" value={newExercise.reps} onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-zinc-100 outline-none text-center text-sm transition-colors" />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Gewicht</label>
                    <input type="text" value={newExercise.weight} onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})} placeholder="kg" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-zinc-100 outline-none text-center text-sm transition-colors" />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <button onClick={addExercise} disabled={!newExercise.name.trim()} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 px-5 py-3 rounded-xl font-bold transition-colors h-[46px] flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" /> <span className="md:hidden">Add Lift</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center opacity-50">
              <Dumbbell className="w-16 h-16 text-zinc-600 mb-4" />
              <p className="text-zinc-400">Selecteer een sessie hierboven in de agenda om je logboek te openen.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProjects = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
        <FolderKanban className="text-cyan-400" /> Projects
      </h2>
      {projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 italic">Geen projecten gevonden. Voeg er één toe via de AI command bar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className={`bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col shadow-xl ${expandedProjectId === project.id ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
              <div className="p-6 cursor-pointer flex flex-col flex-1" onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-800 ${project.category === 'Work' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                    {project.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                    {expandedProjectId === project.id ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                  </div>
                </div>
                <h4 className="font-bold text-xl text-zinc-100 mb-6">{project.title}</h4>
                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-2">
                    <span>{project.tasks.filter(t=>t.completed).length}/{project.tasks.length} Tasks</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${project.progress === 100 ? 'bg-emerald-400' : 'bg-cyan-400'}`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
              {expandedProjectId === project.id && (
                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 space-y-2">
                  {project.tasks.map(task => (
                    <div key={task.id} onClick={(e) => toggleProjectTask(project.id, task.id, e)} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${task.completed ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30'}`}>
                      <button className={task.completed ? 'text-emerald-400' : 'text-zinc-500'}>
                        {task.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                      <span className={`text-sm ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {task.title}
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
  );

  const renderAchievements = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
        <Medal className="text-yellow-400" /> Achievements
      </h2>
      <div className="bg-zinc-900 rounded-3xl p-10 border border-zinc-800 text-center shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          <Award className="w-64 h-64 text-yellow-400" />
        </div>
        <div className="relative z-10">
          <Award className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-zinc-300 mb-2">Hall of Fame</h3>
          <p className="text-zinc-500 max-w-md mx-auto">Deze sectie is momenteel in aanbouw. Binnenkort vind je hier al je behaalde prestaties, streaks en mijlpalen verzameld door de AI.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 opacity-50 grayscale">
          <div className="bg-yellow-500/20 p-3 rounded-full"><Trophy className="w-8 h-8 text-yellow-500" /></div>
          <div>
            <h4 className="font-bold text-zinc-300">Iron Will</h4>
            <p className="text-xs text-zinc-500">Train 7 dagen achter elkaar.</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 opacity-50 grayscale">
          <div className="bg-cyan-500/20 p-3 rounded-full"><Target className="w-8 h-8 text-cyan-500" /></div>
          <div>
            <h4 className="font-bold text-zinc-300">Goal Crusher</h4>
            <p className="text-xs text-zinc-500">Voltooi je eerste grote project.</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 opacity-50 grayscale">
          <div className="bg-emerald-500/20 p-3 rounded-full"><Activity className="w-8 h-8 text-emerald-500" /></div>
          <div>
            <h4 className="font-bold text-zinc-300">Early Bird</h4>
            <p className="text-xs text-zinc-500">Start 5 dagen The Forge voor 08:00.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
        <Settings className="text-cyan-400" /> Settings
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        <div className="flex flex-col gap-6 w-full">
          {/* PERSONALISATIE (YASMIN MODUS) */}
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-xl w-full">
            <h3 className="font-bold text-xl text-zinc-100 mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500"/> Personalisatie
            </h3>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">Pas de look en feel van Apex OS aan naar jouw wensen.</p>
            
            <div className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl transition-all">
              <div>
                <h4 className="font-bold text-zinc-200 flex items-center gap-2">Yasmin Modus ✨</h4>
                <p className="text-xs text-zinc-500 mt-1">Transformeer Apex in een gezellige, paarse omgeving speciaal voor Yasmin.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isYasminMode} onChange={(e) => setIsYasminMode(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
          </div>

          {/* TRAININGS DOEL & BIOMETRICS */}
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-xl w-full">
            <h3 className="font-bold text-xl text-zinc-100 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-500"/> Biometrics & Fysiek Doel
            </h3>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">Deze data gebruikt de AI om je voeding-targets en training te personaliseren.</p>
            
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Huidig Trainingsdoel</label>
                <select value={trainingGoal} onChange={e => setTrainingGoal(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 outline-none focus:border-cyan-500 text-sm">
                  <option value="Spieropbouw (Bulk)">Spieropbouw (Bulk) - 200/300 kcal overschot</option>
                  <option value="Droogtrainen (Cut)">Droogtrainen (Cut) - Focus op spierbehoud</option>
                  <option value="Onderhoud">Onderhoud - Gewicht stabiliseren</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Gewicht</label>
                  <div className="flex items-baseline gap-1">
                    <input type="number" value={healthStats.weight} onChange={(e) => setHealthStats({...healthStats, weight: e.target.value})} className="w-full bg-transparent text-2xl font-black text-white outline-none" />
                    <span className="text-zinc-500 font-bold">kg</span>
                  </div>
                </div>
                <div className="flex-1 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Lengte</label>
                  <div className="flex items-baseline gap-1">
                    <input type="number" value={healthStats.height} onChange={(e) => setHealthStats({...healthStats, height: e.target.value})} className="w-full bg-transparent text-2xl font-black text-white outline-none" />
                    <span className="text-zinc-500 font-bold">cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-6 w-full">
          {/* FORGE PROTOCOL / AI PLANNING */}
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-xl w-full">
            <h3 className="font-bold text-xl text-zinc-100 mb-2 flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-fuchsia-500"/> Forge Protocol
            </h3>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">Configureer je macro cyclus. De AI kan deze wekelijks automatisch voor je inplannen rondom je andere afspraken.</p>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Dagen / Week</label>
                  <input type="number" min="1" max="7" value={trainingDaysPerWeek} onChange={(e) => setTrainingDaysPerWeek(parseInt(e.target.value) || 1)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-zinc-100 outline-none focus:border-fuchsia-500 text-sm transition-colors" />
                </div>
                <div className="w-full sm:w-2/3">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Macro Cyclus (Split met '/')</label>
                  <input type="text" value={workoutSplit} onChange={(e) => setWorkoutSplit(e.target.value)} placeholder="Push / Pull / Legs" className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-zinc-100 outline-none focus:border-fuchsia-500 text-sm transition-colors" />
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl mt-4">
                <div>
                  <h4 className="font-bold text-zinc-200">Automatisch Inplannen</h4>
                  <p className="text-xs text-zinc-500 mt-1">AI plant wekelijks geruisloos je missende sessies in.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={autoScheduleTrainings} onChange={(e) => { setAutoScheduleTrainings(e.target.checked); if (e.target.checked) hasAutoPlannedRef.current = false; }} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* AGENDA INTEGRATIES */}
          <div className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-xl w-full">
            <h3 className="font-bold text-xl text-zinc-100 mb-2">Agenda Integraties</h3>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">Verbind je agenda veilig via OAuth of importeer een kalender feed (.ics) om alles centraal in Apex OS te tonen.</p>
            <div className="space-y-4">
              {['Google', 'Apple', 'Outlook', 'Andere Agenda'].map(provider => (
                <div key={provider} className="flex flex-col p-5 rounded-2xl border bg-zinc-950/50 border-zinc-800 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${getEventColor(provider).split(' ')[0]} ${getEventColor(provider).split(' ')[1]}`}></div>
                      <div>
                        <h4 className="font-bold text-zinc-200">{provider === 'Andere Agenda' ? 'School / URL Agenda' : `${provider} Calendar`}</h4>
                        <p className="text-xs text-zinc-500 mt-1">Status: {connectedAgendas[provider] ? <span className="text-emerald-400 font-bold">Verbonden</span> : 'Niet verbonden'}</p>
                      </div>
                    </div>
                  </div>
                  {!connectedAgendas[provider] ? (
                    <div className="mt-2">
                      {provider === 'Andere Agenda' || provider === 'Apple' ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input type="url" placeholder={provider === 'Apple' ? "Plak hier je openbare iCloud link (webcal://... of https://...)" : "Plak hier de .ics link..."} value={agendaUrls[provider] || ''} onChange={(e) => setAgendaUrls(prev => ({...prev, [provider]: e.target.value}))} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-200 outline-none focus:border-cyan-500 transition-colors" />
                          </div>
                          <button onClick={() => handleConnectUrlAgenda(provider)} disabled={isConnecting === provider || !(agendaUrls[provider] || '').trim()} className="px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center transition-all">
                            {isConnecting === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inladen'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button onClick={() => handleConnectApiAgenda(provider)} disabled={isConnecting === provider} className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all">
                            {isConnecting === provider ? (<><Loader2 className="w-4 h-4 animate-spin" /> Verbinding maken...</>) : (<><LinkIcon className="w-4 h-4" /> Log in met {provider}</>)}
                          </button>
                          <p className="text-[10px] text-zinc-600 mt-2 font-medium">Je wordt omgeleid naar {provider} om deze app veilige toegang (Read-Only) te geven tot je agenda.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                      <div>
                        <p className="text-sm text-zinc-300 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {provider === 'Andere Agenda' || provider === 'Apple' ? 'Live .ics Feed Actief' : 'API Token Actief'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {provider === 'Andere Agenda' || provider === 'Apple' ? <span className="truncate block max-w-xs">{agendaUrls[provider]}</span> : 'Automatische synchronisatie staat aan.'}
                        </p>
                      </div>
                      <button onClick={() => handleDisconnectAgenda(provider)} className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-800 text-rose-400 hover:bg-zinc-700 border border-zinc-700 transition-all shrink-0">
                        Ontkoppelen
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>


        </div>

      </div>

    </div>
  );

  const NavButton = ({ id, icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
        activeTab === id 
          ? (isYasminMode ? 'bg-[#2d1b4e] text-purple-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' : 'bg-zinc-800 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]')
          : (isYasminMode ? 'text-purple-300/60 hover:text-purple-100 hover:bg-[#2d1b4e]/50' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900')
      }`}
    >
      {icon} {label}
    </button>
  );

  // Auth loading / login gate
  if (authLoading) {
    return (
      <div className="flex h-screen bg-zinc-950 items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <LoginScreen onSignIn={signIn} />;
  }

  return (
    <div className={`flex h-screen transition-colors duration-1000 ${isYasminMode ? 'bg-[#140824]' : 'bg-zinc-950'} text-zinc-100 font-sans overflow-hidden selection:bg-cyan-500/30`}>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .safe-top { padding-top: env(safe-area-inset-top); }
        .pt-safe-main { padding-top: calc(4rem + env(safe-area-inset-top)); }
        .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}} />

      {/* MOBILE MENU BAR */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 backdrop-blur-xl border-b z-40 flex flex-col transition-colors duration-1000 safe-top ${isYasminMode ? 'bg-[#140824]/90 border-purple-900/30' : 'bg-zinc-950/90 border-zinc-800'}`}>
        <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 font-black tracking-widest text-lg">
            <Triangle className={`w-5 h-5 ${isYasminMode ? 'text-purple-400 fill-purple-400' : 'text-cyan-400 fill-cyan-400'}`} /> APEX
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 rounded-xl border ${isYasminMode ? 'text-purple-300 bg-[#2d1b4e] border-purple-800' : 'text-zinc-300 bg-zinc-900 border-zinc-800'}`}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR NAVIGATION */}
      <div className={`fixed inset-y-0 left-0 z-[70] w-72 border-r transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isYasminMode ? 'bg-[#140824] border-purple-900/30' : 'bg-zinc-950 border-zinc-800'}`}>
        <div className="p-6 flex items-center justify-between lg:justify-start lg:mb-4 lg:mt-4">
          <div className="flex items-center gap-3 font-black tracking-widest text-xl lg:text-3xl text-white">
            <Triangle className={`${isYasminMode ? 'text-purple-400 fill-purple-400' : 'text-cyan-400 fill-cyan-400'} w-6 h-6 lg:w-8 lg:h-8`}/> APEX
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-zinc-400 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-6 custom-scrollbar">
          <NavButton id="hub" icon={<Command />} label="Morning Hub" />
          <NavButton id="agenda" icon={<Calendar />} label="Agenda" />
          <NavButton id="focus" icon={<Timer />} label="Focus Mode" />
          <NavButton id="projects" icon={<FolderKanban />} label="Projects" />
          <NavButton id="habits" icon={<CheckCircle2 />} label="Habit Tracker" />
          <NavButton id="nutrition" icon={<PieChart />} label="Nutrition" />
          <NavButton id="forge" icon={<Dumbbell />} label="The Forge" />
          <NavButton id="logbook" icon={<BookMarked />} label="Logbook" />
          <div className={`pt-4 mt-4 border-t ${isYasminMode ? 'border-purple-900/30' : 'border-zinc-800/50'}`}>
             <NavButton id="achievements" icon={<Medal />} label="Achievements" />
             <NavButton id="settings" icon={<Settings />} label="Settings" />
          </div>
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-full relative overflow-hidden pt-safe-main lg:pt-0 ${isYasminMode ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#2d1b4e] via-[#140824] to-[#140824]' : ''}`}>
        
        <main ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 scroll-smooth relative custom-scrollbar pb-56 lg:pb-32">
          <div className="max-w-6xl mx-auto w-full flex flex-col min-h-full">
            {activeTab === 'hub' && renderHub()}
            {activeTab === 'agenda' && renderAgenda()}
            {activeTab === 'focus' && renderFocus()}
            {activeTab === 'logbook' && renderLogbook()}
            {activeTab === 'projects' && renderProjects()}
            {activeTab === 'forge' && renderForge()}
            {activeTab === 'nutrition' && renderNutrition()}
            {activeTab === 'achievements' && renderAchievements()}
            {activeTab === 'settings' && renderSettings()}
            
            {activeTab === 'habits' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-3xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-400" /> Habits
                </h2>
                {habits.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-zinc-500 italic">Geen habits gevonden. Gebruik de command bar onderaan om er één toe te voegen ("Start habit: Drink water").</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {habits.map(habit => (
                      <div key={habit.id} onClick={(e) => toggleHabit(habit.id, e)} className={`flex items-center justify-between p-6 rounded-3xl border cursor-pointer transition-all shadow-xl group ${habit.completedToday ? 'bg-emerald-500/10 border-emerald-500/30' : (isYasminMode ? 'bg-[#1a0b2e]/80 border-purple-500/20 hover:border-purple-400/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700')}`}>
                        <div className="flex items-center gap-4">
                          <div className={habit.completedToday ? 'text-emerald-400' : 'text-zinc-600'}>
                            {habit.completedToday ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                          </div>
                          <h3 className={`text-xl font-bold ${habit.completedToday ? 'text-emerald-200 opacity-80' : 'text-zinc-100'}`}>
                            {habit.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-black text-fuchsia-400">{habit.streak}</div>
                            <div className="text-xs font-bold text-zinc-500 uppercase">Streak</div>
                          </div>
                          <button onClick={(e) => handleDeleteHabit(habit.id, e)} className="text-zinc-600 hover:text-rose-400 transition-colors p-2 opacity-0 group-hover:opacity-100 focus:opacity-100" title="Habit verwijderen">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
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
        </main>

        {/* COMMAND BAR */}
        <div className="absolute bottom-24 lg:bottom-6 left-0 right-0 z-50 px-4 md:px-8 pointer-events-none flex justify-center">
          <form onSubmit={handleAISubmit} className="w-full max-w-2xl pointer-events-auto relative">
            {lastAction && (
              <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 shadow-2xl z-[60] whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" /> {lastAction}
              </div>
            )}
            <div className={`flex items-center backdrop-blur-2xl border rounded-2xl md:rounded-full px-4 py-3 md:px-6 md:py-4 shadow-2xl transition-all focus-within:shadow-[0_0_30px_rgba(6,182,212,0.15)] ${isYasminMode ? 'bg-[#2d1b4e]/90 border-purple-500/30 focus-within:border-purple-400/50 focus-within:bg-[#2d1b4e]' : 'bg-zinc-800/90 border-zinc-700/80 focus-within:border-cyan-500/50 focus-within:bg-zinc-800'}`}>
              <Sparkles className={`w-5 h-5 mr-3 md:mr-4 shrink-0 ${isProcessing ? (isYasminMode ? 'text-purple-400' : 'text-cyan-400') + ' animate-pulse' : 'text-zinc-400'}`} />
              <input 
                ref={aiInputRef} 
                type="text" 
                value={aiInput} 
                onChange={(e) => setAiInput(e.target.value)} 
                placeholder="Vraag om AI advies of gebruik een commando..." 
                className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none text-base md:text-lg font-medium w-full" 
                disabled={isProcessing} 
              />
              <button type="submit" disabled={isProcessing || !aiInput.trim()} className={`ml-3 md:ml-4 text-zinc-950 disabled:text-zinc-500 rounded-xl md:rounded-full p-2 md:p-2.5 transition-all shrink-0 ${isYasminMode ? 'bg-purple-400 hover:bg-purple-300 disabled:bg-purple-900' : 'bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700'}`}>
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* MOBILE BOTTOM NAV */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl flex flex-col transition-colors duration-1000 pb-safe-bottom ${isYasminMode ? 'bg-[#140824]/95 border-purple-900/30' : 'bg-zinc-950/95 border-zinc-800'}`}>
        <div className="flex items-center h-16">
          {[
            { id: 'hub',      icon: <Command className="w-5 h-5" />,   label: 'Hub'      },
            { id: 'agenda',   icon: <Calendar className="w-5 h-5" />,  label: 'Agenda'   },
            { id: 'forge',    icon: <Dumbbell className="w-5 h-5" />,  label: 'Forge'    },
            { id: 'focus',    icon: <Timer className="w-5 h-5" />,     label: 'Focus'    },
            { id: 'settings', icon: <Settings className="w-5 h-5" />,  label: 'Settings' },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeTab === id
                  ? (isYasminMode ? 'text-purple-400' : 'text-cyan-400')
                  : (isYasminMode ? 'text-purple-300/40 hover:text-purple-300/70' : 'text-zinc-600 hover:text-zinc-400')
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* MODAL / POPUP VOOR AGENDAPUNTEN */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedEvent(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-800 rounded-full hover:bg-zinc-700">
              <X className="w-4 h-4"/>
            </button>
            
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-3 h-3 rounded-full ${getEventColor(selectedEvent.type)}`}></div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{selectedEvent.type}</span>
            </div>
            
            <h3 className={`text-2xl font-bold mb-2 leading-tight ${selectedEvent.completed ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-white'}`}>
              {selectedEvent.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6 font-medium">
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-cyan-400"/> {selectedEvent.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-emerald-400"/> {selectedEvent.time}</span>
            </div>
            
            {selectedEvent.location && !selectedEvent.completed && (
              <div className="mb-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Locatie / Link</h4>
                <p className="text-zinc-200 text-sm flex items-start gap-2 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 break-all">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"/> {selectedEvent.location}
                </p>
              </div>
            )}
            
            {selectedEvent.description && (
              <div className="mb-6">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Notities</h4>
                <div className="text-zinc-300 text-sm whitespace-pre-wrap bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedEvent.description}
                </div>
              </div>
            )}
            
            {!selectedEvent.location && !selectedEvent.description && (
              <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 mb-6">
                <p className="text-zinc-500 text-sm italic">Geen extra details (locatie of notities) beschikbaar voor deze afspraak.</p>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-zinc-800/50 mt-4">
               <button onClick={(e) => { toggleAgendaEventCompleted(selectedEvent.id, e); setSelectedEvent({...selectedEvent, completed: !selectedEvent.completed}); }} className={`text-sm font-bold flex items-center gap-2 py-2 px-4 rounded-xl transition-colors ${selectedEvent.completed ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                 {selectedEvent.completed ? <><CheckCircle2 className="w-4 h-4"/> Voltooid</> : <><Circle className="w-4 h-4"/> Afvinken</>}
               </button>
               <button onClick={() => { handleDeleteAgendaEvent(selectedEvent.id); setSelectedEvent(null); }} className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-rose-500/10 transition-colors">
                 <Trash2 className="w-4 h-4"/> Verwijderen
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / POPUP VOOR AI SCIENCE ADVICE */}
      {aiResponse && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setAiResponse(null)}>
          <div className={`border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative ${isYasminMode ? 'bg-[#2d1b4e] border-purple-500/50' : 'bg-zinc-900 border-zinc-700'}`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setAiResponse(null)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-950/50 rounded-full">
              <X className="w-5 h-5"/>
            </button>
            
            <div className="flex items-center gap-3 mb-6">
               <div className={`p-3 rounded-2xl ${isYasminMode ? 'bg-[#1a0b2e]' : 'bg-zinc-950'}`}>
                 <BrainCircuit className={`w-6 h-6 ${isYasminMode ? 'text-purple-400' : 'text-cyan-400'}`} />
               </div>
               <div>
                 <h3 className={`font-black text-xl ${isYasminMode ? 'text-purple-100' : 'text-white'}`}>Apex AI Analyse</h3>
                 <p className={`text-xs font-bold uppercase tracking-wider ${isYasminMode ? 'text-purple-400/80' : 'text-cyan-500/80'}`}>Science-Based Protocol</p>
               </div>
            </div>
            
            <div className="mb-6 border-l-4 pl-4 border-zinc-700">
              <p className="text-sm font-medium text-zinc-400 italic">"{aiResponse.query}"</p>
            </div>
            
            <div className="text-zinc-200 text-sm leading-relaxed space-y-4">
               {aiResponse.answer.split('\n').map((line, i) => (
                 <p key={i}>{line.includes('**') ? <strong className={isYasminMode ? 'text-purple-200' : 'text-white'}>{line.replace(/\*\*/g, '')}</strong> : line}</p>
               ))}
            </div>

            <button onClick={() => setAiResponse(null)} className={`w-full mt-8 py-3 rounded-xl font-bold transition-colors ${isYasminMode ? 'bg-purple-500 hover:bg-purple-400 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950'}`}>
              Begrepen
            </button>
          </div>
        </div>
      )}

    </div>
  );
}