# routes/sessions.py
# Endpoints CRUD pour la gestion des sessions d'entraînement
# Toutes les routes liées aux sessions sont regroupées ici

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Import de la session BDD — injectée automatiquement via Depends
from app.database import get_db

# Import des modèles SQLAlchemy
from app.models import Session as SessionModel, Nageur

# Import des schémas Pydantic
from app.schemas import SeanceCreate, SeanceResponse

# APIRouter — groupe toutes les routes sessions
# prefix : toutes les routes commenceront par /sessions
# tags   : groupe les routes dans la documentation Swagger
router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"]
)


# ─────────────────────────────────────────
# POST /sessions — Créer une session
# ─────────────────────────────────────────

@router.post("/", response_model=SeanceResponse, status_code=status.HTTP_201_CREATED)
def creer_session(seance: SeanceCreate, db: Session = Depends(get_db)):
    """
    Crée une nouvelle session d'entraînement pour un nageur.

    - **nageur_id** : obligatoire — id du nageur concerné
    - **date_seance** : obligatoire — date de la séance
    - **type_seance** : optionnel (endurance, sprint, technique, récupération)
    - **duree_min** : optionnel — durée en minutes
    """

    # Vérifie que le nageur existe avant de créer la session
    nageur = db.query(Nageur).filter(Nageur.id == seance.nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {seance.nageur_id} introuvable"
        )

    # Convertit le schéma Pydantic en objet SQLAlchemy
    nouvelle_session = SessionModel(**seance.model_dump())

    # Ajoute à la session SQLAlchemy
    db.add(nouvelle_session)

    # Sauvegarde dans PostgreSQL
    db.commit()

    # Rafraîchit pour récupérer l'id généré
    db.refresh(nouvelle_session)

    return nouvelle_session


# ─────────────────────────────────────────
# GET /sessions — Liste toutes les sessions
# ─────────────────────────────────────────

@router.get("/", response_model=List[SeanceResponse])
def get_sessions(db: Session = Depends(get_db)):
    """
    Retourne la liste de toutes les sessions d'entraînement.
    """
    sessions = db.query(SessionModel).all()
    return sessions


# ─────────────────────────────────────────
# GET /sessions/{id} — Détail d'une session
# ─────────────────────────────────────────

@router.get("/{session_id}", response_model=SeanceResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """
    Retourne le détail d'une session par son id.
    Retourne une erreur 404 si la session n'existe pas.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {session_id} introuvable"
        )

    return session


# ─────────────────────────────────────────
# GET /nageurs/{id}/sessions — Sessions d'un nageur
# ─────────────────────────────────────────

@router.get("/nageur/{nageur_id}", response_model=List[SeanceResponse])
def get_sessions_nageur(nageur_id: int, db: Session = Depends(get_db)):
    """
    Retourne toutes les sessions d'entraînement d'un nageur spécifique.
    Retourne une erreur 404 si le nageur n'existe pas.
    """

    # Vérifie que le nageur existe
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    # Récupère toutes les sessions du nageur
    sessions = db.query(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).all()

    return sessions


# ─────────────────────────────────────────
# DELETE /sessions/{id} — Supprimer une session
# ─────────────────────────────────────────

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_session(session_id: int, db: Session = Depends(get_db)):
    """
    Supprime une session et toutes ses performances associées.
    (grâce au CASCADE défini dans models.py)
    """

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {session_id} introuvable"
        )

    db.delete(session)
    db.commit()