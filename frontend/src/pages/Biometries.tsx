import { useState, FormEvent, useEffect } from 'react'
import { getNageurs, getBiometriesNageur, creerBiometrie } from '../api/api'
import type { Nageur, Biometrie, Utilisateur } from '../types'
import { Calendar, ChevronDown, Heart, Moon, Zap, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import theme from '../theme'

function Biometries({ utilisateur }: { utilisateur: Utilisateur }) {
  const estNageur   = utilisateur.role === 'nageur'
  const monNageurId = utilisateur.nageur_id

  const [nageurs,    setNageurs]    = useState<Nageur[]>([])
  const [biometries, setBiometries] = useState<Biometrie[]>([])
  const [form, setForm] = useState({
    nageur_id: estNageur && monNageurId ? String(monNageurId) : '',
    date: '', hrv_ms: '', fc_repos: '', rpe: '', sommeil_h: '',
  })
  const [message,      setMessage]      = useState('')
  const [messageOk,    setMessageOk]    = useState(true)
  const [formOuvert,   setFormOuvert]   = useState(false)

  useEffect(() => {
    if (estNageur) { if (monNageurId) void chargerBiometries(monNageurId) }
    else void chargerNageurs()
  }, [])

  const chargerNageurs = async () => {
    try { setNageurs(await getNageurs()) } catch { /* silencieux */ }
  }

  const chargerBiometries = async (id: number) => {
    try { setBiometries(await getBiometriesNageur(id)) } catch { /* silencieux */ }
  }

  const handleNageurChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setForm({ ...form, nageur_id: id })
    if (id) void chargerBiometries(parseInt(id))
    else setBiometries([])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cibleId = estNageur && monNageurId ? monNageurId : parseInt(form.nageur_id)
    try {
      await creerBiometrie({
        nageur_id:  cibleId,
        date:       form.date,
        hrv_ms:     form.hrv_ms    ? parseFloat(form.hrv_ms)    : null,
        fc_repos:   form.fc_repos  ? parseInt(form.fc_repos)    : null,
        rpe:        form.rpe       ? parseInt(form.rpe)         : null,
        sommeil_h:  form.sommeil_h ? parseFloat(form.sommeil_h) : null,
      })
      setMessage('Biométrie enregistrée avec succès')
      setMessageOk(true)
      setForm({ ...form, date: '', hrv_ms: '', fc_repos: '', rpe: '', sommeil_h: '' })
      setFormOuvert(false)
      void chargerBiometries(cibleId)
    } catch {
      setMessage("Erreur lors de l'enregistrement")
      setMessageOk(false)
    }
  }

  // ── Dernière biométrie pour les KPI ──
  const derniere = biometries[0] ?? null

  const couleurHrv     = (v: number | null) => !v ? '#94A3B8' : v < 50 ? '#EF4444' : v > 80 ? '#10B981' : '#0F172A'
  const couleurRpe     = (v: number | null) => !v ? '#94A3B8' : v >= 8  ? '#EF4444' : v <= 4  ? '#10B981' : '#F59E0B'
  const couleurSommeil = (v: number | null) => !v ? '#94A3B8' : v < 7   ? '#F59E0B' : '#10B981'

  const scoreRecup = derniere
    ? Math.round(
        ((derniere.hrv_ms    ?? 60) / 100 * 40) +
        ((derniere.sommeil_h ?? 7)  / 10  * 35) +
        ((10 - (derniere.rpe ?? 5)) / 10  * 25)
      )
    : null

  const scoreLabel = scoreRecup === null ? '—'
    : scoreRecup >= 75 ? 'Bonne forme'
    : scoreRecup >= 50 ? 'Modéré'
    : 'Fatigué'

  const scoreCouleur = scoreRecup === null ? '#94A3B8'
    : scoreRecup >= 75 ? '#10B981'
    : scoreRecup >= 50 ? '#F59E0B'
    : '#EF4444'

  function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', ...style }}>
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

  const champ: React.CSSProperties = {
    padding: '9px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
    fontSize: '14px', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: '100%',
  }

  // ── Alertes calculées depuis les données réelles ──
  const alertes: { texte: string; ok: boolean }[] = []
  if (derniere) {
    if (derniere.hrv_ms   && derniere.hrv_ms < 50)   alertes.push({ texte: 'HRV basse — surveiller la récupération', ok: false })
    if (derniere.hrv_ms   && derniere.hrv_ms > 80)   alertes.push({ texte: 'HRV excellente', ok: true })
    if (derniere.sommeil_h && derniere.sommeil_h >= 8) alertes.push({ texte: 'Sommeil en bonne quantité', ok: true })
    if (derniere.sommeil_h && derniere.sommeil_h < 7)  alertes.push({ texte: 'Sommeil insuffisant', ok: false })
    if (derniere.rpe      && derniere.rpe >= 8)       alertes.push({ texte: 'RPE élevé — charge perçue importante', ok: false })
    if (derniere.rpe      && derniere.rpe <= 4)       alertes.push({ texte: 'RPE faible — bonne tolérance à la charge', ok: true })
  }

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: '22px', color: '#0F172A', margin: 0 }}>
            Biométrie / Fatigue
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0' }}>
            Suivi de la récupération et du risque physiologique
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Sélecteur nageur entraîneur */}
          {!estNageur && (
            <select value={form.nageur_id} onChange={handleNageurChange} style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0',
              fontSize: '13px', background: '#FFFFFF', color: '#0F172A', cursor: 'pointer', outline: 'none',
            }}>
              <option value="">— Sélectionner un nageur —</option>
              {nageurs.map(n => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
            </select>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px',
            padding: '8px 12px', fontSize: '13px', color: '#475569',
          }}>
            <Calendar size={13} color="#94A3B8" />
            <span>Saison 2025</span>
            <ChevronDown size={12} color="#94A3B8" />
          </div>
          <button onClick={() => setFormOuvert(v => !v)} style={{
            padding: '8px 16px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}>
            + Saisir
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {/* Score récupération */}
        <Carte style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${scoreCouleur}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} color={scoreCouleur} />
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Score de récupération</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', fontFamily: theme.policeTitre, lineHeight: 1 }}>
            {scoreRecup ?? '—'}<span style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}> /100</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: scoreCouleur }}>{scoreLabel}</span>
        </Carte>

        {/* HRV */}
        <Carte style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={14} color={theme.secondary} />
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>HRV moyenne</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: couleurHrv(derniere?.hrv_ms ?? null), fontFamily: theme.policeTitre, lineHeight: 1 }}>
            {derniere?.hrv_ms ?? '—'}<span style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}>{derniere?.hrv_ms ? ' ms' : ''}</span>
          </div>
        </Carte>

        {/* Sommeil */}
        <Carte style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Moon size={14} color="#8B5CF6" />
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sommeil moyen</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: couleurSommeil(derniere?.sommeil_h ?? null), fontFamily: theme.policeTitre, lineHeight: 1 }}>
            {derniere?.sommeil_h ?? '—'}<span style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}>{derniere?.sommeil_h ? ' h' : ''}</span>
          </div>
        </Carte>

        {/* RPE */}
        <Carte style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#F59E0B" />
            </div>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Risque fatigue</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: couleurRpe(derniere?.rpe ?? null), fontFamily: theme.policeTitre, lineHeight: 1 }}>
            {scoreLabel}
          </div>
          {derniere?.rpe && (
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>RPE {derniere.rpe}/10</span>
          )}
        </Carte>
      </div>

      {/* ── Grille principale ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

        {/* État biométrique — tableau */}
        <Carte>
          <SectionTitre>État biométrique</SectionTitre>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'HRV',       valeur: derniere?.hrv_ms,    unite: ' ms',  couleur: couleurHrv(derniere?.hrv_ms    ?? null), Icon: Activity },
              { label: 'FC repos',  valeur: derniere?.fc_repos,  unite: ' bpm', couleur: '#EF4444',                               Icon: Heart },
              { label: 'Sommeil',   valeur: derniere?.sommeil_h, unite: ' h',   couleur: couleurSommeil(derniere?.sommeil_h ?? null), Icon: Moon },
              { label: 'RPE',       valeur: derniere?.rpe,       unite: '/10',  couleur: couleurRpe(derniere?.rpe       ?? null), Icon: Zap },
            ].map(({ label, valeur, unite, couleur, Icon }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px',
                borderLeft: `3px solid ${couleur}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={14} color={couleur} />
                  <span style={{ fontSize: '13px', color: '#475569' }}>{label}</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 700, color: couleur, fontFamily: theme.policeTitre }}>
                  {valeur !== null && valeur !== undefined ? `${valeur}${unite}` : '—'}
                </span>
              </div>
            ))}
          </div>
        </Carte>

        {/* Alertes & signaux */}
        <Carte>
          <SectionTitre>Alertes & signaux</SectionTitre>
          {alertes.length === 0 ? (
            <div style={{ color: '#94A3B8', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
              {biometries.length === 0 ? 'Aucune donnée biométrique' : 'Aucune alerte'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alertes.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '8px',
                  background: a.ok ? '#F0FDF4' : '#FFF7ED',
                  border: `1px solid ${a.ok ? '#BBF7D0' : '#FED7AA'}`,
                }}>
                  {a.ok
                    ? <CheckCircle  size={15} color="#10B981" />
                    : <AlertCircle size={15} color="#F59E0B" />
                  }
                  <span style={{ fontSize: '13px', color: a.ok ? '#065F46' : '#92400E' }}>{a.texte}</span>
                </div>
              ))}
            </div>
          )}
        </Carte>
      </div>

      {/* ── Historique tableau ── */}
      <Carte style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #F1F5F9' }}>
          <SectionTitre>Historique biométrique</SectionTitre>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F8FAFC' }}>
            <tr>
              {['Date', 'HRV (ms)', 'FC repos (bpm)', 'RPE', 'Sommeil (h)'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {biometries.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                {estNageur ? 'Aucune donnée biométrique' : (form.nageur_id ? 'Aucune donnée' : 'Sélectionnez un nageur')}
              </td></tr>
            ) : biometries.map((b, i) => (
              <tr key={b.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>{b.date}</td>
                <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700, color: couleurHrv(b.hrv_ms) }}>{b.hrv_ms ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: '14px', color: '#0F172A' }}>{b.fc_repos ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700, color: couleurRpe(b.rpe) }}>{b.rpe ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 700, color: couleurSommeil(b.sommeil_h) }}>{b.sommeil_h ? `${b.sommeil_h}h` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Carte>

      {/* ── Formulaire (panel glissant) ── */}
      {formOuvert && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }} onClick={() => setFormOuvert(false)}>
          <div style={{
            background: '#FFFFFF', borderRadius: '16px', padding: '28px 32px',
            width: '480px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: theme.policeTitre, fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>
              Saisir des données biométriques
            </h2>
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
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={champ} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {([
                  { label: 'HRV (ms)', key: 'hrv_ms', step: '0.1' },
                  { label: 'FC repos (bpm)', key: 'fc_repos', step: '1' },
                  { label: 'RPE (1–10)', key: 'rpe', step: '1', min: '1', max: '10' },
                  { label: 'Sommeil (h)', key: 'sommeil_h', step: '0.5' },
                ] as Array<{ label: string; key: keyof typeof form; step: string; min?: string; max?: string }>).map(({ label: l, key, step, min, max }) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '5px' }}>{l}</label>
                    <input type="number" step={step} min={min} max={max} value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })} style={champ} />
                  </div>
                ))}
              </div>
              {message && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: messageOk ? '#F0FDF4' : '#FEF2F2', color: messageOk ? '#065F46' : '#DC2626' }}>
                  {message}
                </div>
              )}
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

export default Biometries