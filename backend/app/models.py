# models.py
# Définition des modèles SQLAlchemy — chaque classe = une table PostgreSQL
# La Base est importée depuis database.py — une seule Base pour tout le projet

from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
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