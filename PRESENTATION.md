# Swim AI — Project Presentation
## Smart Training Optimization Platform for Competitive Swimming

---

# Slide 1 — Title

```
SWIM AI
Smart Training Optimization for Competitive Swimming

Presented by: [Your Name]
Date: June 26, 2026
```

---

# Slide 2 — Project Context

```
THE PROBLEM

- Competitive swimmers train 20-30 hours/week
- Coaches manage 10-30 athletes simultaneously
- Training decisions are still based on intuition, not data
- Overtraining causes 60% of injuries in swimming (British Journal of Sports Medicine)
- No affordable tool connects biometrics, performance, and workload in one place

THE OPPORTUNITY

- The sports analytics market is growing at 25% CAGR (Grand View Research, 2025)
- Wearable adoption among athletes increased 340% since 2020
- Yet most tools target team sports (football, basketball)
- Swimming lacks a dedicated, data-driven coaching platform
```

---

# Slide 3 — State of the Art

```
EXISTING SOLUTIONS                    SWIM AI DIFFERENTIATOR

TrainingPeaks                         ┌─────────────────────────┐
  Multi-sport, no swimming focus      │                         │
  No biometric correlation            │  Swimming-specific      │
  $20/month per athlete               │  HRV + RPE + Sleep      │
                                      │  + Performance in ONE   │
Triton Wear                           │  dashboard              │
  Hardware-dependent (sensor)         │                         │
  $500+ per device                    │  No hardware required   │
  Limited to in-pool metrics          │  Workload monitoring    │
                                      │  (ACWR ratio)           │
SwimSmooth                            │                         │
  Technique analysis only             │  Fatigue detection      │
  No fatigue/recovery tracking        │  + Smart alerts         │
  No team management                  │  + Coach team view      │
                                      │                         │
                                      │  Open source & free     │
                                      └─────────────────────────┘
```

---

# Slide 4 — Market Positioning

```
                    HIGH PRICE
                        │
         Triton Wear    │   WHOOP (general)
         (hardware)     │
                        │
  LOW TECH ─────────────┼───────────────── HIGH TECH
                        │
         Paper logbook  │   ★ SWIM AI
         Excel sheets   │   (smart, free,
                        │    swimming-specific)
                        │
                    LOW PRICE

TARGET USERS:
  → Swimming clubs (50-200 members)
  → University swim teams
  → Independent coaches with 5-30 athletes
  → National federation training centers
```

---

# Slide 5 — Main Features

```
┌─────────────────────────────────────────────────────────┐
│                    SWIM AI FEATURES                      │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│  SWIMMER VIEW       │  COACH VIEW                       │
│                     │                                   │
│  ● Personal KPIs    │  ● Team overview dashboard        │
│    - Last chrono    │  ● Fatigue status per athlete     │
│    - Best chrono    │    (optimal/watch/fatigue/        │
│    - Progression %  │     overtraining)                 │
│                     │  ● Priority alerts                │
│  ● Biometric input  │    (ACWR > 1.5, HRV < 50)        │
│    - HRV (ms)       │  ● All athletes' KPIs at         │
│    - Resting HR     │    a glance                       │
│    - RPE (1-10)     │                                   │
│    - Sleep (hours)  │  ADMIN                            │
│                     │  ● User role management           │
│  ● Workload (ACWR)  │  ● Account activation/            │
│  ● Smart recomm.    │    deactivation                   │
│  ● Chrono history   │                                   │
│    graph            │                                   │
│                     │                                   │
├─────────────────────┴───────────────────────────────────┤
│  SECURITY                                               │
│  ● JWT authentication (bcrypt hashed passwords)         │
│  ● Role-based access control (swimmer/coach/admin)      │
│  ● No self-promotion: only admins can change roles      │
│  ● Password policy: minimum 8 characters                │
├─────────────────────────────────────────────────────────┤
│  API                                                    │
│  ● Full CRUD (Create, Read, Update, Delete)             │
│  ● Pagination on all list endpoints (max 100)           │
│  ● Auto-generated Swagger documentation                 │
└─────────────────────────────────────────────────────────┘
```

