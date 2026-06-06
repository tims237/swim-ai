# routes/dashboard.py
# Endpoint principal du dashboard — agrège toutes les données d'un nageur
# Calcule les KPI, la charge d'entraînement et génère les recommandations
# Un seul appel API depuis React pour alimenter tout le dashboard

# 1. Bibliothèques standard
from datetime import date, timedelta
from typing import List, Optional

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.database import get_db
from app.models import Biometrie, Nageur, Performance
from app.models import Session as SessionModel

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# ─────────────────────────────────────────
# SCHÉMAS DE RÉPONSE DU DASHBOARD
# Définis ici car spécifiques au dashboard
# pas réutilisés ailleurs dans l'API
# ─────────────────────────────────────────

class NageurInfo(BaseModel):
    """Informations de base du nageur."""
    id         : int
    nom        : str
    prenom     : str
    specialite : Optional[str] = None
    niveau     : Optional[str] = None

    class Config:
        from_attributes = True


class KpiDashboard(BaseModel):
    """
    Indicateurs clés de performance calculés côté backend.
    Le frontend React affiche directement ces valeurs sans recalculer.
    """
    dernier_chrono  : Optional[float] = None  # dernier chrono enregistré en secondes
    meilleur_chrono : Optional[float] = None  # meilleur chrono sur la période
    progression     : Optional[float] = None  # évolution en % vs premier chrono
    hrv_moyenne     : Optional[float] = None  # moyenne HRV sur 7 jours
    fc_repos        : Optional[int]   = None  # dernière FC repos enregistrée
    rpe_moyen       : Optional[float] = None  # moyenne RPE sur 7 jours
    sommeil_moyen   : Optional[float] = None  # moyenne sommeil sur 7 jours
    fatigue         : Optional[int]   = None  # score fatigue 0-100 calculé


class ChargeDashboard(BaseModel):
    """
    Données de charge d'entraînement — calcul ACWR.
    ACWR (Acute:Chronic Workload Ratio) — zone saine entre 0.8 et 1.3
    """
    charge_aigue    : Optional[float] = None  # charge des 7 derniers jours
    charge_chronique: Optional[float] = None  # charge des 28 derniers jours
    acwr            : Optional[float] = None  # ratio charge aiguë / chronique


class PointChrono(BaseModel):
    """Un point de l'historique des chronos — pour le graphique React."""
    date   : date
    temps_s: float


class DashboardResponse(BaseModel):
    """
    Réponse complète du dashboard.
    Agrège toutes les données nécessaires en un seul appel API.
    """
    nageur             : NageurInfo
    kpi                : KpiDashboard
    charge             : ChargeDashboard
    historique_chronos : List[PointChrono]
    recommandations    : List[str]


# ─────────────────────────────────────────
# FONCTIONS DE CALCUL
# Séparées de la route pour la lisibilité
# et la testabilité unitaire
# ─────────────────────────────────────────

