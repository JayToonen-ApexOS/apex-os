import React from 'react';
import {
  CheckCircle2, Circle, Flame, ArrowRight, MapPin, CloudRain,
  Sun, Cloud, CloudSnow, Zap, CalendarDays, Target, ChevronRight
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

export default function Hub({
  isYasminMode, todaysEvents, weather, habits, agendaEvents,
  setActiveTab, toggleHabit, toggleAgendaEventCompleted, setSelectedEvent,
  getEventColor, currentTime, currentDateFormatted, pendingTasks = [],
  todayISO, isYasmin
}) {
  const accent = isYasminMode ? 'text-purple-400' : 'text-cyan-400';
  const accentBg = isYasminMode ? 'bg-purple-500/15' : 'bg-cyan-500/15';
  const accentBorder = isYasminMode ? 'border-purple-500/20' : 'border-zinc-700/60';
  const cardBase = `rounded-2xl border backdrop-blur-sm transition-all ${isYasminMode ? 'bg-[#2d1b4e]/40 border-purple-500/20' : 'bg-zinc-900/80 border-zinc-800'}`;

  const upcomingEvents = todaysEvents
    .filter(e => !e.completed)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const completedEvents = todaysEvents.filter(e => e.completed);
  const displayEvents = [...upcomingEvents, ...completedEvents].slice(0, 4);
  const hasMore = todaysEvents.length > 4;

  // Daily focus: first upcoming event today, else first pending task
  const focusEvent = upcomingEvents[0] || null;
  const focusTask = !focusEvent && pendingTasks.length > 0 ? pendingTasks[0] : null;
  const hasFocus = focusEvent || focusTask;

  const doneHabits = habits.filter(h => h.completedToday).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-4">

      {/* ── Greeting ── */}
      <div className="pt-1">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isYasminMode ? 'text-purple-400/60' : 'text-zinc-500'}`}>
          {currentDateFormatted}
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-black text-white leading-none">
            {getGreeting(currentTime)}
          </h1>
          <span className={`text-2xl font-black leading-none ${accent}`}>{currentTime}</span>
        </div>
      </div>

      {/* ── Daily Focus ── */}
      {hasFocus && (
        <div
          className={`rounded-2xl p-4 border ${isYasminMode
            ? 'bg-gradient-to-r from-purple-900/50 to-[#1a0b2e]/60 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
            : 'bg-gradient-to-r from-cyan-950/60 to-zinc-900/80 border-cyan-500/25 shadow-[0_0_20px_rgba(6,182,212,0.1)]'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-3.5 h-3.5 ${accent}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${accent}`}>Daily Focus</span>
          </div>
          {focusEvent ? (
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setSelectedEvent(focusEvent)}
            >
              <div>
                <p className="text-white font-bold text-lg leading-tight">{focusEvent.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {focusEvent.time && (
                    <span className={`text-xs font-semibold ${isYasminMode ? 'text-purple-300' : 'text-cyan-300'}`}>
                      {focusEvent.time}
                    </span>
                  )}
                  {focusEvent.location && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <MapPin className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-400">{focusEvent.location}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleAgendaEventCompleted(focusEvent.id, e); }}
                className={`shrink-0 ml-3 p-2 rounded-xl transition-all ${focusEvent.completed
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : `${accentBg} ${accent} hover:scale-105`}`}
              >
                {focusEvent.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg leading-tight">{focusTask.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{focusTask.projectName}</p>
              </div>
              <button
                onClick={() => setActiveTab('projects')}
                className={`shrink-0 ml-3 p-2 rounded-xl ${accentBg} ${accent} hover:scale-105 transition-all`}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Today's Agenda ── */}
      <div className={cardBase + ' p-4'}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-zinc-100 text-sm">Vandaag</span>
            {todaysEvents.length > 0 && (
              <span className="text-[10px] font-black bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                {todaysEvents.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-1 text-xs font-semibold ${accent} hover:opacity-80 transition-opacity`}
          >
            Zie alles <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {displayEvents.length === 0 ? (
          <p className="text-sm text-zinc-500 italic py-2">Geen afspraken vandaag.</p>
        ) : (
          <div className="space-y-2">
            {displayEvents.map(event => (
              <div key={event.id} className="flex items-center gap-3 group">
                <span className={`text-xs font-bold w-10 shrink-0 text-right tabular-nums ${isYasminMode ? 'text-purple-300/50' : 'text-zinc-500'}`}>
                  {event.time || '—'}
                </span>
                <button
                  onClick={(e) => toggleAgendaEventCompleted(event.id, e)}
                  className={`shrink-0 transition-colors ${event.completed ? 'text-emerald-400' : 'text-zinc-600 hover:text-emerald-400'}`}
                >
                  {event.completed
                    ? <CheckCircle2 className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                    : <Circle className="w-[18px] h-[18px]" />}
                </button>
                <div
                  onClick={() => setSelectedEvent(event)}
                  className={`flex-1 flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-all
                    ${event.completed
                      ? 'opacity-50'
                      : (isYasminMode ? 'hover:bg-purple-500/10' : 'hover:bg-zinc-800/80')}`}
                >
                  <span className={`text-sm font-medium ${event.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {event.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`} />
                    {event.location && <MapPin className="w-3 h-3 text-zinc-600" />}
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={() => setActiveTab('agenda')}
                className={`w-full text-center text-xs font-semibold pt-2 ${accent} hover:opacity-80 transition-opacity`}
              >
                + {todaysEvents.length - 4} meer afspraken
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Weather + Habits row ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Weather */}
        <div className={cardBase + ' p-4 flex flex-col justify-between min-h-[110px]'}>
          <div className="flex items-center justify-between">
            <WeatherIcon
              condition={weather.condition}
              className={`w-6 h-6 ${isYasminMode ? 'text-purple-400' : 'text-cyan-400'}`}
            />
            <span className={`text-[10px] font-bold uppercase tracking-wider truncate ml-2 ${isYasminMode ? 'text-purple-300/60' : 'text-zinc-500'}`}>
              {weather.location}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-black text-white leading-none">{weather.temp}°</div>
            <div className={`text-xs font-semibold mt-0.5 ${isYasminMode ? 'text-purple-300' : 'text-zinc-400'}`}>
              {weather.condition}
            </div>
          </div>
        </div>

        {/* Habits */}
        <div className={cardBase + ' p-4 flex flex-col justify-between min-h-[110px]'}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-zinc-100">Habits</span>
            </div>
            <span className="text-[10px] font-black text-zinc-500">
              {doneHabits}/{habits.length}
            </span>
          </div>
          {habits.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">Geen habits.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {habits.map(habit => (
                <button
                  key={habit.id}
                  onClick={(e) => toggleHabit(habit.id, e)}
                  title={habit.title}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95
                    ${habit.completedToday
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : (isYasminMode
                        ? 'bg-purple-900/30 text-purple-300/60 border border-purple-500/10 hover:border-purple-400/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500')}`}
                >
                  {habit.completedToday
                    ? <CheckCircle2 className="w-3 h-3" />
                    : <Circle className="w-3 h-3" />}
                  <span className="max-w-[72px] truncate">{habit.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