---

# Slide 6 — Data Sources & Studies

```
DATA COLLECTED IN SWIM AI

┌──────────────┬──────────────────────────┬──────────────────────┐
│ Table        │ Fields                   │ Scientific basis     │
├──────────────┼──────────────────────────┼──────────────────────┤
│ swimmers     │ name, birth date,        │ Athlete profiling    │
│ (nageurs)    │ specialty, level         │                      │
├──────────────┼──────────────────────────┼──────────────────────┤
│ sessions     │ date, type (endurance,   │ Training periodiz.   │
│              │ sprint, technique,       │ (Bompa & Haff, 2009) │
│              │ recovery), duration      │                      │
├──────────────┼──────────────────────────┼──────────────────────┤
│ biometrics   │ HRV (ms), resting HR,   │ Plews et al. (2013)  │
│              │ RPE (1-10), sleep (h)    │ "HRV as overtraining │
│              │                          │  marker in swimmers"  │
├──────────────┼──────────────────────────┼──────────────────────┤
│ performances │ distance, time (s),      │ Chronometric tracking │
│              │ stroke, avg speed (m/s)  │ for progression      │
└──────────────┴──────────────────────────┴──────────────────────┘

KEY METRICS COMPUTED BY THE BACKEND

● ACWR (Acute:Chronic Workload Ratio)
  - Acute  = total training minutes over 7 days
  - Chronic = total training minutes over 28 days / 4
  - Safe zone: 0.8 to 1.3 (Gabbett, 2016)
  - Above 1.5 = high injury risk

● Fatigue Score (0-100)
  - Based on RPE average (7 days) × 10
  - Adjusted by HRV: < 50ms → +20 / > 80ms → -10

● Progression = ((last chrono - first chrono) / first chrono) × 100
  - Negative = improvement (faster)
```

---

# Slide 7 — Regulatory Constraints (GDPR / Data Privacy)

```
SWIM AI HANDLES SENSITIVE DATA

Health data (HRV, heart rate, sleep) = special category under GDPR Article 9
Sports performance data = personal data under GDPR Article 4

┌──────────────────────────────────────────────────────────────┐
│                COMPLIANCE MEASURES                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PASSWORDS                                                │
│     → Never stored in plain text                             │
│     → bcrypt hash with automatic salt                        │
│     → Minimum 8 characters enforced                          │
│                                                              │
│  2. AUTHENTICATION                                           │
│     → JWT tokens with 30-minute expiration                   │
│     → Tokens signed with SECRET_KEY (env variable)           │
│     → Automatic invalidation on expiry                       │
│                                                              │
│  3. ACCESS CONTROL                                           │
│     → Swimmers can ONLY access their own data                │
│     → Coaches see their team only                            │
│     → Role escalation requires admin action                  │
│                                                              │
│  4. DATA STORAGE                                             │
│     → PostgreSQL with encrypted connections                  │
│     → .env file excluded from git (.gitignore)               │
│     → Database credentials never hardcoded                   │
│                                                              │
│  5. FUTURE (production)                                      │
│     → HTTPS only (TLS certificate)                           │
│     → Data retention policy                                  │
│     → User consent management                                │
│     → Right to erasure (DELETE endpoints ready)              │
│     → Data portability (JSON export)                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Slide 8 — Technical Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                      DOCKER COMPOSE                           │
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   FRONTEND  │    │   BACKEND    │    │   GRAFANA    │     │
│  │   React     │───▶│   FastAPI    │    │   Analytics  │     │
│  │   :3000     │    │   :8000      │    │   :3001      │     │
│  │             │    │              │    │              │     │
│  │  Dashboard  │    │  REST API    │    │  SQL queries │     │
│  │  Forms      │    │  JWT Auth    │    │  Dashboards  │     │
│  │  Charts     │    │  Pydantic    │    │  Alerts      │     │
│  └─────────────┘    └──────┬───────┘    └──────┬───────┘     │
│                            │                    │             │
│                            │   SQLAlchemy ORM   │  Direct SQL │
│                            │                    │             │
│                            ▼                    ▼             │
│                     ┌──────────────────────────────┐         │
│                     │      POSTGRESQL 15           │         │
│                     │      :5432                   │         │
│                     │                              │         │
│                     │  nageurs | sessions           │         │
│                     │  biometries | performances    │         │
│                     │  utilisateurs                 │         │
│                     │                              │         │
│                     │  Volume: postgres_data       │         │
│                     └──────────────────────────────┘         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

# Slide 9 — Design Patterns

```
PATTERN 1 — LAYERED ARCHITECTURE (n-tier)

  Presentation Layer    →  React (frontend)
  API Layer             →  FastAPI routes + Pydantic validation
  Business Logic Layer  →  Python functions (KPI, ACWR, alerts)
  Data Access Layer     →  SQLAlchemy ORM
  Storage Layer         →  PostgreSQL

