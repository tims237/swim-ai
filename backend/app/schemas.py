# schemas.py
# Schémas Pydantic v2 — validation des données qui entrent et sortent de l'API
# Un schéma = la forme attendue des données, pas la table en BDD
# Pydantic v2 : "example" est remplacé par "json_schema_extra"

from pydantic import BaseModel, Field
# "date as DateType" evite le conflit Pydantic v2 :
# sans ca, le champ "date" et le type "date" portent le meme nom
# → PydanticUserError: field name clashing with a type annotation
from datetime import date as DateType
from typing import Optional


# ─────────────────────────────────────────────
# NAGEUR
# ─────────────────────────────────────────────

class NageurBase(BaseModel):
    """
    Champs communs à la création et à la réponse.
    Hérité par NageurCreate et NageurResponse.
    """
    nom            : str            = Field(..., json_schema_extra={"example": "Dupont"})
    prenom         : str            = Field(..., json_schema_extra={"example": "Lucas"})
    date_naissance : Optional[DateType] = Field(None, json_schema_extra={"example": "2000-03-15"})
    specialite     : Optional[str]  = Field(None, json_schema_extra={"example": "100m crawl"})
    niveau         : Optional[str]  = Field(None, json_schema_extra={"example": "national"})


class NageurCreate(NageurBase):
    """
    Schéma d'entrée — données envoyées par l'utilisateur pour créer un nageur.
    Pas d'id : il est généré automatiquement par PostgreSQL.
    """
    pass  # hérite de tous les champs de NageurBase


class NageurResponse(NageurBase):
    """
    Schéma de sortie — données renvoyées par l'API après création ou consultation.
    Contient l'id généré par PostgreSQL.
    """
    id: int

    class Config:
        # Permet à Pydantic de lire les données depuis un objet SQLAlchemy
        # Sans ça, Pydantic ne sait pas lire les modèles ORM
        from_attributes = True


# ─────────────────────────────────────────────
# SEANCE
# Renommé de "Session" en "Seance" pour éviter le conflit
# avec Session de SQLAlchemy (sqlalchemy.orm.Session)
# La table PostgreSQL reste bien nommée "sessions" dans models.py
#
# IMPORTANT : le champ s'appelle "date" et non "date_seance"
# pour correspondre exactement à la colonne Session.date dans models.py
# (Bug corrigé le 21/06 — incohérence qui bloquait POST /sessions)
# ─────────────────────────────────────────────

class SeanceBase(BaseModel):
    """Champs communs pour une séance d'entraînement."""
    nageur_id   : int            = Field(..., json_schema_extra={"example": 1})
    date        : DateType       = Field(..., json_schema_extra={"example": "2025-05-01"})
    type_seance : Optional[str]  = Field(None, json_schema_extra={"example": "endurance"})
    duree_min   : Optional[int]  = Field(None, json_schema_extra={"example": 90})


class SeanceCreate(SeanceBase):
    """Schéma d'entrée — création d'une séance."""
    pass


class SeanceResponse(SeanceBase):
    """Schéma de sortie — séance renvoyée par l'API."""
    id: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# BIOMETRIE
#
# IMPORTANT : le champ s'appelle "date" et non "date_seance"
# pour correspondre exactement à la colonne Biometrie.date dans models.py
# (Bug corrigé le 21/06 — incohérence qui bloquait POST /biometries)
# ─────────────────────────────────────────────

class BiometrieBase(BaseModel):
    """Champs communs pour une entrée biométrique journalière."""
    nageur_id : int             = Field(..., json_schema_extra={"example": 1})
    date      : DateType        = Field(..., json_schema_extra={"example": "2025-05-01"})
    hrv_ms    : Optional[float] = Field(None, json_schema_extra={"example": 78.5})  # variabilité cardiaque
    fc_repos  : Optional[int]   = Field(None, json_schema_extra={"example": 52})    # fréquence cardiaque repos
    rpe       : Optional[int]   = Field(None, json_schema_extra={"example": 6})     # effort perçu 1-10
    sommeil_h : Optional[float] = Field(None, json_schema_extra={"example": 7.5})   # heures de sommeil


