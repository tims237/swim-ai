import { useState, FormEvent, useEffect } from 'react'
import { getSessions, creerSession, getNageurs } from '../api/api'
import type { Session, Nageur, TypeSeance } from '../types'
import theme from '../theme'

const TYPES_SEANCE: TypeSeance[] = ['endurance', 'sprint', 'technique', 'récupération']

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [nageurs, setNageurs] = useState<Nageur[]>([])
  const [form, setForm] = useState({ nageur_id: '', date: '', type_seance: '', duree_min: '' })
  const [filtreNageur, setFiltreNageur] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    void chargerSessions()
    void chargerNageurs()
  }, [])

  const chargerSessions = async () => {
    try { setSessions(await getSessions()) } catch (_) { /* silencieux */ }
  }

  const chargerNageurs = async () => {
    try { setNageurs(await getNageurs()) } catch (_) { /* silencieux */ }
  }

  const nomNageur = (id: number) => {
    const n = nageurs.find((x) => x.id === id)
    return n ? `${n.prenom} ${n.nom}` : `Nageur #${id}`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await creerSession({
        nageur_id: parseInt(form.nageur_id),
        date: form.date,
        type_seance: (form.type_seance as TypeSeance) || null,
        duree_min: form.duree_min ? parseInt(form.duree_min) : null,
      })
      setMessage('✅ Session créée avec succès !')
      setForm({ nageur_id: '', date: '', type_seance: '', duree_min: '' })
      void chargerSessions()
    } catch (_) {
      setMessage('❌ Erreur lors de la création de la session')
    }
  }

  const sessionsAffichees = sessions
    .filter((s) => !filtreNageur || s.nageur_id === parseInt(filtreNageur))
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const carte: React.CSSProperties = {
    background: theme.fondCarte, padding: '24px', borderRadius: '16px',
    border: `1px solid ${theme.bordure}`,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
  }

  const champ: React.CSSProperties = {
    padding: '10px 12px', borderRadius: '10px',
    border: `1px solid ${theme.bordure}`, fontSize: '14px',
    fontFamily: theme.policeTexte, color: theme.texte, outline: 'none',
    background: theme.blanc,
  }

  const label: React.CSSProperties = { fontSize: '13px', color: theme.texteDoux, fontWeight: 600 }

  const COULEURS_TYPE: Record<TypeSeance, string> = {
    endurance: theme.primary,
    sprint: theme.warning,
    technique: '#8b5cf6',
    récupération: theme.succes,
  }

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '24px', fontSize: '28px', fontWeight: 800 }}>
        Sessions
      </h1>

      <div style={{ ...carte, marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontFamily: theme.policeTitre, color: theme.neutral }}>
          Ajouter une session
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          {[
            { label: 'Nageur *', content: (
              <select value={form.nageur_id} onChange={(e) => setForm({ ...form, nageur_id: e.target.value })} required style={{ ...champ, cursor: 'pointer' }}>
                <option value="">Sélectionner...</option>
                {nageurs.map((n) => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
              </select>
            )},
            { label: 'Date *', content: (
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={champ} />
            )},
            { label: 'Type de séance', content: (
              <select value={form.type_seance} onChange={(e) => setForm({ ...form, type_seance: e.target.value })} style={{ ...champ, cursor: 'pointer' }}>
                <option value="">Sélectionner...</option>
                {TYPES_SEANCE.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )},
            { label: 'Durée (min)', content: (
              <input type="number" value={form.duree_min} onChange={(e) => setForm({ ...form, duree_min: e.target.value })} style={{ ...champ, width: '110px' }} min={1} max={300} />
            )},
          ].map(({ label: l, content }) => (
            <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={label}>{l}</label>
              {content}
            </div>
          ))}
          <button type="submit" style={{
            padding: '11px 24px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          }}>
            Ajouter
          </button>
        </form>
        {message && (
          <p style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: message.startsWith('✅') ? theme.succes : theme.danger }}>
            {message}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <label style={{ ...label, marginBottom: 0 }}>Filtrer :</label>
        <select value={filtreNageur} onChange={(e) => setFiltreNageur(e.target.value)} style={{ ...champ, cursor: 'pointer', minWidth: '220px' }}>
          <option value="">Tous les nageurs</option>
          {nageurs.map((n) => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
        </select>
        <span style={{ color: theme.texteDoux, fontSize: '13px' }}>{sessionsAffichees.length} session(s)</span>
      </div>

      <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: theme.tertiary }}>
            <tr>
              {['Nageur', 'Date', 'Type', 'Durée'].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: theme.texteDoux, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessionsAffichees.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: theme.texteDoux }}>Aucune session</td></tr>
            ) : sessionsAffichees.map((s) => (
              <tr key={s.id} style={{ borderTop: `1px solid ${theme.bordure}` }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: theme.neutral }}>{nomNageur(s.nageur_id)}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{s.date}</td>
                <td style={{ padding: '14px 16px' }}>
                  {s.type_seance ? (
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                      background: `${COULEURS_TYPE[s.type_seance]}20`,
                      color: COULEURS_TYPE[s.type_seance],
                    }}>{s.type_seance}</span>
                  ) : '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{s.duree_min ? `${s.duree_min} min` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Sessions
