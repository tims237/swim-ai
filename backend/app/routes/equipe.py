# routes/equipe.py
# Endpoints dashboard entraîneur — vue agrégée de toute l'équipe
# Séparé de dashboard.py pour une meilleure lisibilité et maintenabilité

# 1. Bibliothèques standard
from typing import List, Optional

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.database import get_db
from app.models import Biometrie, Nageur, Performance
from app.models import Session as SessionModel

# Réutilise les fonctions de calcul déjà définies dans dashboard.py
from app.routes.dashboard import calculer_kpi, calculer_charge

router = APIRouter(
    prefix="/equipe",
    tags=["Équipe — Vue entraîneur"]
)


# ─────────────────────────────────────────
# SCHÉMAS — Dashboard équipe
# ─────────────────────────────────────────

class NageurEquipe(BaseModel):
    """Résumé d'un nageur pour la vue équipe entraîneur."""
    id             : int
    nom            : str
    prenom         : str
    specialite     : Optional[str]   = None
    dernier_chrono : Optional[float] = None  # dernier chrono en secondes
    acwr           : Optional[float] = None  # ratio charge aiguë/chronique
    hrv_moyenne    : Optional[float] = None  # HRV moyenne 7 jours
    fatigue        : Optional[int]   = None  # score fatigue 0-100
    statut         : str = "inconnu"         # optimal/surveiller/fatigue/surmenage

    class Config:
        from_attributes = True


class AlerteEquipe(BaseModel):
    """Alerte générée pour un nageur de l'équipe."""
    nageur_id : int
    nom       : str
    prenom    : str
    type      : str   # "surmenage", "fatigue", "hrv_faible"
    niveau    : str   # "danger", "warning"
    message   : str   # description de l'alerte


class StatsEquipe(BaseModel):
    """Statistiques globales de l'équipe."""
    total_nageurs      : int = 0
    nageurs_optimaux   : int = 0
    nageurs_surveiller : int = 0
    nageurs_fatigues   : int = 0
    nageurs_surmenage  : int = 0
    alertes_actives    : int = 0


class DashboardEquipeResponse(BaseModel):
    """
    Réponse complète du dashboard entraîneur.
    Agrège les données de tous les nageurs en un seul appel API.
    """
    stats   : StatsEquipe
    alertes : List[AlerteEquipe]
    nageurs : List[NageurEquipe]


# ─────────────────────────────────────────
# FONCTIONS DE CALCUL — Équipe
# ─────────────────────────────────────────

def determiner_statut(fatigue: Optional[int], acwr: Optional[float]) -> str:
    """
    Détermine le statut de forme d'un nageur à partir de ses KPI.

    Règles basées sur la littérature sportive :
    - surmenage  : ACWR > 1.5 OU fatigue > 80
    - fatigue    : ACWR > 1.3 OU fatigue > 65
    - surveiller : ACWR > 1.2 OU fatigue > 50
    - optimal    : tout le reste
    """
    if (acwr and acwr > 1.5) or (fatigue and fatigue > 80):
        return "surmenage"
    elif (acwr and acwr > 1.3) or (fatigue and fatigue > 65):
        return "fatigue"
    elif (acwr and acwr > 1.2) or (fatigue and fatigue > 50):
        return "surveiller"
    else:
        return "optimal"


def generer_alertes_equipe(nageurs_data: List[NageurEquipe]) -> List[AlerteEquipe]:
    """
    Génère les alertes prioritaires pour l'entraîneur.
    Analyse chaque nageur et génère une alerte si nécessaire.

    Args:
        nageurs_data : liste des nageurs avec leurs KPI calculés

    Returns:
        List[AlerteEquipe] : alertes triées par niveau (danger en premier)
    """
    alertes = []

    for nageur in nageurs_data:

        # ── Alerte surmenage ─────────────────────
        if nageur.statut == "surmenage":
            alertes.append(AlerteEquipe(
                nageur_id = nageur.id,
                nom       = nageur.nom,
                prenom    = nageur.prenom,
                type      = "surmenage",
                niveau    = "danger",
                message   = f"ACWR {nageur.acwr} — réduire immédiatement le volume"
            ))

        # ── Alerte fatigue ───────────────────────
        elif nageur.statut == "fatigue":
            alertes.append(AlerteEquipe(
                nageur_id = nageur.id,
                nom       = nageur.nom,
                prenom    = nageur.prenom,
                type      = "fatigue",
                niveau    = "warning",
                message   = "Fatigue élevée — prévoir une séance de récupération"
            ))

        # ── Alerte HRV faible ────────────────────
        if nageur.hrv_moyenne and nageur.hrv_moyenne < 50:
            alertes.append(AlerteEquipe(
                nageur_id = nageur.id,
                nom       = nageur.nom,
                prenom    = nageur.prenom,
                type      = "hrv_faible",
                niveau    = "warning",
                message   = f"HRV critique ({nageur.hrv_moyenne} ms) — système nerveux non récupéré"
            ))

    # Trie les alertes — danger en premier, warning ensuite
    alertes.sort(key=lambda a: 0 if a.niveau == "danger" else 1)

    return alertes


