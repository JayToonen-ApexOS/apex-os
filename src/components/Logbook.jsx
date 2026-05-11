import React from 'react';
import { BookMarked, Edit3, Smile, Meh, Frown, BookOpen } from 'lucide-react';

const input = 'w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/25 transition-all duration-150 placeholder-white/20';

const moodConfig = {
  good:    { icon: Smile,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  neutral: { icon: Meh,   color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  bar: 'bg-yellow-500' },
  bad:     { icon: Frown,  color: 'text-rose-400',    bg: 'bg-rose-500/10',    bar: 'bg-rose-500' },
};

export default function Logbook({ logs, newLogText, setNewLogText, newLogMood, setNewLogMood, logbookEndRef, handleAddLog }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Logbook</h2>
        <p className="text-sm text-white/40 mt-0.5">Reflect, record, review.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* New entry */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#00D4FF]" /> Nieuwe Notitie
          </h3>

          <div className="flex items-center gap-2 mb-4">
            {['good', 'neutral', 'bad'].map(mood => {
              const cfg = moodConfig[mood];
              const Icon = cfg.icon;
              return (
                <button
                  key={mood}
                  onClick={() => setNewLogMood(mood)}
                  className={`p-2 rounded-lg transition-all duration-150 ${newLogMood === mood ? cfg.bg + ' ' + cfg.color : 'text-white/25 hover:bg-white/[0.04]'}`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>

          <textarea
            value={newLogText}
            onChange={(e) => setNewLogText(e.target.value)}
            className={input + ' resize-none min-h-[140px] mb-4'}
            placeholder="Wat heb je vandaag meegemaakt?"
          />
          <div className="flex justify-end">
            <button
              onClick={() => handleAddLog()}
              disabled={!newLogText.trim()}
              className="bg-[#00D4FF] hover:bg-[#00b8d9] disabled:bg-white/[0.06] disabled:text-white/20 text-black disabled:cursor-not-allowed px-5 py-2 rounded-lg text-sm font-bold transition-all duration-150"
            >
              Opslaan
            </button>
          </div>
        </div>

        {/* Past records */}
        <div className="lg:col-span-1 rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00D4FF]" /> Geschiedenis
          </h3>
          <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
            <div ref={logbookEndRef} />
            {logs.length === 0 ? (
              <p className="text-xs text-white/25 italic py-4">Nog geen notities.</p>
            ) : (
              logs.map(log => {
                const bar = moodConfig[log.mood]?.bar || 'bg-white/20';
                return (
                  <div key={log.id} className="bg-[#0f0f0f] rounded-lg border border-white/[0.06] overflow-hidden">
                    <div className={`h-0.5 ${bar}`} />
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-[#00D4FF]/70">{log.date}</span>
                        <span className="text-[10px] text-white/25">{log.time}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{log.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
