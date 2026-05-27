import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import {
  computeStreak,
  totalVolume,
  avgStartTime,
  mostFrequentDay,
  consistencyRate,
  weeklySummary,
  exerciseProgress,
  usedExercises,
} from '../lib/stats'
import { formatVolume } from '../lib/utils'
import ExerciseChart from '../components/ExerciseChart'

export default function Stats() {
  const { sessions, settings, DEFAULT_EXERCISES } = useStore()
  const [selectedExercise, setSelectedExercise] = useState(DEFAULT_EXERCISES[0])

  if (sessions.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '80dvh' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📊</div>
        <div style={{ fontWeight: 800, fontSize: '1.375rem', marginBottom: '0.5rem' }}>
          Aucune stat pour l'instant, Raphaël
        </div>
        <div style={{ color: 'var(--gray)', fontWeight: 500, maxWidth: '260px' }}>
          Complète ta première séance pour voir tes stats ici
        </div>
      </div>
    )
  }

  const streak = computeStreak(sessions, settings.weeklyGoal)
  const vol = totalVolume(sessions)
  const bodyRatio = settings.bodyWeight > 0 ? Math.round(vol / settings.bodyWeight) : null
  const avgTime = avgStartTime(sessions)
  const freqDay = mostFrequentDay(sessions)
  const rate = consistencyRate(sessions, settings.weeklyGoal)
  const summary = weeklySummary(sessions)
  const exerciseNames = [
    ...DEFAULT_EXERCISES.filter(n => usedExercises(sessions).includes(n)),
    ...usedExercises(sessions).filter(n => !DEFAULT_EXERCISES.includes(n)),
  ]
  const chartData = exerciseProgress(sessions, selectedExercise)
  const totalSessions = sessions.length

  const milestoneMsg = totalSessions < 10
    ? `${totalSessions} séances. T'es sur la bonne voie, Raphaël. 🚀`
    : totalSessions < 30
    ? `${totalSessions} séances. Ça commence à faire du bruit. 💥`
    : totalSessions < 50
    ? `${totalSessions} séances. Sérieux. Vraiment sérieux. 🔥`
    : totalSessions < 100
    ? `${totalSessions} séances. T'es une machine, Raphaël. 🤖`
    : `${totalSessions} séances. Légendaire. 🏆`

  return (
    <div className="page stats-page">
      <div style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.25rem' }}>
        Tes stats
      </div>

      <div className="stats-grid">
        {/* ── Streak ─── full width ── */}
        <div className="card card--yellow stats-span-full fade-up">
          <div className="tag">Streak de Raphaël</div>
          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '0.375rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div className="num-big" style={{ lineHeight: 1 }}>{streak.current}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                semaine{streak.current !== 1 ? 's' : ''} en cours
              </div>
            </div>
            <div style={{ paddingBottom: '2px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>{streak.best}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#555' }}>record all-time</div>
            </div>
            <div style={{ paddingBottom: '2px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>{totalSessions}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#555' }}>séances totales</div>
            </div>
          </div>
          <div className="divider" style={{ margin: '0.75rem 0' }} />
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Objectif : {settings.weeklyGoal} séances / semaine
          </div>
        </div>

        {/* ── Cette semaine ── */}
        <div className="card fade-up" style={{ animationDelay: '0.04s' }}>
          <div className="tag">Cette semaine</div>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{summary.count}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray)' }}>séances</div>
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, lineHeight: 1 }}>
                {formatVolume(summary.volume)}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray)' }}>volume</div>
            </div>
          </div>
          {summary.bestSet && (
            <div style={{ marginTop: '0.625rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>
                {summary.bestSet.weight}×{summary.bestSet.reps}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '2px' }}>
                meilleure série · {summary.bestSet.exercise}
              </div>
            </div>
          )}
        </div>

        {/* ── Volume all-time ── */}
        <div className="card card--black fade-up" style={{ animationDelay: '0.08s' }}>
          <div className="tag" style={{ color: 'rgba(255,255,255,0.5)' }}>Volume all-time</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.375rem' }}>
            {formatVolume(vol)}
          </div>
          {bodyRatio !== null && bodyRatio > 0 && (
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
              = {bodyRatio}× ton poids ({settings.bodyWeight} kg)
            </div>
          )}
        </div>

        {/* ── Habits ── */}
        <div className="card fade-up" style={{ animationDelay: '0.12s' }}>
          <div className="tag">Tu t'entraînes</div>
          {avgTime && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{avgTime}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, marginTop: '2px' }}>heure moyenne</div>
            </div>
          )}
          {freqDay && (
            <div style={{ marginTop: '0.625rem' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'capitalize' }}>{freqDay}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, marginTop: '2px' }}>jour favori</div>
            </div>
          )}
          {!avgTime && !freqDay && (
            <div style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.5rem' }}>—</div>
          )}
        </div>

        {/* ── Consistency ── */}
        {rate !== null && (
          <div className="card card--lime fade-up stats-span-full" style={{ animationDelay: '0.16s' }}>
            <div className="tag">Régularité de Raphaël</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', margin: '0.375rem 0 0.625rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{rate}%</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', paddingBottom: '5px' }}>
                des semaines atteignent l'objectif
              </span>
            </div>
            <div className="progress-track" style={{ marginBottom: '0.625rem' }}>
              <div className="progress-fill" style={{ width: `${rate}%`, background: 'var(--black)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              {rate >= 80 ? '🔥 Excellent rythme, continue !'
               : rate >= 60 ? '💪 Bonne progression, Raphaël'
               : rate >= 40 ? '📈 Ça monte. Continue.'
               : 'Chaque séance compte. Garde le cap.'}
            </div>
          </div>
        )}

        {/* ── Exercise progression ── full width ── */}
        <div className="card fade-up stats-span-full" style={{ animationDelay: '0.2s' }}>
          <div className="section-header">
            <span className="section-title">Progression</span>
            {chartData.length > 0 && (
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)' }}>
                max {Math.max(...chartData.map(d => d.maxWeight))} kg
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '4px' }}>
              {(exerciseNames.length > 0 ? exerciseNames : DEFAULT_EXERCISES).map(name => (
                <button
                  key={name}
                  className={`btn btn--sm${selectedExercise === name ? ' btn--black' : ''}`}
                  style={{ flexShrink: 0, fontSize: '0.8125rem' }}
                  onClick={() => setSelectedExercise(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <ExerciseChart data={chartData} />
        </div>

        {/* ── Milestone message ── full width ── */}
        <div
          className="card stats-span-full fade-up"
          style={{ background: 'var(--bg)', boxShadow: 'none', borderStyle: 'dashed', animationDelay: '0.24s' }}
        >
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, textAlign: 'center', color: 'var(--gray)' }}>
            {milestoneMsg}
          </div>
        </div>
      </div>
    </div>
  )
}
