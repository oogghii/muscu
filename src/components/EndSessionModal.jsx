import { useMemo } from 'react'
import { formatDuration, PERF_LABELS } from '../lib/utils'

const MESSAGES = [
  { text: "Bravo Raphaël ! Bonne séance, je suis fier de toi !", icon: "🔥" },
  { text: "C'est fait. Bien joué, Raphaël.", icon: "✅" },
  { text: "Séance validée. T'as assuré.", icon: "💪" },
  { text: "Respect, Raphaël. À la prochaine.", icon: "🤙" },
  { text: "Une de plus. Ça compte.", icon: "⬆️" },
  { text: "Propre. Raphaël delivered.", icon: "🎯" },
]

export default function EndSessionModal({ activeSession, durationSec, onConfirm, onCancel }) {
  const msg = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], [])

  if (!activeSession) return null

  const { emoji, perf, energie, humeur, corps } = activeSession
  const tags = [...(humeur || []), ...(corps || [])].slice(0, 4)

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

        {/* Summary row */}
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: tags.length ? '0.625rem' : '1.25rem' }}>
          <div className="card" style={{ flex: 1, textAlign: 'center' }}>
            <div className="tag">Durée</div>
            <div className="num-mid" style={{ marginTop: '0.25rem' }}>
              {formatDuration(durationSec)}
            </div>
          </div>
          {emoji && (
            <div className="card" style={{ flex: 1, textAlign: 'center' }}>
              <div className="tag">Vibe</div>
              <div style={{ fontSize: '2rem', marginTop: '0.125rem', lineHeight: 1.3 }}>
                {emoji}
              </div>
            </div>
          )}
          {perf != null && (
            <div className="card" style={{ flex: 1, textAlign: 'center' }}>
              <div className="tag">Perf</div>
              <div className="num-mid" style={{ marginTop: '0.25rem' }}>
                {perf}<span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray)' }}>/5</span>
              </div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--gray)', marginTop: '2px' }}>
                {PERF_LABELS[perf]}
              </div>
            </div>
          )}
          {energie != null && (
            <div className="card" style={{ flex: 1, textAlign: 'center' }}>
              <div className="tag">Énergie</div>
              <div className="num-mid" style={{ marginTop: '0.25rem' }}>
                {energie}<span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray)' }}>/5</span>
              </div>
            </div>
          )}
        </div>

        {/* Tags summary */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  padding: '0.25rem 0.625rem',
                  border: '2px solid var(--black)',
                  background: 'var(--black)',
                  color: 'var(--bg)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

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
