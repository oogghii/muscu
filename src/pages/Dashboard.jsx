import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import {
  computeStreak, getWeekSessions, getWeekTrainedDays, avgStartTime,
} from '../lib/stats'
import { PERF_LABELS } from '../lib/utils'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const IDX_TO_DAY = [1, 2, 3, 4, 5, 6, 0]

function CountUp({ target, duration = 700 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    const steps = 24
    const inc = target / steps
    const delay = duration / steps
    let cur = 0
    const t = setInterval(() => {
      cur += inc
      if (cur >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(cur))
    }, delay)
    return () => clearInterval(t)
  }, [target, duration])
  return val
}

function WeekGrid({ trainedDays }) {
  const todayJs = new Date().getDay()
  const todayIdx = todayJs === 0 ? 6 : todayJs - 1

  return (
    <div className="week-grid">
      {DAY_LABELS.map((label, i) => {
        const jsDay = IDX_TO_DAY[i]
        const done = trainedDays.includes(jsDay)
        const isToday = i === todayIdx
        return (
          <div className="week-day" key={i}>
            <div className={`week-day__box${done ? ' done' : ''}${isToday ? ' today' : ''}`} />
            <span
              className="week-day__label"
              style={{ color: isToday ? 'var(--black)' : 'var(--gray)', fontWeight: isToday ? 800 : 600 }}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SettingsSheet({ settings, onUpdate, onClose }) {
  const [goal, setGoal] = useState(settings.weeklyGoal)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="row--between" style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Réglages</span>
          <button className="btn btn--sm btn--icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div className="tag" style={{ marginBottom: '0.375rem' }}>Objectif hebdo</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                className={`btn btn--sm${goal === n ? ' btn--black' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setGoal(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="tag" style={{ marginTop: '0.375rem' }}>séances / semaine</div>
        </div>

        <button
          className="btn btn--primary btn--full btn--lg"
          onClick={() => { onUpdate({ weeklyGoal: goal }); onClose() }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}

export default function Dashboard({ navigate }) {
  const { sessions, activeSession, settings, startSession, updateSettings } = useStore()
  const [showSettings, setShowSettings] = useState(false)

  const streak = computeStreak(sessions, settings.weeklyGoal)
  const weekCount = getWeekSessions(sessions)
  const trainedDays = getWeekTrainedDays(sessions)
  const avgTime = avgStartTime(sessions)
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null

  const h = new Date().getHours()
  const greeting = h < 12 ? `Bonjour Raphaël 🌅` : h < 18 ? `Bon après-midi Raphaël ☀️` : `Bonsoir Raphaël 🌙`

  const weekPct = Math.min(100, (weekCount / settings.weeklyGoal) * 100)

  const handleStart = () => {
    if (!activeSession) startSession()
    navigate('session')
  }

  const streakMessage = streak.current === 0 && sessions.length === 0
    ? 'Prêt pour ta première séance, Raphaël ?'
    : streak.current === 0 ? 'Reprends ton rythme cette semaine !'
    : streak.current === 1 ? 'La flamme est allumée 🔥'
    : streak.current >= 8 ? 'Légendaire. Continue comme ça.'
    : streak.current >= 4 ? 'Inarrêtable. 💥'
    : 'Belle régularité !'

  return (
    <div className="page">
      {/* Header */}
      <div className="row--between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', marginBottom: '2px' }}>
            GymStreak
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1 }}>
            {greeting}
          </div>
        </div>
        <button className="btn btn--sm btn--icon" onClick={() => setShowSettings(true)} style={{ fontSize: '1rem' }}>
          ⚙️
        </button>
      </div>

      {/* Streak hero */}
      <div className="card card--yellow fade-up" style={{ marginBottom: '0.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', right: '0.75rem', bottom: '-0.5rem',
          fontSize: '5.5rem', fontWeight: 800, opacity: 0.1, lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>
          {streak.current}
        </div>
        <div className="tag">Streak</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.25rem 0 0.125rem' }}>
          <span className="num-hero num-pop" style={{ position: 'relative', zIndex: 1 }}>
            <CountUp target={streak.current} />
          </span>
          <span style={{ fontWeight: 700, fontSize: '1.125rem', position: 'relative', zIndex: 1 }}>
            {streak.current === 1 ? 'semaine' : 'semaines'}
          </span>
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#444', marginBottom: '0.25rem' }}>
          {streakMessage}
        </div>
        {streak.best > 0 && (
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#666' }}>
            Record all-time : {streak.best} sem.
          </div>
        )}
      </div>

      {/* Week progress */}
      <div className="card fade-up" style={{ marginBottom: '0.75rem', animationDelay: '0.05s' }}>
        <div className="row--between" style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Cette semaine</span>
          <span style={{ fontWeight: 800, fontSize: '1.125rem' }}>
            {weekCount}
            <span style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.9375rem' }}>
              /{settings.weeklyGoal}
            </span>
          </span>
        </div>
        <div className="progress-track" style={{ marginBottom: '0.625rem' }}>
          <div className="progress-fill" style={{ width: `${weekPct}%` }} />
        </div>
        <WeekGrid trainedDays={trainedDays} />
        {weekCount >= settings.weeklyGoal && (
          <div style={{ marginTop: '0.625rem', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
            🎯 Objectif de la semaine atteint, Raphaël !
          </div>
        )}
      </div>

      {/* Last session + avg time */}
      <div className="grid-2 fade-up" style={{ marginBottom: '0.75rem', animationDelay: '0.1s' }}>
        <div className="card">
          <div className="tag">Dernière séance</div>
          {lastSession ? (
            <div style={{ marginTop: '0.375rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {lastSession.emoji && (
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{lastSession.emoji}</span>
                )}
                <div>
                  {lastSession.perf != null && (
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>
                      {lastSession.perf}/5
                    </div>
                  )}
                  {lastSession.perf != null && (
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray)', marginTop: '2px' }}>
                      {PERF_LABELS[lastSession.perf]}
                    </div>
                  )}
                </div>
              </div>
              {lastSession.humeur && lastSession.humeur.length > 0 && (
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)', marginTop: '0.375rem' }}>
                  {lastSession.humeur.slice(0, 2).join(' · ')}
                </div>
              )}
              {!lastSession.emoji && lastSession.perf == null && (
                <div style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>—</div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: 'var(--gray)', marginTop: '0.375rem' }}>—</div>
          )}
        </div>

        <div className="card">
          <div className="tag">Heure moyenne</div>
          {avgTime ? (
            <>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1.1 }}>
                {avgTime}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '0.25rem' }}>
                en moyenne
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>—</div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="fade-up" style={{ animationDelay: '0.15s' }}>
        {activeSession ? (
          <button className="btn btn--lime btn--full btn--lg" onClick={handleStart}>
            ▶ Reprendre la séance
          </button>
        ) : (
          <button className="btn btn--primary btn--full btn--lg" onClick={handleStart}>
            💪 Démarrer une séance
          </button>
        )}
      </div>

      {showSettings && (
        <SettingsSheet
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
