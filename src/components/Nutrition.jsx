import React from 'react';
import { Utensils, Activity, Target, Zap, Flame, Plus } from 'lucide-react';

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

export default function Nutrition({
  trainingGoal, dailyMacros, macroTargets, newMacroEntry, setNewMacroEntry, isYasminMode,
  addMacros, setActiveTab
}) {
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
}
