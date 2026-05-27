import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import {
  computeStreak, getWeekSessions, getWeekTrainedDays,
  totalVolume, avgStartTime, allTimeBestSet,
} from '../lib/stats'
import { formatVolume } from '../lib/utils'

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
  const [bw, setBw] = useState(String(settings.bodyWeight))
  const [goal, setGoal] = useState(settings.weeklyGoal)

  const save = () => {
    const n = parseFloat(bw)
    if (!isNaN(n) && n > 0) onUpdate({ bodyWeight: n, weeklyGoal: goal })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="row--between" style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Réglages</span>
          <button className="btn btn--sm btn--icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div className="tag" style={{ marginBottom: '0.375rem' }}>Ton poids de corps (kg)</div>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            value={bw}
            onChange={e => setBw(e.target.value)}
            placeholder="75"
          />
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

        <button className="btn btn--primary btn--full btn--lg" onClick={save}>
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
  const vol = totalVolume(sessions)
  const avgTime = avgStartTime(sessions)
  const bestSet = allTimeBestSet(sessions)

  const h = new Date().getHours()
  const greeting = h < 12
    ? `Bonjour Raphaël 🌅`
    : h < 18
    ? `Bon après-midi Raphaël ☀️`
    : `Bonsoir Raphaël 🌙`

  const bodyWeightRatio = settings.bodyWeight > 0 ? Math.round(vol / settings.bodyWeight) : null
  const weekPct = Math.min(100, (weekCount / settings.weeklyGoal) * 100)

  const handleStart = () => {
    if (!activeSession) startSession()
    navigate('session')
  }

  const streakMessage = streak.current === 0 && sessions.length === 0
    ? 'Prêt pour ta première séance, Raphaël ?'
    : streak.current === 0
    ? 'Reprends ton rythme cette semaine !'
    : streak.current === 1
    ? 'La flamme est allumée 🔥'
    : streak.current >= 8
    ? 'Légendaire. Continue comme ça.'
    : streak.current >= 4
    ? 'Inarrêtable. 💥'
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
        <button
          className="btn btn--sm btn--icon"
          onClick={() => setShowSettings(true)}
          style={{ fontSize: '1rem' }}
        >
          ⚙️
        </button>
      </div>

      {/* Streak hero */}
      <div className="card card--yellow fade-up" style={{ marginBottom: '0.75rem', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative background number */}
        <div style={{
          position: 'absolute', right: '-0.25rem', top: '-0.75rem',
          fontSize: '8rem', fontWeight: 800, opacity: 0.08, lineHeight: 1,
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

      {/* Stat cards */}
      <div className="grid-2 fade-up" style={{ marginBottom: '0.75rem', animationDelay: '0.1s' }}>
        <div className="card">
          <div className="tag">Volume total</div>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1.1 }}>
            {formatVolume(vol)}
          </div>
          {bodyWeightRatio !== null && vol > 0 ? (
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '0.25rem' }}>
              {bodyWeightRatio}× ton poids
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>—</div>
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

      {/* Best set */}
      {bestSet && (
        <div className="card card--black fade-up" style={{ marginBottom: '0.75rem', animationDelay: '0.15s' }}>
          <div className="tag" style={{ color: 'var(--light-gray)' }}>Meilleure série all-time</div>
          <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.375rem', color: 'rgba(255,255,255,0.7)' }}>
            {bestSet.exercise}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.25rem' }}>
            {bestSet.weight} kg × {bestSet.reps}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="fade-up" style={{ animationDelay: '0.2s' }}>
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
