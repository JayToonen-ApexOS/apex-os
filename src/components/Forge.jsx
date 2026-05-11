import React from 'react';
import {
  Dumbbell, Flame, Quote, Zap, Sparkles, Loader2, Activity, CalendarDays,
  CheckCircle2, Clock, Info, Target, Camera, FileText, Circle, Trash2, Plus
} from 'lucide-react';

const card = 'rounded-xl border border-white/[0.06] bg-[#0a0a0a]';
const input = 'w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-white/25 transition-all duration-150 placeholder-white/20';

export default function Forge({
  trainingEvents, todayISO, activeForgeEventId, setActiveForgeEventId, workoutLogs,
  newExercise, setNewExercise, isScanning, scannedImage, fitnessAdvice, isGeneratingPlan,
  healthStats, trainingGoal, quoteIndex, weather, fileInputRef, handleImageUpload,
  handleGenerateFitnessPlan, addExercise, toggleExercise, handleDeleteExercise,
  setSelectedEvent, setActiveTab, forgeQuotes
}) {
  const activeForgeEvent = trainingEvents.find(e => e.id === activeForgeEventId);
  const activeExercises = activeForgeEventId && workoutLogs[activeForgeEventId] ? workoutLogs[activeForgeEventId] : [];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header + Quote */}
      <div className={card + ' p-6 flex flex-col md:flex-row gap-6 items-start'}>
        <div className="shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <Dumbbell className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-2xl font-black text-white tracking-tight">The Forge</h2>
          </div>
          <p className="text-xs font-bold text-fuchsia-400/60 uppercase tracking-[0.15em]">Where Iron Meets Mind</p>
        </div>
        <div className="flex-1 border-l border-white/[0.06] pl-6 hidden md:block">
          <Quote className="w-4 h-4 text-white/15 mb-2" />
          <p className="text-sm text-white/50 italic leading-relaxed">"{forgeQuotes[quoteIndex].text}"</p>
          <p className="text-xs text-fuchsia-400/70 font-semibold mt-2">— {forgeQuotes[quoteIndex].author}</p>
        </div>
      </div>

      {/* Science check + AI protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={card + ' p-5 flex flex-col'}>
          <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
            <Zap className="w-4 h-4 text-fuchsia-400" /> Science Check
          </h3>
          <p className="text-xs text-white/40 mb-4 leading-relaxed">Genereer je dagelijkse AI protocol op basis van biometrics.</p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 rounded-lg">
              <span className="text-xs text-white/40 font-medium">Gewicht</span>
              <span className="text-sm font-bold text-white">{healthStats.weight ? `${healthStats.weight} kg` : '—'}</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 rounded-lg">
              <span className="text-xs text-white/40 font-medium">Doel</span>
              <span className="text-xs font-bold text-fuchsia-400">{trainingGoal.split(' ')[0]}</span>
            </div>
          </div>

          <button
            onClick={handleGenerateFitnessPlan}
            disabled={isGeneratingPlan}
            className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-150 text-sm font-semibold disabled:opacity-40"
          >
            {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-fuchsia-400" />}
            Genereer Protocol
          </button>
        </div>

        <div className={card + ' p-5 lg:col-span-2 flex flex-col'}>
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" /> AI Protocol
          </h3>
          <div className="flex-1 text-sm text-white/60 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 overflow-y-auto custom-scrollbar min-h-[140px]">
            {isGeneratingPlan ? (
              <div className="flex items-center gap-2 text-fuchsia-400 h-full justify-center">
                <Loader2 className="animate-spin w-5 h-5" /> Analyseren...
              </div>
            ) : fitnessAdvice ? (
              fitnessAdvice.split('\n').map((line, i) => (
                <p key={i} className="mb-1.5">
                  {line.includes('**') ? <strong className="text-white font-semibold">{line.replace(/\*\*/g, '')}</strong> : line}
                </p>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20 py-6">
                <Dumbbell className="w-7 h-7 mb-2 opacity-50" />
                <p className="text-xs text-center">Klik op "Genereer Protocol" om je battle plan te zien.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly schedule */}
      <div className={card + ' p-5'}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-fuchsia-400" /> Schema Deze Week
          </h3>
          <button onClick={() => setActiveTab('agenda')} className="text-xs font-semibold text-white/30 hover:text-white transition-colors duration-150 uppercase tracking-wider">
            Agenda →
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-1">
          {trainingEvents.length === 0 ? (
            <p className="text-sm text-white/25 italic w-full text-center py-6 bg-white/[0.02] rounded-lg border border-white/[0.06]">
              Nog geen trainingen in de agenda.
            </p>
          ) : (
            trainingEvents.map(event => {
              const isPast = event.date < todayISO;
              const isToday = event.date === todayISO;
              const isActive = activeForgeEventId === event.id;
              return (
                <div
                  key={event.id}
                  onClick={() => setActiveForgeEventId(event.id)}
                  className={`group cursor-pointer shrink-0 w-48 p-4 rounded-xl border transition-all duration-150 ${
                    isActive
                      ? 'border-fuchsia-500/40 bg-fuchsia-500/10'
                      : isToday
                        ? 'border-fuchsia-500/25 bg-fuchsia-500/[0.05] hover:bg-fuchsia-500/10'
                        : isPast
                          ? 'border-white/[0.04] bg-white/[0.02] opacity-50 hover:opacity-80'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-fuchsia-500/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-white/30">{event.date}</span>
                    <div className="flex items-center gap-1.5">
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />}
                      <button onClick={e => { e.stopPropagation(); setSelectedEvent(event); }} className="text-white/20 hover:text-fuchsia-400 transition-colors duration-150">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className={`font-bold text-sm truncate mb-1 ${isActive || isToday ? 'text-fuchsia-300' : 'text-white/70'}`}>
                    {event.title}
                  </p>
                  <div className="flex items-center gap-1 text-[10px]">
                    {isPast
                      ? <><CheckCircle2 className="w-3 h-3 text-white/25" /><span className="text-white/25">Voltooid</span></>
                      : isToday
                        ? <><Activity className="w-3 h-3 text-fuchsia-400" /><span className="text-fuchsia-400">Vandaag</span></>
                        : <><Clock className="w-3 h-3 text-white/25" /><span className="text-white/25">Gepland</span></>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Workout logger */}
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${activeForgeEventId ? 'border-fuchsia-500/25' : 'border-white/[0.06]'} bg-[#0a0a0a]`}>
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-fuchsia-400" />
            {activeForgeEvent ? `Sessie: ${activeForgeEvent.title}` : 'Geen sessie geselecteerd'}
          </h3>
          <p className="text-xs text-white/30 mt-0.5">
            {activeForgeEvent ? `Log je oefeningen voor ${activeForgeEvent.date}.` : 'Klik op een training hierboven.'}
          </p>
        </div>

        {activeForgeEventId ? (
          <div className="p-5 space-y-5">
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

            {/* Camera scan zone */}
            <div
              onClick={isScanning ? null : () => fileInputRef.current?.click()}
              className={`w-full border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden transition-all duration-150 ${
                isScanning ? 'border-fuchsia-500/40 bg-fuchsia-500/[0.05]' : 'border-white/[0.08] hover:border-fuchsia-500/30 hover:bg-white/[0.02]'
              }`}
            >
              {scannedImage && <div className="absolute inset-0 opacity-10"><img src={scannedImage} alt="" className="w-full h-full object-cover" /></div>}
              {isScanning ? (
                <div className="relative z-10">
                  <div className="absolute top-0 left-0 right-0 h-px bg-fuchsia-400 animate-[scan_2s_ease-in-out_infinite]" />
                  <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin mb-3 mx-auto" />
                  <p className="text-fuchsia-400 font-bold text-sm">Analyseren...</p>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-3 mx-auto">
                    <Camera className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <p className="text-sm font-semibold text-white/60">Scan Logboek</p>
                  <p className="text-xs text-white/25 mt-1">AI leest je handgeschreven notities in.</p>
                </div>
              )}
            </div>

            {/* Exercise list */}
            <div className="space-y-2">
              {activeExercises.length === 0 ? (
                <div className="text-center py-5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                  <p className="text-xs text-white/25 italic">Nog geen oefeningen gelogd.</p>
                </div>
              ) : (
                activeExercises.map(ex => (
                  <div
                    key={ex.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-150 ${
                      ex.completed ? 'bg-fuchsia-500/[0.07] border-fuchsia-500/20' : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleExercise(ex.id)} className={ex.completed ? 'text-fuchsia-400' : 'text-white/20 hover:text-fuchsia-400 transition-colors duration-150'}>
                        {ex.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </button>
                      <div>
                        <p className={`font-bold text-sm flex items-center gap-1.5 ${ex.completed ? 'text-white/30 line-through' : 'text-white'}`}>
                          {ex.name}
                          {ex.name.includes('(Scanned)') && <FileText className="w-3.5 h-3.5 text-fuchsia-400" />}
                        </p>
                        <div className="flex gap-1.5 mt-1.5">
                          <span className="text-[10px] font-bold bg-white/[0.06] text-white/50 px-2 py-1 rounded-md flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 text-fuchsia-400" /> {ex.sets}×
                          </span>
                          <span className="text-[10px] font-bold bg-white/[0.06] text-white/50 px-2 py-1 rounded-md">{ex.reps} reps</span>
                          <span className="text-[10px] font-bold bg-fuchsia-500/10 text-fuchsia-400 px-2 py-1 rounded-md border border-fuchsia-500/20">{ex.weight}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteExercise(ex.id)} className="text-white/15 hover:text-rose-400 transition-colors duration-150 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual input */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-3">Handmatige Invoer</p>
              <div className="grid grid-cols-2 md:grid-cols-12 gap-2.5 items-end">
                <div className="col-span-2 md:col-span-4">
                  <label className="block text-[10px] text-white/25 uppercase tracking-wider mb-1">Oefening</label>
                  <input type="text" value={newExercise.name} onChange={e => setNewExercise({ ...newExercise, name: e.target.value })} placeholder="Squat..." className={input} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] text-white/25 uppercase tracking-wider mb-1">Sets</label>
                  <input type="number" value={newExercise.sets} onChange={e => setNewExercise({ ...newExercise, sets: e.target.value })} className={input + ' text-center'} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] text-white/25 uppercase tracking-wider mb-1">Reps</label>
                  <input type="number" value={newExercise.reps} onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })} className={input + ' text-center'} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-[10px] text-white/25 uppercase tracking-wider mb-1">Gewicht</label>
                  <input type="text" value={newExercise.weight} onChange={e => setNewExercise({ ...newExercise, weight: e.target.value })} placeholder="kg" className={input + ' text-center'} />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <button
                    onClick={addExercise}
                    disabled={!newExercise.name.trim()}
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-white/[0.06] disabled:text-white/20 text-white font-bold px-3 py-2.5 rounded-lg transition-all duration-150 text-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Voeg toe
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center opacity-30">
            <Dumbbell className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-sm text-white/40">Selecteer een sessie hierboven.</p>
          </div>
        )}
      </div>
    </div>
  );
}
