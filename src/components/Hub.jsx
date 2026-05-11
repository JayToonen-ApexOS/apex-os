import React from 'react';
import {
  Heart, Sparkles, CloudRain, MapPin, Dumbbell, CalendarDays, Calendar,
  CheckCircle2, Circle, Flame, ArrowRight, Edit3, Info
} from 'lucide-react';

export default function Hub({
  isYasminMode, todaysEvents, currentSession, weather, trainingEvents,
  trainingDaysPerWeek, todayISO, habits, scratchpad, setScratchpad, agendaEvents,
  setActiveTab, toggleHabit, toggleAgendaEventCompleted, setSelectedEvent, getEventColor
}) {
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
}
