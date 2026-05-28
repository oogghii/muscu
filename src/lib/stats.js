// ── Date helpers ─────────────────────────────────────────────────────────────

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
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

  let current = 0
  if ((byWeek[currentKey] || []).length >= weeklyGoal) current = 1

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

// ── Sessions count during current streak ─────────────────────────────────────

export function streakSessionCount(sessions, streakWeeks) {
  if (!streakWeeks) return 0
  const start = getMondayOf(new Date())
  start.setDate(start.getDate() - (streakWeeks - 1) * 7)
  return sessions.filter(s => new Date(s.startTime) >= start).length
}

// ── Week sessions ─────────────────────────────────────────────────────────────

export function getWeekSessions(sessions) {
  const k = weekKey(new Date())
  return groupByWeek(sessions)[k]?.length ?? 0
}

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
  const rated = ws.filter(s => s.perf != null)
  const avgPerf = rated.length
    ? Math.round((rated.reduce((sum, s) => sum + s.perf, 0) / rated.length) * 10) / 10
    : null
  return { count: ws.length, avgPerf }
}

// ── Average of a numeric field ────────────────────────────────────────────────

export function avgField(sessions, field) {
  const valued = sessions.filter(s => s[field] != null)
  if (!valued.length) return null
  return Math.round((valued.reduce((sum, s) => sum + s[field], 0) / valued.length) * 10) / 10
}

// ── Emoji distribution ────────────────────────────────────────────────────────

export function emojiDistribution(sessions) {
  const dist = {}
  sessions.forEach(s => {
    if (s.emoji) dist[s.emoji] = (dist[s.emoji] || 0) + 1
  })
  return dist
}

// ── Humeur tags distribution ──────────────────────────────────────────────────

export function humeurDistribution(sessions) {
  const dist = {}
  sessions.forEach(s => {
    ;(s.humeur || []).forEach(tag => {
      dist[tag] = (dist[tag] || 0) + 1
    })
  })
  return dist
}

// ── Corps tags distribution ───────────────────────────────────────────────────

export function corpsDistribution(sessions) {
  const dist = {}
  sessions.forEach(s => {
    ;(s.corps || []).forEach(tag => {
      dist[tag] = (dist[tag] || 0) + 1
    })
  })
  return dist
}

// ── Perf trend (last N sessions with a perf rating) ───────────────────────────

export function perfTrend(sessions, n = 10) {
  return sessions
    .filter(s => s.perf != null)
    .slice(-n)
    .map(s => ({
      date: new Date(s.startTime).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      perf: s.perf,
      emoji: s.emoji || null,
    }))
}

// ── Year heatmap data ─────────────────────────────────────────────────────────

export function yearHeatmap(sessions, year) {
  const map = {}
  sessions.forEach(s => {
    if (new Date(s.startTime).getFullYear() !== year) return
    const dk = s.startTime.slice(0, 10)
    const existing = map[dk]
    // Keep highest perf for that day
    if (!existing || (s.perf != null && (existing.perf == null || s.perf > existing.perf))) {
      map[dk] = { perf: s.perf ?? null, emoji: s.emoji ?? null }
    }
  })
  return map
}

// ── Perf trend direction (recent N vs previous N) ─────────────────────────────

export function perfTrendDir(sessions) {
  const rated = sessions.filter(s => s.perf != null)
  if (rated.length < 6) return null

  const n = Math.min(5, Math.floor(rated.length / 2))
  const recent   = rated.slice(-n)
  const previous = rated.slice(-(n * 2), -n)
  if (!previous.length) return null

  const recentAvg   = recent.reduce((s, x) => s + x.perf, 0) / recent.length
  const previousAvg = previous.reduce((s, x) => s + x.perf, 0) / previous.length
  const diff = Math.round((recentAvg - previousAvg) * 10) / 10

  return {
    recentAvg:   Math.round(recentAvg   * 10) / 10,
    previousAvg: Math.round(previousAvg * 10) / 10,
    diff,
    n,
  }
}

// ── Day-of-week performance ───────────────────────────────────────────────────

const DOW_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function dayOfWeekPerf(sessions) {
  const buckets = Array(7).fill(null).map(() => ({ count: 0, perfSum: 0, perfCount: 0 }))
  sessions.forEach(s => {
    const day = new Date(s.startTime).getDay()
    buckets[day].count++
    if (s.perf != null) {
      buckets[day].perfSum  += s.perf
      buckets[day].perfCount++
    }
  })
  return DOW_FR.map((name, i) => ({
    name,
    count:   buckets[i].count,
    avgPerf: buckets[i].perfCount
      ? Math.round(buckets[i].perfSum / buckets[i].perfCount * 10) / 10
      : null,
  })).filter(d => d.count > 0)
}

// ── Field correlation (e.g. sommeil ≥ 4 → better perf?) ──────────────────────

export function fieldCorrelation(sessions, trigger, target) {
  const high = sessions.filter(s => s[trigger] != null && s[trigger] >= 4 && s[target] != null)
  const low  = sessions.filter(s => s[trigger] != null && s[trigger] <  4 && s[target] != null)
  if (high.length < 2 && low.length < 2) return null
  const avgHigh = high.length ? Math.round(high.reduce((a, s) => a + s[target], 0) / high.length * 10) / 10 : null
  const avgLow  = low.length  ? Math.round(low .reduce((a, s) => a + s[target], 0) / low.length  * 10) / 10 : null
  return { avgHigh, avgLow, highCount: high.length, lowCount: low.length }
}

// ── Humeur → avg perf correlation ─────────────────────────────────────────────

export function humeurPerfCorr(sessions) {
  const data = {}
  sessions.forEach(s => {
    if (s.perf == null) return
    ;(s.humeur || []).forEach(tag => {
      if (!data[tag]) data[tag] = { sum: 0, count: 0 }
      data[tag].sum   += s.perf
      data[tag].count++
    })
  })
  return Object.entries(data)
    .map(([tag, { sum, count }]) => ({
      tag,
      avg: Math.round(sum / count * 10) / 10,
      count,
    }))
    .filter(x => x.count >= 2)
    .sort((a, b) => b.avg - a.avg)
}

// ── Best month ────────────────────────────────────────────────────────────────

export function bestMonth(sessions) {
  if (!sessions.length) return null
  const counts = {}
  sessions.forEach(s => {
    const key = s.startTime.slice(0, 7)
    counts[key] = (counts[key] || 0) + 1
  })
  const [key, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const d = new Date(key + '-01')
  return {
    count,
    label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  }
}
