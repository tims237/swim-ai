# Swim AI

**Plateforme de suivi et de prédiction de performance pour la natation compétitive.**

Swim AI apporte aux clubs amateurs et semi-professionnels des outils d'analyse habituellement réservés au haut niveau : suivi de la charge d'entraînement, de la récupération et des chronos, avec un score de risque de surentraînement calculé par un modèle de Machine Learning.

> Projet réalisé en équipe de 4 lors de mon stage chez **Skills4Mind** (avril – juillet 2026).
> Mon rôle : **développement du back-end** (API, base de données, authentification, indicateurs, scoring IA).

---

## Fonctionnalités

- **Suivi des nageurs** : profil, nage de spécialité, niveau
- **Séances d'entraînement** : type (endurance, sprint, technique, récupération), durée, charge
- **Biométrie** : variabilité cardiaque (HRV), fréquence cardiaque au repos, sommeil, effort perçu (RPE)
- **Performances** : chronos par distance et par nage, progression par rapport au record personnel
- **Tableau de bord nageur** : indicateurs clés, historique, recommandations
- **Vue équipe pour l'entraîneur** : tous les nageurs sur un écran, alertes prioritaires en haut
- **Score de fatigue et de risque de surentraînement** par Random Forest

## Indicateurs calculés

| Indicateur | Calcul | Utilité |
|---|---|---|
| **ACWR** (Acute:Chronic Workload Ratio) | Charge sur 7 jours ÷ (charge sur 28 jours ÷ 4) | Zone sûre entre 0,8 et 1,3 ; au-delà de 1,5, risque de blessure élevé |
| **Score de fatigue** (0–100) | Moyenne RPE × 10, ajustée selon la HRV | Signal visuel immédiat pour l'entraîneur |
| **Progression** | (dernier chrono − premier chrono) ÷ premier chrono × 100 | Valeur négative = le nageur s'améliore |
| **Risque de surentraînement** | Random Forest sur HRV, RPE, ACWR, sommeil, FC au repos | Anticiper la fatigue avant qu'elle ne se ressente |

## Architecture

```
┌─────────────────────────────┐
│  Frontend — React + Vite    │
└──────────────┬──────────────┘
               │ API REST (JSON) + JWT
┌──────────────▼──────────────┐
│  Backend — FastAPI (Python) │
│  Auth · Logique métier · IA │
└──────────────┬──────────────┘
               │ SQLAlchemy
┌──────────────▼──────────────┐
│  PostgreSQL 15              │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  Grafana — dashboards       │
└─────────────────────────────┘
```

**Choix techniques :**

- **Architecture en couches** : présentation, API, logique métier, accès aux données, stockage
- **API REST** sans état, avec validation des données par Pydantic
- **Injection de dépendances** FastAPI pour la base de données et l'authentification
- **Contrôle d'accès par rôles** : un nageur ne voit que ses données, un entraîneur gère son équipe, un admin gère tout
- **Random Forest** retenu car robuste aux données manquantes et aux valeurs aberrantes, et interprétable par l'entraîneur ; une logique à base de règles prend le relais quand les données sont insuffisantes

## Stack technique

**Back-end** : Python, FastAPI, SQLAlchemy, Pydantic, JWT, bcrypt
**Base de données** : PostgreSQL 15
**IA** : scikit-learn (Random Forest)
**Front-end** : React, Vite, React Router, Recharts
**Visualisation** : Grafana
**DevOps** : Docker, Docker Compose

## API

27 endpoints REST, documentés automatiquement avec Swagger :

| Ressource | Routes principales |
|---|---|
| Authentification | `/auth/register/nageur`, `/auth/register/entraineur`, `/auth/login`, `/auth/me` |
| Nageurs | `/nageurs/` (CRUD) |
| Séances | `/sessions/` (CRUD, filtrage par nageur) |
| Biométrie | `/biometries/` (CRUD, filtrage par nageur) |
| Performances | `/performances/` (CRUD, filtrage par séance ou nageur) |
| Tableaux de bord | `/dashboard/{nageur_id}`, `/equipe/`, `/equipe/alertes`, `/equipe/stats` |

Toutes les listes sont paginées (`?skip=0&limit=50`) et les routes protégées exigent un token `Authorization: Bearer <token>`.

## Lancer le projet

Prérequis : [Docker](https://www.docker.com/) et Docker Compose.

```bash
git clone https://github.com/tims237/swim-ai.git
cd swim-ai
cp .env.example .env        # sous Windows : copy .env.example .env
docker compose up --build
```

Ensuite :

- **Documentation de l'API (Swagger)** : http://localhost:8000/docs
- **Grafana** : http://localhost:3001

## Feuille de route

- [x] Schéma de base de données, back-end FastAPI et authentification JWT
- [x] Indicateurs du tableau de bord, vue équipe entraîneur, CRUD complet
- [x] Front-end React, design system et intégration JWT
- [ ] Pages d'inscription séparées nageur / entraîneur et routage par rôle
- [ ] Dashboards Grafana avancés
- [ ] Entraînement et intégration du modèle Random Forest
- [ ] Déploiement en production (HTTPS, hébergement cloud)

## Données personnelles

Le projet manipule des données de santé (biométrie). Des mesures de conformité au RGPD ont été prises en compte dans la conception.

## Auteur

**Elvis Noubissie** — Étudiant Bachelor Informatique Data & IA, ECE Paris
[LinkedIn](https://www.linkedin.com/in/elvisnoubissie) · [GitHub](https://github.com/tims237)
