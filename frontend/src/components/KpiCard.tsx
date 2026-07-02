import theme from '../theme'

interface KpiCardProps {
  titre: string
  valeur: string | number
  couleur?: string
  sousTitre?: string
}

function KpiCard({ titre, valeur, couleur = theme.primary, sousTitre }: KpiCardProps) {
  return (
    <div style={{
      background: theme.blanc,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${theme.bordure}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${couleur}`,
    }}>
      <p style={{ color: theme.texteDoux, fontSize: '13px', fontWeight: 600, margin: 0 }}>
        {titre}
      </p>
      <p style={{ fontSize: '26px', fontWeight: 800, margin: '8px 0 0', color: couleur, fontFamily: theme.policeTitre }}>
        {valeur}
      </p>
      {sousTitre && (
        <p style={{ fontSize: '12px', color: theme.texteDoux, marginTop: '4px' }}>
          {sousTitre}
        </p>
      )}
    </div>
  )
}

export default KpiCard
