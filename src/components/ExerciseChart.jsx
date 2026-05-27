import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '2px solid #111',
      padding: '0.5rem 0.75rem',
      fontFamily: 'Space Grotesk, sans-serif',
      boxShadow: '3px 3px 0 #111',
    }}>
      <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>
        {payload[0].value} kg
      </div>
    </div>
  )
}

export default function ExerciseChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <div className="empty-state__icon">📉</div>
        <div className="empty-state__text">Pas encore assez de données</div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
          Fais 2+ séances avec cet exercice
        </div>
      </div>
    )
  }

  const values = data.map(d => d.maxWeight)
  const minVal = Math.max(0, Math.min(...values) - 5)
  const maxVal = Math.max(...values) + 5

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="0" stroke="#E0DAD0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 600, fill: '#666' }}
            axisLine={{ stroke: '#111', strokeWidth: 2 }}
            tickLine={false}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 10, fontWeight: 600, fill: '#666' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#111', strokeWidth: 2, strokeDasharray: '4 2' }} />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke="#0047FF"
            strokeWidth={3}
            dot={{ r: 5, fill: '#FFE500', stroke: '#111', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: '#FFE500', stroke: '#111', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
