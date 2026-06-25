import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function ChronoChart({ data }) {
  const chartData = data.map(point => ({
    date: point.date,
    chrono: point.temps_s
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip
          formatter={(value) => [`${value}s`, 'Chrono']}
          labelFormatter={(label) => `Date : ${label}`}
        />
        <Line
          type="monotone"
          dataKey="chrono"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default ChronoChart