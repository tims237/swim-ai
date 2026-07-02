# Swim AI — Presentation Slides
## Restructured based on review feedback

---

# SLIDE 1 — Title

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│          [LOGO SKILLS4MIND]                                 │
│                                                             │
│                   SWIM AI                                   │
│       Smart Training Optimization for Competitive Swimming  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Presented by : [Nom du responsable de présentation]        │
│  Date         : [Date de la séance]                         │
│                                                             │
│                                              Slide 1 / 11   │
└─────────────────────────────────────────────────────────────┘
```

---

# SLIDE 2 — Technological Context in Sport

```
TECHNOLOGY IS RESHAPING ATHLETIC PERFORMANCE

In the last decade, data-driven training has become
the standard in high-performance sport.

  2012 — 2024 : Evolution of sports technology

  ─────────────────────────────────────────────────────────
  2012  GPS trackers appear in football and rugby
  2015  Heart rate variability (HRV) adopted by elite coaches
  2018  Machine learning enters performance prediction
  2020  Wearables adopted by 340% more athletes
  2023  AI-powered coaching assistants emerge
  2024  Personalized fatigue prediction becomes accessible
  ─────────────────────────────────────────────────────────

  "The gap between elite and amateur sport is no longer
   talent — it is access to data and its interpretation."
         — McKinsey Global Institute, Sports Analytics 2024


WHY AI IN SWIMMING SPECIFICALLY ?

  ● Swimming is one of the most measurable sports in the world
    → every stroke, every split, every heartbeat can be captured

  ● Yet 90% of clubs worldwide still rely on intuition and paper logs

  ● A 1% improvement in stroke efficiency = 0.5s on 100m
    → the difference between qualifying and not qualifying

  ● AI can detect fatigue patterns 3 days before a swimmer
    feels them consciously (Plews et al., 2013 — HRV research)
```

---

# SLIDE 3 — Market Positioning

```
DESIGNED FOR EVERY LEVEL OF COMPETITIVE SWIMMING

  Swim AI is not here to replace TrainingPeaks, Triton Wear,
  or SwimSmooth. Each of these tools is excellent in its domain.

  We are filling a specific gap:

  ┌──────────────────────────────────────────────────────────┐
  │                                                          │
  │   "An all-in-one platform that brings professional-      │
  │    grade analytics to the amateur and semi-pro club,     │
  │    without hardware requirements or subscription fees."  │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  EXISTING TOOLS AND THEIR FOCUS
  ──────────────────────────────────────────────────────────
  TrainingPeaks   Multi-sport platform / Strong on planning
  Triton Wear     In-pool sensor hardware / Stroke analysis
  SwimSmooth      Technique and video / Coach education
  ──────────────────────────────────────────────────────────
  Each excels in ONE area. None combines biometrics + workload
  + performance + team management in a single free platform.

  SWIM AI TARGET
  ─────────────────────────────────────────────────────────
  ✓  Amateur clubs      (10 to 100 swimmers, limited budget)
  ✓  University teams   (structured training, coach-led)
  ✓  Semi-pro clubs     (regional / national level athletes)
  ✓  National centers   (high volume, multi-coach management)
  ─────────────────────────────────────────────────────────

  POSITIONING MAP

              HIGH PRICE
                  │
  Triton Wear     │    WHOOP / Garmin
  (hardware $500) │    (general fitness)
                  │
  LOW TECH ───────┼──────────────── HIGH TECH
                  │
  Paper logbook   │         ★  SWIM AI
  Excel sheets    │         (smart + free + swimming-specific)
                  │
              LOW PRICE
