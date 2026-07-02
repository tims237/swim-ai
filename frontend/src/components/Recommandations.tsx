import theme from '../theme'

interface RecommandationsProps {
  recommandations: string[]
}

// Détermine la couleur selon le début de la recommandation
function couleurReco(reco: string): string {
  if (reco.startsWith('⚠') || reco.startsWith('📉')) return theme.warning
  if (reco.startsWith('✅') || reco.startsWith('📈')) return theme.succes
  return theme.texteDoux
}

function Recommandations({ recommandations }: RecommandationsProps) {
  return (
    <div style={{
      background: theme.blanc,
      padding: '24px',
      borderRadius: '16px',
      border: `1px solid ${theme.bordure}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ marginBottom: '16px', color: theme.neutral, fontFamily: theme.policeTitre, fontSize: '18px' }}>
        💡 Recommandations
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {recommandations.map((rec, index) => (
          <div key={index} style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: theme.tertiary,
            border: `1px solid ${theme.bordure}`,
            fontSize: '14px',
            color: couleurReco(rec),
            fontWeight: rec.startsWith('⚠') ? 600 : 400,
          }}>
            {rec}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Recommandations
