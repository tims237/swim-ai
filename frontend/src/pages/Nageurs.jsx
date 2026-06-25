import { useState, useEffect } from 'react'
import { getNageurs, creerNageur } from '../api/api'
import theme from '../theme'

function Nageurs() {
  const [nageurs, setNageurs] = useState([])
  const [form, setForm] = useState({
    nom: '', prenom: '', specialite: '', niveau: ''
  })
  const [message, setMessage] = useState('')

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await creerNageur(form)
      setMessage('✅ Nageur créé avec succès !')
      setForm({ nom: '', prenom: '', specialite: '', niveau: '' })
      chargerNageurs()
    } catch (err) {
      setMessage('❌ Erreur : ' + (err.response?.data?.detail || 'inconnue'))
    }
  }

  const carte = {
    background: theme.fondCarte,
    padding: '24px',
    borderRadius: '16px',
    border: `1px solid ${theme.bordure}`,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.06)',
  }

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <h1 style={{ fontFamily: theme.policeTitre, color: theme.neutral, marginBottom: '24px', fontSize: '28px', fontWeight: 800 }}>
        Nageurs
      </h1>

      {/* Formulaire */}
      <div style={{ ...carte, marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontFamily: theme.policeTitre, color: theme.neutral }}>
          Ajouter un nageur
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          {[
            { label: 'Nom *', key: 'nom', required: true },
            { label: 'Prénom *', key: 'prenom', required: true },
            { label: 'Spécialité', key: 'specialite' },
            { label: 'Niveau', key: 'niveau' },
          ].map(({ label, key, required }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', color: theme.texteDoux, fontWeight: 600 }}>{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={required}
                style={{
                  padding: '10px 12px', borderRadius: '10px',
                  border: `1px solid ${theme.bordure}`, fontSize: '14px',
                  fontFamily: theme.policeTexte, color: theme.texte, outline: 'none',
                  background: theme.blanc,
                }}
                onFocus={(e) => (e.target.style.border = `1px solid ${theme.primary}`)}
                onBlur={(e) => (e.target.style.border = `1px solid ${theme.bordure}`)}
              />
            </div>
          ))}
          <button type="submit" style={{
            padding: '11px 24px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px', fontWeight: 700,
            fontFamily: theme.policeTexte,
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

      {/* Liste */}
      <div style={{ ...carte, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: theme.tertiary }}>
            <tr>
              {['ID', 'Nom', 'Prénom', 'Spécialité', 'Niveau'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: theme.texteDoux, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nageurs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: theme.texteDoux }}>Aucun nageur enregistré</td></tr>
            ) : nageurs.map(n => (
              <tr key={n.id} style={{ borderTop: `1px solid ${theme.bordure}` }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texteDoux }}>{n.id}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: theme.neutral }}>{n.nom}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{n.prenom}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{n.specialite || '—'}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: theme.texte }}>{n.niveau || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Nageurs