```

---

# SLIDE 4 — Features : What We Measure and Why

```
SWIMMING IS MORE THAN A STOPWATCH

  A swimmer's performance depends on 4 interconnected dimensions :

  ┌──────────────┬──────────────────────────────────────────────┐
  │  DIMENSION   │  WHAT SWIM AI CAPTURES                       │
  ├──────────────┼──────────────────────────────────────────────┤
  │  TECHNIQUE   │  Stroke style (crawl, backstroke,            │
  │              │  breaststroke, butterfly, individual medley) │
  │              │  Distance per stroke, start type (dive/      │
  │              │  pushoff), split time per length (25m)       │
  ├──────────────┼──────────────────────────────────────────────┤
  │  PERFORMANCE │  Race distance (50m / 100m / 200m / 400m /  │
  │              │  800m / 1500m), total chrono (seconds),      │
  │              │  average speed (m/s), progression % vs PB   │
  ├──────────────┼──────────────────────────────────────────────┤
  │  WORKLOAD    │  Session type (endurance / sprint /          │
  │              │  technique / recovery), duration (min),      │
  │              │  acute load (7d), chronic load (28d),        │
  │              │  ACWR ratio — injury risk indicator           │
  ├──────────────┼──────────────────────────────────────────────┤
  │  RECOVERY    │  HRV (heart rate variability in ms),         │
  │              │  resting heart rate (bpm), sleep duration    │
  │              │  (hours), perceived effort RPE (1–10)        │
  └──────────────┴──────────────────────────────────────────────┘

  KEY COMPUTED INDICATORS

  ● ACWR (Acute:Chronic Workload Ratio)
    → 7-day load ÷ (28-day load ÷ 4)
    → Safe zone : 0.8 – 1.3  |  Above 1.5 : high injury risk

  ● Fatigue Score (0–100)
    → RPE average × 10, adjusted by HRV level
    → Instant visual signal for the coach

  ● Progression
    → (last chrono − first chrono) ÷ first chrono × 100
    → Negative = improvement (swimmer is getting faster)

  ● AI Injury Risk (Random Forest — see Slide 7)
    → Predicts overtraining risk from combined biometric signals
