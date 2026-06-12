# auth/security.py
# Gestion de la sécurité — bcrypt et JWT
# Ce fichier centralise toute la logique cryptographique
# Il est importé par router.py et dependencies.py

# 1. Bibliothèques standard
from datetime import datetime, timedelta
from typing import Optional

# 2. Bibliothèques tierces
from jose import JWTError, jwt
from passlib.context import CryptContext

# ─────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────

# Clé secrète utilisée pour signer les tokens JWT
# En production : mettre dans .env et lire avec os.getenv()
# Cette clé doit rester secrète — si elle est compromise,
# n'importe qui peut créer des tokens valides
import os
SECRET_KEY = os.getenv("SECRET_KEY", "swim-ai-secret-key-dev")

# Algorithme de chiffrement utilisé pour signer le token
# HS256 = HMAC avec SHA-256 — standard et suffisant pour le MVP
ALGORITHM = "HS256"

# Durée de validité du token en minutes
# Après 30 minutes, le token expire et l'utilisateur doit se reconnecter
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Contexte bcrypt — configure le hashage des mots de passe
# bcrypt est l'algorithme recommandé pour les mots de passe
# deprecated="auto" : met à jour automatiquement les anciens hashs
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─────────────────────────────────────────
# FONCTIONS BCRYPT
# ─────────────────────────────────────────

def hasher_mot_de_passe(mot_de_passe: str) -> str:
    """
    Hashe un mot de passe en clair avec bcrypt.
    Le résultat est irréversible — impossible de retrouver
    le mot de passe original depuis le hash.

    Args:
        mot_de_passe : mot de passe en clair saisi par l'utilisateur

    Returns:
        str : hash bcrypt stocké en base de données
              ex: "$2b$12$K8HKzxM9..."

    Usage :
        hash = hasher_mot_de_passe("monmotdepasse")
        # stocke hash en BDD — jamais le mot de passe en clair
    """
    return pwd_context.hash(mot_de_passe)


def verifier_mot_de_passe(mot_de_passe: str, hash: str) -> bool:
    """
    Vérifie qu'un mot de passe correspond à son hash bcrypt.
    Utilisé lors de la connexion.

    Args:
        mot_de_passe : mot de passe saisi par l'utilisateur à la connexion
        hash         : hash stocké en base de données

    Returns:
        bool : True si le mot de passe est correct, False sinon

    Usage :
        if verifier_mot_de_passe("monmotdepasse", hash_en_bdd):
            # connexion autorisée
    """
    return pwd_context.verify(mot_de_passe, hash)


# ─────────────────────────────────────────
# FONCTIONS JWT
# ─────────────────────────────────────────

def creer_token(data: dict, expire_minutes: Optional[int] = None) -> str:
    """
    Crée un token JWT signé avec les données fournies.

    Args:
        data           : données à encoder dans le token
                         ex: {"sub": "1", "role": "nageur"}
        expire_minutes : durée de validité en minutes
                         utilise ACCESS_TOKEN_EXPIRE_MINUTES par défaut

    Returns:
        str : token JWT encodé
              ex: "eyJhbGci..."

    Usage :
        token = creer_token({"sub": str(user.id), "role": user.role})
    """
    # Copie les données pour ne pas modifier l'original
    donnees = data.copy()

    # Calcule la date d'expiration du token
    duree = expire_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    expiration = datetime.utcnow() + timedelta(minutes=duree)

    # Ajoute l'expiration aux données du token
    # "exp" est un champ standard JWT — vérifié automatiquement
    donnees.update({"exp": expiration})

    # Encode et signe le token avec la clé secrète
    token = jwt.encode(donnees, SECRET_KEY, algorithm=ALGORITHM)

    return token


def decoder_token(token: str) -> Optional[dict]:
    """
    Décode et vérifie un token JWT.
    Retourne None si le token est invalide ou expiré.

    Args:
        token : token JWT reçu dans le header Authorization

    Returns:
        dict : payload du token si valide
               ex: {"sub": "1", "role": "nageur", "exp": ...}
        None : si token invalide, expiré ou malformé

    Usage :
        payload = decoder_token(token)
        if payload is None:
            raise HTTPException(401, "Token invalide")
        user_id = payload.get("sub")
    """
    try:
        # Décode le token — vérifie automatiquement la signature et l'expiration
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Token invalide, expiré ou malformé
        return None