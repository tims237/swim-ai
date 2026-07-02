# CONCEPTS.md
# Documentation technique — Swim AI
# Ce fichier explique les concepts clés utilisés dans le projet.
# Rédigé pour permettre à tout collaborateur de comprendre l'architecture
# sans avoir besoin de chercher ailleurs.

---

# Table des matières

1. [L'architecture globale](#1-larchitecture-globale)
2. [PostgreSQL — La base de données](#2-postgresql--la-base-de-données)
3. [SQLAlchemy — L'ORM](#3-sqlalchemy--lorm)
4. [Pydantic — La validation des données](#4-pydantic--la-validation-des-données)
5. [FastAPI — Le framework backend](#5-fastapi--le-framework-backend)
6. [Le flux complet d'une requête](#6-le-flux-complet-dune-requête)
7. [Les fichiers du projet et leurs rôles](#7-les-fichiers-du-projet-et-leurs-rôles)
8. [CORS — Cross-Origin Resource Sharing](#8-cors--cross-origin-resource-sharing)
9. [Docker — Conteneurisation](#9-docker--conteneurisation)
10. [CRUD complet — Create, Read, Update, Delete](#10-crud-complet--create-read-update-delete)
11. [Pagination](#11-pagination)
12. [JWT — Authentification et sécurité](#12-jwt--authentification-et-sécurité)
13. [Grafana — Dashboard monitoring et visualisation](#13-grafana--dashboard-monitoring-et-visualisation)
14. [Intelligence Artificielle — Vue d'ensemble](#14-intelligence-artificielle--vue-densemble)
15. [Feature Engineering — Préparer les données pour l'IA](#15-feature-engineering--préparer-les-données-pour-lia)
16. [Random Forest — L'algorithme central](#16-random-forest--lalgorithme-central)
17. [Modèle 7.2 — Détection de fatigue (Classification)](#17-modèle-72--détection-de-fatigue-classification)
18. [Modèle 7.1 — Prédiction de chrono (Régression)](#18-modèle-71--prédiction-de-chrono-régression)
19. [Modèle 7.3 — Détection du tapering](#19-modèle-73--détection-du-tapering)
20. [SHAP — Explainabilité des modèles](#20-shap--explainabilité-des-modèles)
21. [Stratégie avec peu de données](#21-stratégie-avec-peu-de-données)
22. [Architecture du module IA](#22-architecture-du-module-ia)

---

# 1. L'architecture globale

Swim AI repose sur une architecture en couches.
Chaque couche a un rôle précis et communique uniquement avec la couche adjacente.

```
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│   Dashboard, formulaires, graphiques    │
│   Ce que l'utilisateur voit et touche   │
└─────────────────┬───────────────────────┘
                  │ HTTP (JSON)
                  ▼
┌─────────────────────────────────────────┐
│           API (FastAPI)                 │
│   Reçoit les requêtes HTTP              │
│   Valide les données (Pydantic)         │
│   Renvoie les réponses JSON             │
└─────────────────┬───────────────────────┘
                  │ ORM (SQLAlchemy)
                  ▼
┌─────────────────────────────────────────┐
│           BASE DE DONNÉES (PostgreSQL)  │
│   Stocke toutes les données             │
│   nageurs, sessions, biometries,        │
│   performances, utilisateurs            │
└─────────────────────────────────────────┘
```

**Règle d'or :**
- Le Frontend ne parle jamais directement à PostgreSQL
- FastAPI est le seul point d'entrée
- PostgreSQL ne connaît pas le Frontend

---

# 2. PostgreSQL — La base de données

## Qu'est-ce que c'est ?

PostgreSQL est le système de gestion de base de données du projet.
C'est lui qui stocke physiquement toutes les données sur le disque.

## Analogie simple

PostgreSQL est comme un classeur géant :
- Chaque **table** est un tiroir (nageurs, sessions...)
- Chaque **ligne** est une fiche dans ce tiroir
- Chaque **colonne** est un champ sur la fiche (nom, prénom, chrono...)

## Les tables dans Swim AI

```
nageurs        → profil de chaque nageur
sessions       → séances d'entraînement
biometries     → données physiologiques (HRV, RPE, sommeil)
performances   → chronos et résultats de nage
utilisateurs   → comptes utilisateurs (email, mot de passe hashé, rôle)
```

## Les relations entre tables

```
utilisateurs ──── nageurs
                    │
                    ├──── sessions ──── performances
                    │
                    └──── biometries
```

Un nageur peut avoir :
- plusieurs sessions d'entraînement
- plusieurs entrées biométriques
- et chaque session peut contenir plusieurs performances

Un utilisateur peut être lié à un nageur (rôle nageur)
ou exister indépendamment (rôle entraîneur ou admin).

## Pourquoi PostgreSQL et pas autre chose ?

- Open source et gratuit
- Très robuste et fiable
- Compatible avec SQLAlchemy
- Standard dans les projets professionnels Python

---

# 3. SQLAlchemy — L'ORM

## Qu'est-ce qu'un ORM ?

ORM signifie **Object Relational Mapper**.
C'est un outil qui fait le lien entre Python et PostgreSQL.

Sans ORM, pour créer un nageur tu écrirais du SQL brut :
```sql
INSERT INTO nageurs (nom, prenom, specialite)
VALUES ('Dupont', 'Lucas', '100m crawl');
```

Avec SQLAlchemy, tu écris du Python :
```python
nageur = Nageur(nom="Dupont", prenom="Lucas", specialite="100m crawl")
db.add(nageur)
db.commit()
```

SQLAlchemy traduit ton code Python en SQL automatiquement.

## Analogie simple

SQLAlchemy est comme un traducteur :
- Tu parles Python
- PostgreSQL parle SQL
- SQLAlchemy traduit entre les deux en temps réel

## La Base (DeclarativeBase)

```python
# SQLAlchemy 2.x — syntaxe moderne
class Base(DeclarativeBase):
    pass
```

La Base est le point de départ de tous les modèles.
C'est elle qui dit à SQLAlchemy :
"Ces classes Python représentent des tables PostgreSQL."

**Changement important (SQLAlchemy 2.x) :**
L'ancienne syntaxe `Base = declarative_base()` est dépréciée.
On utilise maintenant une classe qui hérite de `DeclarativeBase`.

```python
# ✅ Correct (SQLAlchemy 2.x)
from sqlalchemy.orm import DeclarativeBase
class Base(DeclarativeBase):
    pass

# ❌ Déprécié (ancienne syntaxe)
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()
```

**Règle importante :**
Il ne doit exister qu'UNE SEULE Base dans tout le projet.
Elle est définie dans `database.py` et importée dans `models.py`.

## Les modèles

Chaque modèle = une table PostgreSQL.

```python
class Nageur(Base):
    __tablename__ = "nageurs"    # nom de la table dans PostgreSQL

    id             = Column(Integer, primary_key=True)
    nom            = Column(String, nullable=False)
    prenom         = Column(String, nullable=False)
    specialite     = Column(String)
```

## Les relations

Les relations permettent de naviguer entre les tables
sans écrire de JOIN SQL manuellement.

```python
# Dans le modèle Nageur :
sessions = relationship("Session", back_populates="nageur")

# Utilisation :
nageur = db.query(Nageur).first()
print(nageur.sessions)  # retourne toutes les sessions du nageur
                        # SQLAlchemy fait le JOIN automatiquement
```

## Les clés étrangères

Une clé étrangère lie une table à une autre.

```python
class Session(Base):
    nageur_id = Column(Integer, ForeignKey("nageurs.id", ondelete="CASCADE"))
    #                                                     ↑
    #                           si le nageur est supprimé,
    #                           toutes ses sessions le sont aussi
```

## get_db() — La session de base de données

```python
def get_db():
    db = SessionLocal()
    try:
        yield db      # fournit la session à la route FastAPI
    finally:
        db.close()    # ferme toujours la connexion après la requête
```

Chaque requête HTTP a sa propre session de base de données.
La session est ouverte au début de la requête et fermée à la fin,
même en cas d'erreur.

---

# 4. Pydantic — La validation des données

## Qu'est-ce que c'est ?

Pydantic est la bibliothèque qui valide les données
qui entrent et sortent de l'API.

## Analogie simple

Pydantic est comme un agent de sécurité à l'entrée d'un club.
Il vérifie que chaque donnée respecte les règles
avant de la laisser entrer dans l'application.

```
Utilisateur envoie des données
           ↓
    Schéma Pydantic
           ↓
✅ Données valides   → FastAPI → PostgreSQL
❌ Données invalides → erreur 422 automatique
```

## Pydantic vs SQLAlchemy — Ne pas confondre

```
SQLALCHEMY (models.py)              PYDANTIC (schemas.py)
──────────────────────              ─────────────────────
Représente les TABLES               Représente les DONNÉES
en base de données                  qui circulent dans l'API

Parle à PostgreSQL                  Parle à l'utilisateur

Persiste les données                Valide les données
sur le disque                       en mémoire

Ce qui EST en base                  Ce qui ENTRE et SORT de l'API
```

## Les quatre schémas par entité

Pour chaque table, on crée quatre schémas :

```python
# 1. NageurBase — champs communs
class NageurBase(BaseModel):
    nom        : str
    prenom     : str
    specialite : Optional[str]

# 2. NageurCreate — ce que l'utilisateur ENVOIE pour créer
#    Hérite de NageurBase — pas d'id (il n'existe pas encore)
class NageurCreate(NageurBase):
    pass

# 3. NageurUpdate — ce que l'utilisateur ENVOIE pour modifier
#    Tous les champs sont optionnels — seuls ceux envoyés sont modifiés
class NageurUpdate(BaseModel):
    nom        : Optional[str] = None
    prenom     : Optional[str] = None
    specialite : Optional[str] = None

# 4. NageurResponse — ce que l'API RENVOIE
#    Hérite de NageurBase — ajoute l'id généré par PostgreSQL
class NageurResponse(NageurBase):
    id: int
    class Config:
        from_attributes = True
```

## Pourquoi quatre schémas ?

```
Création (POST) :
  Utilisateur envoie  →  { "nom": "Dupont", "prenom": "Lucas" }
                                 ↑ pas d'id — il n'existe pas encore

Modification (PUT) :
  Utilisateur envoie  →  { "specialite": "200m brasse" }
                                 ↑ seul le champ à modifier

API renvoie (GET)    →  { "id": 1, "nom": "Dupont", "prenom": "Lucas" }
                                 ↑ id ajouté par PostgreSQL
```

## exclude_unset pour les mises à jour

Lors d'un PUT, on utilise `model_dump(exclude_unset=True)` :

```python
# L'utilisateur envoie seulement : { "specialite": "200m brasse" }
donnees = data.model_dump(exclude_unset=True)
# donnees = {"specialite": "200m brasse"}
# → seul ce champ est modifié, les autres restent intacts

for champ, valeur in donnees.items():
    setattr(nageur, champ, valeur)
```

## from_attributes = True

SQLAlchemy retourne des objets Python :
```python
<Nageur id=1 nom="Dupont" prenom="Lucas">
```

Pydantic attend des dictionnaires :
```python
{"id": 1, "nom": "Dupont", "prenom": "Lucas"}
```

`from_attributes = True` dit à Pydantic :
"Tu peux lire directement les attributs d'un objet SQLAlchemy."

---

# 5. FastAPI — Le framework backend

## Qu'est-ce que c'est ?

FastAPI est le framework Python qui gère les requêtes HTTP.
C'est le chef d'orchestre qui reçoit les requêtes,
les fait valider par Pydantic et les transmet à PostgreSQL via SQLAlchemy.

## Pourquoi FastAPI ?

- Natif Python — s'intègre directement avec Pydantic et SQLAlchemy
- Rapide — basé sur ASGI (jusqu'à 3x plus rapide que Flask)
- Documentation automatique — Swagger UI générée automatiquement
- Moderne — async/await natif

## Les routes

Une route = un endpoint de l'API.

```python
@app.post("/nageurs", response_model=NageurResponse)
def creer_nageur(nageur: NageurCreate, db: Session = Depends(get_db)):
    #             ↑                           ↑
    #    Pydantic valide                SQLAlchemy fournit
    #    les données entrantes          la session BDD
```

## Depends(get_db)

`Depends` est le système d'injection de dépendances de FastAPI.
Il appelle automatiquement `get_db()` avant chaque requête
et fournit la session de base de données à la route.

## La documentation automatique

FastAPI génère automatiquement une interface de test
à partir de tes routes et schémas Pydantic.

```
http://127.0.0.1:8000/docs   → Swagger UI (interface graphique)
http://127.0.0.1:8000/redoc  → ReDoc (documentation alternative)
```

---

# 6. Le flux complet d'une requête

Voici ce qui se passe quand un entraîneur crée un nouveau nageur :

```
1. L'entraîneur remplit le formulaire sur le Dashboard React
   { "nom": "Dupont", "prenom": "Lucas", "specialite": "100m crawl" }
                    ↓
2. React envoie une requête HTTP POST vers l'API
   POST http://127.0.0.1:8000/nageurs
   Header : Authorization: Bearer eyJhbGci...
                    ↓
3. FastAPI reçoit la requête
   et vérifie le token JWT (Depends(get_current_user))
                    ↓
4. FastAPI vérifie que l'utilisateur a le rôle "entraineur" ou "admin"
   ❌ Rôle "nageur" → erreur 403 Forbidden
   ✅ Rôle "entraineur" → continue
                    ↓
5. Pydantic valide les données (NageurCreate)
   ✅ nom est bien un String
   ✅ prenom est bien un String
   ✅ tous les champs obligatoires sont présents
                    ↓
6. FastAPI appelle la fonction de la route
   et injecte la session SQLAlchemy via Depends(get_db)
                    ↓
7. SQLAlchemy crée un objet Nageur
   et l'insère dans PostgreSQL
   INSERT INTO nageurs (nom, prenom, specialite)
   VALUES ('Dupont', 'Lucas', '100m crawl')
                    ↓
8. PostgreSQL génère l'id automatiquement
   et retourne l'objet créé
                    ↓
9. Pydantic sérialise l'objet SQLAlchemy
   en dictionnaire JSON (NageurResponse)
   { "id": 1, "nom": "Dupont", "prenom": "Lucas", "specialite": "100m crawl" }
                    ↓
10. FastAPI renvoie la réponse HTTP 201
    au Dashboard React
                    ↓
11. React affiche le nouveau nageur dans l'interface
```

---

# 7. Les fichiers du projet et leurs rôles

```
backend/
└── app/
    ├── main.py          → point d'entrée de l'API
    │                      démarre FastAPI, enregistre les routers, configure CORS
    │
    ├── database.py      → configuration de la connexion PostgreSQL
    │                      définit engine, SessionLocal, Base (DeclarativeBase), get_db()
    │
    ├── models.py        → modèles SQLAlchemy
    │                      chaque classe = une table PostgreSQL
    │                      (Nageur, Session, Biometrie, Performance, Utilisateur)
    │
    ├── schemas.py       → schémas Pydantic centralisés
    │                      validation des données entrantes et sortantes
    │                      schémas Create, Update, Response pour chaque entité
    │                      + schémas auth (Inscription, Token, ChangeRole)
    │
    ├── auth/
    │   ├── security.py    → bcrypt (hasher, vérifier) + JWT (créer, décoder)
    │   ├── dependencies.py→ get_current_user, get_current_nageur,
    │   │                    get_current_entraineur, get_current_admin
    │   └── router.py      → POST /auth/register, POST /auth/login,
    │                        GET /auth/me, PUT /auth/role/{id}
    │
    └── routes/
        ├── nageurs.py      → CRUD /nageurs (POST, GET, PUT, DELETE)
        ├── sessions.py     → CRUD /sessions (POST, GET, PUT, DELETE)
        ├── biometries.py   → CRUD /biometries (POST, GET, PUT, DELETE)
        ├── performances.py → CRUD /performances (POST, GET, PUT, DELETE)
        ├── dashboard.py    → GET /dashboard/{id} — vue nageur avec KPI
        └── equipe.py       → GET /equipe — vue entraîneur agrégée

docker-compose.yml   → orchestre les 3 services (backend, db, grafana)
backend/Dockerfile   → image Docker du backend FastAPI
.env                 → variables d'environnement (jamais sur GitHub)
.env.example         → template des variables à remplir
```

---

# 8. CORS — Cross-Origin Resource Sharing

## Le problème sans CORS

Le frontend React tourne sur `http://localhost:3000`.
Le backend FastAPI tourne sur `http://localhost:8000`.

Ce sont deux **origines différentes** — port 3000 vs port 8000.
Par défaut, le navigateur bloque automatiquement toutes les requêtes
entre deux origines différentes (Same Origin Policy).

```
React (port 3000)
       │
       │ "Je veux appeler /nageurs"
       ▼
Navigateur (Chrome/Firefox)
       │
       │ "Port 3000 ≠ port 8000 — je bloque !"
       ▼
❌ Requête bloquée — FastAPI ne reçoit jamais rien
```

## Ce que fait CORS

CORS signifie Cross-Origin Resource Sharing.
C'est un mécanisme qui dit au navigateur :
"C'est OK, tu peux autoriser certaines origines à appeler cette API."

```
React (port 3000)
       │
       ▼
Navigateur → vérifie si localhost:3000 est autorisé
       │
       ▼
FastAPI répond : "Oui, localhost:3000 est autorisé ✅"
       │
       ▼
✅ Requête autorisée — React reçoit les données
```

## Dans le projet Swim AI

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL du frontend React
    allow_credentials=True,
    allow_methods=["*"],   # autorise GET, POST, PUT, DELETE
    allow_headers=["*"],   # autorise tous les headers
)
```

## Règle importante

En production, ne jamais mettre `allow_origins=["*"]`.
Toujours spécifier les origines autorisées explicitement :

```python
# ❌ Dangereux en production
allow_origins=["*"]

# ✅ Correct en production
allow_origins=[
    "http://localhost:3000",      # développement local
    "https://swim-ai.com"         # domaine de production
]
```

---

# 9. Docker — Conteneurisation

## Les 3 services dans docker-compose.yml

```
SERVICE 1 — backend (FastAPI)
  Port : 8000
  Construit depuis backend/Dockerfile
  Se connecte à PostgreSQL via "db:5432"
  Redémarre automatiquement en cas de crash
  Hot-reload activé en développement

SERVICE 2 — db (PostgreSQL 15)
  Port externe : 5433 (pour pgAdmin local)
  Port interne : 5432 (entre conteneurs)
  Volume persistant : postgres_data
  Healthcheck : vérifie que PostgreSQL est prêt

SERVICE 3 — grafana
  Port : 3001 (3000 réservé pour React)
  Se connecte directement à PostgreSQL
  Volume persistant : grafana_data
```

## Pourquoi "db:5432" et pas "localhost:5432" ?

```
Chaque service Docker tourne dans son propre conteneur.
"localhost" dans un conteneur = le conteneur lui-même.
"db" = nom du service PostgreSQL dans docker-compose.yml.
Docker résout "db" automatiquement vers l'IP interne du conteneur PostgreSQL.
```

## Commandes Docker principales

```bash
docker-compose up         # démarre tous les services
docker-compose up --build # reconstruit les images puis démarre
docker-compose down       # arrête tous les services
docker-compose logs -f    # affiche les logs en temps réel
```

---

# 10. CRUD complet — Create, Read, Update, Delete

## Les 4 opérations

Chaque entité (nageurs, sessions, biométries, performances) dispose
de 4 opérations HTTP complètes :

```
POST   /nageurs/      → Create  — créer un nageur
GET    /nageurs/      → Read    — lister les nageurs
GET    /nageurs/{id}  → Read    — détail d'un nageur
PUT    /nageurs/{id}  → Update  — modifier un nageur
DELETE /nageurs/{id}  → Delete  — supprimer un nageur
```

## Les routes d'authentification

```
POST /auth/register       → créer un compte (rôle toujours "nageur")
POST /auth/login          → se connecter → token JWT
GET  /auth/me             → profil de l'utilisateur connecté
PUT  /auth/role/{id}      → changer le rôle (admin uniquement)
```

## Contrôle d'accès par rôle

```
Route                    │ nageur         │ entraineur    │ admin
─────────────────────────┼────────────────┼───────────────┼──────────
POST /nageurs/           │ ❌             │ ✅            │ ✅
GET  /nageurs/           │ ✅             │ ✅            │ ✅
PUT  /nageurs/{id}       │ ❌             │ ✅            │ ✅
DELETE /nageurs/{id}     │ ❌             │ ❌            │ ✅
POST /sessions/          │ ✅ (soi-même)  │ ✅            │ ✅
PUT  /sessions/{id}      │ ✅ (soi-même)  │ ✅            │ ✅
GET  /dashboard/{id}     │ ✅ (soi-même)  │ ✅            │ ✅
GET  /equipe/            │ ❌             │ ✅            │ ✅
PUT  /auth/role/{id}     │ ❌             │ ❌            │ ✅
```

## Structure d'une route PUT (mise à jour)

```python
@router.put("/{nageur_id}", response_model=NageurResponse)
def modifier_nageur(
    nageur_id: int,
    data: NageurUpdate,           # schéma avec tous les champs optionnels
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    nageur = db.query(Nageur).filter(Nageur.id == nageur_id).first()
    if not nageur:
        raise HTTPException(404)

    # exclude_unset=True → ne modifie que les champs envoyés
    donnees = data.model_dump(exclude_unset=True)
    for champ, valeur in donnees.items():
        setattr(nageur, champ, valeur)

    db.commit()
    db.refresh(nageur)
    return nageur
```

---

# 11. Pagination

## Le problème sans pagination

Sans pagination, `GET /nageurs` retourne TOUS les nageurs.
Avec 10 000 nageurs, la réponse serait énorme et lente.

## La solution : skip + limit

```python
@router.get("/", response_model=List[NageurResponse])
def get_nageurs(
    skip: int = 0,     # nombre d'éléments à sauter
    limit: int = 50,   # nombre maximum retourné (plafonné à 100)
    db: Session = Depends(get_db)
):
    limit = min(limit, 100)  # sécurité : jamais plus de 100
    return db.query(Nageur).offset(skip).limit(limit).all()
```

## Utilisation côté frontend

```
Page 1 : GET /nageurs?skip=0&limit=20    → nageurs 1 à 20
Page 2 : GET /nageurs?skip=20&limit=20   → nageurs 21 à 40
Page 3 : GET /nageurs?skip=40&limit=20   → nageurs 41 à 60
```

## Toutes les routes paginées

```
GET /nageurs/           → skip, limit
GET /sessions/          → skip, limit
GET /biometries/        → skip, limit
GET /performances/      → skip, limit
```

---

# 12. JWT — Authentification et sécurité

## Le problème sans authentification

```
Sans JWT, n'importe qui peut :
→ GET /nageurs        accéder à toutes les données
→ DELETE /nageurs/1   supprimer un nageur
→ GET /dashboard/1    voir les données privées
```

## bcrypt — Hashage des mots de passe

```
Sans bcrypt :
BDD stocke → "monmotdepasse123" en clair
→ si la BDD est piratée : tous les mots de passe volés

Avec bcrypt :
BDD stocke → "$2b$12$K8HKzxM9..."
→ irréversible — impossible de retrouver le mot de passe
→ salt automatique — protection contre les rainbow tables
```

```python
# Inscription — hashe le mot de passe avant stockage
hash = hasher_mot_de_passe("monmotdepasse")
# stocke "$2b$12$..." en BDD

# Connexion — compare sans jamais voir le mot de passe
verifier_mot_de_passe("monmotdepasse", hash)  # True ou False
```

## Validation du mot de passe

À l'inscription, le mot de passe doit contenir au moins 8 caractères.
Cette vérification est faite dans la route `/auth/register` avant le hashage.

```python
if len(utilisateur.mot_de_passe) < 8:
    raise HTTPException(400, "Le mot de passe doit contenir au moins 8 caractères")
```

## JWT — Token d'accès

```
Un token JWT ressemble à :
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.xK8mN2p

3 parties séparées par des points :
1. Header   → algorithme de chiffrement (HS256)
2. Payload  → données : {"sub": "1", "role": "nageur", "exp": ...}
3. Signature→ garantit que personne n'a modifié le token
```

## Le flux complet

```
1. INSCRIPTION
   email + mot de passe (≥ 8 car.) → bcrypt → hash stocké en BDD
   Le rôle est TOUJOURS "nageur" — sécurité anti-escalade de privilèges
   (le vrai mot de passe n'est JAMAIS stocké)

2. CONNEXION
   email + mot de passe → vérifié avec bcrypt
   ✅ Correct → token JWT généré et renvoyé
   ❌ Incorrect → erreur 401

3. ACCÈS AUX ROUTES PROTÉGÉES
   React envoie : Authorization: Bearer eyJhbGci...
   FastAPI vérifie le token
   ✅ Valide → accès autorisé
   ❌ Invalide ou expiré → erreur 401

4. PROMOTION DE RÔLE (admin uniquement)
   PUT /auth/role/{id} avec {"role": "entraineur"}
   → seul un admin peut promouvoir un nageur en entraîneur ou admin
```

## Les rôles dans Swim AI

```
nageur
→ accès uniquement à ses propres données
→ GET /dashboard/{son_id} seulement

entraineur
→ accès à toute l'équipe
→ GET /equipe, GET /dashboard/{tous les ids}

admin
→ accès total
→ DELETE sur toutes les routes + PUT /auth/role
```

## Sécurité : pourquoi le rôle n'est pas dans le formulaire d'inscription

```
AVANT (vulnérable) :
  POST /auth/register avec {"email": "...", "mot_de_passe": "...", "role": "admin"}
  → n'importe qui pouvait se créer un compte admin

APRÈS (sécurisé) :
  POST /auth/register → rôle toujours forcé à "nageur"
  PUT /auth/role/{id} → admin uniquement peut changer les rôles
```

## Les fichiers auth/

```
auth/security.py      → bcrypt (hasher, vérifier)
                         JWT (créer, décoder token)
                         Utilise datetime.now(timezone.utc) pour l'expiration

auth/dependencies.py  → get_current_user (qui fait la requête ?)
                         get_current_nageur (rôle nageur)
                         get_current_entraineur (rôle entraineur)
                         get_current_admin (rôle admin)

auth/router.py        → POST /auth/register (inscription)
                         POST /auth/login (connexion → token)
                         GET  /auth/me (profil connecté)
                         PUT  /auth/role/{id} (promotion — admin only)
```

## Différence 401 vs 403

```
401 Unauthorized → "Je ne sais pas qui tu es"
                   token manquant, invalide ou expiré
                   solution : se reconnecter

403 Forbidden    → "Je sais qui tu es mais tu n'as pas le droit"
                   token valide mais mauvais rôle
                   solution : changer de compte ou demander une promotion
```

## Protection des routes

```python
# Route publique — sans protection
@router.get("/")
def root():
    return {"message": "API en ligne"}

# Route protégée — tous les connectés
@router.get("/nageurs")
def get_nageurs(user = Depends(get_current_user)):
    ...

# Route entraîneur uniquement
@router.get("/equipe")
def get_equipe(user = Depends(get_current_entraineur)):
    ...

# Route admin uniquement
@router.delete("/nageurs/{id}")
def supprimer(user = Depends(get_current_admin)):
    ...
```

## Le champ actif (Boolean)

```python
# models.py
actif = Column(Boolean, nullable=False, default=True)

# ✅ Correct — comparaison booléenne
if not utilisateur.actif:
    raise HTTPException(403, "Compte désactivé")

# ❌ Ancien code (avant correction) — String au lieu de Boolean
actif = Column(String, default="true")
if utilisateur.actif != "true":  # fragile et confus
```

---

# 13. Grafana — Dashboard monitoring et visualisation

## Qu'est-ce que Grafana ?

```
Grafana = plateforme open source de visualisation
          de données et de monitoring

Il se connecte directement à PostgreSQL
et génère des dashboards riches sans coder
→ parfait pour la vue entraîneur avancée
```

## Pourquoi Grafana dans Swim AI ?

```
React Dashboard          Grafana Dashboard
────────────────         ─────────────────
Vue nageur               Vue entraîneur avancée
Simple et épuré          Dense et analytique type Kibana

KPI cards                Graphiques temps réel
Recommandations IA       Corrélations HRV/chrono
Chrono du jour           Heatmap charge équipe
                         Alertes automatiques
                         Export PDF des rapports
```

## Comment Grafana est installé dans Swim AI

```
Grafana n'est pas installé manuellement
→ Docker le télécharge et le lance automatiquement
→ une seule ligne dans docker-compose.yml suffit

grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"
```

## Connexion à PostgreSQL

```
Dans Grafana :
Connections → Data sources → PostgreSQL

Host     : db:5432
           "db" = nom du service Docker
           pas "localhost" — Grafana est dans un conteneur
Database : swim_ai_db
User     : postgres
Password : valeur de POSTGRES_PASSWORD dans .env
```

## Accès

```
URL      : http://localhost:3001
Login    : admin
Password : valeur de GRAFANA_PASSWORD dans .env
```

## Exemple de requête SQL dans Grafana

```sql
-- Évolution des chronos d'un nageur
SELECT
    s.date AS time,
    p.temps_s AS chrono,
    n.nom || ' ' || n.prenom AS nageur
FROM performances p
JOIN sessions s ON s.id = p.session_id
JOIN nageurs n ON n.id = s.nageur_id
ORDER BY s.date
```

---

---

# 14. Intelligence Artificielle — Vue d'ensemble

## Les 3 niveaux d'IA du projet (CDC)

```
DESCRIPTIF     → analyser ce qui s'est passé
  "Ton HRV moyenne cette semaine est de 42 ms — en baisse de 30%"
  → déjà implémenté dans /dashboard

PRÉDICTIF      → estimer ce qui va se passer
  "D'après ton historique, ton prochain chrono sera ~67.2s"
  → Modèle 7.1 : Random Forest Regressor

PRESCRIPTIF    → recommander ce qu'il faut faire
  "Réduire le volume de 30% cette semaine — risque de surmenage détecté"
  → Modèle 7.2 : Random Forest Classifier + règles expertes
```

## Les 3 modèles demandés par le cahier des charges

```
Modèle 7.1 — Prédiction de chrono (Régression)
  → Algorithme : Random Forest Regressor
  → Sortie     : chrono prédit en secondes
  → Critère    : MAE < 2 secondes

Modèle 7.2 — Détection de fatigue (Classification)
  → Algorithme : Random Forest Classifier
  → Sortie     : "bon" / "fatigué" / "surmenage" + probabilité
  → Fallback   : règles expertes si < 10 données

Modèle 7.3 — Tapering (Règles + Régression)
  → Détecte le bon moment pour réduire la charge avant compétition
  → Sortie     : recommandation + charge cible
```

## Le pipeline général

```
DONNÉES BRUTES (BDD)
       ↓
FEATURE ENGINEERING (Pandas)
  → transformer les données brutes en variables utiles
       ↓
MODÈLE ML (Scikit-learn)
  → Random Forest entraîné sur l'historique du nageur
       ↓
PRÉDICTION
  → résultat + probabilité de confiance
       ↓
EXPLAINABILITÉ (SHAP)
  → "pourquoi le modèle a prédit ça" → compréhensible par l'entraîneur
       ↓
STOCKAGE (table predictions_ia)
  → audit trail pour amélioration continue du modèle
```

---

# 15. Feature Engineering — Préparer les données pour l'IA

## Définition

Le feature engineering consiste à **transformer les données brutes** stockées
en BDD en **variables pertinentes** (features) que le modèle ML peut utiliser.

C'est souvent **80% du travail** d'un projet IA réel.

## Pourquoi ne pas utiliser les données brutes directement ?

```
DONNÉES BRUTES                PROBLÈME
hrv_ms = 42                   → une seule valeur ne dit rien seule
rpe = 8                       → dépend du contexte de la semaine
duree_min = 90                → une séance de 90 min à 30% ≠ 90 min à 90%
```

```
FEATURES CALCULÉES            POURQUOI C'EST MIEUX
hrv_7j_moy = 58.3             → la tendance sur 7 jours est significative
hrv_tendance = -12 ms/sem     → la baisse est le vrai signal de fatigue
acwr = 1.8                    → le ratio charge aiguë/chronique est un indicateur
                                 validé scientifiquement (Gabbett, 2016)
chrono_tendance = -0.8 s/sem  → la progression est plus utile que le chrono brut
```

## Les features calculées dans Swim AI

```python
# Biométriques
hrv_7j_moy      = moyenne des HRV des 7 derniers jours
hrv_tendance    = (HRV_j0 - HRV_j7) / 7          # pente : négatif = fatigue
rpe_7j_moy      = moyenne des RPE des 7 derniers jours
sommeil_7j_moy  = moyenne des heures de sommeil sur 7 jours
fc_repos        = dernière fréquence cardiaque au repos connue

# Charge d'entraînement
charge_7j       = somme des durées de séances sur 7 jours (minutes)
charge_28j      = somme des durées de séances sur 28 jours (minutes)
acwr            = charge_7j / (charge_28j / 4)    # ratio clé anti-blessure
nb_sessions_7j  = nombre de séances dans les 7 derniers jours
ratio_repos     = jours sans séance / 7           # densité de récupération

# Performance
chrono_moy_5    = moyenne des 5 derniers chronos
chrono_tendance = pente des chronos (régression linéaire sur N séances)
                  → négatif = amélioration (on va plus vite)
nb_chronos      = nombre de performances enregistrées
```

## Normalisation — pourquoi c'est nécessaire

```
PROBLÈME : les features ont des échelles très différentes
  hrv_ms    = 40 à 100 ms
  acwr      = 0.5 à 2.0
  duree_min = 30 à 180

Si on ne normalise pas → le modèle croit que "duree_min" est 100x
plus important que "acwr" simplement parce que les valeurs sont plus grandes.

SOLUTION : StandardScaler (Z-score)
  feature_normalisée = (valeur - moyenne) / écart_type
  → toutes les features ont une moyenne de 0 et un écart-type de 1
  → le modèle compare des "écarts" et non des valeurs absolues
```

---

# 16. Random Forest — L'algorithme central

## Qu'est-ce qu'un arbre de décision ?

```
Un arbre de décision est une série de questions if/else :

             [ACWR > 1.3 ?]
             /             \
           OUI              NON
          /                    \
  [HRV < 50 ?]          [RPE > 6 ?]
  /         \            /        \
OUI         NON        OUI        NON
↓            ↓          ↓          ↓
FATIGUÉ     BON      FATIGUÉ      BON
```

## La "forêt" = N arbres entraînés différemment

```
Random Forest = 100 à 500 arbres de décision construits en parallèle.

Chaque arbre est DIFFÉRENT car :
  1. Il voit un sous-ensemble ALÉATOIRE des données (bootstrap sampling)
  2. Il utilise un sous-ensemble ALÉATOIRE des features à chaque nœud

Pourquoi "Random" ?
  → Le hasard force la diversité entre les arbres
  → Un arbre peut se tromper, mais la majorité aura raison
```

## Vote final — classification

```
Arbre 1   : FATIGUÉ
Arbre 2   : FATIGUÉ
Arbre 3   : SURMENAGE
...
Arbre 70  : FATIGUÉ
Arbre 71  : BON
...
Arbre 100 : FATIGUÉ

Résultat : FATIGUÉ (72% des voix) — probabilité = 0.72
```

## Moyenne finale — régression (prédiction de chrono)

```
Arbre 1   : prédit 67.2s
Arbre 2   : prédit 66.8s
Arbre 3   : prédit 68.1s
...
Arbre 100 : prédit 67.4s

Résultat : moyenne = 67.3s
```

## Pourquoi Random Forest et pas un réseau de neurones ?

```
CONTEXTE : projet académique, < 100 données par nageur

Réseau de neurones (LSTM)
  ✗ Nécessite des centaines à milliers d'exemples
  ✗ Risque d'overfitting avec peu de données
  ✗ "Boîte noire" — impossible à expliquer à un entraîneur
  ✗ Long à entraîner

Random Forest
  ✓ Fonctionne bien avec 20-50 exemples
  ✓ Résistant à l'overfitting (grâce à la diversité des arbres)
  ✓ Interprétable via l'importance des features et SHAP
  ✓ Entraînement en millisecondes

Note : le CDC prévoit LSTM en phase avancée (plus de données)
```

## Métriques d'évaluation

```
CLASSIFICATION (fatigue)
  Accuracy  = % de bonnes prédictions (attention : trompeur si données déséquilibrées)
  Precision = parmi les "surmenage" prédits, combien étaient vraiment surmenage ?
  Recall    = parmi les vrais "surmenage", combien a-t-on détectés ?
  F1-score  = moyenne harmonique precision/recall — meilleure métrique globale

RÉGRESSION (chrono)
  MAE  = Mean Absolute Error = |chrono_réel - chrono_prédit| moyenné
         → CDC exige MAE < 2 secondes
  RMSE = Root Mean Squared Error = pénalise davantage les grosses erreurs
         → RMSE > MAE si présence de valeurs aberrantes

Exemple :
  Prédictions : [67.2, 68.1, 66.5]
  Réels        : [66.8, 67.9, 67.2]
  Erreurs      : [0.4,   0.2,  0.7]
  MAE          = (0.4 + 0.2 + 0.7) / 3 = 0.43s  ← excellent
```

---

# 17. Modèle 7.2 — Détection de fatigue (Classification)

## Objectif

Classifier l'état de forme actuel du nageur en 3 catégories :
- **bon** : peut augmenter la charge
- **fatigué** : maintenir ou légèrement réduire
- **surmenage** : réduire immédiatement, risque de blessure

## Features utilisées

```
feature             source          seuils de référence (littérature)
─────────────────────────────────────────────────────────────────────
hrv_7j_moy          biometries      < 50 ms → alarme / > 80 ms → excellent
hrv_tendance        calculé         négatif = récupération insuffisante
rpe_7j_moy          biometries      > 7 → fatigue / > 8 → surmenage
acwr                calculé         > 1.5 → surmenage / < 0.8 → sous-chargé
sommeil_7j_moy      biometries      < 7h → impact récupération
fc_repos            biometries      hausse de la FC repos = signal de fatigue
```

## Logique du modèle

```python
# Fallback règles expertes (< 10 données)
si acwr > 1.5 OU fatigue_score > 80 → "surmenage"
si acwr > 1.3 OU fatigue_score > 65 → "fatigué"
sinon                               → "bon"

# Modèle ML (>= 10 données)
clf = RandomForestClassifier(n_estimators=100)
clf.fit(X_train, y_train)
prediction, probabilite = clf.predict(X), clf.predict_proba(X)
```

## Exemple de sortie API

```json
{
  "classe": "fatigué",
  "probabilite": 0.73,
  "confiance": "modérée",
  "features_cles": {
    "hrv_7j_moy": 48.2,
    "acwr": 1.38,
    "rpe_7j_moy": 7.4
  },
  "recommandation": "Séance de récupération active recommandée"
}
```

---

# 18. Modèle 7.1 — Prédiction de chrono (Régression)

## Objectif

Estimer le chrono que le nageur réalisera lors de sa prochaine séance
ou compétition, sur la base de son historique.

## Features utilisées

```
feature               source        raisonnement
────────────────────────────────────────────────────────────────────
chrono_moy_5          performances  la moyenne récente est le meilleur point de départ
chrono_tendance       calculé       la pente indique si le nageur progresse
nb_chronos            performances  plus il y a de données, plus la prédiction est fiable
acwr                  calculé       un ACWR élevé → probable baisse de performance
rpe_7j_moy            biometries    fatigue = chronos moins bons
hrv_7j_moy            biometries    bonne HRV = meilleure performance attendue
nb_sessions_7j        sessions      fréquence d'entraînement récente
```

## Critère de qualité (CDC)

```
MAE < 2 secondes obligatoire à la livraison.

Sur 100m crawl (record monde ~46s), une erreur de 2s = ~4% → acceptable
Sur 400m crawl (record monde ~220s), une erreur de 2s = ~1% → excellent
```

## Validation croisée

```
Avec peu de données, on utilise Leave-One-Out Cross Validation (LOOCV) :

Données : [68.2, 67.8, 67.1, 66.9, 66.5]  (5 chronos)

Tour 1 : entraîne sur [67.8, 67.1, 66.9, 66.5] → prédit 68.2 → erreur = |68.2 - prédit|
Tour 2 : entraîne sur [68.2, 67.1, 66.9, 66.5] → prédit 67.8 → erreur = |67.8 - prédit|
...
MAE = moyenne des 5 erreurs

→ Utilise chaque point comme test une fois → optimal avec peu de données
```

## Exemple de sortie API

```json
{
  "chrono_predit_s": 66.8,
  "intervalle_confiance": [65.4, 68.2],
  "mae_estime": 0.87,
  "tendance": "progression",
  "nb_donnees": 12,
  "fiabilite": "bonne"
}
```

---

# 19. Modèle 7.3 — Détection du tapering

## Définition

Le **tapering** est la réduction progressive de la charge d'entraînement
dans les 1 à 3 semaines précédant une compétition majeure.
Objectif : arriver en pleine forme le jour J après avoir accumulé les adaptations.

```
SANS TAPERING                    AVEC TAPERING
     │  Charge                        │  Charge
     │   ████                         │   ████
     │   ████                         │   ████  ██
     │   ████  ████                   │   ████  ████  █
     │   ████  ████  ████             │   ████  ████  ████ ██ ─── COMPÉTITION
     └──────────────────              └──────────────────
     → fatigue le jour J              → forme optimale le jour J
```

## Signaux détectés

```
SIGNAL                VALEUR                  INTERPRÉTATION
acwr_tendance         descend sous 0.8        tapering en cours
hrv_tendance          monte > +5 ms/sem       système nerveux qui récupère
rpe_tendance          descend sous 5          fatigue qui se dissipe
chrono_tendance       négatif (amélioration)  forme qui monte
fc_repos_tendance     descend                 récupération cardiovasculaire
```

## Logique de détection

```python
# Le tapering est recommandé si :
# 1. ACWR descend depuis > 1.3 vers < 0.9 (sur 2 semaines)
# 2. HRV remonte (signal de récupération)
# 3. RPE baisse malgré des séances maintenues

tapering_score = (
    (acwr_tendance < 0)      * 0.40 +   # 40% du score
    (hrv_tendance > 0)       * 0.30 +   # 30% du score
    (rpe_tendance < 0)       * 0.20 +   # 20% du score
    (fc_tendance < 0)        * 0.10     # 10% du score
)

si tapering_score > 0.6 → "tapering_en_cours"
si tapering_score > 0.3 → "debut_tapering"
sinon                   → "tapering_non_detecte"
```

## Exemple de sortie API

```json
{
  "statut": "tapering_en_cours",
  "score": 0.75,
  "charge_actuelle_pct": 68,
  "charge_cible_pct": 55,
  "jours_recommandes": 10,
  "signaux": {
    "hrv_remonte": true,
    "rpe_baisse": true,
    "acwr_diminue": true
  }
}
```

---

# 20. SHAP — Explainabilité des modèles

## Le problème de la "boîte noire"

```
Sans SHAP :
  Modèle → "SURMENAGE"
  Entraîneur → "Pourquoi ?"
  Modèle → ...  (pas de réponse)

Avec SHAP :
  Modèle → "SURMENAGE (84%)"
  SHAP   → "Parce que :
             ACWR = 1.8 contribue à +35% de la décision
             HRV basse contribue à +28%
             RPE élevé contribue à +18%"
  Entraîneur → "Je comprends et peux agir"
```

## Comment SHAP fonctionne

```
SHAP (SHapley Additive exPlanations) est basé sur la théorie des jeux.
Idée : combien chaque feature contribue à la prédiction finale ?

Valeur SHAP d'une feature :
  → positive = pousse la prédiction vers "surmenage"
  → négative = pousse vers "bon"
  → magnitude = importance de la contribution

Exemple pour une prédiction "SURMENAGE" :
┌────────────────────────────────────────────┐
│  ACWR = 1.8        SHAP = +0.35  ████████  │
│  HRV = 42 ms       SHAP = +0.28  ███████   │
│  RPE = 8.2         SHAP = +0.18  █████     │
│  sommeil = 5.5h    SHAP = +0.12  ███       │
│  FC repos = 68     SHAP = +0.05  █         │
│  ─────────────────────────────────         │
│  Base rate         SHAP = 0.06             │
│  Total prédit      = 1.04 → SURMENAGE      │
└────────────────────────────────────────────┘
```

## Utilisation dans Swim AI

```
GET /ia/shap/{nageur_id}

→ L'entraîneur voit exactement quels indicateurs ont déclenché l'alerte
→ Il peut prendre une décision éclairée, pas aveugle
→ Conforme au critère CDC "Interprétabilité pour les coachs"
```

---

# 21. Stratégie avec peu de données

## Le problème central d'un projet académique

```
Un nageur commence à utiliser l'app → 0 données → pas de modèle possible.
Après 1 semaine → 7 entrées biométriques → insuffisant.
Après 3 semaines → 21 entrées → on peut commencer.
Après 2 mois → 60+ entrées → modèle fiable.

Comment gérer cette montée progressive ?
```

## Les 3 niveaux de Swim AI

```
NIVEAU 1 — Moins de 10 données biométriques
  → Règles expertes uniquement (codé dans dashboard.py)
  → Basées sur la littérature scientifique (Plews, Gabbett, Foster)
  → Résultat déterministe : mêmes données → même résultat toujours

NIVEAU 2 — Entre 10 et 30 données
  → Random Forest avec Leave-One-Out Cross-Validation
  → Modèle personnalisé au nageur mais avec intervalles de confiance larges
  → MAE estimé sur les données disponibles

NIVEAU 3 — Plus de 30 données
  → Random Forest avec split 80% entraînement / 20% test
  → SHAP values disponibles
  → MAE et RMSE calculés sur données réelles
  → Modèle sauvegardé (joblib) et ré-entraîné à chaque nouvelle donnée

Le passage d'un niveau à l'autre est AUTOMATIQUE dans le pipeline.
```

## Pourquoi ne pas utiliser des datasets publics pour démarrer ?

```
Le CDC le mentionne explicitement :
"Peu de datasets publics en natation — nécessité de collecter les données en propre"

→ Un nageur à 20 ans, 70 kg, 100m crawl ≠ un nageur à 16 ans, 55 kg, 200m brasse
→ Les modèles doivent être PERSONNALISÉS à chaque athlète
→ Transfer learning (utiliser un modèle pré-entraîné sur d'autres athlètes)
   est une piste future mais complexe à mettre en œuvre

Pour l'instant : chaque nageur entraîne son propre modèle.
```

---

# 22. Architecture du module IA

## Structure des fichiers

```
backend/
└── app/
    ├── services/
    │   └── ia/
    │       ├── __init__.py
    │       ├── pipeline.py          → feature engineering (Pandas + NumPy)
    │       │                          calcule toutes les features à partir de la BDD
    │       │
    │       ├── fatigue_model.py     → Modèle 7.2 — Random Forest Classifier
    │       │                          détecte : bon / fatigué / surmenage
    │       │
    │       ├── performance_model.py → Modèle 7.1 — Random Forest Regressor
    │       │                          prédit le prochain chrono
    │       │
    │       ├── tapering.py          → Modèle 7.3 — détection du tapering
    │       │                          moment optimal de réduction de charge
    │       │
    │       └── explainer.py         → SHAP values
    │                                  explique pourquoi le modèle a prédit ça
    │
    ├── routes/
    │   └── ia.py                   → endpoints REST pour le module IA
    │
    └── models.py                   → tables competitions + predictions_ia
```

## Routes API du module IA

```
GET  /ia/fatigue/{nageur_id}
     → état de forme : bon / fatigué / surmenage + probabilité
     → basé sur les 7 derniers jours de biométries

GET  /ia/prediction-chrono/{nageur_id}
     → chrono prédit pour la prochaine séance/compétition
     → MAE estimé sur les données historiques

GET  /ia/tapering/{nageur_id}
     → recommandation de tapering : statut + charge cible
     → basé sur l'évolution ACWR/HRV sur 4 semaines

GET  /ia/shap/{nageur_id}
     → explication SHAP de la dernière prédiction de fatigue
     → importance de chaque feature dans la décision

GET  /ia/rapport/{nageur_id}
     → rapport complet : fatigue + chrono prédit + tapering + SHAP
     → un seul appel API pour tout le module IA (dashboard)
```

## Nouvelles tables BDD (module IA)

```
competitions
  id, nageur_id, date, epreuve, chrono, rang, bassin, lieu
  → résultats officiels en compétition
  → données clés pour entraîner le modèle 7.1

predictions_ia
  id, nageur_id, date, type_modele, valeur_predite,
  classe_predite, probabilite, features_json, explication_json, horizon
  → trace chaque prédiction pour audit et amélioration continue
  → permet de calculer le MAE réel une fois la compétition passée
```

## Dépendances à ajouter (requirements.txt)

```
pandas==2.2.3        → manipulation et feature engineering
numpy==1.26.4        → calculs numériques
scikit-learn==1.5.2  → Random Forest, StandardScaler, métriques
shap==0.45.0         → explainabilité des modèles
joblib==1.4.2        → sauvegarde et chargement des modèles entraînés
```

---

> **Note :** Ce fichier est mis à jour au fur et à mesure de l'évolution du projet.
> Si tu ajoutes un nouveau concept important, documente-le ici.
