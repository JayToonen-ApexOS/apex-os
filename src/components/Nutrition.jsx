import React from 'react';
import { Utensils, Activity, Target, Zap, Flame, Plus } from 'lucide-react';

const input = 'w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-white/25 transition-all duration-150 placeholder-white/20';

const ProgressRing = ({ radius, stroke, progress, color, text, label }) => {
  const r = radius - stroke * 2;
  const circ = r * 2 * Math.PI;
  return (
    <div className="flex flex-col items-center relative">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle stroke="rgba(255,255,255,0.06)" fill="transparent" strokeWidth={stroke} r={r} cx={radius} cy={radius} />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ - progress * circ}
          strokeLinecap="round"
          r={r} cx={radius} cy={radius}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-black text-white text-base leading-none">{text}</span>
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider mt-1">{label}</span>
      </div>
    </div>
  );
};

const macroMeta = [
  { key: 'calories', label: 'Calorieën', unit: 'kcal', color: '#00D4FF',   icon: Activity },
  { key: 'protein',  label: 'Eiwitten',  unit: 'g',    color: '#f97316',   icon: Target   },
  { key: 'carbs',    label: 'Koolhydr.', unit: 'g',    color: '#34d399',   icon: Zap      },
  { key: 'fats',     label: 'Vetten',    unit: 'g',    color: '#facc15',   icon: Flame    },
];

export default function Nutrition({ trainingGoal, dailyMacros, macroTargets, newMacroEntry, setNewMacroEntry, isYasminMode, addMacros, setActiveTab }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Nutrition</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Macro targets voor: <span className="text-white/70 font-medium">{trainingGoal}</span>
          </p>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          className="self-start md:self-auto flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 transition-all duration-150"
        >
          Doel wijzigen →
        </button>
      </div>

      {/* Macro rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {macroMeta.map(({ key, label, unit, color, icon: Icon }) => {
          const current = dailyMacros[key] || 0;
          const target = macroTargets[key] || 1;
          return (
            <div key={key} className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5 flex flex-col items-center gap-3">
              <ProgressRing
                radius={44}
                stroke={5}
                progress={Math.min(1, current / target)}
                color={color}
                text={key === 'calories' ? current : `${current}g`}
                label={key === 'calories' ? `/ ${target} kcal` : `/ ${target}g`}
              />
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-semibold text-white/60">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add meal */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5">
        <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-400" /> Maaltijd Toevoegen
        </h3>
        <form onSubmit={addMacros} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {macroMeta.map(({ key, label, unit }) => (
            <div key={key} className="col-span-1">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-1.5">
                {label} ({unit})
              </label>
              <input
                type="number"
                value={newMacroEntry[key]}
                onChange={e => setNewMacroEntry({ ...newMacroEntry, [key]: e.target.value })}
                className={input}
                placeholder="0"
              />
            </div>
          ))}
          <div className="col-span-2 md:col-span-1">
            <button
              type="submit"
              disabled={!newMacroEntry.calories && !newMacroEntry.protein && !newMacroEntry.carbs && !newMacroEntry.fats}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-white/[0.06] disabled:text-white/20 text-black disabled:cursor-not-allowed font-bold py-2.5 rounded-lg transition-all duration-150 text-sm h-[42px]"
            >
              Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