class BiometrieCreate(BiometrieBase):
    """Schéma d'entrée — création d'une biométrie."""
    pass


class BiometrieResponse(BiometrieBase):
    """Schéma de sortie — biométrie renvoyée par l'API."""
    id: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# PERFORMANCE
# ─────────────────────────────────────────────

class PerformanceBase(BaseModel):
    """Champs communs pour un résultat chronométrique."""
    session_id  : int             = Field(..., json_schema_extra={"example": 1})
    distance_m  : Optional[int]   = Field(None, json_schema_extra={"example": 100})    # distance en mètres
    temps_s     : Optional[float] = Field(None, json_schema_extra={"example": 58.24})  # chrono en secondes
    style_nage  : Optional[str]   = Field(None, json_schema_extra={"example": "crawl"})# type de nage
    vitesse_moy : Optional[float] = Field(None, json_schema_extra={"example": 1.72})   # m/s


class PerformanceCreate(PerformanceBase):
    """Schéma d'entrée — création d'une performance."""
    pass


class PerformanceResponse(PerformanceBase):
    """Schéma de sortie — performance renvoyée par l'API."""
    id: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# SCHÉMAS D'UPDATE (PUT/PATCH)
# Tous les champs sont optionnels — seuls les champs envoyés sont modifiés
# ─────────────────────────────────────────────

class NageurUpdate(BaseModel):
    """Schéma de mise à jour — seuls les champs envoyés sont modifiés."""
    nom            : Optional[str]  = None
    prenom         : Optional[str]  = None
    date_naissance : Optional[DateType] = None
    specialite     : Optional[str]  = None
    niveau         : Optional[str]  = None


class SeanceUpdate(BaseModel):
    """Schéma de mise à jour d'une séance."""
    date        : Optional[DateType] = None
    type_seance : Optional[str]  = None
    duree_min   : Optional[int]  = None


class BiometrieUpdate(BaseModel):
    """Schéma de mise à jour d'une biométrie."""
    date      : Optional[DateType]  = None
    hrv_ms    : Optional[float] = None
    fc_repos  : Optional[int]   = None
    rpe       : Optional[int]   = None
    sommeil_h : Optional[float] = None


class PerformanceUpdate(BaseModel):
    """Schéma de mise à jour d'une performance."""
    distance_m  : Optional[int]   = None
    temps_s     : Optional[float] = None
    style_nage  : Optional[str]   = None
    vitesse_moy : Optional[float] = None


# ─────────────────────────────────────────────
# UTILISATEUR (auth)
# ─────────────────────────────────────────────

class InscriptionSchema(BaseModel):
    """Données nécessaires pour créer un compte.
    Le rôle n'est PAS accepté depuis le formulaire — toujours "nageur" par défaut.
    Seul un admin peut promouvoir un utilisateur via PUT /auth/role.
    """
    email        : str             # adresse email — identifiant unique
    mot_de_passe : str             # mot de passe en clair — hashé avant stockage (min 8 car.)
    nageur_id    : Optional[int] = None  # lien optionnel vers un profil nageur


class TokenSchema(BaseModel):
    """Réponse renvoyée après une connexion réussie."""
    access_token : str   # token JWT à stocker côté frontend
    token_type   : str   # toujours "bearer" — standard OAuth2


class UtilisateurResponse(BaseModel):
    """Informations de l'utilisateur connecté — renvoyé par /auth/me."""
    id        : int
    email     : str
    role      : str
    nageur_id : Optional[int] = None
    actif     : bool   # True = compte actif, False = compte désactivé

    class Config:
        from_attributes = True


class ChangeRoleSchema(BaseModel):
    """Données pour changer le rôle d'un utilisateur — admin uniquement."""
    role : str   # nouveau rôle : "nageur", "entraineur" ou "admin"