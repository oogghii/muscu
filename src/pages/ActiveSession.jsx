import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../context/StoreContext'
import Stepper from '../components/Stepper'
import ExercisePicker from '../components/ExercisePicker'
import EndSessionModal from '../components/EndSessionModal'
import { formatDuration, formatWeight } from '../lib/utils'

function ExerciseBlock({ exercise, onAddSet, onRemoveSet, onRemoveExercise, lastSets }) {
  const defaultWeight = exercise.sets.length > 0
    ? exercise.sets[exercise.sets.length - 1].weight
    : (lastSets?.length > 0 ? lastSets[lastSets.length - 1].weight : 60)
  const defaultReps = exercise.sets.length > 0
    ? exercise.sets[exercise.sets.length - 1].reps
    : (lastSets?.length > 0 ? lastSets[lastSets.length - 1].reps : 8)

  const [weight, setWeight] = useState(defaultWeight)
  const [reps, setReps] = useState(defaultReps)

  const handleLog = () => {
    onAddSet(exercise.name, { weight, reps })
    // Keep the same values for next set (most common workflow)
  }

  return (
    <div className="card" style={{ padding: '0.875rem' }}>
      {/* Header */}
      <div className="row--between" style={{ marginBottom: '0.625rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', flex: 1, marginRight: '0.5rem' }}>
          {exercise.name}
        </span>
        <span style={{ color: 'var(--gray)', fontSize: '0.8125rem', fontWeight: 600, marginRight: '0.5rem' }}>
          {exercise.sets.length} série{exercise.sets.length !== 1 ? 's' : ''}
        </span>
        <button
          className="btn btn--sm btn--icon"
          style={{ fontSize: '0.875rem', boxShadow: 'none' }}
          onClick={() => onRemoveExercise(exercise.name)}
        >
          ✕
        </button>
      </div>

      {/* Set chips */}
      {exercise.sets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem' }}>
          {exercise.sets.map((set, i) => (
            <span
              key={`${i}_${set.weight}_${set.reps}`}
              className="set-chip chip-in"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => onRemoveSet(exercise.name, i)}
              title="Appuyer pour supprimer"
            >
              {formatWeight(set.weight)}×{set.reps}
              <span style={{ fontSize: '0.6rem', color: 'var(--gray)' }}>✕</span>
            </span>
          ))}
        </div>
      )}

      {/* Set input */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div className="tag" style={{ marginBottom: '0.3rem' }}>kg</div>
          <Stepper value={weight} onChange={setWeight} step={2.5} min={0} isWeight />
        </div>
        <div style={{ flex: 1 }}>
          <div className="tag" style={{ marginBottom: '0.3rem' }}>Reps</div>
          <Stepper value={reps} onChange={setReps} step={1} min={1} />
        </div>
        <button
          className="btn btn--primary btn--lg"
          style={{ height: '48px', padding: '0 1.25rem', flexShrink: 0, alignSelf: 'flex-end' }}
          onClick={handleLog}
        >
          OK
        </button>
      </div>
    </div>
  )
}

export default function ActiveSession({ navigate }) {
  const {
    activeSession, sessions, settings,
    startSession, endSession,
    addExercise, logSet, removeSet, removeExercise,
    DEFAULT_EXERCISES,
  } = useStore()

  const [elapsed, setElapsed] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  // Timestamp captured the moment user taps "Terminer" — freezes the display
  const [sessionEndTime, setSessionEndTime] = useState(null)

  const getLastSets = useCallback((exerciseName) => {
    for (let i = sessions.length - 1; i >= 0; i--) {
      const ex = sessions[i].exercises.find(e => e.name === exerciseName)
      if (ex) return ex.sets
    }
    return []
  }, [sessions])

  // Timer — computed from startTime so it survives tab close / phone lock
  useEffect(() => {
    if (!activeSession) return
    const compute = () =>
      Math.round((Date.now() - new Date(activeSession.startTime)) / 1000)

    setElapsed(compute())
    const id = setInterval(() => setElapsed(compute()), 1000)

    // Refresh immediately when screen/tab becomes visible again
    const onVisible = () => { if (!document.hidden) setElapsed(compute()) }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [activeSession])

  // If no active session, show start prompt
  if (!activeSession) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>💪</div>
          <div style={{ fontWeight: 800, fontSize: '1.375rem', marginBottom: '0.5rem' }}>
            Aucune séance en cours
          </div>
          <div style={{ color: 'var(--gray)', fontWeight: 500 }}>
            Lance une séance depuis l'accueil
          </div>
        </div>
        <button
          className="btn btn--primary btn--lg"
          onClick={() => {
            startSession()
          }}
        >
          Démarrer maintenant
        </button>
      </div>
    )
  }

  const usedNames = activeSession.exercises.map(e => e.name)

  const handleEnd = () => {
    const endTime = new Date().toISOString()
    setSessionEndTime(endTime)
    setShowEndModal(true)
  }

  const handleCancelEnd = () => {
    setShowEndModal(false)
    setSessionEndTime(null)
  }

  const handleConfirmEnd = () => {
    endSession(sessionEndTime)
    setShowEndModal(false)
    setSessionEndTime(null)
    navigate('dashboard')
  }

  // Duration shown in the modal is frozen at the moment user tapped "Terminer"
  const frozenDurationSec = sessionEndTime
    ? Math.round((new Date(sessionEndTime) - new Date(activeSession.startTime)) / 1000)
    : elapsed

  const startedAt = new Date(activeSession.startTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="page" style={{ padding: '0.875rem', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      {/* Timer bar */}
      <div className="card card--black" style={{ marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="tag" style={{ color: 'var(--light-gray)' }}>Séance en cours · début {startedAt}</div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, marginTop: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(elapsed)}
            </div>
          </div>
          <div style={{ fontSize: '2rem' }}>⏱</div>
        </div>
      </div>

      {/* Exercises */}
      <div className="stack" style={{ marginBottom: '0.875rem' }}>
        {activeSession.exercises.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem', border: '2px dashed var(--black)', boxShadow: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏋️</div>
            <div style={{ fontWeight: 600, color: 'var(--gray)' }}>
              Ajoute ton premier exercice
            </div>
          </div>
        )}

        {activeSession.exercises.map((ex) => (
          <ExerciseBlock
            key={ex.name}
            exercise={ex}
            onAddSet={logSet}
            onRemoveSet={removeSet}
            onRemoveExercise={removeExercise}
            lastSets={getLastSets(ex.name)}
          />
        ))}
      </div>

      {/* Add exercise */}
      <button
        className="btn btn--full"
        style={{ marginBottom: '0.75rem', borderStyle: 'dashed' }}
        onClick={() => setShowPicker(true)}
      >
        + Ajouter un exercice
      </button>

      {/* End session */}
      <button
        className="btn btn--red btn--full btn--lg"
        onClick={handleEnd}
      >
        Terminer la séance
      </button>

      {/* Exercise picker */}
      {showPicker && (
        <ExercisePicker
          defaultList={DEFAULT_EXERCISES}
          usedNames={usedNames}
          onPick={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* End session modal */}
      {showEndModal && (
        <EndSessionModal
          activeSession={activeSession}
          durationSec={frozenDurationSec}
          onConfirm={handleConfirmEnd}
          onCancel={handleCancelEnd}
        />
      )}
    </div>
  )
}
