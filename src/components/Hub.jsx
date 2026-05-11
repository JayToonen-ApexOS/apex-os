import React, { useMemo } from 'react';
import {
  CheckCircle2, Circle, Flame, ArrowRight, MapPin,
  CloudRain, Sun, Cloud, CloudSnow, Zap, CalendarDays,
  Target, ChevronRight, Sparkles
} from 'lucide-react';

function WeatherIcon({ condition, className }) {
  const c = (condition || '').toLowerCase();
  if (c.includes('regen') || c.includes('mist')) return <CloudRain className={className} />;
  if (c.includes('sneeuw')) return <CloudSnow className={className} />;
  if (c.includes('onweer')) return <Zap className={className} />;
  if (c.includes('bewolkt')) return <Cloud className={className} />;
  return <Sun className={className} />;
}

function getGreeting(time) {
  const hour = parseInt((time || '00').split(':')[0], 10);
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function buildBriefing({ todaysEvents, weather, currentSession, isYasminMode }) {
  const realEvents = todaysEvents.filter(e => e.type !== 'Habit');
  const name = isYasminMode ? 'Yasmin' : 'Jay';
  const parts = [];

  if (realEvents.length === 0) {
    parts.push(`Je agenda is leeg vandaag, ${name}.`);
  } else {
    const first = [...realEvents].sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];
    parts.push(
      `${realEvents.length} afspraak${realEvents.length !== 1 ? 'en' : ''} vandaag.` +
      (first.time ? ` Eerste om ${first.time}: **${first.title}**.` : ` Eerste: **${first.title}**.`)
    );
  }
  if (currentSession) parts.push(`Forge sessie: **${currentSession}**.`);
  if (weather.temp !== '--') parts.push(`${weather.temp}° en ${weather.condition.toLowerCase()} in ${weather.location}.`);
  return parts.join(' ');
}

function BriefingText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{part}</strong>
          : part
      )}
    </p>
  );
}

function trimHabitName(name) {
  return (name || '').replace(/^[,\s\-–—.]+/, '').trim();
}

