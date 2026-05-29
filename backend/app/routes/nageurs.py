# routes/nageurs.py
# Endpoints CRUD pour la gestion des nageurs
# Toutes les routes liées aux nageurs sont regroupées ici

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import de la session BDD — injectée automatiquement via Depends
from app.database import get_db

# Import du modèle SQLAlchemy — représente la table nageurs
from app.models import Nageur

# Import des schémas Pydantic — validation des données entrantes et sortantes
from app.schemas import NageurCreate, NageurResponse

from typing import List

# APIRouter — equivalent de app mais pour un groupe de routes
# prefix : toutes les routes de ce fichier commenceront par /nageurs
# tags   : groupe les routes dans la documentation Swagger
router = APIRouter(
    prefix="/nageurs",
    tags=["Nageurs"]
)


# ─────────────────────────────────────────
# POST /nageurs — Créer un nageur
# ─────────────────────────────────────────

@router.post("/", response_model=NageurResponse, status_code=status.HTTP_201_CREATED)
def creer_nageur(nageur: NageurCreate, db: Session = Depends(get_db)):
    """
    Crée un nouveau nageur dans la base de données.

    - **nom** : obligatoire
    - **prenom** : obligatoire
    - **date_naissance** : optionnel
    - **specialite** : optionnel (ex: 100m crawl)
    - **niveau** : optionnel (ex: national, régional)
    """

    # Vérifie si un nageur avec le même nom et prénom existe déjà
    nageur_existant = db.query(Nageur).filter(
        Nageur.nom == nageur.nom,
        Nageur.prenom == nageur.prenom
    ).first()

    if nageur_existant:
        # HTTP 400 — la requête est invalide (doublon détecté)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un nageur {nageur.nom} {nageur.prenom} existe déjà"
        )

    # Convertit le schéma Pydantic en objet SQLAlchemy
    # model_dump() transforme NageurCreate en dictionnaire Python
    nouveau_nageur = Nageur(**nageur.model_dump())

    # Ajoute l'objet à la session SQLAlchemy (pas encore en BDD)
    db.add(nouveau_nageur)

    # Sauvegarde définitivement dans PostgreSQL
    # C'est ici que l'id est généré par PostgreSQL
    db.commit()

    # Rafraîchit l'objet pour récupérer l'id généré
    db.refresh(nouveau_nageur)

    return nouveau_nageur


# ─────────────────────────────────────────
# GET /nageurs — Liste tous les nageurs
# ─────────────────────────────────────────

@router.get("/", response_model=List[NageurResponse])
def get_nageurs(db: Session = Depends(get_db)):
    """
    Retourne la liste de tous les nageurs enregistrés.
    """

    # Récupère tous les nageurs dans la table
    nageurs = db.query(Nageur).all()

    return nageurs


# ─────────────────────────────────────────
# GET /nageurs/{id} — Détail d'un nageur
# ─────────────────────────────────────────

@router.get("/{nageur_id}", response_model=NageurResponse)
def get_nageur(nageur_id: int, db: Session = Depends(get_db)):
    """
    Retourne le détail d'un nageur par son id.
    Retourne une erreur 404 si le nageur n'existe pas.
    """

    # Recherche le nageur par son id
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()

    # Si aucun nageur trouvé — HTTP 404
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    return nageur


# ─────────────────────────────────────────
# DELETE /nageurs/{id} — Supprimer un nageur
# ─────────────────────────────────────────

@router.delete("/{nageur_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_nageur(nageur_id: int, db: Session = Depends(get_db)):
    """
    Supprime un nageur et toutes ses données associées.
    (sessions, biométries, performances — grâce au CASCADE)
    Retourne 204 No Content si la suppression est réussie.
    """

    # Vérifie que le nageur existe avant de supprimer
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()

    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    # Supprime le nageur — le CASCADE supprime automatiquement
    # toutes ses sessions, biométries et performances
    db.delete(nageur)
    db.commit()