def construire_nageur_equipe(nageur: Nageur, db: Session) -> NageurEquipe:
    """
    Construit le résumé KPI d'un nageur pour la vue équipe.
    Réutilise les fonctions calculer_kpi et calculer_charge de dashboard.py.

    Args:
        nageur : objet SQLAlchemy Nageur
        db     : session de base de données

    Returns:
        NageurEquipe : résumé du nageur avec ses KPI
    """

    # Récupère les sessions
    sessions = db.query(SessionModel).filter(
        SessionModel.nageur_id == nageur.id
    ).order_by(SessionModel.date).all()

    # Récupère les performances via jointure
    performances = db.query(Performance).join(SessionModel).filter(
        SessionModel.nageur_id == nageur.id
    ).order_by(SessionModel.date).all()

    # Récupère les biométries
    biometries = db.query(Biometrie).filter(
        Biometrie.nageur_id == nageur.id
    ).order_by(Biometrie.date).all()

    # Calcule les KPI en réutilisant les fonctions de dashboard.py
    kpi    = calculer_kpi(performances, biometries)
    charge = calculer_charge(sessions)

    # Détermine le statut de forme
    statut = determiner_statut(kpi.fatigue, charge.acwr)

    return NageurEquipe(
        id             = nageur.id,
        nom            = nageur.nom,
        prenom         = nageur.prenom,
        specialite     = nageur.specialite,
        dernier_chrono = kpi.dernier_chrono,
        acwr           = charge.acwr,
        hrv_moyenne    = kpi.hrv_moyenne,
        fatigue        = kpi.fatigue,
        statut         = statut
    )


# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────

@router.get("/", response_model=DashboardEquipeResponse)
def get_dashboard_equipe(db: Session = Depends(get_db)):
    """
    Retourne le dashboard complet pour l'entraîneur.

    Agrège en un seul appel :
    - Statistiques globales de l'équipe
    - Alertes prioritaires (surmenage, fatigue, HRV)
    - KPI de chaque nageur (chrono, ACWR, fatigue, statut)

    Accessible sur : GET /equipe
    """

    # Récupère tous les nageurs
    tous_nageurs = db.query(Nageur).all()

    # Construit le résumé KPI pour chaque nageur
    nageurs_data = [
        construire_nageur_equipe(nageur, db)
        for nageur in tous_nageurs
    ]

    # Génère les alertes
    alertes = generer_alertes_equipe(nageurs_data)

    # Calcule les stats globales
    stats = StatsEquipe(
        total_nageurs      = len(nageurs_data),
        nageurs_optimaux   = sum(1 for n in nageurs_data if n.statut == "optimal"),
        nageurs_surveiller = sum(1 for n in nageurs_data if n.statut == "surveiller"),
        nageurs_fatigues   = sum(1 for n in nageurs_data if n.statut == "fatigue"),
        nageurs_surmenage  = sum(1 for n in nageurs_data if n.statut == "surmenage"),
        alertes_actives    = len(alertes)
    )

    return DashboardEquipeResponse(
        stats   = stats,
        alertes = alertes,
        nageurs = nageurs_data
    )


@router.get("/alertes", response_model=List[AlerteEquipe])
def get_alertes_equipe(db: Session = Depends(get_db)):
    """
    Retourne uniquement les alertes actives de l'équipe.
    Utile pour les notifications en temps réel dans le frontend.

    Accessible sur : GET /equipe/alertes
    """
    tous_nageurs = db.query(Nageur).all()
    nageurs_data = [construire_nageur_equipe(n, db) for n in tous_nageurs]
    return generer_alertes_equipe(nageurs_data)


@router.get("/stats", response_model=StatsEquipe)
def get_stats_equipe(db: Session = Depends(get_db)):
    """
    Retourne uniquement les statistiques globales de l'équipe.
    Utile pour les KPI cards du dashboard entraîneur.

    Accessible sur : GET /equipe/stats
    """
    tous_nageurs = db.query(Nageur).all()
    nageurs_data = [construire_nageur_equipe(n, db) for n in tous_nageurs]
    alertes      = generer_alertes_equipe(nageurs_data)

    return StatsEquipe(
        total_nageurs      = len(nageurs_data),
        nageurs_optimaux   = sum(1 for n in nageurs_data if n.statut == "optimal"),
        nageurs_surveiller = sum(1 for n in nageurs_data if n.statut == "surveiller"),
        nageurs_fatigues   = sum(1 for n in nageurs_data if n.statut == "fatigue"),
        nageurs_surmenage  = sum(1 for n in nageurs_data if n.statut == "surmenage"),
        alertes_actives    = len(alertes)
    )