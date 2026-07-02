// types/index.ts
// Types TypeScript partagés dans tout le projet.
// Chaque type correspond exactement à un schéma Pydantic du backend.

// ─────────────────────────────────────────────
// AUTHENTIFICATION
// ─────────────────────────────────────────────

export type Role = 'nageur' | 'entraineur' | 'admin'

export interface Utilisateur {
  id: number
  email: string
  role: Role
  nom: string
  prenom: string
  date_naissance: string | null
  lieu_naissance: string | null
  nageur_id: number | null
  actif: boolean
  consentement_donnees_sante: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface InscriptionNageurPayload {
  email: string
  mot_de_passe: string
  nom: string
  prenom: string
  date_naissance?: string
  lieu_naissance?: string
  specialite?: string
  niveau?: string
  consentement_donnees_sante: boolean
}

export interface InscriptionEntraineurPayload {
  email: string
  mot_de_passe: string
  nom: string
  prenom: string
  date_naissance?: string
  lieu_naissance?: string
  consentement_donnees_sante: boolean
}

// ─────────────────────────────────────────────
// NAGEUR
// ─────────────────────────────────────────────

export interface Nageur {
  id: number
  nom: string
  prenom: string
  date_naissance: string | null
  specialite: string | null
  niveau: string | null
}

// ─────────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────────

export type TypeSeance = 'endurance' | 'sprint' | 'technique' | 'récupération'

export interface Session {
  id: number
  nageur_id: number
  date: string
  type_seance: TypeSeance | null
  duree_min: number | null
}

// ─────────────────────────────────────────────
// BIOMETRIE
// ─────────────────────────────────────────────

export interface Biometrie {
  id: number
  nageur_id: number
  date: string
  hrv_ms: number | null
  fc_repos: number | null
  rpe: number | null
  sommeil_h: number | null
}

// ─────────────────────────────────────────────
// PERFORMANCE
// ─────────────────────────────────────────────

export type StyleNage = 'crawl' | 'dos' | 'brasse' | 'papillon' | '4 nages'

export interface Performance {
  id: number
  session_id: number
  distance_m: number | null
  temps_s: number | null
  style_nage: StyleNage | null
  vitesse_moy: number | null
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export interface NageurInfo {
  id: number
  nom: string
  prenom: string
  specialite: string | null
  niveau: string | null
}

export interface KpiDashboard {
  dernier_chrono: number | null
  meilleur_chrono: number | null
  progression: number | null
  hrv_moyenne: number | null
  fc_repos: number | null
  rpe_moyen: number | null
  sommeil_moyen: number | null
  fatigue: number | null
}

export interface ChargeDashboard {
  charge_aigue: number | null
  charge_chronique: number | null
  acwr: number | null
}

export interface PointChrono {
  date: string
  temps_s: number
}

export interface DashboardResponse {
  nageur: NageurInfo
  kpi: KpiDashboard
  charge: ChargeDashboard
  historique_chronos: PointChrono[]
  recommandations: string[]
}

// ─────────────────────────────────────────────
// ÉQUIPE (vue entraîneur)
// ─────────────────────────────────────────────

export type StatutNageur = 'optimal' | 'surveiller' | 'fatigue' | 'surmenage' | 'inconnu'

export interface NageurEquipe {
  id: number
  nom: string
  prenom: string
  specialite: string | null
  dernier_chrono: number | null
  acwr: number | null
  hrv_moyenne: number | null
  fatigue: number | null
  statut: StatutNageur
}

export interface AlerteEquipe {
  nageur_id: number
  nom: string
  prenom: string
  type: string
  niveau: 'danger' | 'warning'
  message: string
}

export interface StatsEquipe {
  total_nageurs: number
  nageurs_optimaux: number
  nageurs_surveiller: number
  nageurs_fatigues: number
  nageurs_surmenage: number
  alertes_actives: number
}

export interface DashboardEquipeResponse {
  stats: StatsEquipe
  alertes: AlerteEquipe[]
  nageurs: NageurEquipe[]
}
