import { useState, FormEvent, useEffect } from 'react'
import { getNageurs, getSessionsNageur, getPerformancesNageur, creerPerformance } from '../api/api'
import type { Nageur, Session, Performance, StyleNage, Utilisateur } from '../types'
import { Calendar, ChevronDown, Plus, X, Timer, Zap, Target, TrendingUp } from 'lucide-react'
import theme from '../theme'

const STYLES: StyleNage[] = ['crawl', 'dos', 'brasse', 'papillon', '4 nages']
const DISTANCES = [50, 100, 200, 400, 800, 1500]

const COULEURS_STYLE: Record<StyleNage, { bg: string; text: string }> = {
  crawl:     { bg: '#EFF6FF', text: theme.primary },
  dos:       { bg: '#F5F3FF', text: '#8B5CF6' },
  brasse:    { bg: '#F0FDF4', text: '#10B981' },
  papillon:  { bg: '#FFF7ED', text: '#F59E0B' },
  '4 nages': { bg: '#F8FAFC', text: '#64748B' },
}

interface PerformancesProps { utilisateur: Utilisateur }

function Performances({ utilisateur }: PerformancesProps) {
  const estNageur   = utilisateur.role === 'nageur'
  const monNageurId = utilisateur.nageur_id

  const [nageurs,      setNageurs]      = useState<Nageur[]>([])
  const [sessions,     setSessions]     = useState<Session[]>([])
  const [performances, setPerformances] = useState<Performance[]>([])
  const [nageurId,     setNageurId]     = useState<string>(
    estNageur && monNageurId ? String(monNageurId) : ''
  )
  const [form,         setForm]         = useState({
    nageur_id: estNageur && monNageurId ? String(monNageurId) : '',
    session_id: '', distance_m: '', temps_s: '', style_nage: '',
  })
  const [message,      setMessage]      = useState('')
  const [messageOk,    setMessageOk]    = useState(true)
  const [formOuvert,   setFormOuvert]   = useState(false)

  useEffect(() => {
    if (estNageur && monNageurId) {
      void chargerDonnees(monNageurId)
    } else {
      void chargerNageurs()
    }
  }, [])

  const chargerNageurs = async () => {
    try { setNageurs(await getNageurs()) } catch { /* silencieux */ }
  }

  const chargerDonnees = async (id: number) => {
    try {
      const [s, p] = await Promise.all([
        getSessionsNageur(id),
        getPerformancesNageur(id),
      ])
      setSessions(s)
      setPerformances(p)
    } catch { /* silencieux */ }
  }

  const handleNageurChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setNageurId(id)
    setForm({ ...form, nageur_id: id, session_id: '' })
    if (id) await chargerDonnees(parseInt(id))
    else { setSessions([]); setPerformances([]) }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const dist   = parseInt(form.distance_m)
      const temps  = parseFloat(form.temps_s)
      const vitesse = dist && temps ? parseFloat((dist / temps).toFixed(2)) : null
      await creerPerformance({
        session_id: parseInt(form.session_id),
        distance_m: dist || null,
        temps_s:    temps || null,
        style_nage: (form.style_nage as StyleNage) || null,
        vitesse_moy: vitesse,
      })
      setMessage('Performance enregistrée avec succès')
      setMessageOk(true)
      setFormOuvert(false)
      const cibleId = estNageur && monNageurId ? monNageurId : parseInt(form.nageur_id)
      setPerformances(await getPerformancesNageur(cibleId))
    } catch {
      setMessage("Erreur lors de l'enregistrement")
      setMessageOk(false)
    }
  }

  // ── KPI depuis les données réelles ──
  const meilleurChrono = performances.length
    ? Math.min(...performances.filter(p => p.temps_s).map(p => p.temps_s!))
    : null

  const dernierChrono = performances.find(p => p.temps_s)?.temps_s ?? null

  const progression = meilleurChrono && dernierChrono && dernierChrono !== meilleurChrono
    ? parseFloat(((dernierChrono - meilleurChrono) / meilleurChrono * 100).toFixed(2))
    : null

  const vitesseMoy = performances.filter(p => p.vitesse_moy).length
    ? parseFloat((performances.filter(p => p.vitesse_moy).reduce((a, p) => a + p.vitesse_moy!, 0) / performances.filter(p => p.vitesse_moy).length).toFixed(2))
    : null

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
      <h3 style={{ fontFamily: theme.policeTitre, fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
        {children}
      </h3>
    )
  }

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
            Performance
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            Analyse des chronos et progression saison 2025
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!estNageur && (
            <select value={nageurId} onChange={handleNageurChange} style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
              fontSize: '13px', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer', outline: 'none',
            }}>
              <option value="">— Sélectionner un nageur —</option>
              {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
            </select>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#475569' }}>
            <Calendar size={13} color="#94A3B8" />
            <span>Saison 2025</span>
            <ChevronDown size={12} color="#94A3B8" />
          </div>
          <button onClick={() => setFormOuvert(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>
            <Plus size={15} /> Nouvelle performance
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          marginBottom: '16px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          background: messageOk ? '#F0FDF4' : '#FEF2F2',
          color:      messageOk ? '#065F46'  : '#DC2626',
          border:     `1px solid ${messageOk ? '#BBF7D0' : '#FECACA'}`,
        }}>
          {message}
        </div>
      )}

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          {
            label: 'Meilleur chrono', Icon: Timer, accent: theme.primary,
            valeur: meilleurChrono ? `${meilleurChrono}s` : '—',
            sous: dernierChrono && meilleurChrono && dernierChrono !== meilleurChrono
              ? `↓ ${Math.abs(dernierChrono - meilleurChrono).toFixed(2)}s vs saison 2024`
              : 'Aucune donnée',
          },
          {
            label: 'Progression 4 semaines', Icon: TrendingUp, accent: progression !== null && progression < 0 ? '#10B981' : '#F59E0B',
            valeur: progression !== null ? `${progression > 0 ? '+' : ''}${progression}%` : '—',
            sous: progression !== null
              ? progression < 0 ? 'Amélioration' : 'À améliorer'
              : 'Aucune donnée',
          },
          {
            label: 'Vitesse moyenne', Icon: Zap, accent: theme.secondary,
            valeur: vitesseMoy ? `${vitesseMoy} m/s` : '—',
            sous: performances.filter(p => p.vitesse_moy).length > 1
              ? `↑ ${(vitesseMoy! - performances.filter(p => p.vitesse_moy).slice(-1)[0]?.vitesse_moy!).toFixed(2)} m/s avg`
              : 'Aucune donnée',
          },
          {
            label: 'Objectif saison', Icon: Target, accent: '#10B981',
            valeur: meilleurChrono ? `${(meilleurChrono * 0.98).toFixed(2)}s` : '—',
            sous: meilleurChrono ? `Écart actuel : ${(meilleurChrono - meilleurChrono * 0.98).toFixed(2)}s` : 'Aucune donnée',
          },
        ].map(({ label, Icon, accent, valeur, sous }) => (
          <Carte key={label} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={accent} />
              </div>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre, lineHeight: 1, marginBottom: '6px' }}>
              {valeur}
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{sous}</div>
          </Carte>
        ))}
      </div>

      {/* Tableau + Dernières compétitions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '14px', alignItems: 'start' }}>

        {/* Tableau performances */}
        <Carte style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
            <SectionTitre>
              Évolution des chronos
            </SectionTitre>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F8FAFC' }}>
              <tr>
                {['Session', 'Distance', 'Chrono', 'Style', 'Vitesse moy.'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {performances.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                    {!estNageur && !nageurId ? 'Sélectionnez un nageur' : 'Aucune performance enregistrée'}
                  </td>
                </tr>
              ) : performances.map((p, i) => (
                <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#64748B' }}>#{p.session_id}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>
                    {p.distance_m ? `${p.distance_m}m` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 800, color: theme.primary, fontFamily: theme.policeTitre }}>
                    {p.temps_s ? `${p.temps_s}s` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {p.style_nage ? (
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: COULEURS_STYLE[p.style_nage].bg,
                        color:      COULEURS_STYLE[p.style_nage].text,
                      }}>
                        {p.style_nage}
                      </span>
                    ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>
                    {p.vitesse_moy ? `${p.vitesse_moy} m/s` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Carte>

        {/* Panneau droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Dernières compétitions / meilleures perfs par distance */}
          <Carte style={{ padding: '20px 24px' }}>
            <SectionTitre>Dernières compétitions</SectionTitre>
            {performances.filter(p => p.temps_s && p.distance_m).length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                Aucune performance disponible
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Distance', 'Chrono', 'Style'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {performances.filter(p => p.temps_s && p.distance_m).slice(0, 5).map((p, i) => (
                    <tr key={p.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#475569' }}>
                        {p.distance_m}m
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '14px', fontWeight: 800, color: theme.primary, fontFamily: theme.policeTitre }}>
                        {p.temps_s}s
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        {p.style_nage ? (
                          <span style={{
                            padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                            background: COULEURS_STYLE[p.style_nage].bg,
                            color:      COULEURS_STYLE[p.style_nage].text,
                          }}>
                            {p.style_nage}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Carte>

          {/* Progression par distance */}
          <Carte style={{ padding: '20px 24px' }}>
            <SectionTitre>Progression par distance</SectionTitre>
            {DISTANCES.filter(d => performances.some(p => p.distance_m === d && p.temps_s)).length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
                Aucune donnée par distance
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DISTANCES.filter(d => performances.some(p => p.distance_m === d && p.temps_s)).map(d => {
                  const perfsD   = performances.filter(p => p.distance_m === d && p.temps_s).sort((a, b) => a.temps_s! - b.temps_s!)
                  const meilleur = perfsD[0]?.temps_s
                  const dernier  = performances.filter(p => p.distance_m === d && p.temps_s).slice(-1)[0]?.temps_s
                  const diff     = meilleur && dernier ? parseFloat((dernier - meilleur).toFixed(2)) : null
                  return (
                    <div key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', borderLeft: `3px solid ${theme.primary}` }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>{d}m</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: theme.primary, fontFamily: theme.policeTitre }}>{meilleur}s</div>
                      </div>
                      {diff !== null && (
                        <span style={{ fontSize: '12px', fontWeight: 600, color: diff <= 0 ? '#10B981' : '#F59E0B' }}>
                          {diff <= 0 ? '↓' : '↑'} {Math.abs(diff)}s
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Carte>
        </div>
      </div>

      {/* Modal */}
      {formOuvert && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          onClick={() => setFormOuvert(false)}
        >
          <div
            style={{ background: '#FFFFFF', borderRadius: '16px', padding: '28px 32px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: theme.policeTitre, fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Nouvelle performance
              </h2>
              <button onClick={() => setFormOuvert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!estNageur && (
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Nageur *</label>
                  <select value={form.nageur_id} onChange={handleNageurChange} required style={champ}>
                    <option value="">Sélectionner...</option>
                    {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Session *</label>
                <select value={form.session_id} onChange={e => setForm({ ...form, session_id: e.target.value })} required style={champ}>
                  <option value="">Sélectionner...</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>#{s.id} — {s.date} ({s.type_seance ?? 'sans type'})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Style de nage</label>
                  <select value={form.style_nage} onChange={e => setForm({ ...form, style_nage: e.target.value })} style={champ}>
                    <option value="">Sélectionner...</option>
                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Distance (m)</label>
                  <select value={form.distance_m} onChange={e => setForm({ ...form, distance_m: e.target.value })} style={champ}>
                    <option value="">Sélectionner...</option>
                    {DISTANCES.map(d => <option key={d} value={d}>{d}m</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Chrono (secondes) *</label>
                <input type="number" step="0.01" value={form.temps_s} onChange={e => setForm({ ...form, temps_s: e.target.value })} required style={champ} placeholder="ex: 58.24" />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setFormOuvert(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', cursor: 'pointer', fontSize: '14px' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Performances