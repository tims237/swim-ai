# main.py
# Point d'entrée de l'application FastAPI — démarre le serveur et initialise la BDD

# 1. Bibliothèques tierces
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 2. Imports locaux
from app import models
from app.database import engine, Base
from app.routes import nageurs, sessions, biometries, performances, dashboard, equipe

# Création de l'instance FastAPI — une seule fois
# title : affiché dans la documentation Swagger (http://127.0.0.1:8000/docs)
app = FastAPI(title="Swim AI API 🏊")

# Configuration CORS — autorise le frontend React à appeler l'API
# Sans ça, le navigateur bloque toutes les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL du frontend React
    allow_credentials=True,
    allow_methods=["*"],     # autorise GET, POST, PUT, DELETE
    allow_headers=["*"],     # autorise tous les headers
)

# Crée toutes les tables au démarrage si elles n'existent pas encore
# Ne supprime jamais les tables existantes — sécurisé en production
Base.metadata.create_all(bind=engine)

# Enregistrement de tous les routers
app.include_router(nageurs.router)
app.include_router(sessions.router)
app.include_router(biometries.router)
app.include_router(performances.router)
app.include_router(dashboard.router)
app.include_router(equipe.router)  # route équipe entraîneur   


@app.get("/")
def root():
    """
    Route de vérification — confirme que l'API est en ligne.
    Accessible sur : http://127.0.0.1:8000
    """
    return {"message": "Swim AI API is running 🏊"}