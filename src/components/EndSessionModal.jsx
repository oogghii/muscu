import { useMemo } from 'react'
import { formatDuration, formatVolume, totalSets, sessionVolume } from '../lib/utils'

const MESSAGES = [
  { text: "Bravo Raphaël ! Bonne séance, je suis fier de toi !", icon: "🔥" },
  { text: "C'est fait. Bien joué, Raphaël.", icon: "✅" },
  { text: "Séance validée. T'as assuré ce soir.", icon: "💪" },
  { text: "Respect, Raphaël. À la prochaine.", icon: "🤙" },
  { text: "Une de plus. Ça compte.", icon: "⬆️" },
  { text: "Propre. Raphaël delivered.", icon: "🎯" },
]

export default function EndSessionModal({ activeSession, durationSec, onConfirm, onCancel }) {
  const msg = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], [])

  if (!activeSession) return null

  const exCount = activeSession.exercises.length
  const setCount = totalSets(activeSession)
  const volume = sessionVolume(activeSession)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Message */}
        <div className="card card--lime pop" style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{msg.icon}</div>
          <div style={{ fontSize: '1.0625rem', fontWeight: 700, lineHeight: 1.3 }}>
            {msg.text}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="tag">Durée</div>
            <div className="num-mid" style={{ marginTop: '0.25rem' }}>
              {formatDuration(durationSec)}
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="tag">Exercices</div>
            <div className="num-mid" style={{ marginTop: '0.25rem' }}>
              {exCount}
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="tag">Séries</div>
            <div className="num-mid" style={{ marginTop: '0.25rem' }}>
              {setCount}
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="tag">Volume</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
              {formatVolume(volume)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="stack">
          <button className="btn btn--black btn--full btn--lg" onClick={onConfirm}>
            Enregistrer la séance
          </button>
          <button className="btn btn--full" onClick={onCancel}>
            Continuer la séance
          </button>
        </div>
      </div>
    </div>
  )
}
