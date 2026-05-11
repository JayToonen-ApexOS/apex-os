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
    parts.push(`Je agenda is leeg vandaag, ${name} — gebruik de tijd goed.`);
  } else {
    const first = realEvents.sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
    parts.push(
      `Je hebt ${realEvents.length} afspraak${realEvents.length !== 1 ? 'en' : ''} vandaag.` +
      (first.time ? ` Eerste om ${first.time}: ${first.title}.` : ` Eerste: ${first.title}.`)
    );
  }

  if (currentSession) {
    parts.push(`Forge: ${currentSession} staat op het schema.`);
  }

  if (weather.temp !== '--') {
    parts.push(`Buiten: ${weather.temp}° en ${weather.condition.toLowerCase()} in ${weather.location}.`);
  }

  return parts.join(' ');
}

export default function Hub({
  isYasminMode, todaysEvents, currentSession, weather, habits,
  setActiveTab, toggleHabit, toggleAgendaEventCompleted, setSelectedEvent,
  getEventColor, currentTime, currentDateFormatted, pendingTasks = [],
}) {
  const cy = isYasminMode;
  const accent      = cy ? 'text-purple-400'       : 'text-cyan-400';
  const accentBg    = cy ? 'bg-purple-500/15'       : 'bg-cyan-500/10';
  const accentBorder = cy ? 'border-purple-500/30'  : 'border-cyan-500/20';
  const card        = `rounded-2xl border ${cy ? 'bg-[#2d1b4e]/40 border-purple-500/20' : 'bg-zinc-900 border-zinc-800'}`;

  // Real agenda events (no habits)
  const realEvents = todaysEvents
    .filter(e => e.type !== 'Habit')
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const upcomingReal   = realEvents.filter(e => !e.completed);
  const completedReal  = realEvents.filter(e => e.completed);
  const displayEvents  = [...upcomingReal, ...completedReal].slice(0, 5);
  const extraCount     = realEvents.length - 5;

  // Daily focus: first upcoming real event, else first pending project task
  const focusEvent = upcomingReal[0] || null;
  const focusTask  = !focusEvent && pendingTasks.length > 0 ? pendingTasks[0] : null;

  const doneHabits = habits.filter(h => h.completedToday).length;
  const briefing = buildBriefing({ todaysEvents, weather, currentSession, isYasminMode });

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">

      {/* ── 1. HEADER ROW ── */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${cy ? 'text-purple-400/50' : 'text-zinc-500'}`}>
            {currentDateFormatted}
          </p>
          <h1 className="text-2xl font-black text-white leading-tight">
            {getGreeting(currentTime)}, {cy ? 'Yasmin' : 'Jay'}
          </h1>
        </div>

        {/* Weather pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shrink-0 mt-1 ${cy ? 'bg-purple-500/10 border-purple-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
          <WeatherIcon condition={weather.condition} className={`w-3.5 h-3.5 ${accent}`} />
          <span className="text-sm font-bold text-white">{weather.temp}°</span>
          <span className={`text-xs font-medium ${cy ? 'text-purple-300/70' : 'text-zinc-400'}`}>{weather.condition}</span>
        </div>
      </div>

      {/* ── 2. AI BRIEFING CARD ── */}
      <div className={`rounded-2xl border-l-4 p-4 ${cy
        ? 'bg-[#2d1b4e]/50 border-l-purple-500 border border-purple-500/20'
        : 'bg-zinc-900 border-l-cyan-500 border border-zinc-800'}`}>
        <div className="flex items-center gap-2 mb-2">
          {cy ? <Sparkles className="w-4 h-4 text-purple-400" /> : <BrainCircuit className="w-4 h-4 text-cyan-400" />}
          <span className={`text-xs font-black uppercase tracking-widest ${accent}`}>
            {cy ? 'Yasmin Briefing' : 'Apex Briefing'}
          </span>
        </div>
        <p className={`text-sm leading-relaxed line-clamp-3 ${cy ? 'text-purple-100/80' : 'text-zinc-300'}`}>
          {briefing}
        </p>
      </div>

      {/* ── 3. TODAY'S AGENDA ── */}
      <div className={card + ' p-4'}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Vandaag</span>
            {realEvents.length > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${cy ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-800 text-zinc-400'}`}>
                {realEvents.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-0.5 text-xs font-semibold ${accent} hover:opacity-75 transition-opacity`}
          >
            Volledige agenda <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayEvents.length === 0 ? (
          <p className={`text-sm italic py-2 ${cy ? 'text-purple-300/40' : 'text-zinc-600'}`}>
            Geen afspraken vandaag.
          </p>
        ) : (
          <div className="space-y-1.5">
            {displayEvents.map(event => (
              <div
                key={event.id}
                className={`flex items-center gap-3 group rounded-xl px-2 py-1.5 -mx-2 transition-colors cursor-pointer
                  ${event.completed ? 'opacity-45' : (cy ? 'hover:bg-purple-500/8' : 'hover:bg-zinc-800/60')}`}
                onClick={() => setSelectedEvent(event)}
              >
                {/* Time */}
                <span className={`text-xs font-bold w-9 shrink-0 text-right tabular-nums ${cy ? 'text-purple-300/50' : 'text-zinc-500'}`}>
                  {event.time || '·'}
                </span>

                {/* Source dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${getEventColor(event.type)}`} />

                {/* Title */}
                <span className={`flex-1 text-sm font-medium truncate ${event.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                  {event.title}
                </span>

                {/* Location hint */}
                {event.location && !event.completed && (
                  <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
                )}

                {/* Complete toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAgendaEventCompleted(event.id, e); }}
                  className={`shrink-0 transition-colors ${event.completed ? 'text-emerald-400' : 'text-zinc-700 hover:text-emerald-400'}`}
                >
                  {event.completed
                    ? <CheckCircle2 className="w-[17px] h-[17px]" />
                    : <Circle className="w-[17px] h-[17px]" />}
                </button>
              </div>
            ))}

            {extraCount > 0 && (
              <button
                onClick={() => setActiveTab('agenda')}
                className={`w-full text-center text-xs font-semibold pt-1.5 ${accent} hover:opacity-75 transition-opacity`}
              >
                + {extraCount} meer afspraken →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 4. FOCUS + HABITS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Daily Focus */}
        <div className={`rounded-2xl p-4 border ${cy
          ? 'bg-gradient-to-br from-purple-900/40 to-[#1a0b2e]/60 border-purple-500/25'
          : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800'}`}>
          <div className="flex items-center gap-1.5 mb-3">
            <Target className={`w-3.5 h-3.5 ${accent}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${accent}`}>Focus vandaag</span>
          </div>

          {focusEvent ? (
            <div className="flex flex-col gap-1">
              <p className="text-white font-bold text-base leading-snug">{focusEvent.title}</p>
              <p className={`text-xs ${cy ? 'text-purple-300/60' : 'text-zinc-500'}`}>
                {focusEvent.time
                  ? `Om ${focusEvent.time} · eerste afspraak van de dag`
                  : 'Eerste afspraak van de dag'}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); toggleAgendaEventCompleted(focusEvent.id, e); }}
                className={`mt-2 self-start flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95
                  ${focusEvent.completed
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : `${accentBg} ${accent} ${accentBorder} border`}`}
              >
                {focusEvent.completed
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Gedaan</>
                  : <><Circle className="w-3.5 h-3.5" /> Markeer klaar</>}
              </button>
            </div>
          ) : focusTask ? (
            <div className="flex flex-col gap-1">
              <p className="text-white font-bold text-base leading-snug">{focusTask.title}</p>
              <p className={`text-xs ${cy ? 'text-purple-300/60' : 'text-zinc-500'}`}>{focusTask.projectName}</p>
              <button
                onClick={() => setActiveTab('projects')}
                className={`mt-2 self-start flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${accentBg} ${accent} ${accentBorder}`}
              >
                Open project <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className={`text-sm ${cy ? 'text-purple-300/50' : 'text-zinc-600'} italic`}>
              Niets gepland — goede dag voor deep work.
            </p>
          )}
        </div>

        {/* Habits */}
        <div className={card + ' p-4 flex flex-col'}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-white">Habits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${cy ? 'text-purple-300/60' : 'text-zinc-500'}`}>
                {doneHabits}/{habits.length}
              </span>
              <button
                onClick={() => setActiveTab('habits')}
                className={`text-xs font-semibold ${accent} hover:opacity-75 transition-opacity`}
              >
                Toon alle →
              </button>
            </div>
          </div>

          {habits.length === 0 ? (
            <p className={`text-xs italic ${cy ? 'text-purple-300/40' : 'text-zinc-600'}`}>Geen habits ingesteld.</p>
          ) : (
            <div className="space-y-2">
              {habits.map(habit => (
                <button
                  key={habit.id}
                  onClick={(e) => toggleHabit(habit.id, e)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.98]
                    ${habit.completedToday
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                      : (cy
                        ? 'bg-purple-900/20 border-purple-500/10 text-purple-200/70 hover:border-purple-400/30'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:border-zinc-600')}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {habit.completedToday
                      ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      : <Circle className="w-4 h-4 shrink-0 text-zinc-600" />}
                    <span className="text-xs font-semibold truncate">{habit.title}</span>
                  </div>
                  {habit.streak > 0 && (
                    <div className={`flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md ${habit.completedToday ? 'bg-orange-500/15' : (cy ? 'bg-[#1a0b2e]' : 'bg-zinc-900')}`}>
                      <Flame className={`w-3 h-3 ${habit.completedToday ? 'text-orange-400' : 'text-zinc-600'}`} />
                      <span className={`text-[10px] font-black tabular-nums ${habit.completedToday ? 'text-orange-400' : 'text-zinc-600'}`}>
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
