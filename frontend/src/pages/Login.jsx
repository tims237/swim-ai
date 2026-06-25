// src/pages/Login.jsx
// Écran de connexion — restylé selon le design system Swim AI (Figma)
import { useState } from 'react'
import { login } from '../api/api'
import theme from '../theme'

function Login({ onLoginReussi }) {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  const handleConnexion = async () => {
    setErreur('')
    setChargement(true)
    try {
      const data = await login(email, motDePasse)
      localStorage.setItem('token', data.access_token)
      onLoginReussi()
    } catch (e) {
      const detail = e.response?.data?.detail
      setErreur(typeof detail === 'string' ? detail : 'Email ou mot de passe incorrect')
    } finally {
      setChargement(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConnexion()
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '18px',
    border: `1px solid ${theme.bordure}`,
    borderRadius: '10px',
    boxSizing: 'border-box',
    fontFamily: theme.policeTexte,
    fontSize: '14px',
    color: theme.blanc,               
    background: '#3A3A3A',            
    WebkitTextFillColor: theme.blanc, 
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: theme.texte,
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: theme.policeTexte,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.tertiary,
      fontFamily: theme.policeTexte,
    }}>
      <div style={{
        background: theme.blanc,
        padding: '40px',
        borderRadius: '20px',
        width: '380px',
        border: `1px solid ${theme.bordure}`,
        boxShadow: '0 10px 40px rgba(15,23,42,0.08)',
      }}>
        {/* Logo / titre */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            marginBottom: '14px',
            fontSize: '28px',
          }}>
            🏊
          </div>
          <h1 style={{
            fontFamily: theme.policeTitre,
            fontSize: '26px',
            fontWeight: 800,
            color: theme.neutral,
            margin: 0,
          }}>
            Swim AI
          </h1>
          <p style={{ color: theme.texteDoux, fontSize: '14px', marginTop: '6px' }}>
            Connexion à votre espace
          </p>
        </div>

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          style={{ ...inputStyle, marginBottom: '4px' }}
          onFocus={(e) => (e.target.style.border = `1px solid ${theme.primary}`)}
          onBlur={(e) => (e.target.style.border = `1px solid ${theme.bordure}`)}
        />
        <p style={{ color: theme.texteDoux, fontSize: '12px', margin: '0 0 18px 4px', textAlign: 'left' }}>
          ex: coach@swimai.com
        </p>

        <label style={labelStyle}>Mot de passe</label>
        <input
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="new-password"
          style={{ ...inputStyle, marginBottom: '4px' }}
          onFocus={(e) => (e.target.style.border = `1px solid ${theme.primary}`)}
          onBlur={(e) => (e.target.style.border = `1px solid ${theme.bordure}`)}
        />
        <p style={{ color: theme.texteDoux, fontSize: '12px', margin: '0 0 18px 4px', textAlign: 'left' }}>
          ••••••••
        </p>

        {erreur && (
          <p style={{
            color: theme.danger,
            fontSize: '13px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            {erreur}
          </p>
        )}

        <button
          onClick={handleConnexion}
          disabled={chargement || !email || !motDePasse}
          style={{
            width: '100%',
            padding: '13px',
            background: (chargement || !email || !motDePasse)
              ? '#94A3B8'
              : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: theme.blanc,
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: theme.policeTexte,
            cursor: (chargement || !email || !motDePasse) ? 'not-allowed' : 'pointer',
            marginTop: '4px',
            transition: 'opacity 0.2s',
          }}
        >
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}

export default Login