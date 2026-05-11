import React from 'react';
import {
  FolderKanban, Trash2, ChevronDown, ChevronUp, CheckSquare, Square
} from 'lucide-react';

export default function Projects({
  projects, expandedProjectId, setExpandedProjectId,
  toggleProjectTask, handleDeleteProject
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
        <FolderKanban className="text-cyan-400" /> Projects
      </h2>
      {projects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-zinc-500 italic">Geen projecten gevonden. Voeg er één toe via de AI command bar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className={`bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col shadow-xl ${expandedProjectId === project.id ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
              <div className="p-6 cursor-pointer flex flex-col flex-1" onClick={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-800 ${project.category === 'Work' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                    {project.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => handleDeleteProject(project.id, e)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                    {expandedProjectId === project.id ? <ChevronUp className="text-zinc-500" /> : <ChevronDown className="text-zinc-500" />}
                  </div>
                </div>
                <h4 className="font-bold text-xl text-zinc-100 mb-6">{project.title}</h4>
                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400 mb-2">
                    <span>{project.tasks.filter(t=>t.completed).length}/{project.tasks.length} Tasks</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${project.progress === 100 ? 'bg-emerald-400' : 'bg-cyan-400'}`} style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>
              </div>
              {expandedProjectId === project.id && (
                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 space-y-2">
                  {project.tasks.map(task => (
                    <div key={task.id} onClick={(e) => toggleProjectTask(project.id, task.id, e)} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${task.completed ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30'}`}>
                      <button className={task.completed ? 'text-emerald-400' : 'text-zinc-500'}>
                        {task.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                      <span className={`text-sm ${task.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
