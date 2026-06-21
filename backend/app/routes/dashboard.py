# routes/dashboard.py
# Endpoint dashboard nageur — agrège toutes les données d'un nageur spécifique
# Route protégée par JWT — token requis

# 1. Bibliothèques standard
from datetime import date, timedelta
from typing import List, Optional

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Biometrie, Nageur, Performance, Utilisateur
from app.models import Session as SessionModel

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard — Vue nageur"]
)


# ─────────────────────────────────────────
# SCHÉMAS DE RÉPONSE
# ─────────────────────────────────────────

class NageurInfo(BaseModel):
    """Informations de base du nageur affichées en haut du dashboard."""
    id         : int
    nom        : str
    prenom     : str
    specialite : Optional[str] = None
    niveau     : Optional[str] = None

    class Config:
        from_attributes = True


class KpiDashboard(BaseModel):
    """KPI calculés côté backend — affichés directement par React."""
    dernier_chrono  : Optional[float] = None
    meilleur_chrono : Optional[float] = None
    progression     : Optional[float] = None
    hrv_moyenne     : Optional[float] = None
    fc_repos        : Optional[int]   = None
    rpe_moyen       : Optional[float] = None
    sommeil_moyen   : Optional[float] = None
    fatigue         : Optional[int]   = None


class ChargeDashboard(BaseModel):
    """Charge d'entraînement — ACWR entre 0.8 et 1.3 = zone saine."""
    charge_aigue     : Optional[float] = None
    charge_chronique : Optional[float] = None
    acwr             : Optional[float] = None


class PointChrono(BaseModel):
    """Un point de l'historique des chronos pour le graphique Recharts."""
    date    : date
    temps_s : float


class DashboardResponse(BaseModel):
    """Réponse complète du dashboard — un seul appel API pour tout le dashboard."""
    nageur             : NageurInfo
    kpi                : KpiDashboard
    charge             : ChargeDashboard
    historique_chronos : List[PointChrono]
    recommandations    : List[str]


# ─────────────────────────────────────────
# FONCTIONS DE CALCUL
# Séparées de la route pour lisibilité et réutilisabilité
# Importées dans equipe.py
# ─────────────────────────────────────────

