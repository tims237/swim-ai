import { useState, useEffect } from 'react'
import { getNageurs, getDashboard } from '../api/api'
import type { Nageur, DashboardResponse } from '../types'
import type { Utilisateur } from '../types'
import KpiCard from '../components/KpiCard'
import ChronoChart from '../components/ChronoChart'
import Recommandations from '../components/Recommandations'
import { Calendar, ChevronDown, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import theme from '../theme'

interface DashboardProps { utilisateur: Utilisateur }

function acwrColor(acwr: number | null) {
  if (acwr === null) return '#94A3B8'
  if (acwr < 0.8)   return '#F59E0B'
  if (acwr <= 1.3)  return '#10B981'
  return '#EF4444'
}

function acwrLabel(acwr: number | null) {
  if (acwr === null) return '—'
  if (acwr < 0.8)   return 'Sous-charge'
  if (acwr <= 1.3)  return 'Optimal'
  return 'Surcharge'
}

function DeltaIcon({ valeur, inversé = false }: { valeur: number | null; inversé?: boolean }) {
  if (valeur === null || valeur === 0) return <Minus size={13} color="#94A3B8" />
  const bon = inversé ? valeur < 0 : valeur > 0
  return bon ? <TrendingUp size={13} color="#10B981" /> : <TrendingDown size={13} color="#EF4444" />
}

function KpiBlock({ titre, valeur, unite = '', delta = null, deltaSuffix = '', inverseDelta = false, accent }: {
  titre: string; valeur: string | number | null; unite?: string
  delta?: number | null; deltaSuffix?: string; inverseDelta?: boolean; accent: string
}) {
  const affiche = valeur !== null && valeur !== undefined ? `${valeur}${unite}` : '—'
  const deltaColor = delta === null ? '#94A3B8'
    : (inverseDelta ? delta < 0 : delta > 0) ? '#10B981' : '#EF4444'

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px',
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0,
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', background: `${accent}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: accent }} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginBottom: '4px' }}>{titre}</div>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', fontFamily: theme.policeTitre, lineHeight: 1.1 }}>
          {affiche}
        </div>
      </div>
      {delta !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: deltaColor }}>
          <DeltaIcon valeur={delta} inversé={inverseDelta} />
          <span style={{ fontWeight: 500 }}>{delta > 0 ? '+' : ''}{delta}{deltaSuffix}</span>
          <span style={{ color: '#CBD5E1' }}>vs préc.</span>
        </div>
      )}
    </div>
  )
}

function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', ...style }}>
      {children}
    </div>
  )
}

function SectionTitre({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
      {children}
    </h3>
  )
}

