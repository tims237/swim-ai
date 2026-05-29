# routes/biometries.py
# Endpoints CRUD pour la gestion des données biométriques
# Données physiologiques journalières : HRV, FC repos, RPE, sommeil

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Biometrie, Nageur
from app.schemas import BiometrieCreate, BiometrieResponse

router = APIRouter(
    prefix="/biometries",
    tags=["Biométries"]
)


# ─────────────────────────────────────────
# POST /biometries — Créer une biométrie
# ─────────────────────────────────────────

@router.post("/", response_model=BiometrieResponse, status_code=status.HTTP_201_CREATED)
def creer_biometrie(biometrie: BiometrieCreate, db: Session = Depends(get_db)):
    """
    Enregistre les données physiologiques journalières d'un nageur.

    - **nageur_id** : obligatoire
    - **date_biometrie** : obligatoire
    - **hrv_ms** : variabilité cardiaque en ms
    - **fc_repos** : fréquence cardiaque au repos en bpm
    - **rpe** : effort perçu de 1 à 10
    - **sommeil_h** : heures de sommeil
    """

    # Vérifie que le nageur existe
    nageur = db.query(Nageur).filter(Nageur.id == biometrie.nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {biometrie.nageur_id} introuvable"
        )

    # Convertit le schéma Pydantic en objet SQLAlchemy
    nouvelle_biometrie = Biometrie(**biometrie.model_dump())

    db.add(nouvelle_biometrie)
    db.commit()
    db.refresh(nouvelle_biometrie)

    return nouvelle_biometrie


# ─────────────────────────────────────────
# GET /biometries — Liste toutes les biométries
# ─────────────────────────────────────────

@router.get("/", response_model=List[BiometrieResponse])
def get_biometries(db: Session = Depends(get_db)):
    """
    Retourne toutes les entrées biométriques enregistrées.
    """
    biometries = db.query(Biometrie).all()
    return biometries


# ─────────────────────────────────────────
# GET /biometries/{id} — Détail d'une biométrie
# ─────────────────────────────────────────

@router.get("/{biometrie_id}", response_model=BiometrieResponse)
def get_biometrie(biometrie_id: int, db: Session = Depends(get_db)):
    """
    Retourne le détail d'une entrée biométrique par son id.
    """
    biometrie = db.query(Biometrie).filter(Biometrie.id == biometrie_id).first()

    if not biometrie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Biométrie avec l'id {biometrie_id} introuvable"
        )

    return biometrie


# ─────────────────────────────────────────
# GET /biometries/nageur/{id} — Biométries d'un nageur
# ─────────────────────────────────────────

@router.get("/nageur/{nageur_id}", response_model=List[BiometrieResponse])
def get_biometries_nageur(nageur_id: int, db: Session = Depends(get_db)):
    """
    Retourne toutes les données biométriques d'un nageur spécifique.
    Utile pour suivre l'évolution de la récupération dans le temps.
    """

    # Vérifie que le nageur existe
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    biometries = db.query(Biometrie).filter(
        Biometrie.nageur_id == nageur_id
    ).all()

    return biometries


# ─────────────────────────────────────────
# DELETE /biometries/{id} — Supprimer une biométrie
# ─────────────────────────────────────────

@router.delete("/{biometrie_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_biometrie(biometrie_id: int, db: Session = Depends(get_db)):
    """
    Supprime une entrée biométrique par son id.
    """
    biometrie = db.query(Biometrie).filter(Biometrie.id == biometrie_id).first()

    if not biometrie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Biométrie avec l'id {biometrie_id} introuvable"
        )

    db.delete(biometrie)
    db.commit()