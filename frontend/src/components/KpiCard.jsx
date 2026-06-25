function KpiCard({ titre, valeur, couleur }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${couleur}`
    }}>
      <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{titre}</p>
      <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0 0', color: couleur }}>
        {valeur}
      </p>
    </div>
  )
}

export default KpiCard