import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { getMe } from './api/api'
import type { Utilisateur } from './types'
import Dashboard from './pages/Dashboard'
import Nageurs from './pages/Nageurs'
import Sessions from './pages/Sessions'
import Biometries from './pages/Biometries'
import Performances from './pages/Performances'
import Entraineur from './pages/Entraineur'
import Login from './pages/Login'
import RegisterNageur from './pages/RegisterNageur'
import RegisterEntraineur from './pages/RegisterEntraineur'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import theme from './theme'
import './App.css'

// ─── Pages publiques (sans authentification) ──────────────────────────────
// Encapsulées dans leur propre BrowserRouter pour que React Router
// gère la navigation côté client — window.location.pathname ne suffit pas.
function PublicRoutes({ onLoginReussi }: { onLoginReussi: () => void }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register/nageur"      element={<RegisterNageur />} />
        <Route path="/register/entraineur"  element={<RegisterEntraineur />} />
        <Route path="/forgot-password"      element={<ForgotPassword />} />
        <Route path="/reset-password"       element={<ResetPassword />} />
        <Route path="*"                     element={<Login onLoginReussi={onLoginReussi} />} />
      </Routes>
    </BrowserRouter>
  )
}

// ─── Application principale (après login) ────────────────────────────────
function AppConnectee({ utilisateur, onDeconnexion }: { utilisateur: Utilisateur; onDeconnexion: () => void }) {
  const estNageur     = utilisateur.role === 'nageur'
  const estEntraineur = utilisateur.role === 'entraineur' || utilisateur.role === 'admin'

  const menuNageur = [
    { to: '/',             label: '📊 Mon Dashboard' },
    { to: '/sessions',     label: '🏋️ Mes sessions' },
    { to: '/biometries',   label: '❤️ Mes biométries' },
    { to: '/performances', label: '⏱️ Mes performances' },
  ]

  const menuEntraineur = [
    { to: '/entraineur',   label: '🧑‍🏫 Vue équipe' },
    { to: '/',             label: '📊 Dashboard' },
    { to: '/nageurs',      label: '👤 Nageurs' },
    { to: '/sessions',     label: '🏋️ Sessions' },
    { to: '/biometries',   label: '❤️ Biométries' },
    { to: '/performances', label: '⏱️ Performances' },
  ]

  const menu = estNageur ? menuNageur : menuEntraineur

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: theme.policeTexte }}>

        {/* Sidebar */}
        <nav style={{
          width: '224px', background: '#0f172a', padding: '24px 16px',
          display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0,
        }}>
          {/* Logo */}
          <h2 style={{ color: '#38bdf8', marginBottom: '4px', fontSize: '20px', fontFamily: theme.policeTitre }}>
            🏊 Swim AI
          </h2>

          {/* Badge rôle */}
          <span style={{
            display: 'inline-block', marginBottom: '20px', fontSize: '11px',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            color: estNageur ? '#34d399' : '#f59e0b',
            background: estNageur ? '#064e3b' : '#451a03',
            padding: '3px 8px', borderRadius: '4px', alignSelf: 'flex-start',
          }}>
            {utilisateur.role}
          </span>

          {/* Navigation */}
          {menu.map(({ to, label }) => (
            <NavLink key={to + label} to={to} end={to === '/'}
              style={({ isActive }) => ({
                color: isActive ? '#38bdf8' : '#94a3b8',
                textDecoration: 'none', padding: '10px 12px', borderRadius: '8px',
                background: isActive ? '#1e293b' : 'transparent',
                fontWeight: isActive ? 700 : 400, fontSize: '14px',
                borderLeft: isActive ? `3px solid #38bdf8` : '3px solid transparent',
              })}
            >
              {label}
            </NavLink>
          ))}

          {/* Profil + déconnexion */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{
              padding: '12px', borderRadius: '10px', background: '#1e293b',
              marginBottom: '8px', fontSize: '13px', color: '#e2e8f0',
            }}>
              <div style={{ fontWeight: 600 }}>{utilisateur.prenom} {utilisateur.nom}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{utilisateur.email}</div>
            </div>
            <button onClick={onDeconnexion} style={{
              width: '100%', padding: '10px 12px', background: 'transparent',
              color: '#f87171', border: '1px solid #f87171', borderRadius: '8px',
              cursor: 'pointer', fontSize: '14px',
            }}>
              🚪 Déconnexion
            </button>
          </div>
        </nav>

        {/* Contenu */}
        <main style={{ flex: 1, padding: '32px', background: theme.tertiary, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard utilisateur={utilisateur} />} />
            {estEntraineur && <Route path="/nageurs" element={<Nageurs />} />}
            <Route path="/sessions" element={<Sessions utilisateur={utilisateur} />} />
            <Route path="/biometries" element={<Biometries utilisateur={utilisateur} />} />
            <Route path="/performances" element={<Performances utilisateur={utilisateur} />} />
            {estEntraineur && <Route path="/entraineur" element={<Entraineur />} />}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '80px', color: theme.texteDoux }}>
                <p style={{ fontSize: '48px' }}>🏊</p>
                <h2 style={{ marginTop: '16px', color: theme.neutral }}>Page introuvable</h2>
                <a href="/" style={{ color: theme.primary }}>Retour au dashboard</a>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

// ─── App racine ───────────────────────────────────────────────────────────
function App() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [chargement, setChargement] = useState(true)

  // Au démarrage : si token présent → vérifier qu'il est encore valide
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe()
        .then((u) => setUtilisateur(u))
        .catch(() => { localStorage.removeItem('token') })
        .finally(() => setChargement(false))
    } else {
      setChargement(false)
    }
  }, [])

  const handleLoginReussi = async () => {
    try {
      const u = await getMe()
      setUtilisateur(u)
    } catch {
      // Token stocké mais /auth/me échoue — on nettoie et on reste sur le login
      localStorage.removeItem('token')
    }
  }

  const handleDeconnexion = () => {
    localStorage.removeItem('token')
    setUtilisateur(null)
  }

  if (chargement) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: theme.tertiary, color: theme.texteDoux,
        fontFamily: theme.policeTexte, fontSize: '16px',
      }}>
        Chargement...
      </div>
    )
  }

  // Pas connecté → pages publiques (login, register, forgot...)
  if (!utilisateur) {
    return <PublicRoutes onLoginReussi={handleLoginReussi} />
  }

  // Connecté → application complète
  return <AppConnectee utilisateur={utilisateur} onDeconnexion={handleDeconnexion} />
}

export default App
