import React from 'react';
import { Timer, RotateCcw, Pause, Play, FolderKanban, Circle } from 'lucide-react';

export default function Focus({
  timeLeft, isTimerRunning, pendingTasks,
  toggleTimer, resetTimer, formatTime, toggleProjectTask
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 min-h-full flex flex-col items-center justify-center pt-10">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-zinc-100 flex items-center justify-center gap-3">
          <Timer className="text-cyan-400 w-10 h-10" /> Deep Work
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">Silence distractions. Execute.</p>
      </div>
      <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 absolute inset-0">
          <circle cx="50" cy="50" r="45" className="stroke-zinc-800 fill-none" strokeWidth="2" />
          <circle
            cx="50" cy="50" r="45"
            className={`fill-none transition-all duration-1000 linear ${isTimerRunning ? 'stroke-cyan-400' : 'stroke-zinc-600'}`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="282.7"
            strokeDashoffset={282.7 - (282.7 * (timeLeft / (25 * 60)))}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span className={`text-6xl md:text-8xl font-black tracking-tighter tabular-nums ${isTimerRunning ? 'text-white' : 'text-zinc-400'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-zinc-500 uppercase tracking-widest text-sm font-bold mt-2">
            {isTimerRunning ? 'Focusing...' : 'Paused'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 mb-16">
        <button onClick={resetTimer} className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
          <RotateCcw className="w-6 h-6" />
        </button>
        <button onClick={toggleTimer} className={`p-6 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all ${isTimerRunning ? 'bg-zinc-800 text-cyan-400 border border-cyan-500/50' : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'}`}>
          {isTimerRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
        </button>
      </div>
      <div className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" /> Pending Objectives
          </h3>
        </div>
        <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {pendingTasks.length === 0 ? (
            <p className="text-zinc-500 text-center py-4">All clear! No pending tasks right now.</p>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} onClick={(e) => toggleProjectTask(task.projectId, task.id, e)} className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 cursor-pointer hover:border-cyan-500/50 transition-colors group">
                <button className="text-zinc-600 group-hover:text-cyan-400 transition-colors">
                  <Circle className="w-6 h-6" />
                </button>
                <div>
                  <h4 className="font-bold text-zinc-200">{task.title}</h4>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{task.projectName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
