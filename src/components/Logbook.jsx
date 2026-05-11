import React from 'react';
import { BookMarked, Edit3, Smile, Meh, Frown, BookOpen } from 'lucide-react';

export default function Logbook({
  logs, newLogText, setNewLogText, newLogMood, setNewLogMood, logbookEndRef,
  handleAddLog
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <BookMarked className="text-cyan-400 w-8 h-8" /> Captain's Log
          </h2>
          <p className="text-zinc-400 mt-1">Reflect, record, and review your progress.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl flex flex-col">
          <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-400"/> New Entry
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setNewLogMood('good')} className={`p-2 rounded-full transition-colors ${newLogMood === 'good' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Smile className="w-6 h-6" />
            </button>
            <button onClick={() => setNewLogMood('neutral')} className={`p-2 rounded-full transition-colors ${newLogMood === 'neutral' ? 'bg-yellow-500/20 text-yellow-400' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Meh className="w-6 h-6" />
            </button>
            <button onClick={() => setNewLogMood('bad')} className={`p-2 rounded-full transition-colors ${newLogMood === 'bad' ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-500 hover:bg-zinc-800'}`}>
              <Frown className="w-6 h-6" />
            </button>
          </div>
          <textarea
            value={newLogText}
            onChange={(e) => setNewLogText(e.target.value)}
            className="flex-1 w-full bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 outline-none text-zinc-200 resize-none min-h-[150px] mb-4 focus:border-cyan-500/50 custom-scrollbar"
            placeholder="What's on your mind today? (Or ask AI to log for you)"
          />
          <button onClick={() => handleAddLog()} disabled={!newLogText.trim()} className="self-end bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 px-6 py-2.5 rounded-xl font-bold transition-colors">
            Save Entry
          </button>
        </div>
        <div className="col-span-1 h-full bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800 shadow-xl">
          <h3 className="font-bold text-zinc-100 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400"/> Past Records
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            <div ref={logbookEndRef} />
            {logs.length === 0 ? (
              <p className="text-zinc-500 text-sm italic py-4">Nog geen logboeken toegevoegd.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 group relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.mood === 'good' ? 'bg-emerald-500' : log.mood === 'neutral' ? 'bg-yellow-500' : 'bg-rose-500'}`}></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-cyan-400">{log.date}</span>
                      <span className="text-xs text-zinc-500">{log.time}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{log.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
