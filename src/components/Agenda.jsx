import React from 'react';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2
} from 'lucide-react';

export default function Agenda({
  todayISO, agendaEvents, connectedAgendas, newEventTitle, setNewEventTitle,
  newEventDate, setNewEventDate, newEventTime, setNewEventTime, newEventSource,
  setNewEventSource, newEventLocation, setNewEventLocation, newEventDescription,
  setNewEventDescription, currentMonth, currentYear, daysInMonth, startOffset, monthNames,
  handleAddAgendaEvent, handlePrevMonth, handleNextMonth, setSelectedEvent, getEventColor
}) {
  // Bereken de huidige week (Ma t/m Zo) voor de mobiele lijstweergave
  const todayDate = new Date(todayISO);
  const dayOfWeek = todayDate.getDay(); // 0=Zo, 1=Ma, ...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - daysFromMonday + i);
    const iso = d.toISOString().split('T')[0];
    return { iso, d };
  });
  const dayLabels = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  const agendaForm = (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl h-fit">
      <h3 className="font-bold text-zinc-100 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-cyan-400"/> Nieuwe Afspraak
      </h3>
      <form onSubmit={handleAddAgendaEvent} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Titel</label>
          <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Afspraak..." className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" required />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Datum</label>
            <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" required />
          </div>
          <div className="w-24">
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tijd</label>
            <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" required />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Locatie (Optioneel)</label>
          <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="Adres of link..." className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Agenda Groep</label>
          <select value={newEventSource} onChange={e => setNewEventSource(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-400 outline-none focus:border-cyan-500 text-sm">
            <option value="Privé">Privé</option>
            <option value="Werk">Werk</option>
            <option value="Training">Training</option>
            <option value="Habit">Habit</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Notities (Optioneel)</label>
          <textarea value={newEventDescription} onChange={e => setNewEventDescription(e.target.value)} placeholder="Extra details..." className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-zinc-100 outline-none focus:border-cyan-500 text-sm resize-none h-16" />
        </div>
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold py-2 rounded-xl transition-colors text-sm">Toevoegen</button>
      </form>
      <div className="mt-8 pt-6 border-t border-zinc-800">
        <h3 className="font-bold text-zinc-100 mb-4 text-sm uppercase tracking-wider text-zinc-500">Filters</h3>
        <div className="space-y-2">
          {['Privé', 'Werk', 'Training', 'Habit', 'Google', 'Apple', 'Outlook', 'Andere Agenda'].map(type => {
            const isActive = ['Privé', 'Werk', 'Training', 'Habit'].includes(type) || connectedAgendas[type];
            if (!isActive) return null;
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getEventColor(type)}`}></div>
                <span className="text-sm text-zinc-300">{type}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Calendar className="text-cyan-400" /> Agenda
          </h2>
          <p className="text-zinc-400 mt-1">Beheer al je afspraken.</p>
        </div>
        {/* Maandnavigatie alleen op tablet/desktop */}
        <div className="hidden md:flex items-center bg-zinc-900 rounded-xl p-1 border border-zinc-800">
          <button onClick={handlePrevMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5"/>
          </button>
          <div className="px-4 font-bold text-zinc-100 min-w-[140px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </div>
          <button onClick={handleNextMonth} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5"/>
          </button>
        </div>
      </div>

      {/* ── MOBIEL: lijstweergave deze week ─────────────────────────────────── */}
      <div className="md:hidden space-y-4">
        {agendaForm}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Deze week</h3>
          {weekDays.map(({ iso, d }) => {
            const dayEvents = agendaEvents
              .filter(e => e.date === iso)
              .sort((a, b) => a.time.localeCompare(b.time));
            const isToday = iso === todayISO;
            const isPast = iso < todayISO;
            return (
              <div key={iso} className={`rounded-2xl border overflow-hidden ${isToday ? 'border-cyan-500/40 bg-cyan-500/5' : isPast ? 'border-zinc-800/40 bg-zinc-900/30' : 'border-zinc-800 bg-zinc-900/60'}`}>
                <div className={`flex items-center justify-between px-4 py-2.5 ${isToday ? 'bg-cyan-500/10' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isToday ? 'text-cyan-400' : isPast ? 'text-zinc-600' : 'text-zinc-300'}`}>
                      {dayLabels[d.getDay()]}
                    </span>
                    {isToday && <span className="text-[10px] font-bold bg-cyan-500 text-zinc-950 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Vandaag</span>}
                  </div>
                  <span className={`text-xs font-medium ${isToday ? 'text-cyan-400/70' : 'text-zinc-600'}`}>
                    {d.getDate()} {monthNames[d.getMonth()].slice(0, 3)}
                  </span>
                </div>
                {dayEvents.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-zinc-600 italic">Geen afspraken</div>
                ) : (
                  <div className="divide-y divide-zinc-800/50">
                    {dayEvents.map(event => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-zinc-800/50 transition-colors ${event.completed ? 'opacity-50' : ''}`}>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${getEventColor(event.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${event.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{event.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.time}
                            {event.location && <><MapPin className="w-3 h-3 ml-1" /><span className="truncate">{event.location}</span></>}
                          </p>
                        </div>
                        {event.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP/TABLET: maandkalender ───────────────────────────────────── */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="col-span-1">
          {agendaForm}
        </div>
        <div className="col-span-1 lg:col-span-3 bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
              <div key={day} className="text-xs font-bold text-zinc-500 uppercase">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-zinc-950/30 rounded-xl border border-transparent p-2 min-h-[100px]"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateString = `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const isToday = dateString === todayISO;
              const dayEvents = agendaEvents.filter(e => e.date === dateString);
              return (
                <div key={day} className={`bg-zinc-950/80 rounded-xl border p-2 flex flex-col min-h-[100px] transition-colors hover:border-zinc-700 ${isToday ? 'border-cyan-500/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]' : 'border-zinc-800/80'}`}>
                  <div className={`text-xs font-bold mb-2 flex items-center justify-between ${isToday ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    {day}
                    {dayEvents.length > 0 && <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-400">{dayEvents.length}</span>}
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1">
                    {dayEvents.map(event => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className={`text-[10px] leading-tight flex items-start justify-between group cursor-pointer p-0.5 hover:bg-zinc-800/80 rounded transition-colors ${event.completed ? 'opacity-50 line-through text-emerald-400/50' : ''}`} title={`${event.time} - ${event.title}`}>
                        <div className="flex items-start gap-1.5 overflow-hidden">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${getEventColor(event.type)}`}></div>
                          <span className="text-zinc-300 truncate group-hover:text-white transition-colors">{event.time} {event.title}</span>
                        </div>
                        {event.completed ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0 ml-1" /> : event.location && <MapPin className="w-2.5 h-2.5 text-zinc-600 shrink-0 ml-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
