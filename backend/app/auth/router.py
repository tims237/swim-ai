# auth/router.py
# Endpoints d'authentification — inscription et connexion
# Ces routes sont publiques — accessibles sans token JWT

# 2. Bibliothèques tierces
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.security import (
    hasher_mot_de_passe,
    verifier_mot_de_passe,
    creer_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.auth.dependencies import get_current_user, get_current_admin
from app.database import get_db
from app.models import Utilisateur
from app.schemas import (
    InscriptionSchema,
    TokenSchema,
    UtilisateurResponse,
    ChangeRoleSchema
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentification"]
)


# ─────────────────────────────────────────
# ENDPOINTS
# Les schémas (InscriptionSchema, TokenSchema, UtilisateurResponse, ChangeRoleSchema)
# sont importés depuis app/schemas.py — un seul fichier centralise toute la validation
# ─────────────────────────────────────────

@router.post("/register", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def inscription(utilisateur: InscriptionSchema, db: Session = Depends(get_db)):
    """
    Crée un nouveau compte utilisateur avec le rôle "nageur".

    - **email**        : adresse email unique
    - **mot_de_passe** : mot de passe en clair (min 8 caractères) — hashé avec bcrypt
    - **nageur_id**    : optionnel — lie le compte à un profil nageur existant

    Le rôle est TOUJOURS "nageur" à l'inscription.
    Seul un admin peut promouvoir un utilisateur via PUT /auth/role/{id}.
    Le mot de passe n'est JAMAIS stocké en clair en base de données.
    """

    # ── 1. Valide la longueur du mot de passe ───
    if len(utilisateur.mot_de_passe) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères"
        )

    # ── 2. Vérifie que l'email n'existe pas déjà ─
    email_existant = db.query(Utilisateur).filter(
        Utilisateur.email == utilisateur.email
    ).first()

    if email_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un compte avec l'email {utilisateur.email} existe déjà"
        )

    # ── 3. Hashe le mot de passe avec bcrypt ─────
    # Le mot de passe en clair n'est jamais stocké
    hash_mot_de_passe = hasher_mot_de_passe(utilisateur.mot_de_passe)

    # ── 4. Crée l'utilisateur en base ────────────
    # Le rôle est TOUJOURS "nageur" à l'inscription
    # Seul un admin peut promouvoir un utilisateur (PUT /auth/role)
    nouvel_utilisateur = Utilisateur(
        email        = utilisateur.email,
        mot_de_passe = hash_mot_de_passe,  # hash bcrypt
        role         = "nageur",           # rôle forcé — sécurité
        nageur_id    = utilisateur.nageur_id,
        actif        = True
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
    if not utilisateur.actif:
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


# ─────────────────────────────────────────
# ENDPOINTS ADMIN
# ─────────────────────────────────────────

@router.put("/role/{utilisateur_id}", response_model=UtilisateurResponse)
def changer_role(
    utilisateur_id: int,
    data: ChangeRoleSchema,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_admin)
):
    """
    Change le rôle d'un utilisateur.
    Route protégée — réservée aux administrateurs uniquement.

    - **utilisateur_id** : id de l'utilisateur à modifier
    - **role** : nouveau rôle (nageur, entraineur, admin)

    C'est la seule façon d'obtenir un rôle autre que "nageur".
    L'inscription crée toujours un compte avec le rôle "nageur".
    """

    # ── 1. Vérifie que le rôle est valide ────────
    roles_valides = ["nageur", "entraineur", "admin"]
    if data.role not in roles_valides:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle invalide — choisir parmi : {roles_valides}"
        )

    # ── 2. Récupère l'utilisateur cible ──────────
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == utilisateur_id
    ).first()

    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur avec l'id {utilisateur_id} introuvable"
        )

    # ── 3. Met à jour le rôle ────────────────────
    utilisateur.role = data.role
    db.commit()
    db.refresh(utilisateur)

    return utilisateur