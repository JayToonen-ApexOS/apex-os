import React from 'react';
import {
  Settings as SettingsIcon, Heart, Activity, Dumbbell, CheckCircle2,
  RefreshCw, LinkIcon as LinkIconLucide, Loader2, Link as LinkIcon
} from 'lucide-react';

export default function Settings({
  isYasminMode, setIsYasminMode, healthStats, setHealthStats, trainingGoal,
  setTrainingGoal, workoutSplit, setWorkoutSplit, trainingDaysPerWeek,
  setTrainingDaysPerWeek, autoScheduleTrainings, setAutoScheduleTrainings,
  connectedAgendas, agendaUrls, setAgendaUrls, isConnecting,
  hasAutoPlannedRef, lastPlannedWeekRef, lastAgendaLengthRef,
  handleConnectApiAgenda, handleConnectUrlAgenda, handleDisconnectAgenda,
  handleAIAutoPlan, getEventColor
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
        <SettingsIcon className="text-cyan-400" /> Settings
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

              <div className="flex items-center justify-between bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl mt-4">
                <div>
                  <h4 className="font-bold text-zinc-200">Forceer Herplanning</h4>
                  <p className="text-xs text-zinc-500 mt-1">Verwijdert AI-sessies en plant opnieuw in op basis van huidige agenda.</p>
                </div>
                <button
                  onClick={() => { lastPlannedWeekRef.current = null; lastAgendaLengthRef.current = -1; handleAIAutoPlan(false); }}
                  className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Herplan
                </button>
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
}
