# routes/performances.py
# Endpoints CRUD pour la gestion des performances chronométriques
# Routes protégées par JWT — token requis pour toutes les opérations

# 1. Bibliothèques standard
from typing import List

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.dependencies import get_current_user, get_current_admin
from app.database import get_db
from app.models import Nageur, Performance, Utilisateur
from app.models import Session as SessionModel
from app.schemas import PerformanceCreate, PerformanceResponse, PerformanceUpdate

router = APIRouter(
    prefix="/performances",
    tags=["Performances"]
)


# ─────────────────────────────────────────
# POST /performances — Créer une performance
# Accessible : nageur (ses propres performances) + entraîneur + admin
# ─────────────────────────────────────────

@router.post("/", response_model=PerformanceResponse, status_code=status.HTTP_201_CREATED)
def creer_performance(
    performance: PerformanceCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Enregistre un résultat chronométrique lors d'une session.
    Route protégée — token JWT requis.

    - **session_id** : obligatoire — id de la session concernée
    - **distance_m** : distance en mètres (50, 100, 200, 400, 800, 1500)
    - **temps_s**    : chrono en secondes (ex: 58.24)
    - **style_nage** : crawl, dos, brasse, papillon, 4 nages
    - **vitesse_moy**: vitesse moyenne en m/s
    """

    # Vérifie que la session existe
    session = db.query(SessionModel).filter(
        SessionModel.id == performance.session_id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session avec l'id {performance.session_id} introuvable"
        )

    # Un nageur ne peut enregistrer des performances que pour ses propres sessions
    if current_user.role == "nageur" and session.nageur_id != current_user.nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez enregistrer des performances que pour vos propres sessions"
        )

    nouvelle_performance = Performance(**performance.model_dump())
    db.add(nouvelle_performance)
    db.commit()
    db.refresh(nouvelle_performance)

    return nouvelle_performance


# ─────────────────────────────────────────
# GET /performances — Liste toutes les performances
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/", response_model=List[PerformanceResponse])
def get_performances(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les performances enregistrées avec pagination.
    Route protégée — token JWT requis.
    Un nageur ne voit que ses propres performances.

    - **skip** : nombre d'éléments à sauter (défaut : 0)
    - **limit** : nombre maximum d'éléments retournés (défaut : 50, max : 100)
    """
    limit = min(limit, 100)

    # Un nageur ne voit que ses propres performances
    if current_user.role == "nageur":
        return db.query(Performance).join(SessionModel).filter(
            SessionModel.nageur_id == current_user.nageur_id
        ).offset(skip).limit(limit).all()

    # Entraîneur et admin voient toutes les performances
    return db.query(Performance).offset(skip).limit(limit).all()


# ─────────────────────────────────────────
# GET /performances/{id} — Détail d'une performance
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/{performance_id}", response_model=PerformanceResponse)
def get_performance(
    performance_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne le détail d'une performance par son id.
    Route protégée — token JWT requis.
    """
    performance = db.query(Performance).filter(
        Performance.id == performance_id
    ).first()

    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Performance avec l'id {performance_id} introuvable"
        )

    # Un nageur ne peut voir que ses propres performances
    if current_user.role == "nageur":
        session = db.query(SessionModel).filter(
            SessionModel.id == performance.session_id
        ).first()
        if session and session.nageur_id != current_user.nageur_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Accès refusé — cette performance ne vous appartient pas"
            )

    return performance


# ─────────────────────────────────────────
# GET /performances/session/{id} — Performances d'une session
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/session/{session_id}", response_model=List[PerformanceResponse])
def get_performances_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les performances d'une session spécifique.
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

    return db.query(Performance).filter(
        Performance.session_id == session_id
    ).all()


# ─────────────────────────────────────────
# GET /performances/nageur/{id} — Performances d'un nageur
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/nageur/{nageur_id}", response_model=List[PerformanceResponse])
def get_performances_nageur(
    nageur_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les performances d'un nageur spécifique.
    Route protégée — token JWT requis.
    Jointure performances → sessions pour filtrer par nageur.
    """

    # Un nageur ne peut voir que ses propres performances
    if current_user.role == "nageur" and current_user.nageur_id != nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — vous ne pouvez voir que vos propres performances"
        )

    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    return db.query(Performance).join(SessionModel).filter(
        SessionModel.nageur_id == nageur_id
    ).all()


# ─────────────────────────────────────────
# PUT /performances/{id} — Modifier une performance
# Accessible : nageur (ses performances) + entraîneur + admin
# ─────────────────────────────────────────

@router.put("/{performance_id}", response_model=PerformanceResponse)
def modifier_performance(
    performance_id: int,
    data: PerformanceUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Modifie une performance existante — seuls les champs envoyés sont mis à jour.
    Route protégée — token JWT requis.

    Un nageur ne peut modifier que ses propres performances.
    Un entraîneur ou admin peut modifier toutes les performances.

    - **distance_m** : optionnel
    - **temps_s** : optionnel
    - **style_nage** : optionnel
    - **vitesse_moy** : optionnel
    """

    performance = db.query(Performance).filter(
        Performance.id == performance_id
    ).first()

    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Performance avec l'id {performance_id} introuvable"
        )

    # Un nageur ne peut modifier que ses propres performances
    if current_user.role == "nageur":
        session = db.query(SessionModel).filter(
            SessionModel.id == performance.session_id
        ).first()
        if session and session.nageur_id != current_user.nageur_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez modifier que vos propres performances"
            )

    donnees = data.model_dump(exclude_unset=True)
    for champ, valeur in donnees.items():
        setattr(performance, champ, valeur)

    db.commit()
    db.refresh(performance)

    return performance


# ─────────────────────────────────────────
# DELETE /performances/{id} — Supprimer une performance
# Accessible : admin uniquement
# ─────────────────────────────────────────

@router.delete("/{performance_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_performance(
    performance_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
):
    """
    Supprime une performance par son id.
    Route protégée — réservée aux administrateurs.
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