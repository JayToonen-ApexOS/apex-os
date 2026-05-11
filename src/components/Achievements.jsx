import React from 'react';
import { Trophy, Target, Activity, Lock } from 'lucide-react';

const locked = [
  { icon: <Trophy className="w-5 h-5 text-yellow-400/50" />, title: 'Iron Will', desc: 'Train 7 dagen achter elkaar.' },
  { icon: <Target className="w-5 h-5 text-[#00D4FF]/50" />,  title: 'Goal Crusher', desc: 'Voltooi je eerste grote project.' },
  { icon: <Activity className="w-5 h-5 text-emerald-400/50" />, title: 'Early Bird', desc: 'Start 5 dagen The Forge voor 08:00.' },
];

export default function Achievements() {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Achievements</h2>
        <p className="text-sm text-white/40 mt-0.5">Unlock prestaties door consistent te zijn.</p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-8 text-center mb-2">
        <Trophy className="w-8 h-8 text-white/10 mx-auto mb-3" />
        <h3 className="font-bold text-white/40 text-base mb-1">Hall of Fame</h3>
        <p className="text-sm text-white/25 max-w-sm mx-auto">Binnenkort vind je hier al je behaalde prestaties, streaks en mijlpalen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {locked.map((a, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5 flex items-center gap-4 opacity-40">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
              {a.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Lock className="w-3 h-3 text-white/25" />
                <h4 className="font-bold text-white/60 text-sm">{a.title}</h4>
              </div>
              <p className="text-xs text-white/30">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
