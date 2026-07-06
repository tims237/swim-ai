import { useState, useEffect } from 'react'
import { getNageurs, getDashboard } from '../api/api'
import type { Nageur, DashboardResponse } from '../types'
import { Calendar, ChevronDown, Users, CheckCircle, AlertTriangle, Trophy, Download } from 'lucide-react'
import theme from '../theme'

function Entraineur() {
  const [nageurs,           setNageurs]           = useState<Nageur[]>([])
  const [dashboards,        setDashboards]        = useState<Record<number, DashboardResponse | null>>({})
  const [loading,           setLoading]           = useState(true)
  const [nageurSelectionne, setNageurSelectionne] = useState<number | null>(null)
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<number>(new Date().getFullYear())
  const [anneesDispos,      setAnneesDispos]      = useState<number[]>([])

  useEffect(() => { void chargerTout() }, [])

  const chargerTout = async () => {
    setLoading(true)
    try {
      const liste = await getNageurs()
      setNageurs(liste)
      const resultats: Record<number, DashboardResponse | null> = {}
      await Promise.all(
        liste.map(async (n) => {
          try { resultats[n.id] = await getDashboard(n.id) }
          catch { resultats[n.id] = null }
        })
      )
      setDashboards(resultats)

      // Calcul années disponibles depuis les historiques de chronos
      const annees = new Set<number>()
      Object.values(resultats).forEach(d => {
        d?.historique_chronos?.forEach(h => {
          const annee = new Date(h.date).getFullYear()
          if (!isNaN(annee)) annees.add(annee)
        })
      })
      const sorted = Array.from(annees).sort((a, b) => b - a)
      setAnneesDispos(sorted)
      if (sorted.length > 0) setAnneeSelectionnee(sorted[0])
    } catch { /* silencieux */ }
    finally { setLoading(false) }
  }

  const exporterCSV = () => {
    const lignes = [['Nom', 'Prénom', 'Spécialité', 'Niveau', 'Dernier chrono', 'Meilleur chrono', 'Progression (%)', 'Fatigue', 'ACWR']]
    nageursFiltres.forEach((n) => {
      const d = dashboards[n.id]
      lignes.push([
        n.nom, n.prenom, n.specialite ?? '', n.niveau ?? '',
        String(d?.kpi?.dernier_chrono ?? ''), String(d?.kpi?.meilleur_chrono ?? ''),
        String(d?.kpi?.progression ?? ''), String(d?.kpi?.fatigue ?? ''), String(d?.charge?.acwr ?? ''),
      ])
    })
    const csv  = lignes.map(l => l.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `rapport_equipe_${anneeSelectionnee}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filtre les nageurs qui ont au moins un chrono dans l'année sélectionnée
  const nageursFiltres = nageurs.filter(n => {
    const d = dashboards[n.id]
    if (!d?.historique_chronos?.length) return true // pas de chronos → on garde
    return d.historique_chronos.some(h => new Date(h.date).getFullYear() === anneeSelectionnee)
  })

  const etatForme = (fatigue: number | null | undefined): { label: string; bg: string; text: string } => {
    if (fatigue == null) return { label: '—',        bg: '#F1F5F9', text: '#94A3B8' }
    if (fatigue < 50)    return { label: 'Bon',       bg: '#F0FDF4', text: '#10B981' }
    if (fatigue < 70)    return { label: 'Vigilance', bg: '#FFF7ED', text: '#F59E0B' }
    return                      { label: 'Élevée',    bg: '#FEF2F2', text: '#EF4444' }
  }

  const couleurAcwr = (v: number | null | undefined) => {
    if (v == null) return '#94A3B8'
    if (v > 1.3)   return '#EF4444'
    if (v < 0.8)   return '#F59E0B'
    return '#10B981'
  }

  const enForme   = nageursFiltres.filter(n => { const f = dashboards[n.id]?.kpi?.fatigue; return f != null && f < 50 }).length
  const vigilance = nageursFiltres.filter(n => { const f = dashboards[n.id]?.kpi?.fatigue; return f != null && f >= 50 && f < 70 }).length
  const surmenage = nageursFiltres.filter(n => { const f = dashboards[n.id]?.kpi?.fatigue; return f != null && f >= 70 }).length

  const initiales = (n: Nageur) => `${n.prenom?.[0] ?? ''}${n.nom?.[0] ?? ''}`.toUpperCase()

  function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', ...style }}>
        {children}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
            Vue entraîneur
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            Pilotage collectif des nageurs et décisions coach
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>

          {/* Sélecteur année dynamique */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px' }}>
            <Calendar size={13} color="#94A3B8" />
            <select
              value={anneeSelectionnee}
              onChange={e => setAnneeSelectionnee(Number(e.target.value))}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '13px', color: '#475569', cursor: 'pointer', fontFamily: theme.policeTexte,
              }}
            >
              {anneesDispos.length > 0 ? (
                anneesDispos.map(a => (
                  <option key={a} value={a}>Saison {a}</option>
                ))
              ) : (
                <option value={anneeSelectionnee}>Saison {anneeSelectionnee}</option>
              )}
            </select>
            <ChevronDown size={12} color="#94A3B8" />
          </div>

          <button
            onClick={exporterCSV}
            disabled={nageursFiltres.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: nageursFiltres.length === 0 ? '#E2E8F0' : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: nageursFiltres.length === 0 ? '#94A3B8' : '#fff',
              fontSize: '13px', fontWeight: 600, cursor: nageursFiltres.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Download size={14} /> Exporter CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>Chargement des données équipe…</p>
      ) : (
        <>
          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Nageurs suivis',    valeur: nageursFiltres.length, sous: `Saison ${anneeSelectionnee}`,              Icon: Users,         accent: theme.primary },
              { label: 'En forme',          valeur: enForme,               sous: 'Prêts pour bloc intensif',                 Icon: CheckCircle,   accent: '#10B981' },
              { label: 'Vigilance élevée',  valeur: vigilance,             sous: 'Fatigue ou surcharge détectée',            Icon: AlertTriangle, accent: '#F59E0B' },
              { label: 'Compétitions',      valeur: 4,                     sous: '2 échéances cette semaine',                Icon: Trophy,        accent: '#8B5CF6' },
            ].map(({ label, valeur, sous, Icon, accent }) => (
              <Carte key={label} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={accent} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{label}</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: accent, fontFamily: theme.policeTitre, lineHeight: 1, marginBottom: '6px' }}>
                  {valeur}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{sous}</div>
              </Carte>
            ))}
          </div>

          {/* Tableau + Répartition */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px', alignItems: 'start' }}>

            <Carte style={{ overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Suivi des nageurs — {anneeSelectionnee}
                </h3>
              </div>
              {nageursFiltres.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  Aucun nageur pour la saison {anneeSelectionnee}
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr>
                      {['Nageur', 'Spécialité', 'État de forme', 'Fatigue', 'Risque blessure'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nageursFiltres.map((n, i) => {
                      const d     = dashboards[n.id]
                      const forme = etatForme(d?.kpi?.fatigue)
                      const selec = nageurSelectionne === n.id
                      return (
                        <>
                          <tr
                            key={n.id}
                            onClick={() => setNageurSelectionne(selec ? null : n.id)}
                            style={{
                              borderTop: '1px solid #F1F5F9',
                              background: selec ? '#EFF6FF' : i % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '13px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>{initiales(n)}</span>
                                </div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{n.prenom} {n.nom}</div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{n.niveau ?? '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>{n.specialite ?? '—'}</td>
                            <td style={{ padding: '13px 16px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                background: forme.bg, color: forme.text,
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: forme.text, display: 'inline-block' }} />
                                {forme.label}
                              </span>
                            </td>
                            <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: etatForme(d?.kpi?.fatigue).text }}>
                              {d?.kpi?.fatigue != null ? `${d.kpi.fatigue}/100` : '—'}
                            </td>
                            <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: couleurAcwr(d?.charge?.acwr) }}>
                              {d?.charge?.acwr != null ? `${Math.round((d.charge.acwr ?? 0) * 28)}%` : '—'}
                            </td>
                          </tr>
                          {selec && d?.recommandations && d.recommandations.length > 0 && (
                            <tr key={`rec-${n.id}`} style={{ background: '#EFF6FF' }}>
                              <td colSpan={5} style={{ padding: '0 16px 14px 58px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {d.recommandations.map((rec, ri) => (
                                    <div key={ri} style={{
                                      fontSize: '12px', color: '#1E40AF', background: '#FFFFFF',
                                      border: '1px solid #BFDBFE', borderRadius: '6px', padding: '8px 12px',
                                    }}>
                                      {rec}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </Carte>

            {/* Répartition */}
            <Carte style={{ padding: '20px 24px' }}>
              <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                Répartition — {anneeSelectionnee}
              </h3>
              {nageursFiltres.length > 0 ? (
                <>
                  <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' }}>
                    <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                      {enForme > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3.5"
                          strokeDasharray={`${(enForme / nageursFiltres.length) * 100} 100`}
                          strokeDashoffset="0"
                        />
                      )}
                      {vigilance > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F59E0B" strokeWidth="3.5"
                          strokeDasharray={`${(vigilance / nageursFiltres.length) * 100} 100`}
                          strokeDashoffset={`-${(enForme / nageursFiltres.length) * 100}`}
                        />
                      )}
                      {surmenage > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EF4444" strokeWidth="3.5"
                          strokeDasharray={`${(surmenage / nageursFiltres.length) * 100} 100`}
                          strokeDashoffset={`-${((enForme + vigilance) / nageursFiltres.length) * 100}`}
                        />
                      )}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre }}>{nageursFiltres.length}</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>nageurs</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Excellente forme', valeur: enForme,   couleur: '#10B981' },
                      { label: 'Vigilance',         valeur: vigilance, couleur: '#F59E0B' },
                      { label: 'Surmenage',         valeur: surmenage, couleur: '#EF4444' },
                    ].map(({ label, valeur, couleur }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: couleur }} />
                          <span style={{ fontSize: '13px', color: '#475569' }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                          {`${Math.round((valeur / nageursFiltres.length) * 100)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8', fontSize: '13px' }}>
                  Aucune donnée pour {anneeSelectionnee}
                </div>
              )}
            </Carte>
          </div>
        </>
      )}
    </div>
  )
}

export default Entraineur