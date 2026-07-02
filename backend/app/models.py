# models.py
# Définition des modèles SQLAlchemy — chaque classe = une table PostgreSQL
# La Base est importée depuis database.py — une seule Base pour tout le projet

from sqlalchemy import Boolean, Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from datetime import datetime, timezone
from sqlalchemy.orm import relationship

# Import de la Base centrale — définie dans database.py
# Ne jamais recréer une Base ici, sinon SQLAlchemy ne connaît pas les modèles
from app.database import Base


class Nageur(Base):
    """
    Table principale — représente un nageur inscrit dans l'application.
    C'est le point d'entrée de toutes les données : sessions, biométries, etc.
    """
    __tablename__ = "nageurs"

    # Clé primaire — auto-incrémentée par PostgreSQL
    id             = Column(Integer, primary_key=True, index=True)

    # Identité du nageur
    nom            = Column(String, nullable=False)   # ex : "Dupont"
    prenom         = Column(String, nullable=False)   # ex : "Lucas"
    date_naissance = Column(Date)                     # pour calculer l'âge

    # Profil sportif
    specialite     = Column(String)  # ex : "100m crawl", "200m brasse"
    niveau         = Column(String)  # ex : "national", "régional", "départemental"

    # Relations ORM — permettent d'accéder à nageur.sessions, nageur.biometries
    # sans écrire de JOIN SQL manuellement
    sessions   = relationship("Session",   back_populates="nageur")
    biometries = relationship("Biometrie", back_populates="nageur")


class Session(Base):
    """
    Représente une séance d'entraînement.
    Chaque session est liée à un nageur et peut contenir plusieurs performances.
    """
    __tablename__ = "sessions"

    id          = Column(Integer, primary_key=True, index=True)

    # Clé étrangère — lie la session à son nageur
    # ondelete="CASCADE" : si le nageur est supprimé, ses sessions le sont aussi
    nageur_id   = Column(Integer, ForeignKey("nageurs.id", ondelete="CASCADE"), nullable=False)

    date        = Column(Date, nullable=False)  # date de la séance
    type_seance = Column(String)   # "endurance", "sprint", "technique", "récupération"
    duree_min   = Column(Integer)  # durée totale en minutes

    # Relations ORM
    nageur       = relationship("Nageur",      back_populates="sessions")
    performances = relationship("Performance", back_populates="session")


class Biometrie(Base):
    """
    Données physiologiques journalières du nageur.
    Saisies chaque matin avant l'entraînement pour suivre l'état de forme.
    Ces données alimenteront le modèle de détection de fatigue (Scikit-learn).
    """
    __tablename__ = "biometries"

    id        = Column(Integer, primary_key=True, index=True)

    # Clé étrangère — lie la biométrie à son nageur
    nageur_id = Column(Integer, ForeignKey("nageurs.id", ondelete="CASCADE"), nullable=False)

    date      = Column(Date, nullable=False)

    # Indicateurs physiologiques clés
    hrv_ms    = Column(Float)    # variabilité cardiaque en ms — indicateur de récupération
    fc_repos  = Column(Integer)  # fréquence cardiaque au repos en bpm
    rpe       = Column(Integer)  # effort perçu de 1 (léger) à 10 (maximal)
    sommeil_h = Column(Float)    # durée du sommeil en heures (ex : 7.5)

    # Relation ORM
    nageur = relationship("Nageur", back_populates="biometries")


class Performance(Base):
    """
    Résultat chronométrique d'un nageur lors d'une session.
    Une session peut contenir plusieurs performances (ex : 4x50m crawl).
    Ces données sont la base du modèle de prédiction de chrono.
    """
    __tablename__ = "performances"

    id         = Column(Integer, primary_key=True, index=True)

    # Clé étrangère — lie la performance à sa session
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)

    # Données de la nage
    distance_m  = Column(Integer)  # distance en mètres : 50, 100, 200, 400, 800, 1500
    temps_s     = Column(Float)    # chrono en secondes (ex : 58.24)
    style_nage  = Column(String)   # "crawl", "dos", "brasse", "papillon", "4 nages"
    vitesse_moy = Column(Float)    # vitesse moyenne en m/s — calculée : distance / temps

    # Relation ORM
    session = relationship("Session", back_populates="performances")

