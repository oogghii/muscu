import { useState } from 'react'
import EmojiPicker from './EmojiPicker'
import { PERF_LABELS } from '../lib/utils'

const HUMEUR_TAGS = [
  'Motivé', 'Confiant', 'En mode', 'Euphorique', 'Heureux', 'Calme',
  'Neutre', 'Irritable', 'Agressif', 'Stressé', 'Anxieux', 'Fatigué', 'Mou', 'Triste',
]

const CORPS_TAGS = [
  'En forme', 'Récupéré', 'Léger', 'Bien réveillé',
  'Courbatures', 'Lourd', 'Tendu', 'Raide', 'Douleur', 'Épuisé',
]

const ENERGIE_LABELS  = ['', 'À plat ⬛', 'Peu 🔋', 'Correct ⚡', 'Bon ⚡⚡', 'Plein gaz 🔋🔥']
const SOMMEIL_LABELS  = ['', 'Horrible 💀', 'Mauvais 😩', 'Passable 😐', 'Bien 😊', 'Parfait 🌙']

function TagChips({ tags, selected = [], onChange }) {
  const toggle = tag =>
    onChange(selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag])

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
      {tags.map(tag => {
        const on = selected.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            style={{
              padding: '0.375rem 0.75rem',
              border: '2px solid var(--black)',
              background: on ? 'var(--black)' : 'transparent',
              color: on ? 'var(--bg)' : 'var(--black)',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'background 0.08s, color 0.08s',
              lineHeight: 1.4,
            }}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}

function RatingRow({ value, onChange, labels }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {[1, 2, 3, 4, 5].map(n => {
          const sel = value === n
          return (
            <button
              key={n}
              onClick={() => onChange(sel ? null : n)}
              style={{
                flex: 1,
                padding: '0.625rem 0',
                border: sel ? '2.5px solid var(--black)' : '2px solid var(--black)',
                background: sel ? 'var(--lime)' : 'transparent',
                boxShadow: sel ? 'var(--shadow-sm)' : 'none',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'background 0.08s, box-shadow 0.08s',
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
      {value != null && (
        <div style={{ marginTop: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--gray)', textAlign: 'center' }}>
          {labels[value]}
        </div>
      )}
    </div>
  )
}

export default function SessionForm({ values, onChange }) {
  const [showPicker, setShowPicker] = useState(false)
  const set = (field, val) => onChange({ [field]: val })

  return (
    <div className="stack">
      {/* ── Emoji ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.75rem' }}>Emoji du jour</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            onClick={() => setShowPicker(true)}
            style={{
              width: '64px', height: '64px',
              border: '2px solid var(--black)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', lineHeight: 1, flexShrink: 0,
              cursor: 'pointer',
              background: values.emoji ? 'var(--yellow)' : 'transparent',
              boxShadow: values.emoji ? 'var(--shadow-sm)' : 'none',
              transition: 'background 0.1s',
            }}
          >
            {values.emoji || <span style={{ fontSize: '1.5rem', color: 'var(--light-gray)' }}>+</span>}
          </div>
          <button className="btn btn--primary" onClick={() => setShowPicker(true)}>
            {values.emoji ? 'Changer' : 'Choisir un emoji'}
          </button>
        </div>
      </div>

      {/* ── Humeur ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.625rem' }}>Humeur</div>
        <TagChips
          tags={HUMEUR_TAGS}
          selected={values.humeur || []}
          onChange={v => set('humeur', v)}
        />
      </div>

      {/* ── Corps ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.625rem' }}>Comment tu te sens physiquement ?</div>
        <TagChips
          tags={CORPS_TAGS}
          selected={values.corps || []}
          onChange={v => set('corps', v)}
        />
      </div>

      {/* ── Énergie ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.625rem' }}>Énergie</div>
        <RatingRow
          value={values.energie}
          onChange={v => set('energie', v)}
          labels={ENERGIE_LABELS}
        />
      </div>

      {/* ── Perf ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.625rem' }}>Performance</div>
        <RatingRow
          value={values.perf}
          onChange={v => set('perf', v)}
          labels={PERF_LABELS}
        />
      </div>

      {/* ── Sommeil ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.625rem' }}>Sommeil (nuit dernière)</div>
        <RatingRow
          value={values.sommeil}
          onChange={v => set('sommeil', v)}
          labels={SOMMEIL_LABELS}
        />
      </div>

      {/* ── Note ── */}
      <div className="card">
        <div className="tag" style={{ marginBottom: '0.5rem' }}>Note libre (optionnel)</div>
        <textarea
          value={values.note || ''}
          onChange={e => set('note', e.target.value)}
          placeholder="Ressenti, contexte, PR, douleur..."
          style={{
            width: '100%',
            minHeight: '72px',
            border: '2px solid var(--black)',
            padding: '0.625rem',
            fontFamily: 'var(--font)',
            fontSize: '0.9375rem',
            fontWeight: 500,
            background: 'transparent',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {showPicker && (
        <EmojiPicker
          selected={values.emoji}
          onSelect={emoji => set('emoji', emoji)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
