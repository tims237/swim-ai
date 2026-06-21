# auth/dependencies.py
# Dépendances d'authentification — injectées dans les routes FastAPI
# Ce fichier répond à une question : "Qui fait cette requête ?"
# Utilisé via Depends(get_current_user) dans chaque route protégée

# 1. Bibliothèques standard
from typing import Optional

# 2. Bibliothèques tierces
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# 3. Imports locaux
from app.auth.security import decoder_token
from app.database import get_db
from app.models import Utilisateur

# ─────────────────────────────────────────
# CONFIGURATION OAuth2
# ─────────────────────────────────────────

# OAuth2PasswordBearer indique à FastAPI où trouver le token
# tokenUrl = URL de connexion — utilisée par Swagger pour le bouton "Authorize"
# FastAPI lit automatiquement le header : Authorization: Bearer eyJhbGci...
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ─────────────────────────────────────────
# DÉPENDANCES
# ─────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Utilisateur:
    """
    Dépendance principale — récupère l'utilisateur connecté.
    Injectée dans toutes les routes qui nécessitent une authentification.

    Fonctionnement :
    1. FastAPI extrait le token du header Authorization
    2. On décode et vérifie le token JWT
    3. On récupère l'utilisateur en base de données
    4. On retourne l'utilisateur si tout est valide

    Args:
        token : token JWT extrait automatiquement du header par FastAPI
        db    : session de base de données injectée par Depends(get_db)

    Returns:
        Utilisateur : objet SQLAlchemy de l'utilisateur connecté

    Raises:
        HTTPException 401 : si token invalide, expiré ou utilisateur introuvable

    Usage dans une route :
        @router.get("/profil")
        def get_profil(user: Utilisateur = Depends(get_current_user)):
            return user
    """

    # Erreur standard renvoyée en cas d'échec d'authentification
    # WWW-Authenticate: Bearer indique au client qu'un token Bearer est requis
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré — veuillez vous reconnecter",
        headers={"WWW-Authenticate": "Bearer"}
    )

    # ── 1. Décode le token JWT ───────────────────
    payload = decoder_token(token)
    if payload is None:
        # Token invalide ou expiré
        raise credentials_exception

    # ── 2. Extrait l'id utilisateur du payload ───
    # "sub" = subject — convention JWT pour l'identifiant
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        # Token valide mais sans identifiant — anormal
        raise credentials_exception

    # ── 3. Récupère l'utilisateur en base ────────
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.id == int(user_id)
    ).first()

    if utilisateur is None:
        # Utilisateur supprimé après création du token
        raise credentials_exception

    # ── 4. Vérifie que le compte est actif ───────
    if not utilisateur.actif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte désactivé — contactez l'administrateur"
        )

    return utilisateur


def get_current_nageur(
    current_user: Utilisateur = Depends(get_current_user)
) -> Utilisateur:
    """
    Dépendance — vérifie que l'utilisateur est un nageur.
    Utilisée sur les routes accessibles uniquement aux nageurs.

    Args:
        current_user : utilisateur connecté récupéré par get_current_user

    Returns:
        Utilisateur : l'utilisateur si son rôle est "nageur"

    Raises:
        HTTPException 403 : si l'utilisateur n'est pas un nageur

    Usage :
        @router.get("/mes-performances")
        def get_performances(user = Depends(get_current_nageur)):
            ...
    """
    if current_user.role != "nageur":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux nageurs"
        )
    return current_user


def get_current_entraineur(
    current_user: Utilisateur = Depends(get_current_user)
) -> Utilisateur:
    """
    Dépendance — vérifie que l'utilisateur est un entraîneur.
    Utilisée sur les routes de la vue équipe.

    Args:
        current_user : utilisateur connecté récupéré par get_current_user

    Returns:
        Utilisateur : l'utilisateur si son rôle est "entraineur"

    Raises:
        HTTPException 403 : si l'utilisateur n'est pas un entraîneur

    Usage :
        @router.get("/equipe")
        def get_equipe(user = Depends(get_current_entraineur)):
            ...
    """
    if current_user.role not in ["entraineur", "admin"]:
        # admin peut aussi accéder aux routes entraîneur
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux entraîneurs"
        )
    return current_user


def get_current_admin(
    current_user: Utilisateur = Depends(get_current_user)
) -> Utilisateur:
    """
    Dépendance — vérifie que l'utilisateur est un administrateur.
    Utilisée sur les routes de gestion des comptes.

    Args:
        current_user : utilisateur connecté récupéré par get_current_user

    Returns:
        Utilisateur : l'utilisateur si son rôle est "admin"

    Raises:
        HTTPException 403 : si l'utilisateur n'est pas admin

    Usage :
        @router.delete("/utilisateurs/{id}")
        def supprimer_utilisateur(user = Depends(get_current_admin)):
            ...
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user