class Utilisateur(Base):
    """
    Table des utilisateurs — gère l'authentification et les rôles.
    Séparée de la table nageurs car un utilisateur peut être :
    - un nageur (lié à un profil nageur)
    - un entraîneur (accès à toute l'équipe)
    - un admin (accès total)
    """
    __tablename__ = "utilisateurs"

    # Clé primaire
    id = Column(Integer, primary_key=True, index=True)

    # Identifiants de connexion
    email        = Column(String, unique=True, nullable=False, index=True)  # identifiant unique
    mot_de_passe = Column(String, nullable=False)  # hash bcrypt — jamais en clair

    # Informations personnelles — saisies à l'inscription
    nom             = Column(String, nullable=False)
    prenom          = Column(String, nullable=False)
    date_naissance  = Column(Date, nullable=True)
    lieu_naissance  = Column(String, nullable=True)

    # Rôle — détermine les accès dans l'application
    # "nageur"      → accès à ses propres données uniquement
    # "entraineur"  → accès à toute l'équipe
    # "admin"       → accès total
    role = Column(String, nullable=False, default="nageur")

    # Lien optionnel vers la table nageurs
    # Rempli si l'utilisateur est un nageur
    # None si l'utilisateur est un entraîneur ou admin
    nageur_id = Column(Integer, ForeignKey("nageurs.id", ondelete="SET NULL"), nullable=True)

    # Statut du compte — permet de désactiver sans supprimer
    actif = Column(Boolean, nullable=False, default=True)

    # Consentement RGPD — obligatoire pour les données de santé (Article 9)
    # True = l'utilisateur a explicitement accepté le traitement de ses données de santé
    # False ou None = pas de consentement → accès aux routes biométries refusé
    consentement_donnees_sante  = Column(Boolean, nullable=False, default=False)
    date_consentement           = Column(DateTime, nullable=True)  # horodatage du consentement

    # Relation ORM vers le profil nageur
    nageur = relationship("Nageur", backref="utilisateur")


class PasswordResetToken(Base):
    """
    Token de réinitialisation de mot de passe.
    Généré quand l'utilisateur clique "Mot de passe oublié".
    Envoyé par email sous forme de lien.
    Usage unique — invalide après utilisation ou après 30 minutes.
    """
    __tablename__ = "password_reset_tokens"

    id             = Column(Integer, primary_key=True, index=True)
    token          = Column(String, unique=True, nullable=False, index=True)  # UUID v4
    utilisateur_id = Column(Integer, ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False)
    expiration     = Column(DateTime, nullable=False)   # horodatage d'expiration (30 min)
    utilise        = Column(Boolean, nullable=False, default=False)  # True = déjà utilisé
    cree_le        = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    """
    Journal d'audit RGPD — trace chaque accès à une donnée de santé.
    Conservé 6 ans (exigence légale Article 30 RGPD).
    Jamais supprimé via les routes normales — admin BDD uniquement.
    """
    __tablename__ = "audit_logs"

    id             = Column(Integer, primary_key=True, index=True)

    # Qui a fait l'action ?
    utilisateur_id = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"), nullable=True)
    email          = Column(String, nullable=True)   # conservé même si compte supprimé
    role           = Column(String, nullable=True)

    # Quelle action ?
    methode        = Column(String, nullable=False)  # GET, POST, PUT, DELETE
    route          = Column(String, nullable=False)  # ex: /biometries/3
    statut_http    = Column(Integer, nullable=True)  # 200, 201, 403...

    # Contexte
    ip_adresse     = Column(String, nullable=True)
    horodatage     = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Données concernées (pour les routes santé)
    # ex: "biometrie#3 — nageur#1"
    ressource      = Column(String, nullable=True)