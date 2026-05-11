import React from 'react';
import {
  Dumbbell, Flame, Quote, Zap, Sparkles, Loader2, Activity, CalendarDays,
  CheckCircle2, Clock, Info, Target, Camera, FileText, Circle, Trash2, Plus
} from 'lucide-react';

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
}
