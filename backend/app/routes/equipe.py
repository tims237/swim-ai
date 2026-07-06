# routes/equipe.py
# Endpoints dashboard entraîneur — vue agrégée de toute l'équipe
# Routes protégées par JWT — réservées aux entraîneurs et admins

# 1. Bibliothèques standard
from typing import List, Optional

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.dependencies import get_current_entraineur
from app.database import get_db
from app.models import Biometrie, Nageur, Performance, Utilisateur
from app.models import Session as SessionModel
from app.routes.dashboard import calculer_kpi, calculer_charge

router = APIRouter(
    prefix="/equipe",
    tags=["Équipe — Vue entraîneur"]
)


# ─────────────────────────────────────────
# SCHÉMAS
# ─────────────────────────────────────────

class NageurEquipe(BaseModel):
    """Résumé d'un nageur pour la vue équipe entraîneur."""
    id             : int
    nom            : str
    prenom         : str
    specialite     : Optional[str]   = None
    dernier_chrono : Optional[float] = None
    acwr           : Optional[float] = None
    hrv_moyenne    : Optional[float] = None
    fatigue        : Optional[int]   = None
    statut         : str = "inconnu"

    class Config:
        from_attributes = True


class AlerteEquipe(BaseModel):
    """Alerte générée pour un nageur de l'équipe."""
    nageur_id : int
    nom       : str
    prenom    : str
    type      : str
    niveau    : str
    message   : str


class StatsEquipe(BaseModel):
    """Statistiques globales de l'équipe."""
    total_nageurs      : int = 0
    nageurs_optimaux   : int = 0
    nageurs_surveiller : int = 0
    nageurs_fatigues   : int = 0
    nageurs_surmenage  : int = 0
    alertes_actives    : int = 0


class DashboardEquipeResponse(BaseModel):
    """Réponse complète du dashboard entraîneur."""
    stats   : StatsEquipe
    alertes : List[AlerteEquipe]
    nageurs : List[NageurEquipe]


# ─────────────────────────────────────────
# FONCTIONS DE CALCUL
# ─────────────────────────────────────────

def determiner_statut(fatigue: Optional[int], acwr: Optional[float]) -> str:
    """
    Détermine le statut de forme d'un nageur.

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

    Args:
        nageurs_data : nageurs avec leurs KPI calculés

    Returns:
        List[AlerteEquipe] : alertes triées par niveau (danger en premier)
    """
    alertes = []

    for nageur in nageurs_data:

        if nageur.statut == "surmenage":
            # Le surmenage peut être déclenché par l'ACWR ou par la fatigue
            if nageur.acwr and nageur.acwr > 1.5:
                msg_surmenage = f"ACWR critique ({nageur.acwr}) — réduire immédiatement le volume"
            else:
                msg_surmenage = f"Fatigue critique ({nageur.fatigue}/100) — repos obligatoire"
            alertes.append(AlerteEquipe(
                nageur_id = nageur.id,
                nom       = nageur.nom,
                prenom    = nageur.prenom,
                type      = "surmenage",
                niveau    = "danger",
                message   = msg_surmenage
            ))

        elif nageur.statut == "fatigue":
            alertes.append(AlerteEquipe(
                nageur_id = nageur.id,
                nom       = nageur.nom,
                prenom    = nageur.prenom,
                type      = "fatigue",
                niveau    = "warning",
                message   = "Fatigue élevée — prévoir une séance de récupération"
            ))

        if nageur.hrv_moyenne and nageur.hrv_moyenne < 50:
            alertes.append(AlerteEquipe(
                nageur_id = nageur.id,
                nom       = nageur.nom,
                prenom    = nageur.prenom,
                type      = "hrv_faible",
                niveau    = "warning",
                message   = f"HRV critique ({nageur.hrv_moyenne} ms) — système nerveux non récupéré"
            ))

    alertes.sort(key=lambda a: 0 if a.niveau == "danger" else 1)
    return alertes


def construire_nageur_equipe(nageur: Nageur, db: Session) -> NageurEquipe:
    """
    Construit le résumé KPI d'un nageur pour la vue équipe.
    Réutilise calculer_kpi et calculer_charge de dashboard.py.

    Args:
        nageur : objet SQLAlchemy Nageur
        db     : session de base de données

    Returns:
        NageurEquipe : résumé du nageur avec ses KPI
    """
    sessions = db.query(SessionModel).filter(
        SessionModel.nageur_id == nageur.id
    ).order_by(SessionModel.date).all()

    performances = db.query(Performance).join(SessionModel).filter(
        SessionModel.nageur_id == nageur.id
    ).order_by(SessionModel.date).all()

    biometries = db.query(Biometrie).filter(
        Biometrie.nageur_id == nageur.id
    ).order_by(Biometrie.date).all()

    kpi    = calculer_kpi(performances, biometries)
    charge = calculer_charge(sessions)
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
# Toutes les routes réservées aux entraîneurs et admins
# get_current_entraineur vérifie automatiquement le rôle
# ─────────────────────────────────────────

@router.get("/", response_model=DashboardEquipeResponse)
def get_dashboard_equipe(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_entraineur)
):
    """
    Retourne le dashboard complet pour l'entraîneur.
    Route protégée — réservée aux entraîneurs et admins.

    Agrège en un seul appel :
    - Statistiques globales de l'équipe
    - Alertes prioritaires (surmenage, fatigue, HRV)
    - KPI de chaque nageur
    """
    tous_nageurs = db.query(Nageur).all()
    nageurs_data = [construire_nageur_equipe(n, db) for n in tous_nageurs]
    alertes      = generer_alertes_equipe(nageurs_data)

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
def get_alertes_equipe(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_entraineur)
):
    """
    Retourne uniquement les alertes actives de l'équipe.
    Route protégée — réservée aux entraîneurs et admins.
    """
    tous_nageurs = db.query(Nageur).all()
    nageurs_data = [construire_nageur_equipe(n, db) for n in tous_nageurs]
    return generer_alertes_equipe(nageurs_data)


@router.get("/stats", response_model=StatsEquipe)
def get_stats_equipe(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_entraineur)
):
    """
    Retourne uniquement les statistiques globales de l'équipe.
    Route protégée — réservée aux entraîneurs et admins.
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