import { useState } from 'react'
import { motDePasseOublie } from '../api/api'
import theme from '../theme'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [chargement, setChargement] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setChargement(true)
    await motDePasseOublie(email)
    // On affiche toujours le message de succès (sécurité anti-énumération)
    setEnvoye(true)
    setChargement(false)
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
          <h1 style={{ fontFamily: theme.policeTitre, fontSize: '22px', fontWeight: 800, color: theme.neutral, margin: 0 }}>
            Mot de passe oublié
          </h1>
          <p style={{ color: theme.texteDoux, fontSize: '14px', marginTop: '8px' }}>
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {envoye ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <p style={{ color: theme.succes, fontWeight: 600, fontSize: '15px', margin: 0 }}>
                ✅ Email envoyé !
              </p>
              <p style={{ color: theme.texteDoux, fontSize: '13px', marginTop: '8px' }}>
                Si cet email est enregistré, vous recevrez un lien valable 30 minutes.
              </p>
            </div>
            <a href="/" style={{ color: theme.primary, fontSize: '14px', fontWeight: 600 }}>← Retour à la connexion</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: theme.texte }}>
                Adresse email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required style={inputStyle} placeholder="votre@email.com"
              />
            </div>

            <button type="submit" disabled={chargement || !email} style={{
              padding: '13px', background: (chargement || !email) ? '#94A3B8' : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.blanc, border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 700, cursor: (chargement || !email) ? 'not-allowed' : 'pointer',
            }}>
              {chargement ? 'Envoi...' : 'Envoyer le lien'}
            </button>

            <a href="/" style={{ textAlign: 'center', color: theme.texteDoux, fontSize: '13px' }}>
              ← Retour à la connexion
            </a>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
