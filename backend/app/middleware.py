# middleware.py
# Middleware RGPD et sécurité HTTP pour Swim AI
#
# 1. AuditMiddleware   — journalise les accès aux données de santé
# 2. SecurityHeaders   — ajoute les headers de sécurité HTTP
# 3. HttpsRedirect     — redirige HTTP → HTTPS en production

import os
import time
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response

from app.database import SessionLocal
from app.models import AuditLog

# Routes qui touchent aux données de santé — auditées systématiquement
_ROUTES_SANTE = {
    "/biometries",
    "/performances",
    "/dashboard",
    "/sessions",
    "/nageurs",
    "/equipe",
    "/auth",
}

_ENV = os.getenv("ENVIRONMENT", "development")


# ─────────────────────────────────────────────────────────
# 1. AUDIT MIDDLEWARE — traçabilité RGPD
# ─────────────────────────────────────────────────────────

class AuditMiddleware(BaseHTTPMiddleware):
    """
    Journalise chaque requête vers une route sensible dans la table audit_logs.
    Requis par l'Article 30 RGPD pour les données de santé.
    Les logs ne sont jamais supprimés via l'API (durée de conservation : 6 ans).
    """

    async def dispatch(self, request: Request, call_next):
        # Vérifie si la route doit être auditée
        path = request.url.path
        doit_auditer = any(path.startswith(r) for r in _ROUTES_SANTE)

        reponse = await call_next(request)

        if doit_auditer:
            try:
                # Récupère les infos utilisateur depuis le state (injecté par FastAPI)
                utilisateur_id = getattr(request.state, "utilisateur_id", None)
                email          = getattr(request.state, "email", None)
                role           = getattr(request.state, "role", None)

                # IP réelle (passe-plat Nginx/proxy si X-Forwarded-For présent)
                ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "inconnu")
                ip = ip.split(",")[0].strip()

                db = SessionLocal()
                try:
                    log = AuditLog(
                        utilisateur_id = utilisateur_id,
                        email          = email,
                        role           = role,
                        methode        = request.method,
                        route          = path,
                        statut_http    = reponse.status_code,
                        ip_adresse     = ip,
                        horodatage     = datetime.now(timezone.utc),
                        ressource      = path,
                    )
                    db.add(log)
                    db.commit()
                finally:
                    db.close()
            except Exception:
                # On ne bloque jamais une requête à cause d'un log raté
                pass

        return reponse


# ─────────────────────────────────────────────────────────
# 2. SECURITY HEADERS MIDDLEWARE
# ─────────────────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Ajoute les headers de sécurité HTTP recommandés par l'OWASP.
    Obligatoires pour les applications manipulant des données de santé.
    """

    async def dispatch(self, request: Request, call_next):
        reponse = await call_next(request)

        # Empêche le navigateur de déduire le type MIME
        reponse.headers["X-Content-Type-Options"] = "nosniff"

        # Empêche l'affichage dans une iframe (protection clickjacking)
        reponse.headers["X-Frame-Options"] = "DENY"

        # Active la protection XSS du navigateur
        reponse.headers["X-XSS-Protection"] = "1; mode=block"

        # Politique de référent : ne transmet pas l'URL d'origine
        reponse.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS — force HTTPS pour 1 an (uniquement en production)
        if _ENV == "production":
            reponse.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Swagger UI et ReDoc chargent leurs assets depuis CDN — CSP assouplie pour ces routes
        path = request.url.path
        if path in ("/docs", "/redoc", "/openapi.json"):
            reponse.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
                "img-src 'self' data: https://fastapi.tiangolo.com; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
        else:
            # Content Security Policy stricte pour toutes les autres routes
            reponse.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )

        # Supprime le header qui révèle la technologie utilisée
        if "server" in reponse.headers:
            del reponse.headers["server"]
        if "x-powered-by" in reponse.headers:
            del reponse.headers["x-powered-by"]

        return reponse


# ─────────────────────────────────────────────────────────
# 3. HTTPS REDIRECT MIDDLEWARE
# ─────────────────────────────────────────────────────────

class HttpsRedirectMiddleware(BaseHTTPMiddleware):
    """
    Redirige toutes les requêtes HTTP vers HTTPS en production.
    Inactif en développement pour ne pas bloquer localhost.
    """

    async def dispatch(self, request: Request, call_next):
        if _ENV != "production":
            return await call_next(request)

        # Vérifie si la requête arrive déjà en HTTPS
        # (via X-Forwarded-Proto si derrière un proxy Nginx)
        proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)

        if proto == "http":
            url = str(request.url).replace("http://", "https://", 1)
            return RedirectResponse(url=url, status_code=301)

        return await call_next(request)
