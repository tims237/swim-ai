# main.py
# Point d'entrée de l'application FastAPI — démarre le serveur et initialise la BDD

# 1. Bibliothèques tierces
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# 2. Imports locaux

from app import models
from app.database import engine, Base
from app.auth import router as auth_router
from app.routes import nageurs, sessions, biometries, performances, dashboard, equipe, legal
from app.middleware import AuditMiddleware, SecurityHeadersMiddleware, HttpsRedirectMiddleware


# Rate limiter — protection contre les attaques par brute-force
# Identifie les clients par leur adresse IP
limiter = Limiter(key_func=get_remote_address)

# Création de l'instance FastAPI
app = FastAPI(title="Swim AI API 🏊")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middlewares de sécurité (ordre important : dernier ajouté = premier exécuté) ──

# Redirige HTTP → HTTPS en production
app.add_middleware(HttpsRedirectMiddleware)

# Ajoute les headers de sécurité HTTP (HSTS, CSP, X-Frame-Options...)
app.add_middleware(SecurityHeadersMiddleware)

# Journalise les accès aux données de santé (RGPD Article 30)
app.add_middleware(AuditMiddleware)

# CORS — autorise le frontend React à appeler l'API
# En production, remplacer localhost:3000 par le vrai domaine
import os
_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crée toutes les tables au démarrage si elles n'existent pas encore
# Ne supprime jamais les tables existantes — sécurisé en production
Base.metadata.create_all(bind=engine)

app.include_router(auth_router.router)    # route d'authentification (inscription, connexion)

# Enregistrement de tous les routers
app.include_router(nageurs.router)
app.include_router(sessions.router)
app.include_router(biometries.router)
app.include_router(performances.router)
app.include_router(dashboard.router)
app.include_router(equipe.router)
app.include_router(legal.router)          # mentions légales et politique de confidentialité (public)

@app.get("/")
def root():
    """
    Route de vérification — confirme que l'API est en ligne.
    Accessible sur : http://127.0.0.1:8000
    """
    return {"message": "Swim AI API is running 🏊"}