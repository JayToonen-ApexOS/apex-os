import React from 'react';
import { Heart, Activity, Dumbbell, CheckCircle2, RefreshCw, Loader2, Link as LinkIcon, Settings as SettingsIcon } from 'lucide-react';

const card = 'rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5';
const input = 'w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-white/25 transition-all duration-150 placeholder-white/20';
const fieldLabel = 'block text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-1.5';
const sectionTitle = 'font-bold text-white text-sm mb-1 flex items-center gap-2';
const sectionSub = 'text-xs text-white/40 mb-5 leading-relaxed';

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-[#00D4FF] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
    </label>
  );
}

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
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Settings</h2>
        <p className="text-sm text-white/40 mt-0.5">Configureer je Apex OS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-4">

          {/* Personalisation */}
          <div className={card}>
            <h3 className={sectionTitle}><Heart className="w-4 h-4 text-rose-400" /> Personalisatie</h3>
            <p className={sectionSub}>Pas de look en feel aan.</p>
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] p-3.5 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-white">Yasmin Modus</p>
                <p className="text-xs text-white/35 mt-0.5">Paarse thema voor Yasmin.</p>
              </div>
              <Toggle checked={isYasminMode} onChange={e => setIsYasminMode(e.target.checked)} />
            </div>
          </div>

          {/* Biometrics */}
          <div className={card}>
            <h3 className={sectionTitle}><Activity className="w-4 h-4 text-[#00D4FF]" /> Biometrics & Doel</h3>
            <p className={sectionSub}>De AI gebruikt deze data voor gepersonaliseerde targets.</p>
            <div className="space-y-3">
              <div>
                <label className={fieldLabel}>Trainingsdoel</label>
                <select value={trainingGoal} onChange={e => setTrainingGoal(e.target.value)} className={input + ' text-white/70'}>
                  <option value="Spieropbouw (Bulk)">Spieropbouw (Bulk)</option>
                  <option value="Droogtrainen (Cut)">Droogtrainen (Cut)</option>
                  <option value="Onderhoud">Onderhoud</option>
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-[#111] border border-white/[0.08] rounded-lg p-3">
                  <label className={fieldLabel}>Gewicht</label>
                  <div className="flex items-baseline gap-1">
                    <input type="number" value={healthStats.weight} onChange={e => setHealthStats({ ...healthStats, weight: e.target.value })} className="w-full bg-transparent text-xl font-black text-white outline-none" />
                    <span className="text-white/30 text-sm font-bold">kg</span>
                  </div>
                </div>
                <div className="flex-1 bg-[#111] border border-white/[0.08] rounded-lg p-3">
                  <label className={fieldLabel}>Lengte</label>
                  <div className="flex items-baseline gap-1">
                    <input type="number" value={healthStats.height} onChange={e => setHealthStats({ ...healthStats, height: e.target.value })} className="w-full bg-transparent text-xl font-black text-white outline-none" />
                    <span className="text-white/30 text-sm font-bold">cm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Forge protocol */}
          <div className={card}>
            <h3 className={sectionTitle}><Dumbbell className="w-4 h-4 text-fuchsia-400" /> Forge Protocol</h3>
            <p className={sectionSub}>Configureer je trainingsschema. De AI plant dit automatisch in.</p>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-1/3">
                  <label className={fieldLabel}>Dagen/week</label>
                  <input type="number" min="1" max="7" value={trainingDaysPerWeek} onChange={e => setTrainingDaysPerWeek(parseInt(e.target.value) || 1)} className={input} />
                </div>
                <div className="flex-1">
                  <label className={fieldLabel}>Split</label>
                  <input type="text" value={workoutSplit} onChange={e => setWorkoutSplit(e.target.value)} placeholder="Push / Pull / Legs" className={input} />
                </div>
              </div>

              <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] p-3.5 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-inplannen</p>
                  <p className="text-xs text-white/35 mt-0.5">AI plant wekelijks je sessies in.</p>
                </div>
                <Toggle
                  checked={autoScheduleTrainings}
                  onChange={e => { setAutoScheduleTrainings(e.target.checked); if (e.target.checked) hasAutoPlannedRef.current = false; }}
                />
              </div>

              <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] p-3.5 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-white">Forceer herplanning</p>
                  <p className="text-xs text-white/35 mt-0.5">Verwijdert en herplant AI-sessies.</p>
                </div>
                <button
                  onClick={() => { lastPlannedWeekRef.current = null; lastAgendaLengthRef.current = -1; handleAIAutoPlan(false); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 transition-all duration-150"
                >
                  <RefreshCw className="w-3 h-3" /> Herplan
                </button>
              </div>
            </div>
          </div>

          {/* Agenda integrations */}
          <div className={card}>
            <h3 className={sectionTitle}><LinkIcon className="w-4 h-4 text-[#00D4FF]" /> Agenda Integraties</h3>
            <p className={sectionSub}>Verbind je agenda via OAuth of .ics URL.</p>
            <div className="space-y-3">
              {['Google', 'Apple', 'Outlook', 'Andere Agenda'].map(provider => (
                <div key={provider} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getEventColor(provider).split(' ')[0]}`} />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {provider === 'Andere Agenda' ? 'School / URL Agenda' : `${provider} Calendar`}
                        </p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {connectedAgendas[provider]
                            ? <span className="text-emerald-400 font-bold">Verbonden</span>
                            : 'Niet verbonden'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!connectedAgendas[provider] ? (
                    provider === 'Andere Agenda' || provider === 'Apple' ? (
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                          <input
                            type="url"
                            placeholder={provider === 'Apple' ? 'webcal:// of https://...' : '.ics link...'}
                            value={agendaUrls[provider] || ''}
                            onChange={e => setAgendaUrls(prev => ({ ...prev, [provider]: e.target.value }))}
                            className={input + ' pl-8'}
                          />
                        </div>
                        <button
                          onClick={() => handleConnectUrlAgenda(provider)}
                          disabled={isConnecting === provider || !(agendaUrls[provider] || '').trim()}
                          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 hover:bg-[#00D4FF]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-150"
                        >
                          {isConnecting === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Laden'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnectApiAgenda(provider)}
                        disabled={isConnecting === provider}
                        className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all duration-150"
                      >
                        {isConnecting === provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                        Log in met {provider}
                      </button>
                    )
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {provider === 'Andere Agenda' || provider === 'Apple' ? 'Live feed actief' : 'API token actief'}
                      </p>
                      <button
                        onClick={() => handleDisconnectAgenda(provider)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all duration-150"
                      >
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
