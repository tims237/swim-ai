# routes/biometries.py
# Endpoints CRUD pour la gestion des données biométriques
# Routes protégées par JWT — token requis pour toutes les opérations

# 1. Bibliothèques standard
from typing import List

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.dependencies import get_current_user, get_current_admin
from app.database import get_db
from app.models import Biometrie, Nageur, Utilisateur
from app.schemas import BiometrieCreate, BiometrieResponse, BiometrieUpdate

router = APIRouter(
    prefix="/biometries",
    tags=["Biométries"]
)


# ─────────────────────────────────────────
# POST /biometries — Créer une biométrie
# Accessible : nageur (ses propres données) + entraîneur + admin
# ─────────────────────────────────────────

@router.post("/", response_model=BiometrieResponse, status_code=status.HTTP_201_CREATED)
def creer_biometrie(
    biometrie: BiometrieCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Enregistre les données physiologiques journalières d'un nageur.
    Route protégée — token JWT requis.

    - **nageur_id**      : obligatoire
    - **date_biometrie** : obligatoire
    - **hrv_ms**         : variabilité cardiaque en ms
    - **fc_repos**       : fréquence cardiaque au repos en bpm
    - **rpe**            : effort perçu de 1 à 10
    - **sommeil_h**      : heures de sommeil
    """

    # Vérifie que le nageur existe
    nageur = db.query(Nageur).filter(Nageur.id == biometrie.nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {biometrie.nageur_id} introuvable"
        )

    # Un nageur ne peut saisir que ses propres biométries
    if current_user.role == "nageur" and current_user.nageur_id != biometrie.nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez saisir que vos propres données biométriques"
        )

    nouvelle_biometrie = Biometrie(**biometrie.model_dump())
    db.add(nouvelle_biometrie)
    db.commit()
    db.refresh(nouvelle_biometrie)

    return nouvelle_biometrie


# ─────────────────────────────────────────
# GET /biometries — Liste toutes les biométries
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/", response_model=List[BiometrieResponse])
def get_biometries(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les entrées biométriques avec pagination.
    Route protégée — token JWT requis.
    Un nageur ne voit que ses propres données.

    - **skip** : nombre d'éléments à sauter (défaut : 0)
    - **limit** : nombre maximum d'éléments retournés (défaut : 50, max : 100)
    """
    limit = min(limit, 100)

    # Un nageur ne voit que ses propres biométries
    if current_user.role == "nageur":
        return db.query(Biometrie).filter(
            Biometrie.nageur_id == current_user.nageur_id
        ).offset(skip).limit(limit).all()

    # Entraîneur et admin voient toutes les biométries
    return db.query(Biometrie).offset(skip).limit(limit).all()


# ─────────────────────────────────────────
# GET /biometries/{id} — Détail d'une biométrie
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/{biometrie_id}", response_model=BiometrieResponse)
def get_biometrie(
    biometrie_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne le détail d'une entrée biométrique par son id.
    Route protégée — token JWT requis.
    """
    biometrie = db.query(Biometrie).filter(Biometrie.id == biometrie_id).first()

    if not biometrie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Biométrie avec l'id {biometrie_id} introuvable"
        )

    # Un nageur ne peut voir que ses propres biométries
    if current_user.role == "nageur" and biometrie.nageur_id != current_user.nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — cette biométrie ne vous appartient pas"
        )

    return biometrie


# ─────────────────────────────────────────
# GET /biometries/nageur/{id} — Biométries d'un nageur
# Accessible : tous les utilisateurs connectés
# ─────────────────────────────────────────

@router.get("/nageur/{nageur_id}", response_model=List[BiometrieResponse])
def get_biometries_nageur(
    nageur_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Retourne toutes les données biométriques d'un nageur spécifique.
    Route protégée — token JWT requis.
    """

    # Un nageur ne peut voir que ses propres biométries
    if current_user.role == "nageur" and current_user.nageur_id != nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé — vous ne pouvez voir que vos propres biométries"
        )

    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nageur avec l'id {nageur_id} introuvable"
        )

    return db.query(Biometrie).filter(
        Biometrie.nageur_id == nageur_id
    ).all()


# ─────────────────────────────────────────
# PUT /biometries/{id} — Modifier une biométrie
# Accessible : nageur (ses données) + entraîneur + admin
# ─────────────────────────────────────────

@router.put("/{biometrie_id}", response_model=BiometrieResponse)
def modifier_biometrie(
    biometrie_id: int,
    data: BiometrieUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Modifie une biométrie existante — seuls les champs envoyés sont mis à jour.
    Route protégée — token JWT requis.

    Un nageur ne peut modifier que ses propres biométries.
    Un entraîneur ou admin peut modifier toutes les biométries.

    - **date** : optionnel
    - **hrv_ms** : optionnel
    - **fc_repos** : optionnel
    - **rpe** : optionnel
    - **sommeil_h** : optionnel
    """

    biometrie = db.query(Biometrie).filter(Biometrie.id == biometrie_id).first()

    if not biometrie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Biométrie avec l'id {biometrie_id} introuvable"
        )

    # Un nageur ne peut modifier que ses propres biométries
    if current_user.role == "nageur" and biometrie.nageur_id != current_user.nageur_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que vos propres données biométriques"
        )

    donnees = data.model_dump(exclude_unset=True)
    for champ, valeur in donnees.items():
        setattr(biometrie, champ, valeur)

    db.commit()
    db.refresh(biometrie)

    return biometrie


# ─────────────────────────────────────────
# DELETE /biometries/{id} — Supprimer une biométrie
# Accessible : admin uniquement
# ─────────────────────────────────────────

@router.delete("/{biometrie_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_biometrie(
    biometrie_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
):
    """
    Supprime une entrée biométrique par son id.
    Route protégée — réservée aux administrateurs.
    """
    biometrie = db.query(Biometrie).filter(Biometrie.id == biometrie_id).first()

    if not biometrie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Biométrie avec l'id {biometrie_id} introuvable"
        )

    db.delete(biometrie)
    db.commit()