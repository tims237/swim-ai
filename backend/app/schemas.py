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
    """Ancien schéma d'inscription générique — conservé pour compatibilité.
    Préférer InscriptionNageurSchema ou InscriptionEntraineurSchema.
    """
    email        : str
    mot_de_passe : str
    nageur_id    : Optional[int] = None


class InscriptionNageurSchema(BaseModel):
    """Schéma d'inscription pour un nageur.
    Route : POST /auth/register/nageur
    Crée automatiquement un compte (role=nageur) + un profil nageur lié.
    """
    email           : str
    mot_de_passe    : str                  # min 8 caractères — validé côté route
    nom             : str
    prenom          : str
    date_naissance  : Optional[DateType] = None
    lieu_naissance  : Optional[str]      = None
    specialite      : Optional[str]      = None
    niveau          : Optional[str]      = None
    # RGPD Article 9 — consentement explicite obligatoire pour les données de santé
    # Le frontend doit afficher la case à cocher avant d'envoyer ce champ à True
    consentement_donnees_sante : bool = False


class InscriptionEntraineurSchema(BaseModel):
    """Schéma d'inscription pour un entraîneur.
    Route : POST /auth/register/entraineur
    Crée un compte avec role=entraineur (pas de profil nageur associé).
    """
    email           : str
    mot_de_passe    : str                  # min 8 caractères — validé côté route
    nom             : str
    prenom          : str
    date_naissance  : Optional[DateType] = None
    lieu_naissance  : Optional[str]      = None
    # RGPD — consentement traitement des données personnelles
    consentement_donnees_sante : bool = False


class TokenSchema(BaseModel):
    """Réponse renvoyée après une connexion réussie."""
    access_token : str   # token JWT à stocker côté frontend
    token_type   : str   # toujours "bearer" — standard OAuth2


class UtilisateurResponse(BaseModel):
    """Informations de l'utilisateur connecté — renvoyé par /auth/me et les routes d'inscription."""
    id                         : int
    email                      : str
    role                       : str
    nom                        : str
    prenom                     : str
    date_naissance             : Optional[DateType] = None
    lieu_naissance             : Optional[str]      = None
    nageur_id                  : Optional[int]      = None
    actif                      : bool
    consentement_donnees_sante : bool               = False

    class Config:
        from_attributes = True


class ChangeRoleSchema(BaseModel):
    """Données pour changer le rôle d'un utilisateur — admin uniquement."""
    role : str   # nouveau rôle : "nageur", "entraineur" ou "admin"


class ChangePasswordSchema(BaseModel):
    """Changement de mot de passe — utilisateur connecté.
    Route : POST /auth/change-password
    L'utilisateur doit fournir son mot de passe actuel pour confirmer son identité.
    """
    mot_de_passe_actuel : str   # mot de passe actuel — vérifié avant modification
    nouveau_mot_de_passe : str  # nouveau mot de passe — min 8 caractères


class ResetPasswordAdminSchema(BaseModel):
    """Réinitialisation de mot de passe par un admin.
    Route : POST /auth/reset-password/{user_id}
    Utilisé quand un utilisateur ne peut plus se connecter du tout.
    Un mot de passe temporaire est défini par l'admin, l'utilisateur devra le changer.
    """
    nouveau_mot_de_passe : str  # nouveau mot de passe temporaire — min 8 caractères


class ForgotPasswordSchema(BaseModel):
    """Demande de réinitialisation par email.
    Route : POST /auth/forgot-password
    L'API envoie un email avec un lien de réinitialisation valable 30 minutes.
    Répond toujours 200 même si l'email est inconnu (évite l'énumération d'emails).
    """
    email : str


class ResetPasswordByTokenSchema(BaseModel):
    """Réinitialisation via le lien reçu par email.
    Route : POST /auth/reset-password-by-token
    Le token est extrait du lien cliqué dans l'email.
    Usage unique — invalide après utilisation ou après 30 minutes.
    """
    token                : str   # token UUID reçu dans l'email
    nouveau_mot_de_passe : str   # nouveau mot de passe — min 8 caractères