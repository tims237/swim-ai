# routes/nageurs.py
# Endpoints CRUD pour la gestion des nageurs
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
from app.schemas import NageurCreate, NageurResponse

router = APIRouter(
    prefix="/nageurs",
    tags=["Nageurs"]
)


# ─────────────────────────────────────────
# POST /nageurs — Créer un nageur
# Accessible : entraîneur et admin uniquement
# ─────────────────────────────────────────

@router.post("/", response_model=NageurResponse, status_code=status.HTTP_201_CREATED)
def creer_nageur(
    nageur: NageurCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Crée un nouveau nageur dans la base de données.
    Route protégée — token JWT requis.

    - **nom** : obligatoire
    - **prenom** : obligatoire
    - **date_naissance** : optionnel
    - **specialite** : optionnel (ex: 100m crawl)
    - **niveau** : optionnel (ex: national, régional)
    """

    # Seuls les entraîneurs et admins peuvent créer des nageurs
    if current_user.role not in ["entraineur", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les entraîneurs peuvent créer des nageurs"
        )

    # Vérifie si un nageur avec le même nom et prénom existe déjà
    nageur_existant = db.query(Nageur).filter(
        Nageur.nom == nageur.nom,
        Nageur.prenom == nageur.prenom
    ).first()

    if nageur_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un nageur {nageur.nom} {nageur.prenom} existe déjà"
        )

    # Convertit le schéma Pydantic en objet SQLAlchemy
    nouveau_nageur = Nageur(**nageur.model_dump())

    db.add(nouveau_nageur)
    db.commit()
    db.refresh(nouveau_nageur)

    return nouveau_nageur


# ─────────────────────────────────────────
# GET /nageurs — Liste tous les nageurs
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/", response_model=List[NageurResponse])
def get_nageurs(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne la liste de tous les nageurs enregistrés.
    Route protégée — token JWT requis.
    """
    return db.query(Nageur).all()


# ─────────────────────────────────────────
# GET /nageurs/{id} — Détail d'un nageur
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/{nageur_id}", response_model=NageurResponse)
def get_nageur(
    nageur_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne le détail d'un nageur par son id.
    Route protégée — token JWT requis.
    Retourne une erreur 404 si le nageur n'existe pas.
    """
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()

    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    return nageur


# ─────────────────────────────────────────
# DELETE /nageurs/{id} — Supprimer un nageur
# Accessible : admin uniquement
# ─────────────────────────────────────────

@router.delete("/{nageur_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_nageur(
    nageur_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
    # get_current_admin → vérifie automatiquement que l'utilisateur est admin
):
    """
    Supprime un nageur et toutes ses données associées.
    Route protégée — réservée aux administrateurs.
    (sessions, biométries, performances supprimées par CASCADE)
    """
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()

    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    db.delete(nageur)
    db.commit()