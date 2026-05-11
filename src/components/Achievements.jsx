import React from 'react';
import { Medal, Award, Trophy, Target, Activity } from 'lucide-react';

export default function Achievements() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
        <Medal className="text-yellow-400" /> Achievements
      </h2>
      <div className="bg-zinc-900 rounded-3xl p-10 border border-zinc-800 text-center shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          <Award className="w-64 h-64 text-yellow-400" />
        </div>
        <div className="relative z-10">
          <Award className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-zinc-300 mb-2">Hall of Fame</h3>
          <p className="text-zinc-500 max-w-md mx-auto">Deze sectie is momenteel in aanbouw. Binnenkort vind je hier al je behaalde prestaties, streaks en mijlpalen verzameld door de AI.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 opacity-50 grayscale">
          <div className="bg-yellow-500/20 p-3 rounded-full"><Trophy className="w-8 h-8 text-yellow-500" /></div>
          <div>
            <h4 className="font-bold text-zinc-300">Iron Will</h4>
            <p className="text-xs text-zinc-500">Train 7 dagen achter elkaar.</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 opacity-50 grayscale">
          <div className="bg-cyan-500/20 p-3 rounded-full"><Target className="w-8 h-8 text-cyan-500" /></div>
          <div>
            <h4 className="font-bold text-zinc-300">Goal Crusher</h4>
            <p className="text-xs text-zinc-500">Voltooi je eerste grote project.</p>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 opacity-50 grayscale">
          <div className="bg-emerald-500/20 p-3 rounded-full"><Activity className="w-8 h-8 text-emerald-500" /></div>
          <div>
            <h4 className="font-bold text-zinc-300">Early Bird</h4>
            <p className="text-xs text-zinc-500">Start 5 dagen The Forge voor 08:00.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
