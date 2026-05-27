export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  if (m > 0) return `${m}min${String(s).padStart(2, '0')}`
  return `${s}s`
}

export function formatWeight(kg) {
  if (kg === 0) return '0'
  const n = parseFloat(kg.toFixed(2))
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

export function formatVolume(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')} t`
  return `${Math.round(kg).toLocaleString('fr-FR')} kg`
}

export function sessionVolume(session) {
  return session.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0)
  , 0)
}

export function totalSets(session) {
  return session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
}
