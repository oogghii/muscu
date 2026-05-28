import { useState } from 'react'

const EMOJIS = [
  // Énergie / Hype
  '🔥', '⚡', '💥', '🚀', '💫', '✨', '💯', '🏆',
  // Sport / Force
  '💪', '🦾', '🥇', '🎯', '👑', '🏅', '🎉', '💨',
  // Humeur positive
  '🤩', '😎', '😊', '😁', '🥳', '😄', '😍', '🫶',
  // Chill
  '😏', '😌', '🤙', '🙌', '😜', '🤗', '😋', '🥰',
  // Neutre
  '😐', '😑', '🫤', '🫠', '😒', '🤷', '😶', '😬',
  // Fatigué
  '😴', '💀', '😩', '😫', '😪', '🥵', '😰', '😵',
  // Galère
  '🤯', '😤', '😠', '🤢', '😞', '😔', '🥺', '😭',
  // Corps / santé
  '🦵', '💦', '🩹', '🤕', '🧠', '💊', '🫀', '🏋️',
  // Vibes
  '❤️', '🖤', '💚', '💛', '🌙', '☀️', '🌈', '🍀',
]

export default function EmojiPicker({ selected, onSelect, onClose }) {
  const [custom, setCustom] = useState('')

  const handleCustomSubmit = () => {
    const val = custom.trim()
    if (val) { onSelect(val); onClose() }
  }

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 300 }}
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="row--between" style={{ marginBottom: '0.875rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Choisir un emoji</span>
          <button className="btn btn--sm btn--icon" onClick={onClose}>✕</button>
        </div>

        {/* Custom input */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="Ou colle n'importe quel emoji…"
            style={{
              flex: 1,
              border: '2px solid var(--black)',
              padding: '0.5rem 0.75rem',
              fontFamily: 'var(--font)',
              fontSize: '1.125rem',
              background: 'transparent',
              outline: 'none',
            }}
          />
          {custom.trim() && (
            <button className="btn btn--primary btn--sm" onClick={handleCustomSubmit}>
              OK
            </button>
          )}
        </div>

        {/* Emoji grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
          {EMOJIS.map((emoji, i) => {
            const isSelected = selected === emoji
            return (
              <button
                key={i}
                onClick={() => { onSelect(emoji); onClose() }}
                style={{
                  fontSize: '1.5rem',
                  padding: '0.5rem 0.25rem',
                  background: isSelected ? 'var(--yellow)' : 'transparent',
                  border: isSelected ? '2px solid var(--black)' : '2px solid transparent',
                  cursor: 'pointer',
                  lineHeight: 1,
                  fontFamily: 'var(--font)',
                  transition: 'background 0.08s',
                }}
              >
                {emoji}
              </button>
            )
          })}
        </div>

        {/* Clear */}
        {selected && (
          <button
            className="btn btn--sm btn--full"
            style={{ marginTop: '0.75rem', color: 'var(--gray)', borderColor: 'var(--gray)' }}
            onClick={() => { onSelect(null); onClose() }}
          >
            Retirer l'emoji
          </button>
        )}
      </div>
    </div>
  )
}
