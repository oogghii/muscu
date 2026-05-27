import { useState, useRef, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { formatDuration, formatVolume, sessionVolume, totalSets } from '../lib/utils'

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateKey(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function getCalendarDays(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const start = getMondayOf(firstOfMonth)

  // End on the Sunday of the week containing the last day of month
  const end = new Date(lastOfMonth)
  const endDay = end.getDay()
  if (endDay !== 0) end.setDate(end.getDate() + (7 - endDay))

  const days = []
  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const MONTHS_FR_SHORT = [
  'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.',
]

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr)
  return capitalize(
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  )
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function Calendar({ year, month, sessionDateSet, selectedDay, onSelectDay, onPrevMonth, onNextMonth }) {
  const days = getCalendarDays(year, month)
  const todayKey = toDateKey(new Date())
  const now = new Date()
  const isCurrentOrPast = year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())

  return (
    <div className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
      {/* Month nav */}
      <div className="row--between" style={{ marginBottom: '1rem' }}>
        <button className="btn btn--sm btn--icon" onClick={onPrevMonth}>←</button>
        <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>
          {MONTHS_FR[month]} {year}
        </span>
        <button
          className="btn btn--sm btn--icon"
          onClick={onNextMonth}
          disabled={year === now.getFullYear() && month >= now.getMonth()}
          style={{ opacity: (year === now.getFullYear() && month >= now.getMonth()) ? 0.3 : 1 }}
        >
          →
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} style={{
            textAlign: 'center',
            fontSize: '0.625rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--gray)',
            paddingBottom: '6px',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {days.map((day, i) => {
          const key = toDateKey(day)
          const inMonth = day.getMonth() === month
          const hasSession = sessionDateSet.has(key)
          const isToday = key === todayKey
          const isSelected = selectedDay === key

          return (
            <button
              key={i}
              onClick={() => {
                if (!hasSession || !inMonth) return
                onSelectDay(isSelected ? null : key)
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '5px 2px',
                border: isSelected
                  ? '2.5px solid var(--black)'
                  : isToday
                  ? '2.5px solid var(--black)'
                  : '2px solid transparent',
                background: isSelected
                  ? 'var(--yellow)'
                  : hasSession && inMonth
                  ? 'var(--lime)'
                  : 'transparent',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                fontWeight: isToday ? 800 : 600,
                fontSize: '0.8125rem',
                color: inMonth ? 'var(--black)' : 'var(--light-gray)',
                opacity: inMonth ? 1 : 0.35,
                cursor: hasSession && inMonth ? 'pointer' : 'default',
                fontFamily: 'var(--font)',
                transition: 'background 0.1s, box-shadow 0.08s, transform 0.08s',
                minHeight: '36px',
              }}
            >
              {day.getDate()}
              {hasSession && inMonth && (
                <div style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: isSelected ? 'var(--black)' : 'var(--black)',
                  opacity: isSelected ? 0.6 : 0.5,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Month summary */}
      {(() => {
        const count = days.filter(d => d.getMonth() === month && sessionDateSet.has(toDateKey(d))).length
        return count > 0 ? (
          <div style={{
            marginTop: '0.75rem',
            borderTop: '2px solid var(--black)',
            paddingTop: '0.625rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{count} séance{count !== 1 ? 's' : ''} ce mois</span>
            {selectedDay && (
              <button
                style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: '0.8125rem',
                  cursor: 'pointer', fontFamily: 'var(--font)', color: 'var(--gray)', textDecoration: 'underline' }}
                onClick={() => onSelectDay(null)}
              >
                Tout voir
              </button>
            )}
          </div>
        ) : null
      })()}
    </div>
  )
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({ session, isExpanded, onToggle, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const vol = sessionVolume(session)
  const sets = totalSets(session)
  const start = new Date(session.startTime)
  const durationSec = session.endTime
    ? Math.round((new Date(session.endTime) - start) / 1000)
    : null

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Summary row — always visible */}
      <div
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={onToggle}
      >
        <div className="row--between">
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {durationSec !== null && (
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)' }}>
                  · {formatDuration(durationSec)}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)', marginTop: '3px', lineHeight: 1.4 }}>
              {session.exercises.slice(0, 3).map(e => e.name).join(' · ')}
              {session.exercises.length > 3 && ` · +${session.exercises.length - 3}`}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1.0625rem' }}>{vol > 0 ? formatVolume(vol) : '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>
              {sets} série{sets !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{
          marginTop: '0.375rem',
          fontSize: '0.75rem',
          color: 'var(--gray)',
          fontWeight: 700,
          textAlign: 'right',
        }}>
          {isExpanded ? '▲ Réduire' : '▼ Détails'}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="divider" style={{ margin: '0 0 0.75rem' }} />
          <div className="stack" style={{ gap: '0.75rem' }}>
            {session.exercises.map(ex => {
              const exVol = ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0)
              return (
                <div key={ex.name}>
                  <div className="row--between" style={{ marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ex.name}</span>
                    {exVol > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>
                        {Math.round(exVol).toLocaleString('fr-FR')} kg
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {ex.sets.map((set, i) => (
                      <span key={i} className="set-chip" style={{ cursor: 'default', fontSize: '0.8125rem' }}>
                        {set.weight}×{set.reps}
                      </span>
                    ))}
                    {ex.sets.length === 0 && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gray)' }}>Aucune série</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="divider" style={{ margin: '0.75rem 0' }} />

          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', flex: 1 }}>Supprimer cette séance ?</span>
              <button className="btn btn--red btn--sm" onClick={onConfirmDelete}>Oui</button>
              <button className="btn btn--sm" onClick={onCancelDelete}>Non</button>
            </div>
          ) : (
            <button className="btn btn--sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={onDelete}>
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function History() {
  const { sessions, deleteSession } = useStore()
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const listRef = useRef(null)

  // Build set of all session dates
  const sessionDateSet = new Set(sessions.map(s => s.startTime.slice(0, 10)))

  // Filter sessions: by selected day, or by calendar month
  const filtered = selectedDay
    ? sessions.filter(s => s.startTime.slice(0, 10) === selectedDay)
    : sessions.filter(s => {
        const d = new Date(s.startTime)
        return d.getFullYear() === calYear && d.getMonth() === calMonth
      })

  // Sort newest first, group by date
  const sortedDesc = filtered.slice().sort((a, b) =>
    new Date(b.startTime) - new Date(a.startTime)
  )

  const groups = sortedDesc.reduce((acc, s) => {
    const dk = s.startTime.slice(0, 10)
    if (!acc[dk]) acc[dk] = []
    acc[dk].push(s)
    return acc
  }, {})
  const groupDates = Object.keys(groups).sort().reverse()

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
    setSelectedDay(null)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
    setSelectedDay(null)
  }

  const handleSelectDay = (day) => {
    setSelectedDay(day)
    setExpandedId(null)
    // Scroll list into view on mobile
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const handleDelete = (id) => {
    deleteSession(id)
    setExpandedId(null)
    setConfirmDeleteId(null)
  }

  return (
    <div className="page">
      <div style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.25rem' }}>
        Historique
      </div>

      <Calendar
        year={calYear}
        month={calMonth}
        sessionDateSet={sessionDateSet}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      {/* Session list */}
      <div ref={listRef}>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📅</div>
            <div className="empty-state__text">Aucune séance enregistrée</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
              Commence dès maintenant, Raphaël !
            </div>
          </div>
        ) : groupDates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🗓️</div>
            <div className="empty-state__text">
              {selectedDay
                ? 'Aucune séance ce jour-là'
                : `Aucune séance en ${MONTHS_FR[calMonth].toLowerCase()} ${calYear}`}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
              {sessions.length} séance{sessions.length !== 1 ? 's' : ''} au total
            </div>
          </div>
        ) : (
          <div className="stack">
            {groupDates.map(dk => (
              <div key={dk}>
                {/* Date header */}
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--gray)',
                  marginBottom: '0.5rem',
                  marginTop: '0.25rem',
                  paddingLeft: '2px',
                }}>
                  {formatDayHeader(dk)}
                </div>

                {/* Sessions for this date */}
                <div className="stack" style={{ gap: '0.5rem' }}>
                  {groups[dk].map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isExpanded={expandedId === session.id}
                      confirmDelete={confirmDeleteId === session.id}
                      onToggle={() => {
                        setExpandedId(id => id === session.id ? null : session.id)
                        setConfirmDeleteId(null)
                      }}
                      onDelete={() => setConfirmDeleteId(session.id)}
                      onConfirmDelete={() => handleDelete(session.id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