def calculer_kpi(performances: list, biometries: list) -> KpiDashboard:
    """
    Calcule les KPI du dashboard à partir des données brutes.

    Args:
        performances : liste des performances SQLAlchemy du nageur
        biometries   : liste des biométries SQLAlchemy du nageur

    Returns:
        KpiDashboard : objet contenant tous les KPI calculés
    """

    # ── Chronos ──────────────────────────────────
    chronos = [p.temps_s for p in performances if p.temps_s is not None]

    dernier_chrono  = chronos[-1] if chronos else None
    meilleur_chrono = min(chronos) if chronos else None

    # Progression = écart entre premier et dernier chrono en pourcentage
    # Valeur négative = amélioration (chrono plus rapide)
    progression = None
    if len(chronos) >= 2:
        progression = round(
            ((chronos[-1] - chronos[0]) / chronos[0]) * 100, 2
        )

    # ── Biométries sur 7 jours ───────────────────
    aujourd_hui = date.today()
    semaine     = aujourd_hui - timedelta(days=7)

    # Filtre les biométries des 7 derniers jours
    bio_recentes = [
        b for b in biometries
        if b.date and b.date >= semaine
    ]

    # Calcul des moyennes — ignore les valeurs None
    hrv_values     = [b.hrv_ms    for b in bio_recentes if b.hrv_ms    is not None]
    rpe_values     = [b.rpe       for b in bio_recentes if b.rpe       is not None]
    sommeil_values = [b.sommeil_h for b in bio_recentes if b.sommeil_h is not None]

    hrv_moyenne   = round(sum(hrv_values)     / len(hrv_values),     1) if hrv_values     else None
    rpe_moyen     = round(sum(rpe_values)     / len(rpe_values),     1) if rpe_values     else None
    sommeil_moyen = round(sum(sommeil_values) / len(sommeil_values), 1) if sommeil_values else None

    # Dernière FC repos enregistrée
    fc_values = [b.fc_repos for b in biometries if b.fc_repos is not None]
    fc_repos  = fc_values[-1] if fc_values else None

    # ── Score fatigue 0-100 ──────────────────────
    # Calculé à partir du RPE moyen et de la HRV
    # RPE élevé + HRV faible = fatigue élevée
    fatigue = None
    if rpe_moyen is not None:
        # Base : RPE moyen * 10 (RPE 7 → fatigue 70)
        fatigue = int(rpe_moyen * 10)

        # Ajustement selon HRV — HRV faible augmente la fatigue
        if hrv_moyenne is not None:
            if hrv_moyenne < 50:
                fatigue = min(100, fatigue + 20)  # HRV très faible
            elif hrv_moyenne > 80:
                fatigue = max(0,   fatigue - 10)  # HRV excellente

    return KpiDashboard(
        dernier_chrono  = round(dernier_chrono, 2)  if dernier_chrono  else None,
        meilleur_chrono = round(meilleur_chrono, 2) if meilleur_chrono else None,
        progression     = progression,
        hrv_moyenne     = hrv_moyenne,
        fc_repos        = fc_repos,
        rpe_moyen       = rpe_moyen,
        sommeil_moyen   = sommeil_moyen,
        fatigue         = fatigue
    )


def calculer_charge(sessions: list) -> ChargeDashboard:
    """
    Calcule la charge d'entraînement et l'ACWR.

    ACWR = Acute Chronic Workload Ratio
    - Charge aiguë  : moyenne des 7 derniers jours
    - Charge chronique : moyenne des 28 derniers jours
    - Zone saine : ACWR entre 0.8 et 1.3
    - ACWR > 1.5 : risque de blessure élevé

    Args:
        sessions : liste des sessions SQLAlchemy du nageur

    Returns:
        ChargeDashboard : charge aiguë, chronique et ACWR
    """
    aujourd_hui = date.today()
    semaine     = aujourd_hui - timedelta(days=7)
    mois        = aujourd_hui - timedelta(days=28)

    # Filtre les sessions par période
    sessions_7j  = [s for s in sessions if s.date and s.date >= semaine]
    sessions_28j = [s for s in sessions if s.date and s.date >= mois]

    # Charge = nombre de minutes d'entraînement par période
    # Plus tard : on pourra pondérer par l'intensité (RPE * durée)
    charge_aigue    = sum(s.duree_min for s in sessions_7j  if s.duree_min) or None
    charge_chronique= sum(s.duree_min for s in sessions_28j if s.duree_min) or None

    # ACWR = charge aiguë / charge chronique
    # La charge chronique est ramenée à 7 jours pour être comparable
    acwr = None
    if charge_aigue and charge_chronique and charge_chronique > 0:
        # Normalise la charge chronique sur 7 jours (÷ 4 semaines)
        charge_chronique_normalisee = charge_chronique / 4
        acwr = round(charge_aigue / charge_chronique_normalisee, 2)

    return ChargeDashboard(
        charge_aigue     = charge_aigue,
        charge_chronique = charge_chronique,
        acwr             = acwr
    )


