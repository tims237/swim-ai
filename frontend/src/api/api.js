// src/api/api.js
// Connexion centralisée à l'API FastAPI du backend Swim AI
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000'
})

// ── Intercepteur ───────────────────────────────────────
// Avant CHAQUE requête, on ajoute automatiquement le token JWT
// (s'il existe) dans le header Authorization. C'est ce qui permet
// au backend de savoir qui on est et d'autoriser l'accès.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── AUTHENTIFICATION ───────────────────────────────────
// Connexion : le backend attend du form-data (format OAuth2),
// avec "username" (= l'email) et "password".
export const login = async (email, motDePasse) => {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', motDePasse)
  const reponse = await api.post('/auth/login', params)
  return reponse.data // { access_token, token_type }
}

// Infos de l'utilisateur connecté (rôle, email...)
export const getMe = () => api.get('/auth/me')

// ── NAGEURS ────────────────────────────────────────────
export const getNageurs = () => api.get('/nageurs/')
export const getNageur = (id) => api.get(`/nageurs/${id}`)
export const creerNageur = (data) => api.post('/nageurs/', data)
export const supprimerNageur = (id) => api.delete(`/nageurs/${id}`)

// ── SESSIONS ───────────────────────────────────────────
export const getSessions = () => api.get('/sessions/')
export const getSessionsNageur = (id) => api.get(`/sessions/nageur/${id}`)
export const creerSession = (data) => api.post('/sessions/', data)

// ── BIOMETRIES ─────────────────────────────────────────
export const getBiometriesNageur = (id) => api.get(`/biometries/nageur/${id}`)
export const creerBiometrie = (data) => api.post('/biometries/', data)

// ── PERFORMANCES ───────────────────────────────────────
export const getPerformancesNageur = (id) => api.get(`/performances/nageur/${id}`)
export const creerPerformance = (data) => api.post('/performances/', data)

// ── DASHBOARD ──────────────────────────────────────────
export const getDashboard = (id) => api.get(`/dashboard/${id}`)

export default api