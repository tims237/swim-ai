import { useState, FormEvent, useEffect } from 'react'
import { getNageurs, creerNageur, supprimerNageur, getPerformancesNageur, getDashboard } from '../api/api'
import type { Nageur, Performance, DashboardResponse } from '../types'
import { UserCircle, Plus, X, ChevronLeft, Trophy, Target, Shield, Heart, Moon, Zap, Activity } from 'lucide-react'
import theme from '../theme'

function Nageurs() {
  const [nageurs,       setNageurs]       = useState<Nageur[]>([])
  const [form,          setForm]          = useState({ nom: '', prenom: '', specialite: '', niveau: '' })
  const [message,       setMessage]       = useState('')
  const [messageOk,     setMessageOk]     = useState(true)
  const [formOuvert,    setFormOuvert]    = useState(false)
  const [nageurSelec,   setNageurSelec]   = useState<Nageur | null>(null)
  const [performances,  setPerformances]  = useState<Performance[]>([])
  const [dashboard,     setDashboard]     = useState<DashboardResponse | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => { void charger() }, [])

  const charger = async () => {
    try { setNageurs(await getNageurs()) } catch { /* silencieux */ }
  }

  const ouvrirProfil = async (n: Nageur) => {
    setNageurSelec(n)
    setLoadingDetail(true)
    try {
      const [perfs, dash] = await Promise.all([
        getPerformancesNageur(n.id),
        getDashboard(n.id),
      ])
      setPerformances(perfs)
      setDashboard(dash)
    } catch { setPerformances([]); setDashboard(null) }
    finally { setLoadingDetail(false) }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await creerNageur({ ...form, specialite: form.specialite || undefined, niveau: form.niveau || undefined })
      setMessage('Nageur créé avec succès')
      setMessageOk(true)
      setForm({ nom: '', prenom: '', specialite: '', niveau: '' })
      setFormOuvert(false)
      void charger()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setMessage(e.response?.data?.detail ?? 'Erreur inconnue')
      setMessageOk(false)
    }
  }

  const handleSupprimer = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer ${nom} et toutes ses données ?`)) return
    try {
      await supprimerNageur(id)
      if (nageurSelec?.id === id) setNageurSelec(null)
      void charger()
    } catch {
      setMessage('Erreur lors de la suppression')
      setMessageOk(false)
    }
  }

  const champ: React.CSSProperties = {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
    fontSize: '14px', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: '100%',
  }

  function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', ...style }}>
        {children}
      </div>
    )
  }

  function SectionTitre({ children }: { children: React.ReactNode }) {
    return (
      <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>
        {children}
      </h3>
    )
  }

  const initiales = (n: Nageur) => `${n.prenom?.[0] ?? ''}${n.nom?.[0] ?? ''}`.toUpperCase()

  // KPI depuis dashboard réel
  const meilleurChrono = performances.filter(p => p.temps_s).length
    ? Math.min(...performances.filter(p => p.temps_s).map(p => p.temps_s!))
    : null

  // ── Vue profil nageur ──
  if (nageurSelec) {
    return (
      <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <button onClick={() => { setNageurSelec(null); setDashboard(null); setPerformances([]) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '13px', marginBottom: '6px', padding: 0 }}>
              <ChevronLeft size={15} /> Retour à la liste
            </button>
            <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>Profil nageur</h1>
            <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>Fiche athlète et objectifs saison 2025</p>
          </div>
        </div>

        {loadingDetail ? (
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Chargement…</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

              {/* Identité */}
              <Carte style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: '24px' }}>{initiales(nageurSelec)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre, marginBottom: '14px' }}>
                    {nageurSelec.prenom} {nageurSelec.nom}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', marginBottom: '14px' }}>
                    {[
                      { label: 'Spécialité', valeur: nageurSelec.specialite ?? '—' },
                      { label: 'Niveau',     valeur: nageurSelec.niveau     ?? '—' },
                      { label: 'ACWR',       valeur: dashboard?.charge.acwr != null ? String(dashboard.charge.acwr) : '—' },
                      { label: 'Score fatigue', valeur: dashboard?.kpi.fatigue != null ? `${dashboard.kpi.fatigue}/100` : '—' },
                    ].map(({ label, valeur }) => (
                      <div key={label}>
                        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
                        <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>{valeur}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: '#F0FDF4', color: '#065F46', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid #BBF7D0' }}>Actif</span>
                    {nageurSelec.niveau && (
                      <span style={{ background: '#EFF6FF', color: theme.primary, fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>{nageurSelec.niveau}</span>
                    )}
                  </div>
                </div>
              </Carte>

              {/* KPI chrono */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { label: 'Meilleur chrono', valeur: meilleurChrono ? `${meilleurChrono}s` : '—', Icon: Trophy,  accent: theme.primary },
                  { label: 'Objectif saison', valeur: meilleurChrono ? `${(meilleurChrono * 0.98).toFixed(2)}s` : '—', Icon: Target,  accent: '#10B981' },
                  { label: 'HRV moyenne',     valeur: dashboard?.kpi.hrv_moyenne ? `${dashboard.kpi.hrv_moyenne} ms` : '—', Icon: Activity, accent: theme.secondary },
                  { label: 'FC repos',        valeur: dashboard?.kpi.fc_repos ? `${dashboard.kpi.fc_repos} bpm` : '—', Icon: Shield,  accent: '#EF4444' },
                ].map(({ label, valeur, Icon, accent }) => (
                  <Carte key={label} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={accent} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre, lineHeight: 1 }}>{valeur}</div>
                  </Carte>
                ))}
              </div>
            </div>

            {/* Profil biométrique */}
            {dashboard && (
              <Carte style={{ padding: '20px 24px', marginBottom: '14px' }}>
                <SectionTitre>Profil biométrique</SectionTitre>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'HRV (ms)',       valeur: dashboard.kpi.hrv_moyenne,   unite: ' ms',  accent: theme.secondary, Icon: Activity },
                    { label: 'FC repos (bpm)', valeur: dashboard.kpi.fc_repos,      unite: ' bpm', accent: '#EF4444',       Icon: Heart },
                    { label: 'Sommeil (h)',    valeur: dashboard.kpi.sommeil_moyen, unite: 'h',    accent: '#8B5CF6',       Icon: Moon },
                    { label: 'RPE moyen',      valeur: dashboard.kpi.rpe_moyen,     unite: '/10',  accent: '#F59E0B',       Icon: Zap },
                  ].map(({ label, valeur, unite, accent, Icon }) => (
                    <div key={label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '14px', borderLeft: `3px solid ${accent}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Icon size={12} color={accent} />
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{label}</span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', fontFamily: theme.policeTitre }}>
                        {valeur !== null && valeur !== undefined ? `${valeur}${unite}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </Carte>
            )}

            {/* Records personnels */}
            <Carte style={{ overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '18px 24px 14px' }}>
                <SectionTitre>Records personnels</SectionTitre>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#F8FAFC' }}>
                  <tr>
                    {['Distance', 'Meilleur chrono', 'Style', 'Vitesse moy.'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {performances.filter(p => p.temps_s && p.distance_m).length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Aucun record enregistré</td></tr>
                  ) : (
                    // Meilleur par distance
                    Object.entries(
                      performances.filter(p => p.temps_s && p.distance_m).reduce((acc, p) => {
                        const key = `${p.distance_m}-${p.style_nage}`
                        if (!acc[key] || p.temps_s! < acc[key].temps_s!) acc[key] = p
                        return acc
                      }, {} as Record<string, Performance>)
                    ).map(([, p], i) => (
                      <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: theme.primary }}>{p.distance_m}m</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre }}>{p.temps_s}s</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{p.style_nage ?? '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{p.vitesse_moy ? `${p.vitesse_moy} m/s` : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Carte>

            {/* Recommandations */}
            {dashboard?.recommandations && dashboard.recommandations.length > 0 && (
              <Carte style={{ padding: '20px 24px', marginBottom: '14px' }}>
                <SectionTitre>Recommandations</SectionTitre>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dashboard.recommandations.map((rec, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', color: '#1E40AF' }}>
                      {rec}
                    </div>
                  ))}
                </div>
              </Carte>
            )}

            {/* Danger zone */}
            <Carte style={{ padding: '20px 24px', border: '1px solid #FECACA', background: '#FFF8F8' }}>
              <SectionTitre>Zone de danger</SectionTitre>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                  Supprimer ce nageur et toutes ses données (sessions, biométries, performances).
                </p>
                <button onClick={() => handleSupprimer(nageurSelec.id, `${nageurSelec.prenom} ${nageurSelec.nom}`)} style={{ padding: '9px 18px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                  Supprimer ce nageur
                </button>
              </div>
            </Carte>
          </>
        )}
      </div>
    )
  }

  // ── Vue liste ──
  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>Nageurs</h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            {nageurs.length} athlète{nageurs.length !== 1 ? 's' : ''} enregistré{nageurs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setFormOuvert(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={15} /> Ajouter un nageur
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: messageOk ? '#F0FDF4' : '#FEF2F2', color: messageOk ? '#065F46' : '#DC2626', border: `1px solid ${messageOk ? '#BBF7D0' : '#FECACA'}` }}>
          {message}
        </div>
      )}

      {nageurs.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px dashed #E2E8F0', borderRadius: '12px', textAlign: 'center', padding: '60px' }}>
          <UserCircle size={40} color="#CBD5E1" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 500, color: '#475569', margin: 0 }}>Aucun nageur enregistré</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>Ajoutez votre premier athlète</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {nageurs.map(n => (
            <div key={n.id} onClick={() => ouvrirProfil(n)} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,85,255,0.10)'; (e.currentTarget as HTMLDivElement).style.borderColor = theme.primary }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>{initiales(n)}</span>
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', fontFamily: theme.policeTitre }}>{n.prenom} {n.nom}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{n.specialite ?? 'Spécialité non renseignée'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {n.niveau && <span style={{ background: '#EFF6FF', color: theme.primary, fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px' }}>{n.niveau}</span>}
                <span style={{ background: '#F0FDF4', color: '#065F46', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '20px' }}>Actif</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal ajout */}
      {formOuvert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setFormOuvert(false)}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px 32px', width: '440px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: theme.policeTitre, fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Ajouter un nageur</h2>
              <button onClick={() => setFormOuvert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {([
                  { label: 'Nom *',      key: 'nom',       required: true },
                  { label: 'Prénom *',   key: 'prenom',    required: true },
                  { label: 'Spécialité', key: 'specialite' },
                  { label: 'Niveau',     key: 'niveau' },
                ] as Array<{ label: string; key: keyof typeof form; required?: boolean }>).map(({ label: l, key, required }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>{l}</label>
                    <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={required} style={champ} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setFormOuvert(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Nageurs