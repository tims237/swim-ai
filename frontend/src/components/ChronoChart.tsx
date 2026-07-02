import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PointChrono } from '../types'
import theme from '../theme'

interface ChronoChartProps {
  data: PointChrono[]
}

function ChronoChart({ data }: ChronoChartProps) {
  const chartData = data.map((point) => ({
    date: point.date,
    chrono: point.temps_s,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.bordure} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: theme.texteDoux }}
          tickFormatter={(val: string) => val.slice(5)} // affiche MM-DD
        />
        <YAxis
          tick={{ fontSize: 11, fill: theme.texteDoux }}
          domain={['auto', 'auto']}
          // L'axe Y est inversé : une valeur basse = meilleure performance
          reversed
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                <p style={{ margin: 0, color: '#64748b' }}>Date : {String(label)}</p>
                <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#0055FF' }}>{payload[0].value}s</p>
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="chrono"
          stroke={theme.primary}
          strokeWidth={2}
          dot={{ fill: theme.primary, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default ChronoChart
