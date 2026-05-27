import { useState } from 'react'

export default function ExercisePicker({ defaultList, usedNames, onPick, onClose }) {
  const [search, setSearch] = useState('')

  const available = defaultList.filter(n => !usedNames.includes(n))
  const custom = search.trim() &&
    !defaultList.some(n => n.toLowerCase() === search.trim().toLowerCase()) &&
    !usedNames.some(n => n.toLowerCase() === search.trim().toLowerCase())
      ? [search.trim()]
      : []

  const filtered = [...custom, ...available].filter(n =>
    n.toLowerCase().includes(search.toLowerCase())
  )

  // Also show used ones (greyed out) so user knows they're already added
  const alreadyAdded = defaultList.filter(n =>
    usedNames.includes(n) && n.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="row--between" style={{ marginBottom: '1rem' }}>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem' }}>Ajouter un exercice</span>
          <button className="btn btn--sm btn--icon" onClick={onClose}>✕</button>
        </div>

        <input
          className="input"
          placeholder="Rechercher ou créer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: '0.75rem' }}
        />

        <div className="stack" style={{ maxHeight: '60dvh', overflowY: 'auto' }}>
          {custom.length > 0 && (
            <button
              className="btn btn--lime btn--full"
              onClick={() => { onPick(custom[0]); onClose() }}
            >
              + Créer "{custom[0]}"
            </button>
          )}

          {filtered.filter(n => !custom.includes(n)).map(name => (
            <button
              key={name}
              className="btn btn--full"
              style={{ justifyContent: 'flex-start', fontWeight: 600 }}
              onClick={() => { onPick(name); onClose() }}
            >
              {name}
            </button>
          ))}

          {alreadyAdded.map(name => (
            <div
              key={name}
              style={{
                padding: '0.625rem 1.25rem',
                border: '2px solid var(--light-gray)',
                color: 'var(--gray)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {name}
              <span style={{ fontSize: '0.75rem' }}>Déjà ajouté</span>
            </div>
          ))}

          {filtered.length === 0 && !custom.length && (
            <div className="empty-state">
              <div className="empty-state__text">Aucun résultat. Tapez pour créer.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
