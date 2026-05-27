// ── Date helpers ─────────────────────────────────────────────────────────────

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekKey(date) {
  return getMondayOf(new Date(date)).toISOString().slice(0, 10)
}

function groupByWeek(sessions) {
  const map = {}
  sessions.forEach(s => {
    const k = weekKey(s.startTime)
    ;(map[k] = map[k] || []).push(s)
  })
  return map
}

// ── Streak ────────────────────────────────────────────────────────────────────

export function computeStreak(sessions, weeklyGoal = 4) {
  if (!sessions.length) return { current: 0, best: 0 }

  const byWeek = groupByWeek(sessions)
  const currentKey = weekKey(new Date())

  // ── current streak ──
  let current = 0
  // First: if current week is already at goal, count it
  if ((byWeek[currentKey] || []).length >= weeklyGoal) current = 1

  // Then walk backwards from previous weeks
  let d = getMondayOf(new Date())
  d.setDate(d.getDate() - 7)
  while (true) {
    const k = weekKey(d)
    if ((byWeek[k] || []).length >= weeklyGoal) {
      current++
      d.setDate(d.getDate() - 7)
    } else {
      break
    }
  }

  // ── all-time best ──
  const keys = Object.keys(byWeek).sort()
  if (!keys.length) return { current, best: current }

  let best = current
  let streak = 0
  const start = getMondayOf(new Date(keys[0]))
  const now = getMondayOf(new Date())
  const cursor = new Date(start)

  while (cursor <= now) {
    const k = weekKey(cursor)
    const count = (byWeek[k] || []).length
    if (count >= weeklyGoal) {
      streak++
      if (streak > best) best = streak
    } else if (k !== currentKey) {
      streak = 0
    }
    cursor.setDate(cursor.getDate() + 7)
  }

  return { current, best }
}

// ── Week sessions ─────────────────────────────────────────────────────────────

export function getWeekSessions(sessions) {
  const k = weekKey(new Date())
  return groupByWeek(sessions)[k]?.length ?? 0
}

/** Returns array of JS day numbers (0=Sun…6=Sat) for sessions this week */
export function getWeekTrainedDays(sessions) {
  const start = getMondayOf(new Date())
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return sessions
    .filter(s => {
      const d = new Date(s.startTime)
      return d >= start && d < end
    })
    .map(s => new Date(s.startTime).getDay())
}

// ── Volume ────────────────────────────────────────────────────────────────────

export function totalVolume(sessions) {
  return sessions.reduce((sum, s) =>
    sum + s.exercises.reduce((es, ex) =>
      es + ex.sets.reduce((ss, set) => ss + (set.weight || 0) * (set.reps || 0), 0)
    , 0)
  , 0)
}

// ── Average start time ────────────────────────────────────────────────────────

export function avgStartTime(sessions) {
  if (!sessions.length) return null
  const mins = sessions.map(s => {
    const d = new Date(s.startTime)
    return d.getHours() * 60 + d.getMinutes()
  })
  const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
  return `${Math.floor(avg / 60)}h${String(avg % 60).padStart(2, '0')}`
}

// ── Most frequent day ─────────────────────────────────────────────────────────

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

export function mostFrequentDay(sessions) {
  if (!sessions.length) return null
  const counts = Array(7).fill(0)
  sessions.forEach(s => counts[new Date(s.startTime).getDay()]++)
  return DAYS_FR[counts.indexOf(Math.max(...counts))]
}

// ── Exercise progression ──────────────────────────────────────────────────────

export function exerciseProgress(sessions, name) {
  return sessions
    .filter(s => s.exercises.some(e => e.name === name))
    .slice(-8)
    .map(s => {
      const ex = s.exercises.find(e => e.name === name)
      const weights = ex.sets.map(set => set.weight || 0)
      const maxW = weights.length ? Math.max(...weights) : 0
      const d = new Date(s.startTime)
      return {
        date: d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        maxWeight: maxW,
      }
    })
}

// ── Consistency rate ──────────────────────────────────────────────────────────

export function consistencyRate(sessions, weeklyGoal = 4) {
  const byWeek = groupByWeek(sessions)
  const currentKey = weekKey(new Date())
  const past = Object.keys(byWeek).filter(k => k !== currentKey)
  if (!past.length) return null
  const hits = past.filter(k => byWeek[k].length >= weeklyGoal)
  return Math.round((hits.length / past.length) * 100)
}

// ── Weekly summary ────────────────────────────────────────────────────────────

export function weeklySummary(sessions) {
  const start = getMondayOf(new Date())
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const ws = sessions.filter(s => {
    const d = new Date(s.startTime)
    return d >= start && d < end
  })

  const vol = totalVolume(ws)
  let bestSet = null

  ws.forEach(s =>
    s.exercises.forEach(ex =>
      ex.sets.forEach(set => {
        const score = (set.weight || 0) * (set.reps || 0)
        if (!bestSet || score > bestSet.weight * bestSet.reps) {
          bestSet = { ...set, exercise: ex.name }
        }
      })
    )
  )

  return { count: ws.length, volume: vol, bestSet }
}

// ── All-time best set ─────────────────────────────────────────────────────────

export function allTimeBestSet(sessions) {
  let best = null
  sessions.forEach(s =>
    s.exercises.forEach(ex =>
      ex.sets.forEach(set => {
        if (!best || set.weight > best.weight) {
          best = { ...set, exercise: ex.name }
        }
      })
    )
  )
  return best
}

// ── Unique exercises in sessions ──────────────────────────────────────────────

export function usedExercises(sessions) {
  const names = new Set()
  sessions.forEach(s => s.exercises.forEach(e => names.add(e.name)))
  return Array.from(names)
}
