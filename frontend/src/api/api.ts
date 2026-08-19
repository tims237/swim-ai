// api/api.ts
// Client HTTP centralisé — toutes les fonctions d'appel à l'API backend
// Le token JWT est injecté automatiquement via l'intercepteur Axios.

import axios from 'axios'
import type {
  Utilisateur, TokenResponse,
  InscriptionNageurPayload, InscriptionEntraineurPayload,
  Nageur, Session, Biometrie, Performance,
  DashboardResponse, DashboardEquipeResponse, AlerteEquipe, StatsEquipe,
} from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
})

// Intercepteur — ajoute automatiquement le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur — gère l'expiration du token (401 → redirection login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// ── AUTHENTIFICATION ───────────────────────────────────────────────────────

export const login = async (email: string, motDePasse: string): Promise<TokenResponse> => {
  const params = new URLSearchParams()
  params.append('username', email)
  params.append('password', motDePasse)
  const res = await api.post<TokenResponse>('/auth/login', params)
  return res.data
}

export const getMe = async (): Promise<Utilisateur> => {
  const res = await api.get<Utilisateur>('/auth/me')
  return res.data
}

export const registerNageur = async (data: InscriptionNageurPayload): Promise<Utilisateur> => {
  const res = await api.post<Utilisateur>('/auth/register/nageur', data)
  return res.data
}

export const registerEntraineur = async (data: InscriptionEntraineurPayload): Promise<Utilisateur> => {
  const res = await api.post<Utilisateur>('/auth/register/entraineur', data)
  return res.data
}

export const changerMotDePasse = async (motDePasseActuel: string, nouveauMotDePasse: string): Promise<void> => {
  await api.post('/auth/change-password', {
    mot_de_passe_actuel: motDePasseActuel,
    nouveau_mot_de_passe: nouveauMotDePasse,
  })
}

export const motDePasseOublie = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email })
}

export const resetPasswordParToken = async (token: string, nouveauMotDePasse: string): Promise<void> => {
  await api.post('/auth/reset-password-by-token', {
    token,
    nouveau_mot_de_passe: nouveauMotDePasse,
  })
}

export const supprimerMonCompte = async (): Promise<void> => {
  await api.delete('/auth/me')
}

// ── NAGEURS ────────────────────────────────────────────────────────────────

export const getNageurs = async (): Promise<Nageur[]> => {
  const res = await api.get<Nageur[]>('/nageurs/')
  return res.data
}

export const getNageur = async (id: number): Promise<Nageur> => {
  const res = await api.get<Nageur>(`/nageurs/${id}`)
  return res.data
}

export const creerNageur = async (data: Partial<Nageur>): Promise<Nageur> => {
  const res = await api.post<Nageur>('/nageurs/', data)
  return res.data
}

export const modifierNageur = async (id: number, data: Partial<Nageur>): Promise<Nageur> => {
  const res = await api.put<Nageur>(`/nageurs/${id}`, data)
  return res.data
}

export const supprimerNageur = async (id: number): Promise<void> => {
  await api.delete(`/nageurs/${id}`)
}

// ── SESSIONS ───────────────────────────────────────────────────────────────

export const getSessions = async (): Promise<Session[]> => {
  const res = await api.get<Session[]>('/sessions/')
  return res.data
}

export const getSessionsNageur = async (nageurId: number): Promise<Session[]> => {
  const res = await api.get<Session[]>(`/sessions/nageur/${nageurId}`)
  return res.data
}

export const creerSession = async (data: Omit<Session, 'id'>): Promise<Session> => {
  const res = await api.post<Session>('/sessions/', data)
  return res.data
}

export const modifierSession = async (id: number, data: Partial<Session>): Promise<Session> => {
  const res = await api.put<Session>(`/sessions/${id}`, data)
  return res.data
}

// ── BIOMÉTRIES ─────────────────────────────────────────────────────────────

export const getBiometriesNageur = async (nageurId: number): Promise<Biometrie[]> => {
  const res = await api.get<Biometrie[]>(`/biometries/nageur/${nageurId}`)
  return res.data
}

export const creerBiometrie = async (data: Omit<Biometrie, 'id'>): Promise<Biometrie> => {
  const res = await api.post<Biometrie>('/biometries/', data)
  return res.data
}

export const modifierBiometrie = async (id: number, data: Partial<Biometrie>): Promise<Biometrie> => {
  const res = await api.put<Biometrie>(`/biometries/${id}`, data)
  return res.data
}

// ── PERFORMANCES ───────────────────────────────────────────────────────────

export const getPerformancesNageur = async (nageurId: number): Promise<Performance[]> => {
  const res = await api.get<Performance[]>(`/performances/nageur/${nageurId}`)
  return res.data
}

export const creerPerformance = async (data: Omit<Performance, 'id'>): Promise<Performance> => {
  const res = await api.post<Performance>('/performances/', data)
  return res.data
}

export const modifierPerformance = async (id: number, data: Partial<Performance>): Promise<Performance> => {
  const res = await api.put<Performance>(`/performances/${id}`, data)
  return res.data
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────

export const getDashboard = async (nageurId: number): Promise<DashboardResponse> => {
  const res = await api.get<DashboardResponse>(`/dashboard/${nageurId}`)
  return res.data
}

// ── ÉQUIPE ─────────────────────────────────────────────────────────────────

export const getDashboardEquipe = async (): Promise<DashboardEquipeResponse> => {
  const res = await api.get<DashboardEquipeResponse>('/equipe/')
  return res.data
}

export const getAlertesEquipe = async (): Promise<AlerteEquipe[]> => {
  const res = await api.get<AlerteEquipe[]>('/equipe/alertes')
  return res.data
}

export const getStatsEquipe = async (): Promise<StatsEquipe> => {
  const res = await api.get<StatsEquipe>('/equipe/stats')
  return res.data
}

export default api
