import { useState, useRef } from 'react'
import { useStore } from '../context/StoreContext'
import { formatDuration, PERF_LABELS } from '../lib/utils'
import SessionEditSheet from '../components/SessionEditSheet'

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

function Calendar({ year, month, sessionDateSet, emojiByDate, selectedDay, onSelectDay, onPrevMonth, onNextMonth }) {
  const days = getCalendarDays(year, month)
  const todayKey = toDateKey(new Date())
  const now = new Date()

  return (
    <div className="card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: '0.625rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--gray)', paddingBottom: '6px',
          }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {days.map((day, i) => {
          const key = toDateKey(day)
          const inMonth = day.getMonth() === month
          const hasSession = sessionDateSet.has(key)
          const isToday = key === todayKey
          const isSelected = selectedDay === key
          const emoji = emojiByDate[key]

          return (
            <button
              key={i}
              onClick={() => {
                if (!hasSession || !inMonth) return
                onSelectDay(isSelected ? null : key)
              }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '1px', padding: '4px 2px',
                border: isSelected || isToday ? '2.5px solid var(--black)' : '2px solid transparent',
                background: isSelected ? 'var(--yellow)' : hasSession && inMonth ? 'var(--lime)' : 'transparent',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                fontWeight: isToday ? 800 : 600,
                fontSize: '0.8125rem',
                color: inMonth ? 'var(--black)' : 'var(--light-gray)',
                opacity: inMonth ? 1 : 0.35,
                cursor: hasSession && inMonth ? 'pointer' : 'default',
                fontFamily: 'var(--font)',
                transition: 'background 0.1s, box-shadow 0.08s',
                minHeight: '42px',
              }}
            >
              {day.getDate()}
              {hasSession && inMonth && (
                emoji
                  ? <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{emoji}</span>
                  : <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--black)', opacity: 0.5 }} />
              )}
            </button>
          )
        })}
      </div>

      {(() => {
        const count = days.filter(d => d.getMonth() === month && sessionDateSet.has(toDateKey(d))).length
        return count > 0 ? (
          <div style={{
            marginTop: '0.75rem', borderTop: '2px solid var(--black)', paddingTop: '0.625rem',
            fontWeight: 700, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between',
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

function SessionCard({ session, isExpanded, onToggle, onEdit, onDelete, confirmDelete, onConfirmDelete, onCancelDelete }) {
  const start = new Date(session.startTime)
  const durationSec = session.endTime
    ? Math.round((new Date(session.endTime) - start) / 1000)
    : null

  const { emoji, perf, energie, sommeil, humeur = [], corps = [], note } = session
  const hasNote = note && note.trim().length > 0
  const hasTags = humeur.length > 0 || corps.length > 0
  const allTags = [...humeur, ...corps]

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Summary row — always visible */}
      <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={onToggle}>
        <div className="row--between" style={{ alignItems: 'flex-start' }}>
          {/* Left: time + tags preview */}
          <div style={{ flex: 1, minWidth: 0, marginRight: '0.75rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {durationSec !== null && (
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)' }}>
                  · {formatDuration(durationSec)}
                </span>
              )}
            </div>
            {!isExpanded && hasTags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.375rem' }}>
                {allTags.slice(0, 3).map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px',
                    border: '1.5px solid var(--black)', background: 'var(--black)', color: 'var(--bg)',
                  }}>
                    {tag}
                  </span>
                ))}
                {allTags.length > 3 && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray)', alignSelf: 'center' }}>
                    +{allTags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: emoji + ratings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
            {emoji && (
              <span style={{ fontSize: '1.875rem', lineHeight: 1 }}>{emoji}</span>
            )}
            <div style={{ textAlign: 'right' }}>
              {perf != null && (
                <div style={{ fontWeight: 800, fontSize: '1.125rem', lineHeight: 1 }}>
                  {perf}<span style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>/5</span>
                </div>
              )}
              {energie != null && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '2px' }}>
                  ⚡{energie}/5
                </div>
              )}
              {sommeil != null && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '1px' }}>
                  🌙{sommeil}/5
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 700, textAlign: 'right' }}>
          {isExpanded ? '▲ Réduire' : '▼ Détails'}
        </div>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div style={{ marginTop: '0.75rem' }}>
          <div className="divider" style={{ margin: '0 0 0.75rem' }} />

          {/* All tags */}
          {hasTags && (
            <div style={{ marginBottom: '0.75rem' }}>
              {humeur.length > 0 && (
                <div style={{ marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginRight: '0.5rem' }}>Humeur</span>
                  {humeur.map(tag => (
                    <span key={tag} style={{ display: 'inline-block', fontSize: '0.8125rem', fontWeight: 700, padding: '2px 8px', border: '2px solid var(--black)', background: 'var(--black)', color: 'var(--bg)', marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {corps.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginRight: '0.5rem' }}>Corps</span>
                  {corps.map(tag => (
                    <span key={tag} style={{ display: 'inline-block', fontSize: '0.8125rem', fontWeight: 700, padding: '2px 8px', border: '2px solid var(--black)', background: 'transparent', marginRight: '0.25rem', marginBottom: '0.25rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ratings detail */}
          {(perf != null || energie != null || sommeil != null) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {perf != null && (
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                  Perf <strong>{perf}/5</strong>
                  <span style={{ fontWeight: 600, color: 'var(--gray)' }}> {PERF_LABELS[perf]}</span>
                </div>
              )}
              {energie != null && (
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                  · Énergie <strong>{energie}/5</strong>
                </div>
              )}
              {sommeil != null && (
                <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                  · Sommeil <strong>{sommeil}/5</strong>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {hasNote && (
            <div style={{
              fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5,
              marginBottom: '0.75rem', color: 'var(--black)',
              borderLeft: '3px solid var(--black)', paddingLeft: '0.625rem',
            }}>
              {note}
            </div>
          )}

          <div className="divider" style={{ margin: '0 0 0.625rem' }} />

          {/* Actions */}
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', flex: 1 }}>Supprimer cette séance ?</span>
              <button className="btn btn--red btn--sm" onClick={onConfirmDelete}>Oui</button>
              <button className="btn btn--sm" onClick={onCancelDelete}>Non</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn--sm btn--primary" style={{ flex: 1 }} onClick={onEdit}>
                ✏️ Modifier
              </button>
              <button className="btn btn--sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={onDelete}>
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function History() {
  const { sessions, deleteSession, updateSession } = useStore()
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [editingSession, setEditingSession] = useState(null)
  const listRef = useRef(null)

  const sessionDateSet = new Set(sessions.map(s => s.startTime.slice(0, 10)))

  // Build emoji map: dateKey → last emoji for that day
  const emojiByDate = {}
  sessions.forEach(s => {
    const dk = s.startTime.slice(0, 10)
    if (s.emoji) emojiByDate[dk] = s.emoji
  })

  const filtered = selectedDay
    ? sessions.filter(s => s.startTime.slice(0, 10) === selectedDay)
    : sessions.filter(s => {
        const d = new Date(s.startTime)
        return d.getFullYear() === calYear && d.getMonth() === calMonth
      })

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
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const handleDelete = (id) => {
    deleteSession(id)
    setExpandedId(null)
    setConfirmDeleteId(null)
  }

  const handleSaveEdit = (id, values) => {
    updateSession(id, values)
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
        emojiByDate={emojiByDate}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

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
                <div style={{
                  fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--gray)',
                  marginBottom: '0.5rem', marginTop: '0.25rem', paddingLeft: '2px',
                }}>
                  {formatDayHeader(dk)}
                </div>

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
                      onEdit={() => setEditingSession(session)}
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

      {editingSession && (
        <SessionEditSheet
          session={editingSession}
          onSave={values => handleSaveEdit(editingSession.id, values)}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  )
}
