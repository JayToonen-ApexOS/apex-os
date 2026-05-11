import React from 'react';
import {
  CheckCircle2, Circle, Flame, ArrowRight, MapPin,
  CloudRain, Sun, Cloud, CloudSnow, Zap, CalendarDays,
  Target, ChevronRight, Sparkles, BrainCircuit
} from 'lucide-react';

function WeatherIcon({ condition, className }) {
  const c = (condition || '').toLowerCase();
  if (c.includes('regen') || c.includes('mist')) return <CloudRain className={className} />;
  if (c.includes('sneeuw')) return <CloudSnow className={className} />;
  if (c.includes('onweer')) return <Zap className={className} />;
  if (c.includes('bewolkt')) return <Cloud className={className} />;
  return <Sun className={className} />;
}

function getGreeting(time) {
  const hour = parseInt((time || '00').split(':')[0], 10);
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function buildBriefing({ todaysEvents, weather, currentSession, isYasminMode }) {
  const realEvents = todaysEvents.filter(e => e.type !== 'Habit');
  const name = isYasminMode ? 'Yasmin' : 'Jay';
  const parts = [];

  if (realEvents.length === 0) {
    parts.push(`Je agenda is leeg vandaag, ${name}.`);
  } else {
    const first = [...realEvents].sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
    parts.push(
      `${realEvents.length} afspraak${realEvents.length !== 1 ? 'en' : ''} vandaag.` +
      (first.time ? ` Eerste om ${first.time}: ${first.title}.` : ` Eerste: ${first.title}.`)
    );
  }
  if (currentSession) parts.push(`Forge: ${currentSession}.`);
  if (weather.temp !== '--') parts.push(`${weather.temp}°, ${weather.condition.toLowerCase()} in ${weather.location}.`);
  return parts.join(' ');
}

// Design tokens
const card = 'rounded-xl border border-white/[0.06] bg-[#0a0a0a]';
const muted = 'text-white/40';

export default function Hub({
  isYasminMode, todaysEvents, currentSession, weather, habits,
  setActiveTab, toggleHabit, toggleAgendaEventCompleted, setSelectedEvent,
  getEventColor, currentTime, currentDateFormatted, pendingTasks = [],
}) {
  const cy = isYasminMode;
  const accent = cy ? 'text-purple-400' : 'text-[#00D4FF]';
  const accentBg = cy ? 'bg-purple-500/10' : 'bg-[#00D4FF]/10';

  const realEvents = todaysEvents
    .filter(e => e.type !== 'Habit')
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const upcoming = realEvents.filter(e => !e.completed);
  const completed = realEvents.filter(e => e.completed);
  const displayEvents = [...upcoming, ...completed].slice(0, 5);
  const extraCount = realEvents.length - 5;

  const focusEvent = upcoming[0] || null;
  const focusTask = !focusEvent && pendingTasks.length > 0 ? pendingTasks[0] : null;

  const doneHabits = habits.filter(h => h.completedToday).length;
  const briefing = buildBriefing({ todaysEvents, weather, currentSession, isYasminMode });

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-6">

      {/* ── HERO ── */}
      <div
        className="rounded-xl p-6 border border-white/[0.06] relative overflow-hidden"
        style={{
          background: cy
            ? 'radial-gradient(ellipse at 70% 0%, rgba(139,92,246,0.12) 0%, #0a0a0a 70%)'
            : 'radial-gradient(ellipse at 70% 0%, rgba(0,212,255,0.08) 0%, #0a0a0a 70%)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.12em] mb-1 ${muted}`}>
              {currentDateFormatted}
            </p>
            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
              {getGreeting(currentTime)}, {cy ? 'Yasmin' : 'Jay'}
            </h1>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Live clock */}
            <span className={`text-2xl font-black tabular-nums leading-none tracking-tight ${accent}`}>
              {currentTime}
            </span>
            {/* Weather pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03]`}>
              <WeatherIcon condition={weather.condition} className={`w-3.5 h-3.5 ${accent}`} />
              <span className="text-sm font-bold text-white">{weather.temp}°</span>
              <span className={`text-xs ${muted}`}>{weather.condition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AI BRIEFING ── */}
      <div className={`rounded-xl border-l-[3px] border border-white/[0.06] p-4 ${cy ? 'bg-[#0a0a0a] border-l-purple-500' : 'bg-[#0a0a0a] border-l-[#00D4FF]'}`}>
        <div className="flex items-center gap-2 mb-2">
          {cy ? <Sparkles className={`w-3.5 h-3.5 ${accent}`} /> : <BrainCircuit className={`w-3.5 h-3.5 ${accent}`} />}
          <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${accent}`}>
            Apex Briefing
          </span>
        </div>
        <p className="text-sm text-white/60 leading-relaxed line-clamp-2">{briefing}</p>
      </div>

      {/* ── TODAY'S AGENDA ── */}
      <div className={card + ' p-5'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Vandaag</span>
            {realEvents.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${accentBg} ${accent}`}>
                {realEvents.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-0.5 text-xs font-semibold ${accent} hover:opacity-70 transition-opacity duration-150`}
          >
            Alles zien <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayEvents.length === 0 ? (
          <p className={`text-sm italic ${muted} py-1`}>
            Geen afspraken vandaag — geniet van de vrijheid.
          </p>
        ) : (
          <div className="space-y-px">
            {displayEvents.map((event, idx) => (
              <div key={event.id} className="relative">
                {/* Vertical connector line between events */}
                {idx < displayEvents.length - 1 && (
                  <div className="absolute left-[27px] top-[34px] w-px h-[calc(100%-2px)] bg-white/[0.06]" />
                )}
                <div
                  className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg cursor-pointer transition-all duration-150 group
                    ${event.completed ? 'opacity-40' : 'hover:bg-white/[0.03]'}`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <span className={`text-xs font-bold w-10 shrink-0 text-right tabular-nums ${muted}`}>
                    {event.time || '—'}
                  </span>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${getEventColor(event.type)}`} />
                  <span className={`flex-1 text-sm font-medium ${event.completed ? 'line-through text-white/30' : 'text-white'}`}>
                    {event.title}
                  </span>
                  {event.location && !event.completed && (
                    <MapPin className={`w-3 h-3 ${muted} shrink-0`} />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleAgendaEventCompleted(event.id, e); }}
                    className={`shrink-0 transition-colors duration-150 ${event.completed ? 'text-emerald-400' : 'text-white/20 hover:text-emerald-400 opacity-0 group-hover:opacity-100'}`}
                  >
                    {event.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            {extraCount > 0 && (
              <button
                onClick={() => setActiveTab('agenda')}
                className={`w-full text-center text-xs font-semibold pt-3 ${accent} hover:opacity-70 transition-opacity duration-150`}
              >
                + {extraCount} meer afspraken →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── FOCUS + HABITS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Daily Focus */}
        <div className={card + ' p-5'}>
          <div className="flex items-center gap-1.5 mb-4">
            <Target className={`w-3.5 h-3.5 ${accent}`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${accent}`}>Focus</span>
          </div>

          {focusEvent ? (
            <div>
              <p className="text-white font-bold text-xl leading-tight mb-1">{focusEvent.title}</p>
              <p className={`text-xs ${muted} mb-4`}>
                {focusEvent.time ? `Om ${focusEvent.time} · eerste afspraak` : 'Eerste afspraak van de dag'}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); toggleAgendaEventCompleted(focusEvent.id, e); }}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition-all duration-150 active:scale-95
                  ${focusEvent.completed
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : `${accentBg} ${accent} border-white/[0.06] hover:border-white/20`}`}
              >
                {focusEvent.completed
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Gedaan</>
                  : <><Circle className="w-3.5 h-3.5" /> Markeer klaar</>}
              </button>
            </div>
          ) : focusTask ? (
            <div>
              <p className="text-white font-bold text-xl leading-tight mb-1">{focusTask.title}</p>
              <p className={`text-xs ${muted} mb-4`}>{focusTask.projectName}</p>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${accentBg} ${accent} border-white/[0.06] hover:border-white/20 transition-all duration-150 active:scale-95`}
              >
                Open project <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className={`text-sm ${muted} italic`}>
              Geen prioriteit — goede dag voor deep work.
            </p>
          )}
        </div>

        {/* Habits */}
        <div className={card + ' p-5'}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/60">Habits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${muted}`}>{doneHabits}/{habits.length}</span>
              <button
                onClick={() => setActiveTab('habits')}
                className={`text-xs font-semibold ${accent} hover:opacity-70 transition-opacity duration-150`}
              >
                Toon alle →
              </button>
            </div>
          </div>

          {habits.length === 0 ? (
            <p className={`text-xs italic ${muted}`}>Geen habits ingesteld.</p>
          ) : (
            <div className="space-y-2">
              {habits.map(habit => (
                <button
                  key={habit.id}
                  onClick={(e) => toggleHabit(habit.id, e)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 active:scale-[0.99]
                    ${habit.completedToday
                      ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:text-white/80'}`}
                >
                  {habit.completedToday
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    : <Circle className="w-4 h-4 shrink-0 text-white/20" />}
                  <span className={`flex-1 text-xs font-semibold truncate ${habit.completedToday ? 'line-through opacity-60' : ''}`}>
                    {habit.title}
                  </span>
                  {habit.streak > 1 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Flame className={`w-3 h-3 ${habit.completedToday ? 'text-orange-400' : 'text-white/20'}`} />
                      <span className={`text-[10px] font-black tabular-nums ${habit.completedToday ? 'text-orange-400' : muted}`}>
                        {habit.streak}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
