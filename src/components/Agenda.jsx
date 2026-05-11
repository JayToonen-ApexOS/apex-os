import React from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2 } from 'lucide-react';

const card = 'rounded-xl border border-white/[0.06] bg-[#0a0a0a]';
const input = 'w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/25 transition-all duration-150 placeholder-white/20';
const label = 'block text-[10px] font-bold text-white/40 uppercase tracking-[0.1em] mb-1.5';

export default function Agenda({
  todayISO, agendaEvents, connectedAgendas, newEventTitle, setNewEventTitle,
  newEventDate, setNewEventDate, newEventTime, setNewEventTime, newEventSource,
  setNewEventSource, newEventLocation, setNewEventLocation, newEventDescription,
  setNewEventDescription, currentMonth, currentYear, daysInMonth, startOffset, monthNames,
  handleAddAgendaEvent, handlePrevMonth, handleNextMonth, setSelectedEvent, getEventColor
}) {
  const todayDate = new Date(todayISO);
  const dayOfWeek = todayDate.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - daysFromMonday + i);
    return { iso: d.toISOString().split('T')[0], d };
  });
  const dayLabels = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  const agendaForm = (
    <div className={card + ' p-5'}>
      <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-[#00D4FF]" /> Nieuwe Afspraak
      </h3>
      <form onSubmit={handleAddAgendaEvent} className="space-y-3">
        <div>
          <label className={label}>Titel</label>
          <input type="text" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Afspraak..." className={input} required />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={label}>Datum</label>
            <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className={input} required />
          </div>
          <div className="w-24">
            <label className={label}>Tijd</label>
            <input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} className={input} required />
          </div>
        </div>
        <div>
          <label className={label}>Locatie (optioneel)</label>
          <input type="text" value={newEventLocation} onChange={e => setNewEventLocation(e.target.value)} placeholder="Adres of link..." className={input} />
        </div>
        <div>
          <label className={label}>Categorie</label>
          <select value={newEventSource} onChange={e => setNewEventSource(e.target.value)} className={input + ' text-white/70'}>
            <option value="Privé">Privé</option>
            <option value="Werk">Werk</option>
            <option value="Training">Training</option>
            <option value="Habit">Habit</option>
          </select>
        </div>
        <div>
          <label className={label}>Notities (optioneel)</label>
          <textarea value={newEventDescription} onChange={e => setNewEventDescription(e.target.value)} placeholder="Extra details..." className={input + ' resize-none h-16'} />
        </div>
        <button type="submit" className="w-full bg-[#00D4FF] hover:bg-[#00b8d9] text-black font-bold py-2.5 rounded-lg transition-all duration-150 text-sm">
          Toevoegen
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] mb-3">Categorieën</p>
        <div className="space-y-1.5">
          {['Privé', 'Werk', 'Training', 'Habit', 'Google', 'Apple', 'Outlook', 'Andere Agenda'].map(type => {
            const isActive = ['Privé', 'Werk', 'Training', 'Habit'].includes(type) || connectedAgendas[type];
            if (!isActive) return null;
            return (
              <div key={type} className="flex items-center gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getEventColor(type)}`} />
                <span className="text-xs text-white/50">{type}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Agenda</h2>
          <p className="text-sm text-white/40 mt-0.5">Beheer al je afspraken.</p>
        </div>
        <div className="hidden md:flex items-center gap-1 bg-[#0a0a0a] border border-white/[0.06] rounded-lg p-1">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-150">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm font-bold text-white min-w-[130px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-150">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE: week list */}
      <div className="md:hidden space-y-4">
        {agendaForm}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em] px-1">Deze week</p>
          {weekDays.map(({ iso, d }) => {
            const dayEvents = agendaEvents.filter(e => e.date === iso).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            const isToday = iso === todayISO;
            const isPast = iso < todayISO;
            return (
              <div key={iso} className={`rounded-xl border overflow-hidden ${isToday ? 'border-[#00D4FF]/20 bg-[#00D4FF]/[0.03]' : 'border-white/[0.06] bg-[#0a0a0a]'}`}>
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isToday ? 'border-[#00D4FF]/10 bg-[#00D4FF]/[0.04]' : 'border-white/[0.04]'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isToday ? 'text-[#00D4FF]' : isPast ? 'text-white/25' : 'text-white/60'}`}>
                      {dayLabels[d.getDay()]} {d.getDate()}
                    </span>
                    {isToday && <span className="text-[9px] font-black bg-[#00D4FF] text-black px-1.5 py-0.5 rounded uppercase tracking-wider">Vandaag</span>}
                  </div>
                  <span className={`text-[10px] ${isToday ? 'text-[#00D4FF]/50' : 'text-white/20'}`}>
                    {monthNames[d.getMonth()].slice(0, 3)}
                  </span>
                </div>
                {dayEvents.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-white/20 italic">Geen afspraken</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {dayEvents.map(event => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 hover:bg-white/[0.02] ${event.completed ? 'opacity-40' : ''}`}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getEventColor(event.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${event.completed ? 'line-through text-white/40' : 'text-white'}`}>{event.title}</p>
                          <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1.5">
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

      {/* DESKTOP: month grid */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="col-span-1">{agendaForm}</div>
        <div className={card + ' col-span-3 p-5 flex flex-col'}>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
              <div key={day} className="text-[10px] font-bold text-white/25 uppercase py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`e-${i}`} className="rounded-lg min-h-[90px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateString = `${currentYear}-${(currentMonth+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
              const isToday = dateString === todayISO;
              const dayEvents = agendaEvents.filter(e => e.date === dateString);
              return (
                <div key={day} className={`rounded-lg border p-2 flex flex-col min-h-[90px] transition-all duration-150 hover:border-white/15 ${isToday ? 'border-[#00D4FF]/30 bg-[#00D4FF]/[0.04]' : 'border-white/[0.05] bg-[#0f0f0f]'}`}>
                  <div className={`text-[10px] font-bold mb-1.5 ${isToday ? 'text-[#00D4FF]' : 'text-white/30'}`}>
                    {day}
                    {dayEvents.length > 0 && (
                      <span className="ml-1 text-white/20">({dayEvents.length})</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {dayEvents.map(event => (
                      <div key={event.id} onClick={() => setSelectedEvent(event)} className={`text-[10px] leading-tight flex items-center gap-1 cursor-pointer p-0.5 rounded hover:bg-white/[0.05] transition-all duration-150 ${event.completed ? 'opacity-40' : ''}`}>
                        <div className={`w-1 h-1 rounded-full shrink-0 ${getEventColor(event.type)}`} />
                        <span className="text-white/60 truncate">{event.time && `${event.time} `}{event.title}</span>
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
