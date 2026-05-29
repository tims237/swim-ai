# routes/performances.py
# Endpoints CRUD pour la gestion des performances chronométriques
# Résultats de nage : chrono, distance, style, vitesse moyenne

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Performance, Session as SessionModel, Nageur
from app.schemas import PerformanceCreate, PerformanceResponse

router = APIRouter(
    prefix="/performances",
    tags=["Performances"]
)


# ─────────────────────────────────────────
# POST /performances — Créer une performance
# ─────────────────────────────────────────

@router.post("/", response_model=PerformanceResponse, status_code=status.HTTP_201_CREATED)
def creer_performance(performance: PerformanceCreate, db: Session = Depends(get_db)):
    """
    Enregistre un résultat chronométrique lors d'une session.

    - **session_id** : obligatoire — id de la session concernée
    - **distance_m** : distance en mètres (50, 100, 200, 400, 800, 1500)
    - **temps_s** : chrono en secondes (ex: 58.24)
    - **style_nage** : crawl, dos, brasse, papillon, 4 nages
    - **vitesse_moy** : vitesse moyenne en m/s
    """

    # Vérifie que la session existe avant de créer la performance
    session = db.query(SessionModel).filter(
        SessionModel.id == performance.session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {performance.session_id} introuvable"
        )

    # Convertit le schéma Pydantic en objet SQLAlchemy
    nouvelle_performance = Performance(**performance.model_dump())

    db.add(nouvelle_performance)
    db.commit()
    db.refresh(nouvelle_performance)

    return nouvelle_performance


# ─────────────────────────────────────────
# GET /performances — Liste toutes les performances
# ─────────────────────────────────────────

@router.get("/", response_model=List[PerformanceResponse])
def get_performances(db: Session = Depends(get_db)):
    """
    Retourne toutes les performances enregistrées.
    """
    performances = db.query(Performance).all()
    return performances


# ─────────────────────────────────────────
# GET /performances/{id} — Détail d'une performance
# ─────────────────────────────────────────

@router.get("/{performance_id}", response_model=PerformanceResponse)
def get_performance(performance_id: int, db: Session = Depends(get_db)):
    """
    Retourne le détail d'une performance par son id.
    """
    performance = db.query(Performance).filter(
        Performance.id == performance_id
    ).first()

    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Performance avec l'id {performance_id} introuvable"
        )

    return performance


# ─────────────────────────────────────────
# GET /performances/session/{id} — Performances d'une session
# ─────────────────────────────────────────

@router.get("/session/{session_id}", response_model=List[PerformanceResponse])
def get_performances_session(session_id: int, db: Session = Depends(get_db)):
    """
    Retourne toutes les performances d'une session spécifique.
    Utile pour voir tous les chronos d'une séance d'entraînement.
    """

    # Vérifie que la session existe
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {session_id} introuvable"
        )

    performances = db.query(Performance).filter(
        Performance.session_id == session_id
    ).all()

    return performances


# ─────────────────────────────────────────
# GET /performances/nageur/{id} — Performances d'un nageur
# ─────────────────────────────────────────

@router.get("/nageur/{nageur_id}", response_model=List[PerformanceResponse])
def get_performances_nageur(nageur_id: int, db: Session = Depends(get_db)):
    """
    Retourne toutes les performances d'un nageur spécifique.
    Fait une jointure entre performances et sessions pour filtrer par nageur.
    Utile pour suivre l'évolution des chronos dans le temps.
    """

    # Vérifie que le nageur existe
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    # Jointure performances → sessions pour filtrer par nageur_id
    performances = db.query(Performance).join(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).all()

    return performances


# ─────────────────────────────────────────
# DELETE /performances/{id} — Supprimer une performance
# ─────────────────────────────────────────

@router.delete("/{performance_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_performance(performance_id: int, db: Session = Depends(get_db)):
    """
    Supprime une performance par son id.
    """
    performance = db.query(Performance).filter(
        Performance.id == performance_id
    ).first()

    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Performance avec l'id {performance_id} introuvable"
        )

    db.delete(performance)
    db.commit()