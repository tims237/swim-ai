# auth/router.py
# Endpoints d'authentification — inscription et connexion
# Ces routes sont publiques — accessibles sans token JWT

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.security import (
    hasher_mot_de_passe,
    verifier_mot_de_passe,
    creer_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Utilisateur

router = APIRouter(
    prefix="/auth",
    tags=["Authentification"]
)


# ─────────────────────────────────────────
# SCHÉMAS
# ─────────────────────────────────────────

class InscriptionSchema(BaseModel):
    """Données nécessaires pour créer un compte."""
    email        : str   # adresse email — identifiant unique
    mot_de_passe : str   # mot de passe en clair — hashé avant stockage
    role         : str = "nageur"  # rôle par défaut : nageur
    nageur_id    : int = None      # lien optionnel vers un profil nageur


class TokenSchema(BaseModel):
    """Réponse renvoyée après une connexion réussie."""
    access_token : str   # token JWT à stocker côté frontend
    token_type   : str   # toujours "bearer" — standard OAuth2


class UtilisateurResponse(BaseModel):
    """Informations de l'utilisateur connecté."""
    id        : int
    email     : str
    role      : str
    nageur_id : int = None
    actif     : str

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────

@router.post("/register", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def inscription(utilisateur: InscriptionSchema, db: Session = Depends(get_db)):
    """
    Crée un nouveau compte utilisateur.

    - **email**        : adresse email unique
    - **mot_de_passe** : mot de passe en clair — hashé avec bcrypt avant stockage
    - **role**         : nageur (défaut), entraineur ou admin
    - **nageur_id**    : optionnel — lie le compte à un profil nageur existant

    Le mot de passe n'est JAMAIS stocké en clair en base de données.
    """

    # ── 1. Vérifie que l'email n'existe pas déjà ─
    email_existant = db.query(Utilisateur).filter(
        Utilisateur.email == utilisateur.email
    ).first()

    if email_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un compte avec l'email {utilisateur.email} existe déjà"
        )

    # ── 2. Vérifie que le rôle est valide ────────
    roles_valides = ["nageur", "entraineur", "admin"]
    if utilisateur.role not in roles_valides:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide — choisir parmi : {roles_valides}"
        )

    # ── 3. Hashe le mot de passe avec bcrypt ─────
    # Le mot de passe en clair n'est jamais stocké
    hash_mot_de_passe = hasher_mot_de_passe(utilisateur.mot_de_passe)

    # ── 4. Crée l'utilisateur en base ────────────
    nouvel_utilisateur = Utilisateur(
        email        = utilisateur.email,
        mot_de_passe = hash_mot_de_passe,  # hash bcrypt
        role         = utilisateur.role,
        nageur_id    = utilisateur.nageur_id,
        actif        = "true"
    )

    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)

    return nouvel_utilisateur


@router.post("/login", response_model=TokenSchema)
def connexion(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Connecte un utilisateur et retourne un token JWT.

    Utilise le format standard OAuth2 :
    - **username** : adresse email (champ nommé username par convention OAuth2)
    - **password** : mot de passe en clair

    Retourne un token JWT à stocker côté frontend React.
    Ce token doit être envoyé dans le header de chaque requête :
    Authorization: Bearer eyJhbGci...
    """

    # ── 1. Cherche l'utilisateur par email ───────
    # OAuth2PasswordRequestForm utilise "username" par convention
    # mais on l'utilise comme email dans notre projet
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.email == form_data.username
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # ── 2. Vérifie le mot de passe ───────────────
    if not verifier_mot_de_passe(form_data.password, utilisateur.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # ── 3. Vérifie que le compte est actif ───────
    if utilisateur.actif != "true":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé — contactez l'administrateur"
        )

    # ── 4. Génère le token JWT ───────────────────
    # "sub" = subject — identifiant de l'utilisateur
    # "role" = rôle — utilisé par les dépendances pour les permissions
    token = creer_token(
        data={
            "sub"  : str(utilisateur.id),
            "role" : utilisateur.role
        }
    )

    return TokenSchema(
        access_token = token,
        token_type   = "bearer"
    )


@router.get("/me", response_model=UtilisateurResponse)
def get_me(current_user: Utilisateur = Depends(get_current_user)):
    """
    Retourne les informations de l'utilisateur connecté.
    Route protégée — nécessite un token JWT valide.

    Utilisé par le frontend React pour :
    → afficher le profil de l'utilisateur
    → vérifier le rôle pour afficher la bonne interface
       (vue nageur ou vue entraîneur)
    """
    return current_user