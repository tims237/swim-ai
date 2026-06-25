import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Nageurs from './pages/Nageurs'
import Sessions from './pages/Sessions'
import Biometries from './pages/Biometries'
import Performances from './pages/Performances'
import Entraineur from './pages/Entraineur'
import Login from './pages/Login'
import './App.css'

function App() {
  // État : est-on connecté ? (true si un token existe déjà dans le navigateur)
  const [estConnecte, setEstConnecte] = useState(!!localStorage.getItem('token'))

  // Déconnexion : on efface le token et on revient à l'écran de login
  const handleDeconnexion = () => {
    localStorage.removeItem('token')
    setEstConnecte(false)
  }

  // Si pas connecté → on affiche UNIQUEMENT l'écran de connexion
  if (!estConnecte) {
    return <Login onLoginReussi={() => setEstConnecte(true)} />
  }

  // Si connecté → on affiche l'appli complète (navigation + pages)
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>

        {/* Barre de navigation gauche */}
        <nav style={{
          width: '220px',
          background: '#0f172a',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '24px', fontSize: '20px' }}>
            🏊 Swim AI
          </h2>
          {[
            { to: '/', label: '📊 Dashboard' },
            { to: '/nageurs', label: '👤 Nageurs' },
            { to: '/sessions', label: '🏋️ Sessions' },
            { to: '/biometries', label: '❤️ Biométries' },
            { to: '/entraineur', label: '🧑‍🏫 Entraîneur' },
            { to: '/performances', label: '⏱️ Performances' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                color: isActive ? '#38bdf8' : '#94a3b8',
                textDecoration: 'none',
                padding: '10px 12px',
                borderRadius: '8px',
                background: isActive ? '#1e293b' : 'transparent',
                fontWeight: isActive ? 'bold' : 'normal'
              })}
            >
              {label}
            </NavLink>
          ))}

          {/* Bouton de déconnexion, tout en bas */}
          <button
            onClick={handleDeconnexion}
            style={{
              marginTop: 'auto',
              padding: '10px 12px',
              background: 'transparent',
              color: '#f87171',
              border: '1px solid #f87171',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚪 Déconnexion
          </button>
        </nav>

        {/* Contenu principal */}
        <main style={{ flex: 1, padding: '32px', background: '#f8fafc' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nageurs" element={<Nageurs />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/biometries" element={<Biometries />} />
            <Route path="/entraineur" element={<Entraineur />} />
            <Route path="/performances" element={<Performances />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

export default App