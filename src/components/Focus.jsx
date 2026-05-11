import React from 'react';
import { RotateCcw, Pause, Play, Circle } from 'lucide-react';

export default function Focus({ timeLeft, isTimerRunning, pendingTasks, toggleTimer, resetTimer, formatTime, toggleProjectTask }) {
  const progress = timeLeft / (25 * 60);

  return (
    <div className="animate-in fade-in duration-200 flex flex-col items-center min-h-full pt-8 pb-6">

      <div className="text-center mb-12">
        <h2 className="text-2xl font-black text-white tracking-tight">Deep Work</h2>
        <p className="text-sm text-white/30 mt-1">Silence distractions. Execute.</p>
      </div>

      {/* Timer ring */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-10">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 absolute inset-0">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke={isTimerRunning ? '#00D4FF' : 'rgba(255,255,255,0.15)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="289.0"
            strokeDashoffset={289.0 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span className={`text-6xl md:text-7xl font-black tabular-nums tracking-tight leading-none ${isTimerRunning ? 'text-white' : 'text-white/50'}`}>
            {formatTime(timeLeft)}
          </span>
          <span className={`text-xs uppercase tracking-[0.2em] font-bold mt-3 ${isTimerRunning ? 'text-[#00D4FF]' : 'text-white/25'}`}>
            {isTimerRunning ? 'Focusing' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5 mb-14">
        <button
          onClick={resetTimer}
          className="p-3 rounded-xl border border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 transition-all duration-150"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleTimer}
          className={`p-5 rounded-full transition-all duration-150 active:scale-95 ${
            isTimerRunning
              ? 'bg-white/10 border border-white/20 text-[#00D4FF] hover:bg-white/15'
              : 'bg-[#00D4FF] text-black hover:bg-[#00b8d9]'
          }`}
        >
          {isTimerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
        </button>
      </div>

      {/* Pending tasks */}
      <div className="w-full max-w-xl rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-5">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.12em] mb-4">Openstaande taken</h3>
        <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar">
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-white/25 text-center py-4 italic">Geen openstaande taken.</p>
          ) : (
            pendingTasks.map(task => (
              <div
                key={task.id}
                onClick={(e) => toggleProjectTask(task.projectId, task.id, e)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer group hover:bg-white/[0.03] transition-all duration-150"
              >
                <Circle className="w-4 h-4 text-white/20 group-hover:text-[#00D4FF] transition-colors duration-150 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors duration-150">{task.title}</p>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mt-0.5">{task.projectName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