export default function Hub({
  isYasminMode, todaysEvents, currentSession, weather, habits,
  setActiveTab, toggleHabit, toggleAgendaEventCompleted, setSelectedEvent,
  getEventColor, currentTime, currentDateFormatted, pendingTasks = [],
}) {
  const cy = isYasminMode;
  const accent = cy ? '#a78bfa' : '#00D4FF';
  const accentBg = cy ? 'rgba(167,139,250,0.08)' : 'rgba(0,212,255,0.08)';
  const accentBorder = cy ? 'rgba(167,139,250,0.2)' : 'rgba(0,212,255,0.2)';

  const realEvents = useMemo(() =>
    todaysEvents
      .filter(e => e.type !== 'Habit')
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')),
    [todaysEvents]
  );

  const upcoming = realEvents.filter(e => !e.completed);
  const displayEvents = realEvents.slice(0, 5);
  const extraCount = realEvents.length - 5;

  const focusEvent = upcoming[0] || null;
  const focusTask = !focusEvent && pendingTasks.length > 0 ? pendingTasks[0] : null;

  const doneHabits = habits.filter(h => h.completedToday).length;
  const habitProgress = habits.length > 0 ? doneHabits / habits.length : 0;

  const briefing = buildBriefing({ todaysEvents, weather, currentSession, isYasminMode });

  const cardStyle = {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24, animation: 'fadeIn 200ms ease' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        {/* Left: date + greeting */}
        <div>
          <p style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: 6,
            fontWeight: 500,
          }}>
            {currentDateFormatted}
          </p>
          <h1 style={{
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            lineHeight: 1.05,
            margin: 0,
          }}>
            {getGreeting(currentTime)},<br />{cy ? 'Yasmin' : 'Jay'}
          </h1>
        </div>

        {/* Right: clock + weather */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 32,
            fontWeight: 500,
            color: accent,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {currentTime}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <WeatherIcon condition={weather.condition} className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {weather.temp !== '--' ? `${weather.temp}° · ` : ''}{weather.condition}
            </span>
          </div>
        </div>
      </div>

      {/* ── AI BRIEFING CARD ── */}
      <div style={{
        ...cardStyle,
        borderLeft: `2px solid ${accent}`,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles style={{ width: 15, height: 15, color: accent }} />
        </div>
        <div>
          <p style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: accent,
            fontWeight: 700,
            marginBottom: 6,
          }}>
            Apex Briefing
          </p>
          <BriefingText text={briefing} />
        </div>
      </div>

      {/* ── TODAY'S AGENDA CARD ── */}
      <div style={{ ...cardStyle, padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays style={{ width: 16, height: 16, color: '#34d399' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>Vandaag</span>
            {realEvents.length > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.5)',
              }}>
                {realEvents.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('agenda')}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: accent,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              opacity: 1,
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Alles zien <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Events */}
        {displayEvents.length === 0 ? (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            Geen afspraken vandaag — geniet van de vrijheid.
          </p>
        ) : (
          <div>
            {displayEvents.map((event, idx) => {
              const dotColorClass = getEventColor(event.type);
              return (
                <div key={event.id}>
                  {idx > 0 && (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 0' }} />
                  )}
                  <div
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 8px',
                      margin: '0 -8px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'background 150ms',
                      opacity: event.completed ? 0.4 : 1,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Time */}
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.2)',
                      width: 44,
                      textAlign: 'right',
                      flexShrink: 0,
                      fontWeight: 400,
                    }}>
                      {event.time || '—'}
                    </span>
                    {/* Dot */}
                    <EventDot colorClass={dotColorClass} />
                    {/* Title */}
                    <span style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: 500,
                      color: event.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                      textDecoration: event.completed ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {event.title}
                    </span>
                    {/* Source tag */}
                    {event.type && event.type !== 'Habit' && (
                      <SourceTag label={event.type} />
                    )}
                    {/* Check button */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleAgendaEventCompleted(event.id, e); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: event.completed ? '#34d399' : 'rgba(255,255,255,0.15)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                        transition: 'color 150ms',
                      }}
                    >
                      {event.completed
                        ? <CheckCircle2 style={{ width: 15, height: 15 }} />
                        : <Circle style={{ width: 15, height: 15 }} />}
                    </button>
                  </div>
                </div>
              );
            })}
            {extraCount > 0 && (
              <button
                onClick={() => setActiveTab('agenda')}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: accent,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  paddingTop: 12,
                  opacity: 1,
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                + {extraCount} meer afspraken →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── BOTTOM GRID: FOCUS + HABITS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* FOCUS CARD */}
        <div style={{ ...cardStyle, padding: 20, position: 'relative', overflow: 'hidden' }}>
          {/* Watermark number */}
          <span style={{
            position: 'absolute',
            top: -8,
            right: 12,
            fontSize: 72,
            fontWeight: 900,
            color: 'rgba(255,255,255,0.03)',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            01
          </span>

          <p style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: accent,
            fontWeight: 700,
            marginBottom: 12,
          }}>
            Focus Vandaag
          </p>

          {focusEvent ? (
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 6 }}>
                {focusEvent.title}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                {focusEvent.time ? `Om ${focusEvent.time} · eerste afspraak` : 'Eerste afspraak van de dag'}
              </p>
              <button
                onClick={e => { e.stopPropagation(); toggleAgendaEventCompleted(focusEvent.id, e); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: `1px solid ${focusEvent.completed ? 'rgba(52,211,153,0.2)' : accentBorder}`,
                  background: focusEvent.completed ? 'rgba(52,211,153,0.08)' : accentBg,
                  color: focusEvent.completed ? '#34d399' : accent,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {focusEvent.completed
                  ? <><CheckCircle2 style={{ width: 14, height: 14 }} /> Gedaan</>
                  : <><Circle style={{ width: 14, height: 14 }} /> Markeer klaar</>}
              </button>
            </div>
          ) : focusTask ? (
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: 6 }}>
                {focusTask.title}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                {focusTask.projectName}
              </p>
              <button
                onClick={() => setActiveTab('projects')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: `1px solid ${accentBorder}`,
                  background: accentBg,
                  color: accent,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                Open project <ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
              Geen prioriteit — goede dag voor deep work.
            </p>
          )}
        </div>

        {/* HABITS CARD */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {/* Progress bar */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${habitProgress * 100}%`,
              background: accent,
              transition: 'width 600ms ease',
              borderRadius: 999,
            }} />
          </div>

          <div style={{ padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame style={{ width: 14, height: 14, color: '#fb923c' }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)' }}>
                  Habits
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                  {doneHabits}/{habits.length}
                </span>
                <button
                  onClick={() => setActiveTab('habits')}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: accent,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 1,
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Toon alle →
                </button>
              </div>
            </div>

            {/* Habit rows */}
            {habits.length === 0 ? (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                Geen habits ingesteld.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {habits.map(habit => {
                  const done = habit.completedToday;
                  const name = trimHabitName(habit.title);
                  return (
                    <button
                      key={habit.id}
                      onClick={e => toggleHabit(habit.id, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'opacity 150ms',
                      }}
                    >
                      {/* Circle */}
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: done ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                        background: done ? accent : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 200ms',
                      }}>
                        {done && <CheckCircle2 style={{ width: 13, height: 13, color: '#000000' }} />}
                      </div>
                      {/* Name */}
                      <span style={{
                        flex: 1,
                        fontSize: 13,
                        color: done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)',
                        textDecoration: done ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'color 200ms',
                      }}>
                        {name}
                      </span>
                      {/* Streak */}
                      {habit.streak > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                          <Flame style={{ width: 12, height: 12, color: done ? '#fb923c' : 'rgba(255,255,255,0.15)' }} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: done ? '#fb923c' : 'rgba(255,255,255,0.25)',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {habit.streak}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* Helper: renders a colored 6px dot from a Tailwind color class */
function EventDot({ colorClass }) {
  const colorMap = {
    'bg-blue-400': '#60a5fa',
    'bg-emerald-400': '#34d399',
    'bg-violet-400': '#a78bfa',
    'bg-orange-400': '#fb923c',
    'bg-rose-400': '#f87171',
    'bg-amber-400': '#fbbf24',
    'bg-sky-400': '#38bdf8',
    'bg-fuchsia-400': '#e879f9',
    'bg-[#00D4FF]': '#00D4FF',
  };
  const color = Object.entries(colorMap).find(([cls]) => colorClass.includes(cls))?.[1] ?? '#60a5fa';
  return (
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
  );
}

/* Helper: small source pill */
function SourceTag({ label }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 500,
      padding: '2px 6px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.3)',
      flexShrink: 0,
      maxWidth: 60,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