def generer_recommandations(kpi: KpiDashboard, charge: ChargeDashboard) -> List[str]:
    """
    Génère des recommandations personnalisées basées sur les KPI et la charge.
    Règles expertes basées sur la littérature sportive.

    Args:
        kpi    : KPI calculés du nageur
        charge : charge d'entraînement calculée

    Returns:
        List[str] : liste de recommandations textuelles
    """
    recommandations = []

    # ── Recommandations charge (ACWR) ────────────
    if charge.acwr is not None:
        if charge.acwr > 1.5:
            recommandations.append(
                "⚠️ Charge trop élevée (ACWR > 1.5) — réduire le volume immédiatement"
            )
        elif charge.acwr > 1.3:
            recommandations.append(
                "⚠️ Éviter toute augmentation du volume cette semaine (ACWR élevé)"
            )
        elif charge.acwr < 0.8:
            recommandations.append(
                "📈 Volume d'entraînement faible — augmentation progressive possible"
            )
        else:
            recommandations.append(
                "✅ Charge d'entraînement optimale — maintenir le volume actuel"
            )

    # ── Recommandations fatigue (RPE) ────────────
    if kpi.rpe_moyen is not None:
        if kpi.rpe_moyen >= 8:
            recommandations.append(
                "⚠️ Fatigue élevée détectée (RPE moyen ≥ 8) — prévoir une séance de récupération"
            )
        elif kpi.rpe_moyen <= 4:
            recommandations.append(
                "✅ Bonne récupération observée — état de forme optimal"
            )

    # ── Recommandations HRV ──────────────────────
    if kpi.hrv_moyenne is not None:
        if kpi.hrv_moyenne < 50:
            recommandations.append(
                "⚠️ HRV faible — privilégier la récupération et le sommeil"
            )
        elif kpi.hrv_moyenne > 80:
            recommandations.append(
                "✅ HRV excellente — système nerveux bien récupéré"
            )

    # ── Recommandations sommeil ──────────────────
    if kpi.sommeil_moyen is not None:
        if kpi.sommeil_moyen < 7:
            recommandations.append(
                "⚠️ Durée de sommeil insuffisante (< 7h) — impact négatif sur la récupération"
            )
        elif kpi.sommeil_moyen >= 8:
            recommandations.append(
                "✅ Excellente qualité de sommeil — facteur clé de progression"
            )

    # ── Recommandation progression ───────────────
    if kpi.progression is not None:
        if kpi.progression < -2:
            recommandations.append(
                "✅ Progression significative détectée — continuer sur cette lancée"
            )
        elif kpi.progression > 2:
            recommandations.append(
                "📉 Régression du chrono détectée — analyser les facteurs (fatigue, technique)"
            )

    # Message par défaut si aucune donnée disponible
    if not recommandations:
        recommandations.append(
            "📊 Pas assez de données pour générer des recommandations — continuer la saisie"
        )

    return recommandations


# ─────────────────────────────────────────
# ENDPOINT PRINCIPAL
# ─────────────────────────────────────────

@router.get("/{nageur_id}", response_model=DashboardResponse)
def get_dashboard(nageur_id: int, db: Session = Depends(get_db)):
    """
    Retourne toutes les données du dashboard pour un nageur.

    Agrège en un seul appel :
    - Informations du nageur
    - KPI calculés (chrono, HRV, fatigue, progression)
    - Charge d'entraînement et ACWR
    - Historique des chronos pour le graphique
    - Recommandations personnalisées

    Utilisé par le frontend React pour alimenter tout le dashboard.
    """

    # ── 1. Récupère le nageur ────────────────────
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    # ── 2. Récupère toutes ses sessions ──────────
    sessions = db.query(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).order_by(SessionModel.date).all()

    # ── 3. Récupère toutes ses performances ──────
    # Jointure sessions → performances pour filtrer par nageur
    performances = db.query(Performance).join(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).order_by(SessionModel.date).all()

    # ── 4. Récupère toutes ses biométries ────────
    biometries = db.query(Biometrie).filter(
        Biometrie.nageur_id == nageur_id
    ).order_by(Biometrie.date).all()

    # ── 5. Calcule les KPI ───────────────────────
    kpi    = calculer_kpi(performances, biometries)
    charge = calculer_charge(sessions)

    # ── 6. Construit l'historique des chronos ────
    # Uniquement les performances avec un chrono valide
    historique_chronos = [
        PointChrono(date=s.date, temps_s=p.temps_s)
        for p, s in zip(performances, sessions)
        if p.temps_s is not None and s.date is not None
    ]

    # ── 7. Génère les recommandations ────────────
    recommandations = generer_recommandations(kpi, charge)

    return DashboardResponse(
        nageur             = nageur,
        kpi                = kpi,
        charge             = charge,
        historique_chronos = historique_chronos,
        recommandations    = recommandations
    )

