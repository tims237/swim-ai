import { useState, useEffect } from 'react'
import { getNageurs, creerNageur, supprimerNageur } from '../api/api'
import type { Nageur } from '../types'
import theme from '../theme'

function Nageurs() {
  const [nageurs, setNageurs] = useState<Nageur[]>([])
  const [form, setForm] = useState({ nom: '', prenom: '', specialite: '', niveau: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { void charger() }, [])

  const charger = async () => {
    try { setNageurs(await getNageurs()) } catch (_) { /* silencieux */ }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await creerNageur({ ...form, specialite: form.specialite || undefined, niveau: form.niveau || undefined })
      setMessage('✅ Nageur créé avec succès !')
      setForm({ nom: '', prenom: '', specialite: '', niveau: '' })
      void charger()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setMessage('❌ ' + (e.response?.data?.detail ?? 'Erreur inconnue'))
    }
  }

  const handleSupprimer = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer ${nom} et toutes ses données ?`)) return
    try {
      await supprimerNageur(id)
      void charger()
    } catch (_) {
      setMessage('❌ Erreur lors de la suppression')
    }
  }

  const carte: React.CSSProperties = {
    background: theme.fondCarte, padding: '24px', borderRadius: '16px',
    border: `1px solid ${theme.bordure}`, boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
  }
  const champ: React.CSSProperties = {
    padding: '10px 12px', borderRadius: '10px', border: `1px solid ${theme.bordure}`,
    fontSize: '14px', fontFamily: theme.policeTexte, color: theme.texte, outline: 'none', background: theme.blanc,
  }
  const label: React.CSSProperties = { fontSize: '13px', color: theme.texteDoux, fontWeight: 600 }

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '24px', fontSize: '28px', fontWeight: 800 }}>Nageurs</h1>

      <div style={{ ...carte, marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontFamily: theme.policeTitre, color: theme.neutral }}>Ajouter un nageur</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          {([
            { label: 'Nom *', key: 'nom', required: true },
            { label: 'Prénom *', key: 'prenom', required: true },
            { label: 'Spécialité', key: 'specialite' },
            { label: 'Niveau', key: 'niveau' },
          ] as Array<{ label: string; key: keyof typeof form; required?: boolean }>).map(({ label: l, key, required }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={label}>{l}</label>
              <input
                value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={required} style={champ}
                onFocus={(e) => { e.target.style.border = `1px solid ${theme.primary}` }}
                onBlur={(e) => { e.target.style.border = `1px solid ${theme.bordure}` }}
              />
            </div>
          ))}
          <button type="submit" style={{
            padding: '11px 24px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          }}>Ajouter</button>
        </form>
        {message && <p style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: message.startsWith('✅') ? theme.succes : theme.danger }}>{message}</p>}
      </div>

      <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: theme.tertiary }}>
            <tr>
              {['Nom', 'Prénom', 'Spécialité', 'Niveau', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: theme.texteDoux, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nageurs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: theme.texteDoux }}>Aucun nageur enregistré</td></tr>
            ) : nageurs.map((n) => (
              <tr key={n.id} style={{ borderTop: `1px solid ${theme.bordure}` }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: theme.neutral }}>{n.nom}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{n.prenom}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{n.specialite ?? '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{n.niveau ?? '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button onClick={() => handleSupprimer(n.id, `${n.prenom} ${n.nom}`)} style={{
                    padding: '6px 12px', background: `${theme.danger}15`, color: theme.danger,
                    border: `1px solid ${theme.danger}40`, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Nageurs
