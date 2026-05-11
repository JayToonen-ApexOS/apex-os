import React from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

export default function Habits({
  habits, isYasminMode, toggleHabit, handleDeleteHabit
}) {
  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
        <CheckCircle2 className="text-emerald-400" /> Habits
      </h2>
      {habits.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 italic">Geen habits gevonden. Gebruik de command bar onderaan om er één toe te voegen ("Start habit: Drink water").</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map(habit => (
            <div key={habit.id} onClick={(e) => toggleHabit(habit.id, e)} className={`flex items-center justify-between p-6 rounded-3xl border cursor-pointer transition-all shadow-xl group ${habit.completedToday ? 'bg-emerald-500/10 border-emerald-500/30' : (isYasminMode ? 'bg-[#1a0b2e]/80 border-purple-500/20 hover:border-purple-400/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700')}`}>
              <div className="flex items-center gap-4">
                <div className={habit.completedToday ? 'text-emerald-400' : 'text-zinc-600'}>
                  {habit.completedToday ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                </div>
                <h3 className={`text-xl font-bold ${habit.completedToday ? 'text-emerald-200 opacity-80' : 'text-zinc-100'}`}>
                  {habit.title}
                </h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-fuchsia-400">{habit.streak}</div>
                  <div className="text-xs font-bold text-zinc-500 uppercase">Streak</div>
                </div>
                <button onClick={(e) => handleDeleteHabit(habit.id, e)} className="text-zinc-600 hover:text-rose-400 transition-colors p-2 opacity-0 group-hover:opacity-100 focus:opacity-100" title="Habit verwijderen">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
