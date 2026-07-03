import { useState, FormEvent, useEffect } from 'react'
import { resetPasswordParToken } from '../api/api'
import theme from '../theme'

function ResetPassword() {
  const [token, setToken] = useState('')
  const [form, setForm] = useState({ nouveau: '', confirm: '' })
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState(false)
  const [chargement, setChargement] = useState(false)

  // Récupère le token depuis l'URL : /reset-password?token=<UUID>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) setToken(t)
    else setErreur('Lien invalide. Veuillez faire une nouvelle demande.')
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (form.nouveau.length < 8) return setErreur('Le mot de passe doit contenir au moins 8 caractères')
    if (form.nouveau !== form.confirm) return setErreur('Les mots de passe ne correspondent pas')
    setChargement(true)
    try {
      await resetPasswordParToken(token, form.nouveau)
      setSucces(true)
    } catch (_) {
      setErreur('Lien invalide ou expiré. Veuillez faire une nouvelle demande.')
    } finally {
      setChargement(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: `1px solid ${theme.bordure}`,
    borderRadius: '10px', fontSize: '14px', fontFamily: theme.policeTexte,
    color: theme.texte, background: theme.blanc, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.tertiary }}>
      <div style={{
        background: theme.blanc, padding: '40px', borderRadius: '20px',
        width: '400px', border: `1px solid ${theme.bordure}`,
        boxShadow: '0 10px 40px rgba(15,23,42,0.08)', fontFamily: theme.policeTexte,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔑</div>
          <h1 style={{ fontFamily: theme.policeTitre, fontSize: '22px', fontWeight: 800, color: theme.neutral, margin: 0 }}>
            Nouveau mot de passe
          </h1>
        </div>

        {succes ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <p style={{ color: theme.succes, fontWeight: 600, fontSize: '15px', margin: 0 }}>✅ Mot de passe mis à jour !</p>
            </div>
            <a href="/" style={{
              display: 'block', padding: '13px', borderRadius: '10px', textDecoration: 'none',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.blanc, fontWeight: 700, fontSize: '15px',
            }}>Se connecter</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: theme.texte }}>
                Nouveau mot de passe <span style={{ color: theme.texteDoux, fontWeight: 400 }}>(min. 8 car.)</span>
              </label>
              <input type="password" value={form.nouveau} onChange={(e) => setForm({ ...form, nouveau: e.target.value })} required style={inputStyle} placeholder="••••••••" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: theme.texte }}>
                Confirmer le mot de passe
              </label>
              <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required style={inputStyle} placeholder="••••••••" />
            </div>

            {erreur && <p style={{ color: theme.danger, fontSize: '13px', textAlign: 'center' }}>{erreur}</p>}

            <button type="submit" disabled={chargement || !token} style={{
              padding: '13px', background: (chargement || !token) ? '#94A3B8' : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.blanc, border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 700, cursor: (chargement || !token) ? 'not-allowed' : 'pointer',
            }}>
              {chargement ? 'Mise à jour...' : 'Confirmer le nouveau mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