function Dashboard({ utilisateur }: DashboardProps) {
  const [nageurs,   setNageurs]   = useState<Nageur[]>([])
  const [nageurId,  setNageurId]  = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [erreur,    setErreur]    = useState('')

  const estNageur = utilisateur.role === 'nageur'

  useEffect(() => {
    if (estNageur && utilisateur.nageur_id) chargerDashboard(utilisateur.nageur_id)
    else chargerNageurs()
  }, [utilisateur])

  const chargerNageurs = async () => {
    try { setNageurs(await getNageurs()) } catch { /* silencieux */ }
  }

  const chargerDashboard = async (id: number) => {
    setLoading(true); setErreur('')
    try { setDashboard(await getDashboard(id)); setNageurId(id) }
    catch { setErreur('Impossible de charger le dashboard.') }
    finally { setLoading(false) }
  }

  const nom = dashboard?.nageur
  const initiales = nom ? `${nom.prenom?.[0] ?? ''}${nom.nom?.[0] ?? ''}`.toUpperCase() : '??'

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      {dashboard ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '17px' }}>{initiales}</span>
            </div>
            <div>
              <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
                {dashboard.nageur.prenom} {dashboard.nageur.nom}
              </h1>
              <p style={{ color: '#64748B', fontSize: '13px', margin: '3px 0 0' }}>
                {dashboard.nageur.specialite ?? 'Spécialité non renseignée'}
                {dashboard.nageur.niveau ? ` · ${dashboard.nageur.niveau}` : ''}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px',
            padding: '8px 14px', fontSize: '13px', color: '#475569',
          }}>
            <Calendar size={14} color="#94A3B8" />
            <span>Saison 2025</span>
            <ChevronDown size={13} color="#94A3B8" />
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '26px', color: '#0F172A', marginBottom: '4px' }}>
            {estNageur ? 'Mon Dashboard' : 'Dashboard nageur'}
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>
            {estNageur ? 'Vos indicateurs de performance et de récupération' : 'Sélectionnez un nageur pour voir ses données'}
          </p>
        </div>
      )}

      {/* Select nageur */}
      {!estNageur && (
        <div style={{ marginBottom: '24px' }}>
          <select
            value={nageurId ?? ''}
            onChange={(e) => e.target.value && chargerDashboard(Number(e.target.value))}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '1px solid #E2E8F0',
              fontSize: '14px', background: '#FFFFFF', cursor: 'pointer',
              minWidth: '260px', color: '#0F172A', outline: 'none',
            }}
          >
            <option value="">— Sélectionner un nageur —</option>
            {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
          </select>
        </div>
      )}

      {loading && <p style={{ color: '#94A3B8', fontSize: '14px', padding: '20px 0' }}>Chargement…</p>}
      {erreur && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2',
          border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px',
          color: '#DC2626', fontSize: '14px',
        }}>
          <AlertTriangle size={15} />{erreur}
        </div>
      )}

      {dashboard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
            <KpiBlock titre="Chrono actuel"   valeur={dashboard.kpi.dernier_chrono}  unite="s"    delta={dashboard.kpi.progression} deltaSuffix="%" inverseDelta accent={theme.primary} />
            <KpiBlock titre="Meilleur chrono" valeur={dashboard.kpi.meilleur_chrono} unite="s"    accent="#10B981" />
            <KpiBlock titre="HRV"             valeur={dashboard.kpi.hrv_moyenne}     unite=" ms"  accent={theme.secondary} />
            <KpiBlock titre="FC repos"        valeur={dashboard.kpi.fc_repos}        unite=" bpm" accent="#EF4444" />
            <KpiBlock titre="RPE moyen"       valeur={dashboard.kpi.rpe_moyen}       accent="#F59E0B" />
            <KpiBlock titre="Sommeil"         valeur={dashboard.kpi.sommeil_moyen}   unite="h"    accent="#8B5CF6" />
          </div>

          {/* Chronos + Charge */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Carte>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <SectionTitre>Évolution des performances</SectionTitre>
                <select style={{ border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', padding: '4px 8px', color: '#475569', background: '#F8FAFC' }}>
                  <option>100m nage libre</option>
                </select>
              </div>
              {dashboard.historique_chronos.length > 0 ? (
                <ChronoChart data={dashboard.historique_chronos} />
              ) : (
                <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: '13px', border: '1px dashed #E2E8F0', borderRadius: '8px' }}>
                  Aucune donnée disponible
                </div>
              )}
            </Carte>

            <Carte>
              <SectionTitre>Charge d'entraînement</SectionTitre>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {dashboard.charge.acwr !== null && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: `${acwrColor(dashboard.charge.acwr)}12`,
                    border: `1px solid ${acwrColor(dashboard.charge.acwr)}30`,
                    borderRadius: '8px', padding: '10px 14px',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>ACWR</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: acwrColor(dashboard.charge.acwr), fontFamily: theme.policeTitre }}>
                        {dashboard.charge.acwr}
                      </div>
                    </div>
                    <span style={{ background: acwrColor(dashboard.charge.acwr), color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                      {acwrLabel(dashboard.charge.acwr)}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '24px' }}>
                  {[
                    { label: 'Charge aiguë (7j)',      valeur: dashboard.charge.charge_aigue },
                    { label: 'Charge chronique (28j)',  valeur: dashboard.charge.charge_chronique },
                  ].map(({ label, valeur }) => (
                    <div key={label}>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', fontFamily: theme.policeTitre }}>
                        {valeur ? `${valeur} min` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Carte>
          </div>

          {/* Biométrie */}
          <Carte>
            <SectionTitre>Biométrie & Fatigue</SectionTitre>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {[
                { label: 'HRV (ms)',       valeur: dashboard.kpi.hrv_moyenne,   unite: ' ms',  accent: theme.secondary },
                { label: 'Sommeil (h)',    valeur: dashboard.kpi.sommeil_moyen, unite: 'h',    accent: '#8B5CF6' },
                { label: 'RPE (séance)',   valeur: dashboard.kpi.rpe_moyen,     unite: '',     accent: '#F59E0B' },
                { label: 'FC repos (bpm)', valeur: dashboard.kpi.fc_repos,      unite: ' bpm', accent: '#EF4444' },
                { label: 'Score fatigue',  valeur: dashboard.kpi.fatigue,       unite: '/100', accent: '#F97316' },
              ].map(({ label, valeur, unite, accent }) => (
                <div key={label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '14px 16px', borderLeft: `3px solid ${accent}` }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', fontFamily: theme.policeTitre }}>
                    {valeur !== null && valeur !== undefined ? `${valeur}${unite}` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </Carte>

          {/* Recommandations */}
          <Recommandations recommandations={dashboard.recommandations} />

        </div>
      )}

      {/* État vide */}
      {!nageurId && !loading && !estNageur && (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: '#FFFFFF', border: '1px dashed #E2E8F0', borderRadius: '16px', color: '#94A3B8' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🏊</div>
          <p style={{ fontSize: '16px', fontWeight: 500, color: '#475569' }}>Sélectionnez un nageur pour voir son dashboard</p>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Utilisez le menu déroulant ci-dessus</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard