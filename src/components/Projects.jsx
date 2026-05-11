import React from 'react';
import { FolderKanban, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';

export default function Projects({ projects, expandedProjectId, setExpandedProjectId, toggleProjectTask, handleDeleteProject }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Projects</h2>
        <p className="text-sm text-white/40 mt-0.5">Gebruik de command bar om projecten aan te maken via AI.</p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0a] p-10 text-center">
          <FolderKanban className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/30 italic">Geen projecten. Voeg er één toe via de command bar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const isExpanded = expandedProjectId === project.id;
            return (
              <div
                key={project.id}
                className={`rounded-xl border overflow-hidden flex flex-col transition-all duration-150 ${
                  isExpanded ? 'border-[#00D4FF]/20 bg-[#0a0a0a]' : 'border-white/[0.06] bg-[#0a0a0a] hover:border-white/15'
                }`}
              >
                <div className="p-5 cursor-pointer flex flex-col flex-1" onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-md border ${
                      project.category === 'Work'
                        ? 'text-[#00D4FF] border-[#00D4FF]/20 bg-[#00D4FF]/8'
                        : 'text-purple-400 border-purple-500/20 bg-purple-500/8'
                    }`}>
                      {project.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="p-1 rounded-md text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-white/30" />
                        : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </div>

                  <h4 className="font-bold text-lg text-white mb-5 leading-tight">{project.title}</h4>

                  <div className="mt-auto">
                    <div className="flex justify-between text-[10px] font-semibold text-white/40 mb-1.5">
                      <span>{project.tasks.filter(t => t.completed).length}/{project.tasks.length} taken</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="w-full bg-white/[0.06] rounded-full h-0.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${project.progress === 100 ? 'bg-emerald-400' : 'bg-[#00D4FF]'}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-1.5">
                    {project.tasks.map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => toggleProjectTask(project.id, task.id, e)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                          task.completed
                            ? 'bg-emerald-500/[0.06] border border-emerald-500/15'
                            : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05]'
                        }`}
                      >
                        {task.completed
                          ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          : <Square className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />}
                        <span className={`text-xs ${task.completed ? 'text-white/30 line-through' : 'text-white/60'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
