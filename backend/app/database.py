# database.py
# Configuration de la connexion à PostgreSQL via SQLAlchemy
# Ce fichier est le point central de toute interaction avec la base de données.

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from dotenv import load_dotenv
import os



# Charge les variables d'environnement depuis le fichier .env
# DATABASE_URL doit y être défini : postgresql://user:password@host:port/swim_ai_db
load_dotenv()
# Cherche le .env en remontant jusqu'à la racine du projet
from pathlib import Path

# Remonte deux niveaux : app/ → backend/ → racine
env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=env_path)

# Récupération de l'URL de connexion — jamais en dur dans le code
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    import sys
    print(
        "[ERREUR CRITIQUE] DATABASE_URL non définie dans le fichier .env.\n"
        "Exemple : DATABASE_URL=postgresql://user:password@localhost:5432/swim_ai_db",
        file=sys.stderr
    )
    sys.exit(1)

# Moteur SQLAlchemy — gère le pool de connexions vers PostgreSQL
# pool_pre_ping=True : vérifie que la connexion est vivante avant chaque requête
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Fabrique de sessions — chaque requête HTTP aura sa propre session
# autocommit=False : les transactions sont validées manuellement (plus sûr)
# autoflush=False  : on contrôle l'envoi des données vers la BDD
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base commune à tous les modèles SQLAlchemy (importée dans models.py)
# SQLAlchemy 2.x : DeclarativeBase remplace declarative_base() déprécié
class Base(DeclarativeBase):
    pass


def get_db():
    """
    Générateur de session de base de données — injecté dans les routes FastAPI
    via Depends(get_db).

    Garantit que la session est toujours fermée après chaque requête,
    même en cas d'erreur (bloc finally).

    Usage dans une route :
        @app.get("/nageurs")
        def get_nageurs(db: Session = Depends(get_db)):
            return db.query(Nageur).all()
    """
    db = SessionLocal()
    try:
        yield db       # fournit la session à la route
    finally:
        db.close()     # fermeture garantie dans tous les cas