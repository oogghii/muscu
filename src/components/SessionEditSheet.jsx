import { useState } from 'react'
import SessionForm from './SessionForm'
import { formatDuration } from '../lib/utils'

export default function SessionEditSheet({ session, onSave, onClose }) {
  const [values, setValues] = useState({
    emoji:   session.emoji   ?? null,
    humeur:  session.humeur  ?? [],
    corps:   session.corps   ?? [],
    energie: session.energie ?? null,
    sommeil: session.sommeil ?? null,
    perf:    session.perf    ?? null,
    note:    session.note    ?? '',
  })

  const start = new Date(session.startTime)
  const durationSec = session.endTime
    ? Math.round((new Date(session.endTime) - start) / 1000)
    : null

  const dateLabel = start.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const timeLabel = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="row--between" style={{ marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Modifier la séance</span>
          <button className="btn btn--sm btn--icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)', marginBottom: '1rem', textTransform: 'capitalize' }}>
          {dateLabel} · {timeLabel}{durationSec ? ` · ${formatDuration(durationSec)}` : ''}
        </div>

        <SessionForm
          values={values}
          onChange={updates => setValues(prev => ({ ...prev, ...updates }))}
        />

        <div style={{ marginTop: '1rem' }}>
          <button
            className="btn btn--black btn--full btn--lg"
            onClick={() => { onSave(values); onClose() }}
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  )
}
