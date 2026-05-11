import React from 'react';
import { CheckCircle2, Circle, Flame, Trash2 } from 'lucide-react';

export default function Habits({ habits, isYasminMode, toggleHabit, handleDeleteHabit }) {
  const done = habits.filter(h => h.completedToday).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Habits</h2>
          <p className="text-sm text-white/40 mt-0.5">{done}/{habits.length} voltooid vandaag</p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-10 text-center">
          <p className="text-sm text-white/30 italic">
            Geen habits. Voeg er één toe via de command bar ("Start habit: Drink water").
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {habits.map(habit => (
            <div
              key={habit.id}
              onClick={(e) => toggleHabit(habit.id, e)}
              className={`flex items-center justify-between p-5 rounded-xl border cursor-pointer transition-all duration-150 group ${
                habit.completedToday
                  ? 'bg-emerald-500/[0.07] border-emerald-500/20'
                  : 'bg-[#0a0a0a] border-white/[0.06] hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={habit.completedToday ? 'text-emerald-400' : 'text-white/20'}>
                  {habit.completedToday ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </div>
                <h3 className={`text-base font-bold ${habit.completedToday ? 'text-emerald-200/70 line-through' : 'text-white'}`}>
                  {habit.title}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-black ${habit.streak > 0 ? 'text-orange-400' : 'text-white/15'}`}>
                    {habit.streak}
                  </div>
                  <div className="flex items-center gap-1 justify-center mt-0.5">
                    <Flame className={`w-3 h-3 ${habit.streak > 0 ? 'text-orange-400' : 'text-white/15'}`} />
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">streak</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteHabit(habit.id, e)}
                  className="p-2 rounded-lg text-white/15 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
