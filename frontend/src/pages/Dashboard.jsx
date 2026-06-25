import { useState, useEffect } from 'react'
import { getNageurs, getDashboard } from '../api/api'
import KpiCard from '../components/KpiCard'
import ChronoChart from '../components/ChronoChart'
import Recommandations from '../components/Recommandations'
import theme from '../theme'

function Dashboard() {
  const [nageurs, setNageurs] = useState([])
  const [nageurId, setNageurId] = useState('')
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    chargerNageurs()
  }, [])

  const chargerNageurs = async () => {
    try {
      const res = await getNageurs()
      setNageurs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const chargerDashboard = async (id) => {
    if (!id) return
    setLoading(true)
    setErreur('')
    try {
      const res = await getDashboard(id)
      setDashboard(res.data)
    } catch (err) {
      setErreur('Impossible de charger le dashboard.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const id = e.target.value
    setNageurId(id)
    setDashboard(null)
    chargerDashboard(id)
  }

  // Style de carte réutilisable (design system)
  const carte = {
    background: theme.fondCarte,
    padding: '24px',
    borderRadius: '16px',
    border: `1px solid ${theme.bordure}`,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)',
  }

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '6px', fontSize: '28px', fontWeight: 800 }}>
        Dashboard
      </h1>
      <p style={{ color: theme.texteDoux, marginBottom: '24px', fontSize: '15px' }}>
        Sélectionne un nageur pour voir ses données et prédictions
      </p>

      {/* Sélecteur nageur */}
      <div style={{ marginBottom: '28px' }}>
        <select
          value={nageurId}
          onChange={handleChange}
          style={{
            padding: '11px 16px', borderRadius: '10px',
            border: `1px solid ${theme.bordure}`, fontSize: '15px',
            background: theme.blanc, cursor: 'pointer', minWidth: '280px',
            fontFamily: theme.policeTexte, color: theme.texte, outline: 'none',
          }}
        >
          <option value="">-- Sélectionner un nageur --</option>
          {nageurs.map(n => (
            <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: theme.texteDoux }}>Chargement...</p>}
      {erreur && <p style={{ color: theme.danger }}>{erreur}</p>}

      {dashboard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* En-tête nageur — dégradé bleu/cyan */}
          <div style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, padding: '24px 28px', borderRadius: '16px',
          }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontFamily: theme.policeTitre, fontWeight: 700 }}>
              🏊 {dashboard.nageur.prenom} {dashboard.nageur.nom}
            </h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
              {dashboard.nageur.specialite || 'Spécialité non renseignée'} —{' '}
              {dashboard.nageur.niveau || 'Niveau non renseigné'}
            </p>
          </div>

          {/* KPI */}
          <div>
            <h3 style={{ marginBottom: '14px', color: theme.neutral, fontFamily: theme.policeTitre, fontSize: '18px' }}>
              Indicateurs clés
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              <KpiCard titre="Dernier chrono" valeur={dashboard.kpi.dernier_chrono ? `${dashboard.kpi.dernier_chrono}s` : '—'} couleur={theme.primary} />
              <KpiCard titre="Meilleur chrono" valeur={dashboard.kpi.meilleur_chrono ? `${dashboard.kpi.meilleur_chrono}s` : '—'} couleur={theme.succes} />
              <KpiCard titre="Progression" valeur={dashboard.kpi.progression !== null ? `${dashboard.kpi.progression}%` : '—'} couleur={dashboard.kpi.progression < 0 ? theme.succes : theme.warning} />
              <KpiCard titre="HRV moyenne" valeur={dashboard.kpi.hrv_moyenne ? `${dashboard.kpi.hrv_moyenne} ms` : '—'} couleur="#8b5cf6" />
              <KpiCard titre="FC repos" valeur={dashboard.kpi.fc_repos ? `${dashboard.kpi.fc_repos} bpm` : '—'} couleur={theme.danger} />
              <KpiCard titre="RPE moyen" valeur={dashboard.kpi.rpe_moyen ?? '—'} couleur={theme.warning} />
              <KpiCard titre="Sommeil moyen" valeur={dashboard.kpi.sommeil_moyen ? `${dashboard.kpi.sommeil_moyen}h` : '—'} couleur={theme.secondary} />
              <KpiCard titre="Score fatigue" valeur={dashboard.kpi.fatigue !== null ? `${dashboard.kpi.fatigue}/100` : '—'} couleur={theme.danger} />
            </div>
          </div>

          {/* Charge entraînement */}
          <div style={carte}>
            <h3 style={{ marginBottom: '16px', color: theme.neutral, fontFamily: theme.policeTitre, fontSize: '18px' }}>
              Charge d'entraînement
            </h3>
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: theme.texteDoux, fontSize: '13px', margin: 0 }}>Charge aiguë (7j)</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: theme.neutral }}>
                  {dashboard.charge.charge_aigue ? `${dashboard.charge.charge_aigue} min` : '—'}
                </p>
              </div>
              <div>
                <p style={{ color: theme.texteDoux, fontSize: '13px', margin: 0 }}>Charge chronique (28j)</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: theme.neutral }}>
                  {dashboard.charge.charge_chronique ? `${dashboard.charge.charge_chronique} min` : '—'}
                </p>
              </div>
              <div>
                <p style={{ color: theme.texteDoux, fontSize: '13px', margin: 0 }}>ACWR</p>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', color: dashboard.charge.acwr > 1.3 ? theme.danger : theme.succes }}>
                  {dashboard.charge.acwr ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Graphique chronos */}
          {dashboard.historique_chronos.length > 0 && (
            <div style={carte}>
              <h3 style={{ marginBottom: '16px', color: theme.neutral, fontFamily: theme.policeTitre, fontSize: '18px' }}>
                Évolution des chronos
              </h3>
              <ChronoChart data={dashboard.historique_chronos} />
            </div>
          )}

          <Recommandations recommandations={dashboard.recommandations} />

        </div>
      )}

      {!nageurId && !loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.texteDoux }}>
          <p style={{ fontSize: '48px', margin: 0 }}>🏊</p>
          <p style={{ fontSize: '18px', marginTop: '16px' }}>Sélectionne un nageur pour voir son dashboard</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard