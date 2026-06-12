# routes/sessions.py
# Endpoints CRUD pour la gestion des sessions d'entraînement
# Routes protégées par JWT — token requis pour toutes les opérations

# 1. Bibliothèques standard
from typing import List

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.dependencies import get_current_user, get_current_admin
from app.database import get_db
from app.models import Nageur, Utilisateur
from app.models import Session as SessionModel
from app.schemas import SeanceCreate, SeanceResponse

router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"]
)


# ─────────────────────────────────────────
# POST /sessions — Créer une session
# Accessible : nageur (ses propres sessions) + entraîneur + admin
# ─────────────────────────────────────────

@router.post("/", response_model=SeanceResponse, status_code=status.HTTP_201_CREATED)
def creer_session(
    seance: SeanceCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Crée une nouvelle session d'entraînement pour un nageur.
    Route protégée — token JWT requis.

    - **nageur_id**  : obligatoire — id du nageur concerné
    - **date_seance**: obligatoire — date de la séance
    - **type_seance**: optionnel (endurance, sprint, technique, récupération)
    - **duree_min**  : optionnel — durée en minutes
    """

    # Vérifie que le nageur existe
    nageur = db.query(Nageur).filter(Nageur.id == seance.nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {seance.nageur_id} introuvable"
        )

    # Un nageur ne peut créer des sessions que pour lui-même
    # Un entraîneur ou admin peut créer pour n'importe quel nageur
    if current_user.role == "nageur" and current_user.nageur_id != seance.nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez créer des sessions que pour votre propre profil"
        )

    nouvelle_session = SessionModel(**seance.model_dump())
    db.add(nouvelle_session)
    db.commit()
    db.refresh(nouvelle_session)

    return nouvelle_session


# ─────────────────────────────────────────
# GET /sessions — Liste toutes les sessions
# Accessible : entraîneur et admin uniquement
# ─────────────────────────────────────────

@router.get("/", response_model=List[SeanceResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les sessions d'entraînement.
    Route protégée — token JWT requis.
    """
    # Un nageur ne voit que ses propres sessions
    if current_user.role == "nageur":
        return db.query(SessionModel).filter(
            SessionModel.nageur_id == current_user.nageur_id
        ).all()

    # Entraîneur et admin voient toutes les sessions
    return db.query(SessionModel).all()


# ─────────────────────────────────────────
# GET /sessions/{id} — Détail d'une session
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/{session_id}", response_model=SeanceResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne le détail d'une session par son id.
    Route protégée — token JWT requis.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {session_id} introuvable"
        )

    # Un nageur ne peut voir que ses propres sessions
    if current_user.role == "nageur" and session.nageur_id != current_user.nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — cette session ne vous appartient pas"
        )

    return session


# ─────────────────────────────────────────
# GET /sessions/nageur/{id} — Sessions d'un nageur
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/nageur/{nageur_id}", response_model=List[SeanceResponse])
def get_sessions_nageur(
    nageur_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les sessions d'un nageur spécifique.
    Route protégée — token JWT requis.
    """

    # Un nageur ne peut voir que ses propres sessions
    if current_user.role == "nageur" and current_user.nageur_id != nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — vous ne pouvez voir que vos propres sessions"
        )

    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    return db.query(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).all()


# ─────────────────────────────────────────
# DELETE /sessions/{id} — Supprimer une session
# Accessible : admin uniquement
# ─────────────────────────────────────────

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
):
    """
    Supprime une session et toutes ses performances associées.
    Route protégée — réservée aux administrateurs.
    """
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {session_id} introuvable"
        )

    db.delete(session)
    db.commit()