function Recommandations({ recommandations }) {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ marginBottom: '16px', color: '#0f172a' }}>💡 Recommandations</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {recommandations.map((rec, index) => (
          <div key={index} style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            color: '#334155'
          }}>
            {rec}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recommandations