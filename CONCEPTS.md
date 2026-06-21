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

> **Note :** Ce fichier est mis à jour au fur et à mesure de l'évolution du projet.
> Si tu ajoutes un nouveau concept important, documente-le ici.