PATTERN 2 — RESTful WEB SERVICES

  POST   /nageurs       →  Create
  GET    /nageurs       →  Read (list, paginated)
  GET    /nageurs/{id}  →  Read (single)
  PUT    /nageurs/{id}  →  Update
  DELETE /nageurs/{id}  →  Delete

  All endpoints follow REST conventions:
  → Stateless (JWT token per request)
  → Resource-oriented URLs
  → Standard HTTP status codes (200, 201, 204, 400, 401, 403, 404)

PATTERN 3 — DEPENDENCY INJECTION (FastAPI)

  def get_nageurs(
      db: Session = Depends(get_db),              ← DB session injected
      user: Utilisateur = Depends(get_current_user) ← Auth injected
  ):

PATTERN 4 — REPOSITORY PATTERN (via SQLAlchemy ORM)

  → Models (models.py) = database tables
  → Schemas (schemas.py) = API validation
  → Routes (routes/*.py) = controllers
  → Separation of concerns: data ≠ validation ≠ logic
```

---

# Slide 10 — Technology Stack

```
LAYER            TECHNOLOGY         VERSION    WHY

Backend          Python             3.11       Industry standard for data/ML
Framework        FastAPI            0.136      Fastest Python framework, auto-docs
ORM              SQLAlchemy         2.0        Most mature Python ORM
Validation       Pydantic           2.13       Type-safe, auto-error messages
Auth             python-jose        3.5        JWT standard implementation
Password hash    bcrypt/passlib     4.0/1.7    Industry standard, auto-salt
Database         PostgreSQL         15         Robust, open source, production-ready
Monitoring       Grafana            latest     SQL-native dashboards, alerts
Containerization Docker Compose     v2         Reproducible environments
Frontend (plan.) React              18+        Component-based, large ecosystem
Charts (plan.)   Recharts           2.x        React-native charting library
ML (future)      Scikit-learn       —          Fatigue prediction model

DEV TOOLS

Version control  Git + GitHub       —          Collaboration, PR workflow
IDE              VS Code            —          Extensions, Docker integration
API testing      Swagger UI         auto       Generated from FastAPI + Pydantic
```

---

# Slide 11 — Database Schema (ERD)

```
┌──────────────────┐       ┌──────────────────┐
│   utilisateurs   │       │     nageurs       │
├──────────────────┤       ├──────────────────┤
│ id          PK   │       │ id          PK   │
│ email       UQ   │  1──1 │ nom              │
│ mot_de_passe     │───────│ prenom           │
│ role             │       │ date_naissance   │
│ nageur_id   FK   │       │ specialite       │
│ actif       BOOL │       │ niveau           │
└──────────────────┘       └────────┬─────────┘
                                    │
                           1────────┤────────1
                           │                 │
                    ┌──────┴───────┐  ┌──────┴───────┐
                    │   sessions   │  │  biometries  │
                    ├──────────────┤  ├──────────────┤
                    │ id       PK  │  │ id       PK  │
                    │ nageur_id FK │  │ nageur_id FK │
                    │ date         │  │ date         │
                    │ type_seance  │  │ hrv_ms       │
                    │ duree_min    │  │ fc_repos     │
                    └──────┬───────┘  │ rpe          │
                           │          │ sommeil_h    │
                      1────┘          └──────────────┘
                      │
               ┌──────┴────────┐
               │ performances  │
               ├───────────────┤
               │ id        PK  │
               │ session_id FK │
               │ distance_m    │
               │ temps_s       │
               │ style_nage    │
               │ vitesse_moy   │
               └───────────────┘

CASCADE DELETE: swimmer deleted → all sessions, biometrics, performances deleted
```

---

# Slide 12 — API Endpoints Overview (25 routes)

```
AUTH (public)                          SWIMMERS (protected)
  POST /auth/register                    POST /nageurs
  POST /auth/login                       GET  /nageurs?skip=0&limit=50
  GET  /auth/me                          GET  /nageurs/{id}
  PUT  /auth/role/{id} (admin)           PUT  /nageurs/{id}
                                         DELETE /nageurs/{id} (admin)

SESSIONS (protected)                   BIOMETRICS (protected)
  POST /sessions                         POST /biometries
  GET  /sessions?skip=0&limit=50         GET  /biometries?skip=0&limit=50
  GET  /sessions/{id}                    GET  /biometries/{id}
  GET  /sessions/nageur/{id}             GET  /biometries/nageur/{id}
  PUT  /sessions/{id}                    PUT  /biometries/{id}
  DELETE /sessions/{id} (admin)          DELETE /biometries/{id} (admin)

PERFORMANCES (protected)              DASHBOARDS (protected)
  POST /performances                     GET /dashboard/{nageur_id}
  GET  /performances?skip=0&limit=50     GET /equipe
  GET  /performances/{id}                GET /equipe/alertes
  GET  /performances/session/{id}        GET /equipe/stats
  GET  /performances/nageur/{id}
  PUT  /performances/{id}
  DELETE /performances/{id} (admin)
```

---

# Slide 13 — Project Organization & Team

```
TEAM STRUCTURE

  Backend Developer(s)    → API, database, authentication, business logic
  Frontend Developer(s)   → React dashboard, user interface
  Data/ML (future)        → Fatigue prediction model (Scikit-learn)

WORKFLOW

  1. Git branching strategy
     main ← feature branches ← pull requests

  2. Docker-first development
     → docker-compose up = entire stack running
     → Same environment for every team member

  3. API-first approach
     → Backend built and tested independently
     → Swagger UI as living documentation
     → Frontend consumes REST API

PROJECT TIMELINE

  Phase 1 (done)  → Database design + FastAPI backend + JWT auth
  Phase 2 (done)  → Dashboard endpoints + coach team view + CRUD complete
  Phase 3 (current) → React frontend + Figma mockups
  Phase 4 (next)  → Grafana dashboards + data visualization
  Phase 5 (future)→ ML fatigue prediction + mobile app
```

---

# Slide 14 — Live Demo

```
DEMO CHECKLIST

  1. Show Swagger UI         → http://localhost:8000/docs
  2. Register a user         → POST /auth/register
  3. Login                   → POST /auth/login → get JWT token
  4. Create a swimmer        → POST /nageurs (with token)
  5. Create a session        → POST /sessions
  6. Add biometrics          → POST /biometries
  7. Add a performance       → POST /performances
  8. Show dashboard          → GET /dashboard/{id}
  9. Show team dashboard     → GET /equipe
  10. Show Grafana           → http://localhost:3001
```

---

# Slide 15 — Next Steps & Roadmap

```
SHORT TERM (next 2 weeks)
  → Build React frontend from UI_SPEC.md mockups
  → Connect frontend to all API endpoints
  → Deploy Grafana dashboards with SQL queries

MEDIUM TERM (1-2 months)
  → Implement fatigue prediction with Scikit-learn
  → Add data export (CSV/PDF reports)
  → Mobile responsive design

LONG TERM
  → Mobile app (React Native)
  → Wearable integration (Garmin, Apple Watch)
  → AI-powered training plan generation
  → Multi-club support (SaaS model)
```

---

# Slide 16 — Q&A

```
THANK YOU

  GitHub    : github.com/tims237/swim-ai
  API Docs  : http://localhost:8000/docs
  Grafana   : http://localhost:3001

  Questions?
```
