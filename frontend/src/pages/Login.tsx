import { useState } from 'react'
import { login } from '../api/api'
import theme from '../theme'

interface LoginProps {
  onLoginReussi: () => void
}

function Login({ onLoginReussi }: LoginProps) {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [vue, setVue] = useState<'login' | 'choix-inscription'>('login')

  const handleConnexion = async () => {
    setErreur('')
    setChargement(true)
    try {
      const data = await login(email, motDePasse)
      localStorage.setItem('token', data.access_token)
      onLoginReussi()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      const detail = err.response?.data?.detail
      setErreur(typeof detail === 'string' ? detail : 'Email ou mot de passe incorrect')
    } finally {
      setChargement(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${theme.bordure}`,
    borderRadius: '10px',
    boxSizing: 'border-box',
    fontFamily: theme.policeTexte,
    fontSize: '14px',
    color: theme.texte,
    background: theme.blanc,
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    color: theme.texte,
    fontSize: '13px',
    fontWeight: 600,
  }

  if (vue === 'choix-inscription') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: theme.tertiary,
      }}>
        <div style={{
          background: theme.blanc, padding: '40px', borderRadius: '20px',
          width: '380px', border: `1px solid ${theme.bordure}`,
          boxShadow: '0 10px 40px rgba(15,23,42,0.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '16px',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              marginBottom: '14px', fontSize: '28px',
            }}>🏊</div>
            <h1 style={{ fontFamily: theme.policeTitre, fontSize: '22px', fontWeight: 800, color: theme.neutral, margin: 0 }}>
              Créer un compte
            </h1>
            <p style={{ color: theme.texteDoux, fontSize: '14px', marginTop: '6px' }}>
              Quel est votre rôle ?
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/register/nageur" style={{
              display: 'block', padding: '16px', borderRadius: '12px',
              border: `2px solid ${theme.primary}`, textDecoration: 'none',
              background: `${theme.primary}10`,
            }}>
              <div style={{ fontWeight: 700, color: theme.primary, fontSize: '15px' }}>🏊 Je suis nageur</div>
              <div style={{ fontSize: '13px', color: theme.texteDoux, marginTop: '4px' }}>
                Accès à mon dashboard, mes chronos, ma récupération
              </div>
            </a>
            <a href="/register/entraineur" style={{
              display: 'block', padding: '16px', borderRadius: '12px',
              border: `2px solid ${theme.secondary}`, textDecoration: 'none',
              background: `${theme.secondary}10`,
            }}>
              <div style={{ fontWeight: 700, color: theme.secondary, fontSize: '15px' }}>🧑‍🏫 Je suis entraîneur</div>
              <div style={{ fontSize: '13px', color: theme.texteDoux, marginTop: '4px' }}>
                Accès à la vue équipe, toutes les données, export CSV
              </div>
            </a>
          </div>

          <button onClick={() => setVue('login')} style={{
            marginTop: '20px', width: '100%', padding: '10px',
            background: 'transparent', border: 'none', color: theme.texteDoux,
            fontSize: '13px', cursor: 'pointer',
          }}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: theme.tertiary, fontFamily: theme.policeTexte,
    }}>
      <div style={{
        background: theme.blanc, padding: '40px', borderRadius: '20px',
        width: '380px', border: `1px solid ${theme.bordure}`,
        boxShadow: '0 10px 40px rgba(15,23,42,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            marginBottom: '14px', fontSize: '28px',
          }}>🏊</div>
          <h1 style={{ fontFamily: theme.policeTitre, fontSize: '26px', fontWeight: 800, color: theme.neutral, margin: 0 }}>
            Swim AI
          </h1>
          <p style={{ color: theme.texteDoux, fontSize: '14px', marginTop: '6px' }}>
            Connexion à votre espace
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnexion()}
            placeholder="coach@swimai.com" style={inputStyle}
            onFocus={(e) => { e.target.style.border = `1px solid ${theme.primary}` }}
            onBlur={(e) => { e.target.style.border = `1px solid ${theme.bordure}` }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={labelStyle}>Mot de passe</label>
          <input
            type="password" value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnexion()}
            placeholder="••••••••" style={inputStyle}
            onFocus={(e) => { e.target.style.border = `1px solid ${theme.primary}` }}
            onBlur={(e) => { e.target.style.border = `1px solid ${theme.bordure}` }}
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <a href="/forgot-password" style={{ fontSize: '13px', color: theme.primary, textDecoration: 'none' }}>
            Mot de passe oublié ?
          </a>
        </div>

        {erreur && (
          <p style={{ color: theme.danger, fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {erreur}
          </p>
        )}

        <button
          onClick={handleConnexion}
          disabled={chargement || !email || !motDePasse}
          style={{
            width: '100%', padding: '13px',
            background: (chargement || !email || !motDePasse)
              ? '#94A3B8'
              : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc, border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700, cursor: (chargement || !email || !motDePasse) ? 'not-allowed' : 'pointer',
          }}
        >
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: theme.texteDoux }}>
          Pas de compte ?{' '}
          <button onClick={() => setVue('choix-inscription')} style={{
            background: 'none', border: 'none', color: theme.primary,
            cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0,
          }}>
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login
