import { useStore } from '../context/StoreContext'
import {
  computeStreak,
  avgStartTime,
  mostFrequentDay,
  consistencyRate,
  weeklySummary,
  avgField,
  emojiDistribution,
  humeurDistribution,
  corpsDistribution,
  perfTrend,
  yearHeatmap,
  perfTrendDir,
  dayOfWeekPerf,
  fieldCorrelation,
  humeurPerfCorr,
  bestMonth,
} from '../lib/stats'

// ── Year heatmap component ────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const CELL = 11
const GAP  = 2

function YearHeatmap({ data, year }) {
  const jan1  = new Date(year, 0, 1)
  const start = new Date(jan1)
  const dow   = start.getDay()
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))

  const dec31 = new Date(year, 11, 31)
  const end   = new Date(dec31)
  const edow  = end.getDay()
  if (edow !== 0) end.setDate(end.getDate() + (7 - edow))

  const todayKey = new Date().toISOString().slice(0, 10)
  const weeks    = []
  const cursor   = new Date(start)

  while (cursor <= end) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const dk     = cursor.toISOString().slice(0, 10)
      const inYear = cursor.getFullYear() === year
      days.push({ dk, inYear, cell: inYear ? (data[dk] || null) : null, isToday: dk === todayKey })
      cursor.setDate(cursor.getDate() + 1)
    }
    const firstOfMonth = days.find(d => d.inYear && new Date(d.dk).getDate() === 1)
    weeks.push({ days, monthLabel: firstOfMonth ? MONTHS_SHORT[new Date(firstOfMonth.dk).getMonth()] : null })
  }

  const getBg = ({ inYear, cell, isToday }) => {
    if (!inYear) return 'transparent'
    if (!cell)   return isToday ? '#ebedf0' : '#ebedf0'
    const { perf } = cell
    if (perf === 5) return '#216e39'
    if (perf >= 4)  return '#30a14e'
    if (perf >= 3)  return '#40c463'
    return '#9be9a8'
  }

  const getOutline = ({ inYear, isToday }) => {
    if (!inYear)  return 'none'
    if (isToday)  return '2px solid var(--black)'
    return 'none'
  }

  const trainedCount = Object.keys(data).filter(dk =>
    new Date(dk).getFullYear() === year
  ).length

  return (
    <div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
        <div style={{ display: 'flex', gap: `${GAP}px`, minWidth: 'max-content' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
              {/* Month label */}
              <div style={{
                height: '13px', fontSize: '0.5625rem', fontWeight: 800, lineHeight: '13px',
                color: week.monthLabel ? 'var(--black)' : 'transparent', whiteSpace: 'nowrap',
              }}>
                {week.monthLabel || '.'}
              </div>
              {/* Day cells */}
              {week.days.map((d, di) => (
                <div
                  key={di}
                  title={d.inYear
                    ? `${d.dk}${d.cell?.perf != null ? ` · Perf ${d.cell.perf}/5` : d.cell ? ' · ✓' : ''}`
                    : ''}
                  style={{
                    width: CELL, height: CELL,
                    background: getBg(d),
                    border: '1px solid rgba(0,0,0,0.12)',
                    outline: getOutline(d),
                    outlineOffset: '-1px',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.625rem', flexWrap: 'wrap' }}>
        {[
          { bg: '#ebedf0', label: 'Repos' },
          { bg: '#9be9a8', label: 'Séance' },
          { bg: '#40c463', label: 'Perf 3' },
          { bg: '#30a14e', label: 'Perf 4' },
          { bg: '#216e39', label: 'Perf 5' },
        ].map(({ bg, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: CELL, height: CELL, background: bg, border: '1px solid rgba(0,0,0,0.2)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--gray)' }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.6875rem', fontWeight: 800, marginLeft: 'auto' }}>
          {trainedCount} jour{trainedCount !== 1 ? 's' : ''} entraîné{trainedCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

// ── Horizontal bar helper ─────────────────────────────────────────────────────

function HBar({ value, max, bg = 'var(--black)', height = 10 }) {
  return (
    <div style={{ flex: 1, height, background: 'var(--light-gray)', border: '1.5px solid var(--black)' }}>
      <div style={{
        height: '100%', width: `${Math.round((value / max) * 100)}%`,
        background: bg, transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Stats() {
  const { sessions, settings } = useStore()

  if (sessions.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '80dvh' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>📊</div>
        <div style={{ fontWeight: 800, fontSize: '1.375rem', marginBottom: '0.5rem' }}>
          Aucune stat pour l'instant, Raphaël
        </div>
        <div style={{ color: 'var(--gray)', fontWeight: 500, maxWidth: '260px' }}>
          Complète ta première séance pour voir tes stats ici
        </div>
      </div>
    )
  }

  const year         = new Date().getFullYear()
  const streak       = computeStreak(sessions, settings.weeklyGoal)
  const avgTime      = avgStartTime(sessions)
  const freqDay      = mostFrequentDay(sessions)
  const rate         = consistencyRate(sessions, settings.weeklyGoal)
  const summary      = weeklySummary(sessions)
  const avgPerf      = avgField(sessions, 'perf')
  const avgEnergie   = avgField(sessions, 'energie')
  const avgSommeil   = avgField(sessions, 'sommeil')
  const emojiDist    = emojiDistribution(sessions)
  const humeurDist   = humeurDistribution(sessions)
  const corpsDist    = corpsDistribution(sessions)
  const trend        = perfTrend(sessions, 10)
  const heatmap      = yearHeatmap(sessions, year)
  const trendDir     = perfTrendDir(sessions)
  const dowPerf      = dayOfWeekPerf(sessions)
  const sommeilCorr  = fieldCorrelation(sessions, 'sommeil', 'perf')
  const energieCorr  = fieldCorrelation(sessions, 'energie', 'perf')
  const humeurCorr   = humeurPerfCorr(sessions)
  const bestMonthStat = bestMonth(sessions)
  const totalSessions = sessions.length

  const milestoneMsg = totalSessions < 10
    ? `${totalSessions} séances. T'es sur la bonne voie, Raphaël. 🚀`
    : totalSessions < 30
    ? `${totalSessions} séances. Ça commence à faire du bruit. 💥`
    : totalSessions < 50
    ? `${totalSessions} séances. Sérieux. Vraiment sérieux. 🔥`
    : totalSessions < 100
    ? `${totalSessions} séances. T'es une machine, Raphaël. 🤖`
    : `${totalSessions} séances. Légendaire. 🏆`

  const emojiEntries  = Object.entries(emojiDist).sort((a, b) => b[1] - a[1])
  const humeurEntries = Object.entries(humeurDist).sort((a, b) => b[1] - a[1])
  const corpsEntries  = Object.entries(corpsDist).sort((a, b) => b[1] - a[1])
  const maxHumeur = humeurEntries.length ? humeurEntries[0][1] : 1
  const maxCorps  = corpsEntries.length  ? corpsEntries[0][1]  : 1

  // Trend direction arrow
  const trendArrow = trendDir
    ? trendDir.diff >= 0.5 ? '↑'
    : trendDir.diff >= 0.2 ? '↗'
    : trendDir.diff > -0.2 ? '→'
    : trendDir.diff > -0.5 ? '↘'
    : '↓'
    : null
  const trendColor = trendDir
    ? trendDir.diff >= 0.2  ? 'var(--lime)'
    : trendDir.diff > -0.2 ? 'var(--yellow)'
    : 'var(--white)'
    : null

  // Correlations: only show if at least one has data
  const hasCorr = sommeilCorr || energieCorr

  // DoW: only show if ≥ 3 sessions on different days
  const showDow = dowPerf.length >= 2

  // HumeurCorr: only show if ≥ 3 tags with enough data
  const showHumeurCorr = humeurCorr.length >= 3
  const maxHumeurPerf  = showHumeurCorr ? humeurCorr[0].avg : 5

  return (
    <div className="page stats-page">
      <div style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '1.25rem' }}>
        Tes stats
      </div>

      <div className="stats-grid">

        {/* ── 1. Streak hero ── full width ── */}
        <div className="card card--yellow stats-span-full fade-up">
          <div className="tag">Streak de Raphaël</div>
          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '0.375rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <div className="num-big" style={{ lineHeight: 1 }}>{streak.current}</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '0.25rem' }}>
                semaine{streak.current !== 1 ? 's' : ''} en cours
              </div>
            </div>
            <div style={{ paddingBottom: '2px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>{streak.best}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#555' }}>record all-time</div>
            </div>
            <div style={{ paddingBottom: '2px' }}>
              <div style={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1 }}>{totalSessions}</div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#555' }}>séances totales</div>
            </div>
          </div>
          <div className="divider" style={{ margin: '0.75rem 0' }} />
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Objectif : {settings.weeklyGoal} séances / semaine
          </div>
        </div>

        {/* ── 2. Cette semaine + Moyennes ── */}
        <div className="card fade-up" style={{ animationDelay: '0.04s' }}>
          <div className="tag">Cette semaine</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginTop: '0.375rem' }}>{summary.count}</div>
          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--gray)', marginTop: '2px' }}>séances</div>
          {summary.avgPerf != null && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1 }}>{summary.avgPerf}/5</div>
              <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--gray)', marginTop: '2px' }}>perf moy.</div>
            </div>
          )}
        </div>

        <div className="card fade-up" style={{ animationDelay: '0.08s' }}>
          <div className="tag" style={{ marginBottom: '0.625rem' }}>Moyennes all-time</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {avgPerf    != null && <div className="row--between"><span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)' }}>Perf</span>    <span style={{ fontWeight: 800 }}>{avgPerf}/5</span></div>}
            {avgEnergie != null && <div className="row--between"><span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)' }}>Énergie</span> <span style={{ fontWeight: 800 }}>{avgEnergie}/5</span></div>}
            {avgSommeil != null && <div className="row--between"><span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gray)' }}>Sommeil</span> <span style={{ fontWeight: 800 }}>{avgSommeil}/5</span></div>}
            {avgPerf == null && avgEnergie == null && avgSommeil == null && (
              <span style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>—</span>
            )}
          </div>
        </div>

        {/* ── 3. Year heatmap ── full width ── */}
        <div className="card fade-up stats-span-full" style={{ animationDelay: '0.12s' }}>
          <div className="tag" style={{ marginBottom: '0.75rem' }}>Activité {year}</div>
          <YearHeatmap data={heatmap} year={year} />
        </div>

        {/* ── 4. Trend direction + Best month ── */}
        {trendDir && (
          <div className="card fade-up" style={{ animationDelay: '0.16s', background: trendColor }}>
            <div className="tag">Tendance récente</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', margin: '0.25rem 0 0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{trendArrow}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {trendDir.diff > 0 ? '+' : ''}{trendDir.diff}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
              {trendDir.recentAvg}/5 récemment
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '2px' }}>
              vs {trendDir.previousAvg}/5 avant
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray)', marginTop: '4px' }}>
              Basé sur tes {trendDir.n} dernières séances notées
            </div>
          </div>
        )}

        <div className="card fade-up" style={{ animationDelay: trendDir ? '0.2s' : '0.16s' }}>
          <div className="tag">Meilleur mois</div>
          {bestMonthStat ? (
            <>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, marginTop: '0.375rem' }}>
                {bestMonthStat.count}
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', marginTop: '2px' }}>séances</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, marginTop: '0.375rem', textTransform: 'capitalize' }}>
                {bestMonthStat.label}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.375rem' }}>—</div>
          )}
        </div>

        {/* ── 5. Emojis ── full width ── */}
        {emojiEntries.length > 0 && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.2s' }}>
            <div className="tag" style={{ marginBottom: '0.75rem' }}>Tes emojis</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {emojiEntries.map(([emoji, count], i) => (
                <div
                  key={emoji}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '3px', padding: '0.625rem 0.75rem',
                    border: '2px solid var(--black)',
                    background: i === 0 ? 'var(--yellow)' : 'transparent',
                    minWidth: '54px', position: 'relative',
                  }}
                >
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)',
                      fontSize: '0.5625rem', fontWeight: 800, background: 'var(--black)',
                      color: 'var(--bg)', padding: '1px 5px', whiteSpace: 'nowrap',
                    }}>
                      #1
                    </div>
                  )}
                  <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>{emoji}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Humeur distribution ── full width ── */}
        {humeurEntries.length > 0 && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.24s' }}>
            <div className="tag" style={{ marginBottom: '0.75rem' }}>Tes humeurs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {humeurEntries.slice(0, 10).map(([tag, count]) => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, width: '82px', flexShrink: 0 }}>{tag}</span>
                  <HBar value={count} max={maxHumeur} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, width: '22px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 7. Humeur → perf correlation ── full width ── */}
        {showHumeurCorr && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.28s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
              <div className="tag">Humeur & performance</div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray)' }}>Perf moy. selon l'humeur</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {humeurCorr.slice(0, 8).map(({ tag, avg, count }, i) => {
                const barBg = avg >= 4 ? 'var(--lime)' : avg >= 3 ? 'var(--yellow)' : 'var(--light-gray)'
                return (
                  <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, width: '82px', flexShrink: 0 }}>{tag}</span>
                    <HBar value={avg} max={5} bg={barBg} height={12} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, width: '32px', textAlign: 'right', flexShrink: 0 }}>
                      {avg}/5
                    </span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray)', width: '24px', textAlign: 'right', flexShrink: 0 }}>
                      ×{count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 8. Corps distribution ── full width ── */}
        {corpsEntries.length > 0 && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.32s' }}>
            <div className="tag" style={{ marginBottom: '0.75rem' }}>Ton corps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {corpsEntries.slice(0, 8).map(([tag, count]) => (
                <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, width: '100px', flexShrink: 0 }}>{tag}</span>
                  <HBar value={count} max={maxCorps} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, width: '22px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 9. Correlations ── full width ── */}
        {hasCorr && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.36s' }}>
            <div className="tag" style={{ marginBottom: '0.875rem' }}>Ce qui impacte ta perf</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sommeilCorr && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    💤 Sommeil
                    {sommeilCorr.avgHigh != null && sommeilCorr.avgLow != null && (
                      <span style={{
                        marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700,
                        color: sommeilCorr.avgHigh > sommeilCorr.avgLow ? 'var(--gray)' : 'var(--gray)',
                      }}>
                        {sommeilCorr.avgHigh > sommeilCorr.avgLow
                          ? `+${Math.round((sommeilCorr.avgHigh - sommeilCorr.avgLow) * 10) / 10} pts quand bien dormi`
                          : 'pas de différence notable'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {sommeilCorr.avgHigh != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '88px', flexShrink: 0, color: 'var(--gray)' }}>
                          Bon (4-5/5)
                          <span style={{ fontWeight: 600, fontSize: '0.6875rem', display: 'block' }}>×{sommeilCorr.highCount}</span>
                        </span>
                        <HBar value={sommeilCorr.avgHigh} max={5} bg="var(--black)" height={10} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                          {sommeilCorr.avgHigh}/5
                        </span>
                      </div>
                    )}
                    {sommeilCorr.avgLow != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '88px', flexShrink: 0, color: 'var(--gray)' }}>
                          Mauvais (1-3/5)
                          <span style={{ fontWeight: 600, fontSize: '0.6875rem', display: 'block' }}>×{sommeilCorr.lowCount}</span>
                        </span>
                        <HBar value={sommeilCorr.avgLow} max={5} bg="var(--light-gray)" height={10} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                          {sommeilCorr.avgLow}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sommeilCorr && energieCorr && (
                <div style={{ height: '2px', background: 'var(--light-gray)' }} />
              )}

              {energieCorr && (
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    ⚡ Énergie
                    {energieCorr.avgHigh != null && energieCorr.avgLow != null && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)' }}>
                        {energieCorr.avgHigh > energieCorr.avgLow
                          ? `+${Math.round((energieCorr.avgHigh - energieCorr.avgLow) * 10) / 10} pts avec bonne énergie`
                          : 'pas de différence notable'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {energieCorr.avgHigh != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '88px', flexShrink: 0, color: 'var(--gray)' }}>
                          Bonne (4-5/5)
                          <span style={{ fontWeight: 600, fontSize: '0.6875rem', display: 'block' }}>×{energieCorr.highCount}</span>
                        </span>
                        <HBar value={energieCorr.avgHigh} max={5} bg="var(--black)" height={10} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                          {energieCorr.avgHigh}/5
                        </span>
                      </div>
                    )}
                    {energieCorr.avgLow != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, width: '88px', flexShrink: 0, color: 'var(--gray)' }}>
                          Faible (1-3/5)
                          <span style={{ fontWeight: 600, fontSize: '0.6875rem', display: 'block' }}>×{energieCorr.lowCount}</span>
                        </span>
                        <HBar value={energieCorr.avgLow} max={5} bg="var(--light-gray)" height={10} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, width: '36px', textAlign: 'right', flexShrink: 0 }}>
                          {energieCorr.avgLow}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 10. Day-of-week performance ── full width ── */}
        {showDow && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
              <div className="tag">Jour idéal</div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray)' }}>séances · perf moy.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {dowPerf.sort((a, b) => (b.avgPerf ?? 0) - (a.avgPerf ?? 0)).map(({ name, count, avgPerf: ap }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, width: '34px', flexShrink: 0 }}>{name}</span>
                  <div style={{ flex: 1, display: 'flex', gap: '3px', alignItems: 'center' }}>
                    {Array.from({ length: count }).map((_, i) => (
                      <div key={i} style={{
                        width: '10px', height: '18px',
                        background: ap != null
                          ? ap >= 4 ? 'var(--lime)' : ap >= 3 ? 'var(--yellow)' : 'var(--light-gray)'
                          : 'var(--lime)',
                        border: '1.5px solid var(--black)',
                        flexShrink: 0,
                      }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)' }}>×{count}</span>
                    {ap != null && (
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, marginLeft: '0.375rem' }}>{ap}/5</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 11. Habits ── */}
        <div className="card fade-up" style={{ animationDelay: '0.44s' }}>
          <div className="tag">Tu t'entraînes</div>
          {avgTime && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1 }}>{avgTime}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, marginTop: '2px' }}>heure moyenne</div>
            </div>
          )}
          {freqDay && (
            <div style={{ marginTop: '0.625rem' }}>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, textTransform: 'capitalize' }}>{freqDay}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600, marginTop: '2px' }}>jour favori</div>
            </div>
          )}
          {!avgTime && !freqDay && (
            <div style={{ color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.5rem' }}>—</div>
          )}
        </div>

        {/* ── 12. Consistency ── */}
        {rate !== null && (
          <div className="card card--lime fade-up stats-span-full" style={{ animationDelay: '0.48s' }}>
            <div className="tag">Régularité de Raphaël</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', margin: '0.375rem 0 0.625rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{rate}%</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', paddingBottom: '5px' }}>
                des semaines atteignent l'objectif
              </span>
            </div>
            <div className="progress-track" style={{ marginBottom: '0.625rem' }}>
              <div className="progress-fill" style={{ width: `${rate}%`, background: 'var(--black)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              {rate >= 80 ? '🔥 Excellent rythme, continue !'
               : rate >= 60 ? '💪 Bonne progression, Raphaël'
               : rate >= 40 ? '📈 Ça monte. Continue.'
               : 'Chaque séance compte. Garde le cap.'}
            </div>
          </div>
        )}

        {/* ── 13. Perf trend bars ── full width ── */}
        {trend.length > 1 && (
          <div className="card fade-up stats-span-full" style={{ animationDelay: '0.52s' }}>
            <div className="tag" style={{ marginBottom: '0.75rem' }}>Évolution de ta perf</div>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'flex-end', overflowX: 'auto', paddingBottom: '4px' }}>
              {trend.map((entry, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, minWidth: '44px' }}>
                  {entry.emoji && (
                    <span style={{ fontSize: '1.125rem', lineHeight: 1 }}>{entry.emoji}</span>
                  )}
                  <div style={{
                    width: '36px',
                    height: `${(entry.perf / 5) * 64 + 12}px`,
                    background: entry.perf >= 4 ? 'var(--lime)' : entry.perf >= 3 ? 'var(--yellow)' : 'var(--light-gray)',
                    border: '2px solid var(--black)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'height 0.3s ease',
                  }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>{entry.perf}</span>
                  </div>
                  <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: 'var(--gray)', textAlign: 'center', lineHeight: 1.2 }}>
                    {entry.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 14. Milestone ── full width ── */}
        <div
          className="card stats-span-full fade-up"
          style={{ background: 'var(--bg)', boxShadow: 'none', borderStyle: 'dashed', animationDelay: '0.56s' }}
        >
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, textAlign: 'center', color: 'var(--gray)' }}>
            {milestoneMsg}
          </div>
        </div>

      </div>
    </div>
  )
}
