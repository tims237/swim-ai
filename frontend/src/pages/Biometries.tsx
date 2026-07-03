import { useState, FormEvent, useEffect } from 'react'
import { getNageurs, getBiometriesNageur, creerBiometrie } from '../api/api'
import type { Nageur, Biometrie } from '../types'
import theme from '../theme'

function Biometries() {
  const [nageurs, setNageurs] = useState<Nageur[]>([])
  const [biometries, setBiometries] = useState<Biometrie[]>([])
  const [form, setForm] = useState({ nageur_id: '', date: '', hrv_ms: '', fc_repos: '', rpe: '', sommeil_h: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { void chargerNageurs() }, [])

  const chargerNageurs = async () => {
    try { setNageurs(await getNageurs()) } catch (_) { /* silencieux */ }
  }

  const chargerBiometries = async (id: number) => {
    try { setBiometries(await getBiometriesNageur(id)) } catch (_) { /* silencieux */ }
  }

  const handleNageurChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setForm({ ...form, nageur_id: id })
    if (id) void chargerBiometries(parseInt(id))
    else setBiometries([])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await creerBiometrie({
        nageur_id: parseInt(form.nageur_id),
        date: form.date,
        hrv_ms: form.hrv_ms ? parseFloat(form.hrv_ms) : null,
        fc_repos: form.fc_repos ? parseInt(form.fc_repos) : null,
        rpe: form.rpe ? parseInt(form.rpe) : null,
        sommeil_h: form.sommeil_h ? parseFloat(form.sommeil_h) : null,
      })
      setMessage('✅ Biométrie enregistrée !')
      setForm({ ...form, date: '', hrv_ms: '', fc_repos: '', rpe: '', sommeil_h: '' })
      void chargerBiometries(parseInt(form.nageur_id))
    } catch (_) {
      setMessage('❌ Erreur lors de l\'enregistrement')
    }
  }

  const couleurHrv = (v: number | null) => { if (!v) return theme.texte; if (v < 50) return theme.danger; if (v > 80) return theme.succes; return theme.texte }
  const couleurRpe = (v: number | null) => { if (!v) return theme.texte; if (v >= 8) return theme.danger; if (v <= 4) return theme.succes; return theme.texte }
  const couleurSommeil = (v: number | null) => { if (!v) return theme.texte; if (v < 7) return theme.warning; if (v >= 8) return theme.succes; return theme.texte }

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
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '24px', fontSize: '28px', fontWeight: 800 }}>Biométries</h1>

      <div style={{ ...carte, marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontFamily: theme.policeTitre, color: theme.neutral }}>Saisir des données biométriques</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={label}>Nageur *</label>
            <select value={form.nageur_id} onChange={handleNageurChange} required style={{ ...champ, cursor: 'pointer' }}>
              <option value="">Sélectionner...</option>
              {nageurs.map((n) => <option key={n.id} value={n.id}>{n.prenom} {n.nom}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={label}>Date *</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required style={champ} />
          </div>
          {([
            { label: 'HRV (ms)', key: 'hrv_ms', step: '0.1' },
            { label: 'FC repos (bpm)', key: 'fc_repos', step: '1' },
            { label: 'RPE (1-10)', key: 'rpe', step: '1', min: '1', max: '10' },
            { label: 'Sommeil (h)', key: 'sommeil_h', step: '0.5' },
          ] as Array<{ label: string; key: keyof typeof form; step: string; min?: string; max?: string }>).map(({ label: l, key, step, min, max }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={label}>{l}</label>
              <input type="number" step={step} min={min} max={max} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{ ...champ, width: '110px' }} />
            </div>
          ))}
          <button type="submit" style={{
            padding: '11px 24px', background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
          }}>Enregistrer</button>
        </form>
        {message && <p style={{ marginTop: '14px', fontSize: '14px', fontWeight: 600, color: message.startsWith('✅') ? theme.succes : theme.danger }}>{message}</p>}
      </div>

      <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: theme.tertiary }}>
            <tr>
              {['Date', 'HRV (ms)', 'FC repos', 'RPE', 'Sommeil'].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: theme.texteDoux, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {biometries.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: theme.texteDoux }}>
                {form.nageur_id ? 'Aucune donnée' : 'Sélectionnez un nageur'}
              </td></tr>
            ) : biometries.map((b) => (
              <tr key={b.id} style={{ borderTop: `1px solid ${theme.bordure}` }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{b.date}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: couleurHrv(b.hrv_ms) }}>{b.hrv_ms ?? '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{b.fc_repos ?? '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: couleurRpe(b.rpe) }}>{b.rpe ?? '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: couleurSommeil(b.sommeil_h) }}>{b.sommeil_h ? `${b.sommeil_h}h` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Biometries
