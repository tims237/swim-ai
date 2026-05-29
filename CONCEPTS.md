```markdown
# CONCEPTS.md
# Documentation technique — Swim AI
# Ce fichier explique les concepts clés utilisés dans le projet.
# Rédigé pour permettre à tout collaborateur de comprendre l'architecture
# sans avoir besoin de chercher ailleurs.

---

# 📚 Table des matières

1. [L'architecture globale](#1-larchitecture-globale)
2. [PostgreSQL — La base de données](#2-postgresql--la-base-de-données)
3. [SQLAlchemy — L'ORM](#3-sqlalchemy--lorm)
4. [Pydantic — La validation des données](#4-pydantic--la-validation-des-données)
5. [FastAPI — Le framework backend](#5-fastapi--le-framework-backend)
6. [Le flux complet d'une requête](#6-le-flux-complet-dune-requête)
7. [Les fichiers du projet et leurs rôles](#7-les-fichiers-du-projet-et-leurs-rôles)

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
│   performances                          │
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
```

## Les relations entre tables

```
nageurs
   │
   ├──── sessions ──── performances
   │
   └──── biometries
```

Un nageur peut avoir :
- plusieurs sessions d'entraînement
- plusieurs entrées biométriques
- et chaque session peut contenir plusieurs performances

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

## La Base

```python
Base = declarative_base()
```

La Base est le point de départ de tous les modèles.
C'est elle qui dit à SQLAlchemy :
"Ces classes Python représentent des tables PostgreSQL."

**Règle importante :**
Il ne doit exister qu'UNE SEULE Base dans tout le projet.
Elle est définie dans `database.py` et importée dans `models.py`.

```python
# ✅ Correct
# database.py → définit la Base
Base = declarative_base()

# models.py → importe la Base
from app.database import Base

# ❌ Incorrect — crée deux Base indépendantes
# database.py → Base = declarative_base()
# models.py   → Base = declarative_base()  ← ne jamais faire ça
```

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

## Les trois schémas par entité

Pour chaque table, on crée trois schémas :

```python
# 1. NageurBase — champs communs
class NageurBase(BaseModel):
    nom        : str
    prenom     : str
    specialite : Optional[str]

# 2. NageurCreate — ce que l'utilisateur ENVOIE
#    Hérite de NageurBase — pas d'id (il n'existe pas encore)
class NageurCreate(NageurBase):
    pass

# 3. NageurResponse — ce que l'API RENVOIE
#    Hérite de NageurBase — ajoute l'id généré par PostgreSQL
class NageurResponse(NageurBase):
    id: int
    class Config:
        from_attributes = True
```

## Pourquoi trois schémas ?

```
Création d'un nageur :
  Utilisateur envoie  →  { "nom": "Dupont", "prenom": "Lucas" }
                                 ↑ pas d'id — il n'existe pas encore
  API renvoie         →  { "id": 1, "nom": "Dupont", "prenom": "Lucas" }
                                 ↑ id ajouté par PostgreSQL
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
                    ↓
3. FastAPI reçoit la requête
   et passe les données à Pydantic (NageurCreate)
                    ↓
4. Pydantic valide les données
   ✅ nom est bien un String
   ✅ prenom est bien un String
   ✅ tous les champs obligatoires sont présents
                    ↓
5. FastAPI appelle la fonction de la route
   et injecte la session SQLAlchemy via Depends(get_db)
                    ↓
6. SQLAlchemy crée un objet Nageur
   et l'insère dans PostgreSQL
   INSERT INTO nageurs (nom, prenom, specialite)
   VALUES ('Dupont', 'Lucas', '100m crawl')
                    ↓
7. PostgreSQL génère l'id automatiquement
   et retourne l'objet créé
                    ↓
8. Pydantic sérialise l'objet SQLAlchemy
   en dictionnaire JSON (NageurResponse)
   { "id": 1, "nom": "Dupont", "prenom": "Lucas", "specialite": "100m crawl" }
                    ↓
9. FastAPI renvoie la réponse HTTP 201
   au Dashboard React
                    ↓
10. React affiche le nouveau nageur dans l'interface
```

---

# 7. Les fichiers du projet et leurs rôles

```
backend/
└── app/
    ├── main.py        → point d'entrée de l'API
    │                    démarre FastAPI et crée les tables
    │
    ├── database.py    → configuration de la connexion PostgreSQL
    │                    définit engine, SessionLocal, Base, get_db()
    │
    ├── models.py      → modèles SQLAlchemy
    │                    chaque classe = une table PostgreSQL
    │
    ├── schemas.py     → schémas Pydantic
    │                    validation des données entrantes et sortantes
    │
    └── .env           → variables d'environnement
                         DATABASE_URL — jamais partagé sur GitHub
```

---

> **Note :** Ce fichier est mis à jour au fur et à mesure de l'évolution du projet.
> Si tu ajoutes un nouveau concept important, documente-le ici.
```

Place ce fichier à la racine de `swim-ai_projet/`. On attaque les routes FastAPI ?

Tu as raison, c'est un concept fondamental. Voici le bloc à ajouter à la fin de ton `CONCEPTS.md` :

```markdown
---

# 8. CORS — Cross-Origin Resource Sharing

## Le problème sans CORS

Le frontend React tourne sur :
```
http://localhost:3000
```

Le backend FastAPI tourne sur :
```
http://localhost:8000
```

Ce sont deux **origines différentes** — port 3000 vs port 8000.

Par défaut, le navigateur bloque automatiquement toutes les requêtes
entre deux origines différentes.
C'est une règle de sécurité du navigateur : la **Same Origin Policy**.

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
       │ "Je veux appeler /nageurs"
       ▼
Navigateur
       │
       │ "Je vérifie si localhost:3000
       │  est autorisé par l'API..."
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

## Sans CORS — ce que verrait l'équipe frontend

```
Console du navigateur :

❌ Access to fetch at 'http://localhost:8000/nageurs'
   from origin 'http://localhost:3000'
   has been blocked by CORS policy
```

Leur code React serait correct mais le navigateur bloquerait tout.

## Résumé

```
Sans CORS  →  navigateur bloque React ↔ FastAPI
Avec CORS  →  navigateur autorise React ↔ FastAPI
```

## Règle importante

En production, ne jamais mettre `allow_origins=["*"]`.
Cela autoriserait N'IMPORTE quel site à appeler ton API.
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
```

Ajoute ce bloc à la fin de ton `CONCEPTS.md` avec **CTRL+End** pour aller directement à la fin du fichier. On attaque le dashboard endpoint ?