import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext'
import { formatDuration } from '../lib/utils'
import SessionForm from '../components/SessionForm'
import EndSessionModal from '../components/EndSessionModal'

export default function ActiveSession({ navigate }) {
  const { activeSession, startSession, endSession, updateActiveSession } = useStore()

  const [elapsed, setElapsed] = useState(0)
  const [showEndModal, setShowEndModal] = useState(false)
  const [sessionEndTime, setSessionEndTime] = useState(null)

  useEffect(() => {
    if (!activeSession) return
    const compute = () => Math.round((Date.now() - new Date(activeSession.startTime)) / 1000)
    setElapsed(compute())
    const id = setInterval(() => setElapsed(compute()), 1000)
    const onVisible = () => { if (!document.hidden) setElapsed(compute()) }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [activeSession])

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
        <button className="btn btn--primary btn--lg" onClick={() => startSession()}>
          Démarrer maintenant
        </button>
      </div>
    )
  }

  const startedAt = new Date(activeSession.startTime).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  const frozenDurationSec = sessionEndTime
    ? Math.round((new Date(sessionEndTime) - new Date(activeSession.startTime)) / 1000)
    : elapsed

  const handleEnd = () => {
    setSessionEndTime(new Date().toISOString())
    setShowEndModal(true)
  }

  const handleConfirmEnd = () => {
    endSession(sessionEndTime)
    setShowEndModal(false)
    setSessionEndTime(null)
    navigate('dashboard')
  }

  const handleCancelEnd = () => {
    setShowEndModal(false)
    setSessionEndTime(null)
  }

  const formValues = {
    emoji:   activeSession.emoji,
    humeur:  activeSession.humeur,
    corps:   activeSession.corps,
    energie: activeSession.energie,
    sommeil: activeSession.sommeil,
    perf:    activeSession.perf,
    note:    activeSession.note,
  }

  return (
    <div className="page" style={{ padding: '0.875rem', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
      {/* Timer bar */}
      <div className="card card--black" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="tag" style={{ color: 'var(--light-gray)' }}>
              Séance en cours · début {startedAt}
            </div>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, marginTop: '0.25rem', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(elapsed)}
            </div>
          </div>
          <div style={{ fontSize: '2rem' }}>⏱</div>
        </div>
      </div>

      <SessionForm
        values={formValues}
        onChange={updateActiveSession}
      />

      <div style={{ marginTop: '1rem' }}>
        <button className="btn btn--red btn--full btn--lg" onClick={handleEnd}>
          Terminer la séance
        </button>
      </div>

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