```

---

# SLIDE 5 — Meet Sophie : A Swimmer's Journey

```
MEET SOPHIE, 19 — REGIONAL LEVEL SWIMMER, 100M BACKSTROKE

  Monday morning, 7:00 AM
  ─────────────────────────────────────────────────────────
  Sophie wakes up, opens Swim AI on her phone.

  She enters her morning biometrics before practice :
    → HRV today  : 42 ms   (her normal range: 68–75 ms)
    → Resting HR : 64 bpm  (usually 52 bpm)
    → Sleep      : 5.5 h
    → RPE (yesterday's session) : 8/10

  Swim AI immediately flags :
    ⚠  "HRV below threshold — nervous system not recovered"
    ⚠  "Sleep below 7h — direct impact on recovery"
    ⚠  "RPE ≥ 8 — consider a recovery session today"

  ─────────────────────────────────────────────────────────
  Her coach, Marc, sees Sophie's alert on the team dashboard
  before the 8 AM session even starts.

  He adjusts her training plan :
    ✓  Replaces sprint session with active recovery
    ✓  Reduces total volume from 4000m to 2000m
    ✓  Adds 20 min of stretching and breathwork

  ─────────────────────────────────────────────────────────
  Wednesday — 2 days later
  Sophie's HRV returns to 71 ms.
  She posts her best 100m backstroke time : 1:08.4 — a PB.

  ─────────────────────────────────────────────────────────

  Without Swim AI :
    → Marc would have run the full sprint session Monday
    → Sophie would have trained through fatigue
    → Risk of minor injury or performance plateau

  With Swim AI :
    → One data point prevented 2 weeks of potential setback
```

---

# SLIDE 6 — Sophie's Data in Swim AI

```
SOPHIE'S PROFILE — WHAT THE PLATFORM SHOWS

  ┌─────────────────────────────────────────────────────────┐
  │  SWIMMER DASHBOARD — Sophie Lefebvre                    │
  │  Specialty: 100m Backstroke  |  Level: Regional         │
  ├──────────────┬──────────────┬─────────────┬────────────┤
  │ Last chrono  │ Personal best│ Progression │ Fatigue    │
  │   1:08.4     │   1:07.9     │   -1.8%     │  72/100    │
  │   100m back  │   100m back  │  improving  │ moderate   │
  ├──────────────┴──────────────┴─────────────┴────────────┤
  │  WORKLOAD (ACWR)                                        │
  │  Acute load (7d)  : 320 min                             │
  │  Chronic load (28d): 1 100 min                          │
  │  ACWR             : 1.16  ✓ Safe zone (0.8 – 1.3)      │
  ├──────────────────────────────────────────────────────────┤
  │  BIOMETRICS — Last 7 days                               │
  │  HRV average  : 66.2 ms   (was 42 ms on Monday)        │
  │  Resting HR   : 54 bpm                                  │
  │  Avg sleep    : 7.2 h                                   │
  │  Avg RPE      : 6.1 / 10                                │
  ├──────────────────────────────────────────────────────────┤
  │  CHRONO HISTORY — 100m Backstroke                       │
  │  Jan    1:12.3                                          │
  │  Feb    1:10.8  ↓                                       │
  │  Mar    1:09.5  ↓                                       │
  │  Apr    1:08.4  ↓  ← current PB                        │
  ├──────────────────────────────────────────────────────────┤
  │  SMART RECOMMENDATIONS                                  │
  │  ✓  Workload in optimal zone — maintain volume          │
  │  ✓  Significant progression — stay on this trajectory  │
  │  ⚠  Monitor HRV — stays below 50 ms = rest day        │
  └──────────────────────────────────────────────────────────┘

  COACH MARC SEES THIS ACROSS HIS ENTIRE TEAM OF 18 SWIMMERS
  → One screen, all athletes, priority alerts at the top
  → He can export the full team report as CSV in one click
```

---

# SLIDE 7 — Data Sources, Architecture & AI

```
WHERE THE DATA COMES FROM

  ─────────────────────────────────────────────────────────
  INPUT                      SOURCE
  ─────────────────────────────────────────────────────────
  Biometrics (HRV, HR, RPE)  Swimmer — entered manually
                              or synced from wearable
  Session data               Coach or swimmer — entered
                              after each practice
  Performance (chrono)       Coach — entered after timing
  Profile (stroke, level)    Admin — set at registration
  ─────────────────────────────────────────────────────────

  TECHNICAL ARCHITECTURE — RESTful Web Services

  ┌────────────────────────────────────────────────────────┐
  │  FRONTEND (React + Vite)                               │
  │  HTTP Requests + JWT Bearer Token                      │
  └──────────────────┬─────────────────────────────────────┘
                     │  REST API  (JSON over HTTP)
  ┌──────────────────▼─────────────────────────────────────┐
  │  BACKEND (FastAPI — Python)                            │
  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
  │  │  Auth Layer  │  │ Business     │  │  AI Layer   │  │
  │  │  JWT / bcrypt│  │ Logic        │  │  Random     │  │
  │  │  Role-based  │  │ KPI / ACWR   │  │  Forest     │  │
  │  │  access      │  │ Fatigue score│  │  Scoring    │  │
  │  └──────────────┘  └──────────────┘  └─────────────┘  │
  │  SQLAlchemy ORM                                        │
  └──────────────────┬─────────────────────────────────────┘
                     │
  ┌──────────────────▼─────────────────────────────────────┐
  │  DATABASE (PostgreSQL 15)                              │
  │  nageurs | sessions | biometries | performances        │
  │  utilisateurs                                          │
  └────────────────────────────────────────────────────────┘
                     │
  ┌──────────────────▼─────────────────────────────────────┐
  │  GRAFANA  (direct SQL connection)                      │
  │  Advanced coach dashboards | Heatmaps | PDF export     │
  └────────────────────────────────────────────────────────┘

  AI — RANDOM FOREST SCORING

  ● Algorithm   : Random Forest Classifier (Scikit-learn)
  ● Input       : HRV (7d avg), RPE (7d avg), ACWR,
                  sleep average, resting HR trend
  ● Output      : Fatigue risk score (0–100)
                  + Overtraining probability (%)
  ● Why Random Forest ?
    → Handles missing data well (common in manual entry)
    → Resistant to outliers (one bad sleep night ≠ overtraining)
    → Interpretable — coach can see which feature drove the score
    → No large dataset needed to start — rule-based fallback
```

---

# SLIDE 8 — API Routes : All 27 Endpoints

```
REST API — COMPLETE ROUTE MAP

  Authentication (public — no token required)
  ───────────────────────────────────────────────────────────
  POST  /auth/register/nageur      Register a new swimmer
                                   (creates account + swimmer profile)
  POST  /auth/register/entraineur  Register a new coach
                                   (creates account, role=entraineur)
  POST  /auth/login                Login → returns JWT token
  GET   /auth/me                   Get current user profile + role
  PUT   /auth/role/{id}            Change a user's role (admin only)

  Swimmers — role: any authenticated user
  ───────────────────────────────────────────────────────────
  POST  /nageurs/                  Create a swimmer (coach/admin)
  GET   /nageurs/                  List all swimmers (paginated)
  GET   /nageurs/{id}              Get one swimmer by ID
  PUT   /nageurs/{id}              Update swimmer (coach/admin)
  DELETE /nageurs/{id}             Delete swimmer (admin only)

  Training Sessions — role-filtered
  ───────────────────────────────────────────────────────────
  POST  /sessions/                 Create a session
  GET   /sessions/                 List sessions (own if nageur)
  GET   /sessions/{id}             Get session by ID
  GET   /sessions/nageur/{id}      All sessions for one swimmer
  PUT   /sessions/{id}             Update a session
  DELETE /sessions/{id}            Delete (admin only)

  Biometrics — role-filtered
  ───────────────────────────────────────────────────────────
  POST  /biometries/               Record biometric entry
  GET   /biometries/               List (own if nageur)
  GET   /biometries/{id}           Get one entry
  GET   /biometries/nageur/{id}    All biometrics for one swimmer
  PUT   /biometries/{id}           Update an entry
  DELETE /biometries/{id}          Delete (admin only)

  Performances — role-filtered
  ───────────────────────────────────────────────────────────
  POST  /performances/             Record a chrono
  GET   /performances/             List (own if nageur)
  GET   /performances/{id}         Get one performance
  GET   /performances/session/{id} All performances for a session
  GET   /performances/nageur/{id}  All performances for a swimmer
  PUT   /performances/{id}         Update a performance
  DELETE /performances/{id}        Delete (admin only)

  Dashboards — computed KPIs
  ───────────────────────────────────────────────────────────
  GET   /dashboard/{nageur_id}     Full swimmer dashboard
                                   (KPI + ACWR + history + AI score)
  GET   /equipe/                   Coach team overview
                                   (stats + alerts + all swimmers)
  GET   /equipe/alertes            Active alerts only
  GET   /equipe/stats              Team statistics only

  All list endpoints support pagination : ?skip=0&limit=50
  All protected routes require : Authorization: Bearer <token>
```

---

# SLIDE 9 — Design Patterns & Technical Choices

```
ARCHITECTURE PATTERNS CHOSEN

  1. LAYERED ARCHITECTURE (N-Tier)
     ─────────────────────────────────────────────────────
     Presentation  →  React (Vite, React Router, Recharts)
     API           →  FastAPI routes + Pydantic validation
     Business      →  Python functions (KPI, ACWR, AI score)
     Data Access   →  SQLAlchemy ORM (models + queries)
     Storage       →  PostgreSQL 15

  2. RESTful WEB SERVICES
     ─────────────────────────────────────────────────────
     ● Stateless   : every request carries its JWT token
     ● Resource-based URLs : /nageurs, /sessions, /performances
     ● Standard HTTP verbs : POST / GET / PUT / DELETE
     ● Standard status codes : 200 / 201 / 204 / 400 / 401 / 403 / 404
     ● JSON exclusively : request bodies and responses

  3. DEPENDENCY INJECTION (FastAPI)
     ─────────────────────────────────────────────────────
     def get_nageurs(
         db   = Depends(get_db),           # DB session injected
         user = Depends(get_current_user)  # Auth injected
     )
     → Decoupled, testable, no global state

  4. ROLE-BASED ACCESS CONTROL (RBAC)
     ─────────────────────────────────────────────────────
     nageur      → own data only
     entraineur  → full team read + write
     admin       → everything + role management

  5. AI SCORING — RANDOM FOREST
     ─────────────────────────────────────────────────────
     ● Ensemble method : 100 decision trees vote on each prediction
     ● Input features  : HRV, RPE, ACWR, sleep, resting HR
     ● Output          : fatigue risk score (0–100)
     ● Fallback        : rule-based scoring when data is insufficient

  ELEMENTS EXTRACTABLE FOR THE THESIS (BAC)
  ─────────────────────────────────────────────────────────
  ✓ RESTful API design with role-based access — Web Services course
  ✓ MVC-inspired separation : models / schemas / routes — Architecture
  ✓ JWT authentication flow — Security module
  ✓ Random Forest for sports prediction — AI / ML module
  ✓ Docker containerization — Deployment / DevOps
  ✓ GDPR compliance measures — Data law / Regulations
  ✓ PostgreSQL relational schema with CASCADE — Database course
  ✓ ACWR workload ratio — Sports science / domain knowledge
```

---

# SLIDE 10 — Project Organization

```
TEAM & WORKFLOW

  Roles
  ─────────────────────────────────────────────────────────
  Backend developer(s)    API, database, authentication, AI scoring
  Frontend developer(s)   React dashboard, user interface, UX
  ─────────────────────────────────────────────────────────

  Git workflow
  ─────────────────────────────────────────────────────────
  main         ←  production-ready code
  dev          ←  integration branch
  feature/*    ←  one branch per feature, PR to dev then main
  ─────────────────────────────────────────────────────────

  Docker-first development
  → docker-compose up = entire stack running for any team member
  → No "works on my machine" — same environment everywhere

  API-first approach
  → Backend built and tested independently via Swagger UI
  → Frontend consumes the REST API
  → Teams work in parallel without blocking each other

  PROJECT TIMELINE
  ─────────────────────────────────────────────────────────
  Phase 1  ✓  Database schema + FastAPI backend + JWT auth
  Phase 2  ✓  Dashboard KPIs + Coach team view + Full CRUD
  Phase 3  ✓  React frontend + Design system + JWT integration
  Phase 4  ○  Separate registration pages (nageur / entraineur)
               Role-based routing in frontend
  Phase 5  ○  Grafana dashboards + SQL queries
  Phase 6  ○  Random Forest model training + integration
  Phase 7  ○  Production deployment (HTTPS + cloud hosting)
  ─────────────────────────────────────────────────────────
```

---

# SLIDE 11 — Demo & Q&A

```
LIVE DEMO

  1. Open Swagger UI         → http://localhost:8000/docs
  2. Register as a swimmer   → POST /auth/register/nageur
                               (nom, prénom, date de naissance, email, mdp)
  3. Register as a coach     → POST /auth/register/entraineur
  4. Login                   → POST /auth/login → JWT token
  5. Create a session        → POST /sessions
  6. Record biometrics       → POST /biometries (HRV, RPE, sleep)
  7. Record a performance    → POST /performances (100m crawl — 58.24s)
  8. View swimmer dashboard  → GET /dashboard/{id}
     → ACWR, fatigue score, progression, recommendations
  9. View coach team view    → GET /equipe
     → all swimmers, alerts, status badges
  10. Open Grafana           → http://localhost:3001

─────────────────────────────────────────────────────────────

                        THANK YOU

  GitHub  :  github.com/tims237/swim-ai
  API     :  http://localhost:8000/docs
  Grafana :  http://localhost:3001

                       Questions ?

                                              [LOGO SKILLS4MIND]
```