def calculer_kpi(performances: list, biometries: list) -> KpiDashboard:
    """
    Calcule tous les KPI du dashboard à partir des données brutes.

    Args:
        performances : liste des objets Performance SQLAlchemy
        biometries   : liste des objets Biometrie SQLAlchemy

    Returns:
        KpiDashboard : tous les KPI calculés et arrondis
    """

    # ── Chronos ──────────────────────────────────
    chronos = [p.temps_s for p in performances if p.temps_s is not None]

    dernier_chrono  = chronos[-1] if chronos else None
    meilleur_chrono = min(chronos) if chronos else None

    progression = None
    if len(chronos) >= 2:
        progression = round(
            ((chronos[-1] - chronos[0]) / chronos[0]) * 100, 2
        )

    # ── Biométries sur 7 jours ───────────────────
    aujourd_hui  = date.today()
    il_y_a_7j    = aujourd_hui - timedelta(days=7)

    bio_recentes = [
        b for b in biometries
        if b.date and b.date >= il_y_a_7j
    ]

    hrv_values     = [b.hrv_ms    for b in bio_recentes if b.hrv_ms    is not None]
    rpe_values     = [b.rpe       for b in bio_recentes if b.rpe       is not None]
    sommeil_values = [b.sommeil_h for b in bio_recentes if b.sommeil_h is not None]

    hrv_moyenne   = round(sum(hrv_values)     / len(hrv_values),     1) if hrv_values     else None
    rpe_moyen     = round(sum(rpe_values)     / len(rpe_values),     1) if rpe_values     else None
    sommeil_moyen = round(sum(sommeil_values) / len(sommeil_values), 1) if sommeil_values else None

    fc_values = [b.fc_repos for b in biometries if b.fc_repos is not None]
    fc_repos  = fc_values[-1] if fc_values else None

    # ── Score fatigue 0-100 ──────────────────────
    fatigue = None
    if rpe_moyen is not None:
        fatigue = int(rpe_moyen * 10)
        if hrv_moyenne is not None:
            if hrv_moyenne < 50:
                fatigue = min(100, fatigue + 20)
            elif hrv_moyenne > 80:
                fatigue = max(0,   fatigue - 10)

    return KpiDashboard(
        dernier_chrono  = round(dernier_chrono,  2) if dernier_chrono  else None,
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
    Calcule la charge d'entraînement et le ratio ACWR.

    ACWR = charge aiguë (7j) / (charge chronique (28j) / 4)
    Zone saine : 0.8 à 1.3 — Au-dessus de 1.5 : risque blessure

    Args:
        sessions : liste des objets Session SQLAlchemy

    Returns:
        ChargeDashboard : charges et ACWR calculés
    """
    aujourd_hui  = date.today()
    il_y_a_7j    = aujourd_hui - timedelta(days=7)
    il_y_a_28j   = aujourd_hui - timedelta(days=28)

    sessions_7j  = [s for s in sessions if s.date and s.date >= il_y_a_7j]
    sessions_28j = [s for s in sessions if s.date and s.date >= il_y_a_28j]

    charge_aigue     = sum(s.duree_min for s in sessions_7j  if s.duree_min) or None
    charge_chronique = sum(s.duree_min for s in sessions_28j if s.duree_min) or None

    acwr = None
    if charge_aigue and charge_chronique and charge_chronique > 0:
        acwr = round(charge_aigue / (charge_chronique / 4), 2)

    return ChargeDashboard(
        charge_aigue     = charge_aigue,
        charge_chronique = charge_chronique,
        acwr             = acwr
    )


def generer_recommandations(kpi: KpiDashboard, charge: ChargeDashboard) -> List[str]:
    """
    Génère des recommandations personnalisées basées sur les KPI et la charge.
    Règles expertes issues de la littérature en science du sport.

    Args:
        kpi    : KPI calculés du nageur
        charge : charge d'entraînement calculée

    Returns:
        List[str] : recommandations textuelles prêtes à afficher
    """
    recommandations = []

    if charge.acwr is not None:
        if charge.acwr > 1.5:
            recommandations.append("⚠️ Charge trop élevée (ACWR > 1.5) — réduire le volume immédiatement")
        elif charge.acwr > 1.3:
            recommandations.append("⚠️ Éviter toute augmentation du volume cette semaine (ACWR élevé)")
        elif charge.acwr < 0.8:
            recommandations.append("📈 Volume faible — augmentation progressive possible")
        else:
            recommandations.append("✅ Charge optimale — maintenir le volume actuel")

    if kpi.rpe_moyen is not None:
        if kpi.rpe_moyen >= 8:
            recommandations.append("⚠️ Fatigue élevée (RPE ≥ 8) — prévoir une séance de récupération")
        elif kpi.rpe_moyen <= 4:
            recommandations.append("✅ Bonne récupération — état de forme optimal")

    if kpi.hrv_moyenne is not None:
        if kpi.hrv_moyenne < 50:
            recommandations.append("⚠️ HRV faible — privilégier le repos et le sommeil")
        elif kpi.hrv_moyenne > 80:
            recommandations.append("✅ HRV excellente — système nerveux bien récupéré")

    if kpi.sommeil_moyen is not None:
        if kpi.sommeil_moyen < 7:
            recommandations.append("⚠️ Sommeil insuffisant (< 7h) — impact direct sur la récupération")
        elif kpi.sommeil_moyen >= 8:
            recommandations.append("✅ Excellente durée de sommeil — facteur clé de progression")

    if kpi.progression is not None:
        if kpi.progression < -2:
            recommandations.append("✅ Progression significative — continuer sur cette lancée")
        elif kpi.progression > 2:
            recommandations.append("📉 Régression détectée — analyser fatigue, technique et charge")

    if not recommandations:
        recommandations.append("📊 Données insuffisantes — continuer la saisie pour obtenir des recommandations")

    return recommandations


# ─────────────────────────────────────────
# ENDPOINT
# ─────────────────────────────────────────

@router.get("/{nageur_id}", response_model=DashboardResponse)
def get_dashboard(
    nageur_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les données du dashboard pour un nageur.
    Route protégée — token JWT requis.

    Un nageur ne peut voir que son propre dashboard.
    Un entraîneur ou admin peut voir le dashboard de n'importe quel nageur.
    """

    # Un nageur ne peut voir que son propre dashboard
    if current_user.role == "nageur" and current_user.nageur_id != nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — vous ne pouvez voir que votre propre dashboard"
        )

    # ── 1. Récupère le nageur ────────────────────
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    # ── 2. Récupère les sessions ──────────────────
    sessions = db.query(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).order_by(SessionModel.date).all()

    # ── 3. Récupère les performances ─────────────
    performances = db.query(Performance).join(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).order_by(SessionModel.date).all()

    # ── 4. Récupère les biométries ────────────────
    biometries = db.query(Biometrie).filter(
        Biometrie.nageur_id == nageur_id
    ).order_by(Biometrie.date).all()

    # ── 5. Calcule les KPI et la charge ──────────
    kpi    = calculer_kpi(performances, biometries)
    charge = calculer_charge(sessions)

    # ── 6. Historique des chronos pour Recharts ───
    # Chaque performance est liée à sa session via session_id
    # On utilise la relation ORM pour récupérer la date de la session
    historique_chronos = [
        PointChrono(date=p.session.date, temps_s=p.temps_s)
        for p in performances
        if p.temps_s is not None and p.session is not None and p.session.date is not None
    ]

    # ── 7. Recommandations ────────────────────────
    recommandations = generer_recommandations(kpi, charge)

    return DashboardResponse(
        nageur             = nageur,
        kpi                = kpi,
        charge             = charge,
        historique_chronos = historique_chronos,
        recommandations    = recommandations
    )