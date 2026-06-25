# Swim AI — Specification UI / Figma
# Document de reference pour la creation des maquettes Figma
# Chaque ecran est decrit avec son wireframe ASCII, ses composants et ses regles

---

# Table des matieres

1. [Design System](#1-design-system)
2. [Login](#2-login)
3. [Register](#3-register)
4. [Dashboard Nageur](#4-dashboard-nageur)
5. [Dashboard Equipe (Entraineur)](#5-dashboard-equipe-entraineur)
6. [Liste Nageurs](#6-liste-nageurs)
7. [Liste Sessions](#7-liste-sessions)
8. [Liste Biometries](#8-liste-biometries)
9. [Liste Performances](#9-liste-performances)
10. [Formulaires (Create / Edit)](#10-formulaires-create--edit)
11. [Admin — Gestion des roles](#11-admin--gestion-des-roles)
12. [Navigation et Layout](#12-navigation-et-layout)
13. [User Flows par role](#13-user-flows-par-role)
14. [Responsive et Mobile](#14-responsive-et-mobile)

---

# 1. Design System

## Palette de couleurs

```
PRIMARY (bleu piscine)
  --primary-50   : #EBF5FF    fond clair, hover sur cards
  --primary-100  : #CCE5FF    fond selection active
  --primary-500  : #0077CC    boutons principaux, liens, icones actifs
  --primary-600  : #005FA3    hover boutons
  --primary-700  : #004A80    texte sur fond clair

SECONDARY (bleu marine)
  --secondary-800 : #1A2332   sidebar, header
  --secondary-900 : #0F1722   fond sidebar hover

SUCCESS (vert)
  --success-50  : #ECFDF5     fond badge "optimal"
  --success-500 : #10B981     badge "optimal", icone check, ACWR OK

WARNING (orange)
  --warning-50  : #FFFBEB     fond badge "surveiller"
  --warning-500 : #F59E0B     badge "surveiller", alerte modere

DANGER (rouge)
  --danger-50   : #FEF2F2     fond badge "surmenage"
  --danger-500  : #EF4444     badge "surmenage", alerte critique

NEUTRAL (gris)
  --neutral-50  : #F9FAFB     fond page
  --neutral-100 : #F3F4F6     fond cards
  --neutral-200 : #E5E7EB     bordures
  --neutral-400 : #9CA3AF     texte secondaire, placeholder
  --neutral-600 : #4B5563     texte corps
  --neutral-800 : #1F2937     titres, texte principal
  --neutral-900 : #111827     titres h1
```

## Typographie

```
Font principale : Inter (Google Fonts)
Font alternative : system-ui, -apple-system, sans-serif

h1   : 28px / bold / neutral-900    — titre de page
h2   : 22px / semibold / neutral-800 — titre de section
h3   : 16px / semibold / neutral-800 — titre de card
body : 14px / regular / neutral-600  — texte courant
small: 12px / regular / neutral-400  — labels, captions
```

## Composants de base

### Boutons

```
┌─────────────────────┐
│   Bouton Primaire   │  bg: primary-500 / text: white / radius: 8px
└─────────────────────┘  hover: primary-600 / height: 40px / padding: 0 20px

┌─────────────────────┐
│  Bouton Secondaire  │  bg: white / border: neutral-200 / text: neutral-800
└─────────────────────┘  hover: neutral-50

┌─────────────────────┐
│   Bouton Danger     │  bg: danger-500 / text: white
└─────────────────────┘  hover: #DC2626 — pour les suppressions
```

### Cards (KPI)

```
┌──────────────────────────────┐
│  Label (small, neutral-400)  │  bg: white
│  VALEUR  (h2, neutral-900)   │  border: 1px neutral-200
│  sous-info (small, success)  │  radius: 12px
└──────────────────────────────┘  padding: 20px / shadow: sm
```

### Badges de statut

```
[ Optimal ]     bg: success-50  / text: success-700  / radius: 20px
[ Surveiller ]  bg: warning-50  / text: warning-700
[ Fatigue ]     bg: warning-50  / text: warning-700  / border: warning-300
[ Surmenage ]   bg: danger-50   / text: danger-700
[ Inconnu ]     bg: neutral-100 / text: neutral-500
```

### Champs de formulaire

```
  Label (small, neutral-600)
┌──────────────────────────────┐
│  Placeholder...              │  height: 40px / border: neutral-200
└──────────────────────────────┘  radius: 8px / focus-border: primary-500
                                  error-border: danger-500
  Message d'erreur (small, danger-500)
```

### Alertes (toast / inline)

```
┌─ ⚠ ──────────────────────────────────┐
│  Titre alerte                         │  border-left: 4px danger-500
│  Description du probleme              │  bg: danger-50
└───────────────────────────────────────┘  radius: 8px / padding: 16px

┌─ ✓ ──────────────────────────────────┐
│  Succes — Operation reussie           │  border-left: 4px success-500
└───────────────────────────────────────┘  bg: success-50
```

### Tableau

```
┌──────────┬───────────┬──────────┬─────────┐
│ Nom    ▼ │ Prenom    │ Special. │ Actions │  header: bg neutral-50 / text neutral-600
├──────────┼───────────┼──────────┼─────────┤
│ Dupont   │ Lucas     │ 100m     │ ✏ 🗑   │  row: hover bg primary-50
├──────────┼───────────┼──────────┼─────────┤  border-bottom: neutral-200
│ Martin   │ Emma      │ 200m     │ ✏ 🗑   │  actions: icones 20px
└──────────┴───────────┴──────────┴─────────┘
          < 1  2  3  ...  12 >                  pagination: bas du tableau
```

---

# 2. Login

## Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                   ┌───────────────────────┐                     │
│                   │                       │                     │
│                   │      SWIM AI          │                     │
│                   │      [logo vague]     │                     │
│                   │                       │                     │
│                   │  Email                │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │                 │  │                     │
│                   │  └─────────────────┘  │                     │
│                   │                       │                     │
│                   │  Mot de passe         │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │            [eye]│  │                     │
│                   │  └─────────────────┘  │                     │
│                   │                       │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │  Se connecter   │  │                     │
│                   │  └─────────────────┘  │                     │
│                   │                       │                     │
│                   │  Pas de compte ?      │                     │
│                   │  Creer un compte      │                     │
│                   │                       │                     │
│                   └───────────────────────┘                     │
│                                                                 │
│     fond: gradient primary-500 → secondary-800                  │
└─────────────────────────────────────────────────────────────────┘
```

## Specifications

```
Fond de page      : gradient diagonal primary-500 → secondary-800
Card centrale     : bg white / radius 16px / shadow xl / max-width 400px
Logo              : 48px / centre / marge bas 32px
Champs            : composant Input standard (voir Design System)
Bouton            : Primaire / full width
Lien inscription  : text primary-500 / hover underline
Erreur            : alerte inline danger sous le bouton
```

## Endpoints utilises

```
POST /auth/login   → body: { username: email, password: mot_de_passe }
                   → reponse: { access_token, token_type }
                   → stocker le token dans localStorage
```

---

# 3. Register

## Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                   ┌───────────────────────┐                     │
│                   │                       │                     │
│                   │      SWIM AI          │                     │
│                   │   Creer votre compte  │                     │
│                   │                       │                     │
│                   │  Email                │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │                 │  │                     │
│                   │  └─────────────────┘  │                     │
│                   │                       │                     │
│                   │  Mot de passe         │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │            [eye]│  │                     │
│                   │  └─────────────────┘  │                     │
│                   │  Min. 8 caracteres    │                     │
│                   │                       │                     │
│                   │  Confirmer mdp        │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │            [eye]│  │                     │
│                   │  └─────────────────┘  │                     │
│                   │                       │                     │
│                   │  ┌─────────────────┐  │                     │
│                   │  │  S'inscrire     │  │                     │
│                   │  └─────────────────┘  │                     │
│                   │                       │                     │
│                   │  Deja un compte ?     │                     │
│                   │  Se connecter         │                     │
│                   │                       │                     │
│                   └───────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Specifications

```
Meme layout que Login
Champ "Confirmer mdp" : validation front (match avec mot de passe)
Indication            : "Min. 8 caracteres" sous le champ mdp (neutral-400)
Validation front      : email format + mdp >= 8 + mdp == confirmation
Le role n'est PAS dans le formulaire (force a "nageur" cote backend)
```

## Endpoints utilises

```
POST /auth/register → body: { email, mot_de_passe }
                    → reponse: { id, email, role, actif }
                    → rediriger vers /login apres succes
```

---

# 4. Dashboard Nageur

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Dashboard > Mon profil                    [avatar]  │
│  SWIM AI │─────────────────────────────────────────────────────│
│          │                                                      │
│ ┌──────┐ │  Bonjour, Lucas Dupont                               │
│ │ Dash │ │  Specialite : 100m crawl | Niveau : National         │
│ └──────┘ │                                                      │
│ Sessions │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│ Biometrie│  │ Dernier  │ │ Meilleur │ │ Progres- │ │ Score   │ │
│ Perfs    │  │ chrono   │ │ chrono   │ │ sion     │ │ fatigue │ │
│          │  │          │ │          │ │          │ │         │ │
│          │  │  58.24s  │ │  56.80s  │ │  -2.4%   │ │  45/100 │ │
│          │  │  ▲ 0.3s  │ │  100m    │ │  ✓ bon   │ │ optimal │ │
│          │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│          │                                                      │
│          │  ┌──────────────────────┐ ┌────────────────────────┐ │
│          │  │ Charge entrainement  │ │  Biometries (7 jours)  │ │
│          │  │                      │ │                        │ │
│          │  │ Aigue    : 320 min   │ │  HRV moy  : 72.5 ms   │ │
│          │  │ Chronique: 1200 min  │ │  FC repos  : 52 bpm    │ │
│          │  │ ACWR     : 1.07      │ │  RPE moyen : 5.2       │ │
│          │  │ [====●========]      │ │  Sommeil   : 7.8 h     │ │
│          │  │  0.8    1.0   1.3    │ │                        │ │
│          │  │       zone ok        │ │                        │ │
│          │  └──────────────────────┘ └────────────────────────┘ │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │ Evolution des chronos                          │  │
│          │  │                                                │  │
│          │  │  60|                                           │  │
│          │  │    |  *                                        │  │
│          │  │  58|     *    *                                │  │
│          │  │    |        *    *     *                       │  │
│          │  │  56|                *     *                    │  │
│          │  │    └──────────────────────────                 │  │
│          │  │     Jan  Fev  Mar  Avr  Mai                   │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │ Recommandations                                │  │
│          │  │                                                │  │
│          │  │  ✓  Charge optimale — maintenir le volume      │  │
│          │  │  ✓  HRV excellente — bien recupere             │  │
│          │  │  ✓  Progression significative — continuer      │  │
│          │  │  ⚠  Sommeil insuffisant (< 7h)                │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Layout           : sidebar 240px + zone principale scrollable
KPI cards        : grille 4 colonnes (2 colonnes sur tablette, 1 sur mobile)
Graphique chrono : librairie Recharts (LineChart)
                   axe X = dates / axe Y = temps en secondes (inversé, bas = mieux)
                   couleur ligne : primary-500 / points : primary-700
Jauge ACWR       : barre horizontale avec zone verte (0.8-1.3) et marqueur
Recommandations  : liste avec icone couleur selon type (✓ vert, ⚠ orange)
```

## Endpoints utilises

```
GET /auth/me              → recuperer le profil (role, nageur_id)
GET /dashboard/{nageur_id} → toutes les donnees du dashboard en un appel
```

---

# 5. Dashboard Equipe (Entraineur)

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Dashboard > Mon equipe                   [avatar]   │
│  SWIM AI │──────────────────────────────────────────────────────│
│          │                                                      │
│ ┌──────┐ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ │Equipe│ │  │  Total   │ │ Optimaux │ │ A surv.  │ │ Alertes ││
│ └──────┘ │  │ nageurs  │ │          │ │          │ │ actives ││
│ Nageurs  │  │          │ │          │ │          │ │         ││
│ Sessions │  │    12    │ │    8     │ │    3     │ │    4    ││
│ Biometrie│  │          │ │  ✓ 67%  │ │  ⚠ 25%  │ │  ! prio ││
│ Perfs    │  └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│ Alertes  │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │ Alertes prioritaires                   Voir +  │  │
│          │  │                                                │  │
│          │  │  ! DANGER  Dupont Lucas                        │  │
│          │  │    ACWR 1.8 — reduire immediatement le volume  │  │
│          │  │                                                │  │
│          │  │  ⚠ WARNING  Martin Emma                       │  │
│          │  │    Fatigue elevee — prevoir recuperation        │  │
│          │  │                                                │  │
│          │  │  ⚠ WARNING  Bernard Hugo                      │  │
│          │  │    HRV critique (42 ms) — systeme non recupere │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │ Vue equipe                        [recherche]  │  │
│          │  │                                                │  │
│          │  │ ┌──────┬────────┬────────┬──────┬──────┬─────┐ │  │
│          │  │ │ Nom  │Special.│ Chrono │ ACWR │Fatig.│Stat.│ │  │
│          │  │ ├──────┼────────┼────────┼──────┼──────┼─────┤ │  │
│          │  │ │Dupont│100m    │ 58.24  │ 1.80 │  82  │ !!! │ │  │
│          │  │ │Martin│200m    │ 132.5  │ 1.35 │  68  │ ⚠  │ │  │
│          │  │ │Leroy │ 50m    │ 27.10  │ 1.05 │  35  │  ✓  │ │  │
│          │  │ │Petit │400m    │ 258.0  │ 0.92 │  42  │  ✓  │ │  │
│          │  │ └──────┴────────┴────────┴──────┴──────┴─────┘ │  │
│          │  │              < 1  2  3 >                        │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Stats cards      : 4 colonnes en haut (meme composant que dashboard nageur)
Alertes          : card avec bordure gauche coloree (danger rouge, warning orange)
                   triees : danger en premier, puis warning
                   clic sur une alerte → ouvre le dashboard du nageur concerne
Tableau equipe   : colonnes triables (clic sur header)
                   colonne Statut = badge colore (voir Design System)
                   clic sur une ligne → ouvre /dashboard/{nageur_id}
                   pagination en bas
```

## Endpoints utilises

```
GET /equipe/         → dashboard complet (stats + alertes + nageurs)
GET /equipe/alertes  → alertes seules (pour widget sidebar)
GET /equipe/stats    → stats seules (pour KPI cards)
GET /dashboard/{id}  → quand on clique sur un nageur
```

---

# 6. Liste Nageurs

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Nageurs                                  [avatar]   │
│  SWIM AI │──────────────────────────────────────────────────────│
│          │                                                      │
│  [menu]  │  ┌─────────────────────────┐  ┌──────────────────┐  │
│          │  │ Rechercher...           │  │ + Ajouter nageur │  │
│          │  └─────────────────────────┘  └──────────────────┘  │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │                                                │  │
│          │  │ Nom     │Prenom  │Naissance │Special. │Niveau  │  │
│          │  │─────────┼────────┼──────────┼─────────┼────────│  │
│          │  │ Dupont  │ Lucas  │15/03/2000│100m     │National│  │
│          │  │         │        │          │crawl    │  [✏][🗑]│  │
│          │  │─────────┼────────┼──────────┼─────────┼────────│  │
│          │  │ Martin  │ Emma   │22/07/2001│200m     │Region. │  │
│          │  │         │        │          │brasse   │  [✏][🗑]│  │
│          │  │─────────┼────────┼──────────┼─────────┼────────│  │
│          │  │ Bernard │ Hugo   │05/11/1999│ 50m     │National│  │
│          │  │         │        │          │papillon │  [✏][🗑]│  │
│          │  │                                                │  │
│          │  │              < 1  2  3  ...  8 >               │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Bouton "+ Ajouter" : visible uniquement pour entraineur et admin
Actions [edit]     : visible uniquement pour entraineur et admin
Actions [delete]   : visible uniquement pour admin
Recherche          : filtre local sur nom/prenom (pas de requete serveur)
Clic sur une ligne : ouvre /dashboard/{nageur_id}
Pagination         : 20 elements par page / utilise ?skip=X&limit=20
```

## Endpoints utilises

```
GET    /nageurs?skip=0&limit=20  → liste paginee
POST   /nageurs                  → creer (via modal ou page dediee)
PUT    /nageurs/{id}             → modifier
DELETE /nageurs/{id}             → supprimer (confirmation modal)
```

---

# 7. Liste Sessions

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Sessions                                 [avatar]   │
│  SWIM AI │──────────────────────────────────────────────────────│
│          │                                                      │
│  [menu]  │  ┌────────────────────┐  ┌────────────────────────┐ │
│          │  │ Rechercher...      │  │ + Nouvelle session     │ │
│          │  └────────────────────┘  └────────────────────────┘ │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │                                                │  │
│          │  │ Date     │Nageur    │Type       │Duree │Actions│  │
│          │  │──────────┼─────────┼───────────┼──────┼───────│  │
│          │  │01/05/2025│ Dupont  │ Endurance │90min │ [✏][🗑]│  │
│          │  │──────────┼─────────┼───────────┼──────┼───────│  │
│          │  │02/05/2025│ Martin  │ Sprint    │60min │ [✏][🗑]│  │
│          │  │──────────┼─────────┼───────────┼──────┼───────│  │
│          │  │03/05/2025│ Dupont  │ Technique │75min │ [✏][🗑]│  │
│          │  │                                                │  │
│          │  │              < 1  2  3 >                        │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Role nageur      : voit uniquement SES sessions, pas le bouton "+ Nouvelle"
                   sauf pour creer ses propres sessions
Role entraineur  : voit toutes les sessions, peut creer pour tout nageur
Colonne Nageur   : affiche "nom prenom" — lien cliquable vers le dashboard
Type seance      : badge colore (endurance=bleu, sprint=orange, technique=violet,
                   recuperation=vert)
```

## Endpoints utilises

```
GET    /sessions?skip=0&limit=20        → liste paginee
GET    /sessions/nageur/{id}            → filtrer par nageur
POST   /sessions                        → creer
PUT    /sessions/{id}                   → modifier
DELETE /sessions/{id}                   → supprimer (admin only)
```

---

# 8. Liste Biometries

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Biometries                               [avatar]   │
│  SWIM AI │──────────────────────────────────────────────────────│
│          │                                                      │
│  [menu]  │  ┌────────────────────┐  ┌────────────────────────┐ │
│          │  │ Rechercher...      │  │ + Saisir biometrie     │ │
│          │  └────────────────────┘  └────────────────────────┘ │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │                                                │  │
│          │  │ Date     │Nageur  │HRV(ms)│FC  │RPE│Sommeil│Act│  │
│          │  │──────────┼────────┼───────┼────┼───┼───────┼───│  │
│          │  │01/05/2025│ Dupont │ 72.5  │ 52 │ 5 │ 7.5h  │✏🗑│  │
│          │  │──────────┼────────┼───────┼────┼───┼───────┼───│  │
│          │  │01/05/2025│ Martin │ 45.0  │ 68 │ 8 │ 5.5h  │✏🗑│  │
│          │  │──────────┼────────┼───────┼────┼───┼───────┼───│  │
│          │  │02/05/2025│ Dupont │ 78.2  │ 50 │ 4 │ 8.0h  │✏🗑│  │
│          │  │                                                │  │
│          │  │              < 1  2  3 >                        │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Couleurs conditionnelles dans le tableau :
  HRV < 50    → texte danger-500 + fond danger-50
  HRV > 80    → texte success-500
  RPE >= 8    → texte danger-500 + fond danger-50
  RPE <= 4    → texte success-500
  Sommeil < 7 → texte warning-500
  Sommeil >= 8→ texte success-500

Role nageur   : voit ses propres biometries, peut saisir les siennes
Role entrain. : voit toutes les biometries, peut saisir pour tout nageur
```

## Endpoints utilises

```
GET    /biometries?skip=0&limit=20      → liste paginee
GET    /biometries/nageur/{id}          → filtrer par nageur
POST   /biometries                      → creer
PUT    /biometries/{id}                 → modifier
DELETE /biometries/{id}                 → supprimer (admin only)
```

---

# 9. Liste Performances

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Performances                             [avatar]   │
│  SWIM AI │──────────────────────────────────────────────────────│
│          │                                                      │
│  [menu]  │  ┌────────────────────┐  ┌────────────────────────┐ │
│          │  │ Rechercher...      │  │ + Ajouter performance  │ │
│          │  └────────────────────┘  └────────────────────────┘ │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │                                                │  │
│          │  │ Session│Distance│Temps  │Style  │Vitesse│ Act  │  │
│          │  │────────┼────────┼───────┼───────┼───────┼──────│  │
│          │  │ #12    │ 100m   │ 58.24 │ Crawl │1.72   │ ✏ 🗑 │  │
│          │  │────────┼────────┼───────┼───────┼───────┼──────│  │
│          │  │ #12    │  50m   │ 27.10 │ Crawl │1.85   │ ✏ 🗑 │  │
│          │  │────────┼────────┼───────┼───────┼───────┼──────│  │
│          │  │ #15    │ 200m   │132.50 │Brasse │1.51   │ ✏ 🗑 │  │
│          │  │                                                │  │
│          │  │              < 1  2  3 >                        │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Colonne Session : affiche "#id" — lien cliquable vers le detail session
Colonne Temps   : format secondes avec 2 decimales
Colonne Vitesse : calculee distance/temps, affichee en m/s
Style           : badge colore par type de nage
                  crawl=bleu, dos=violet, brasse=vert, papillon=orange, 4nages=gris
```

## Endpoints utilises

```
GET    /performances?skip=0&limit=20       → liste paginee
GET    /performances/session/{id}          → filtrer par session
GET    /performances/nageur/{id}           → filtrer par nageur
POST   /performances                       → creer
PUT    /performances/{id}                  → modifier
DELETE /performances/{id}                  → supprimer (admin only)
```

---

# 10. Formulaires (Create / Edit)

## Modal de creation (exemple : Nageur)

```
┌─────────────────────────────────────────┐
│  Ajouter un nageur               [X]   │
│─────────────────────────────────────────│
│                                         │
│  Nom *                                  │
│  ┌───────────────────────────────────┐  │
│  │ Dupont                            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Prenom *                               │
│  ┌───────────────────────────────────┐  │
│  │ Lucas                             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Date de naissance                      │
│  ┌───────────────────────────────────┐  │
│  │ 15/03/2000              [cal]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Specialite                             │
│  ┌───────────────────────────────────┐  │
│  │ 100m crawl                ▼      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Niveau                                 │
│  ┌───────────────────────────────────┐  │
│  │ National                  ▼      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  Annuler    │  │   Enregistrer   │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Modal de creation : Biometrie

```
┌─────────────────────────────────────────┐
│  Saisie biometrique              [X]   │
│─────────────────────────────────────────│
│                                         │
│  Nageur *                               │
│  ┌───────────────────────────────────┐  │
│  │ Dupont Lucas              ▼      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Date *                                 │
│  ┌───────────────────────────────────┐  │
│  │ 21/06/2026              [cal]     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ HRV (ms)       │ │ FC repos (bpm) │  │
│  │ ┌────────────┐ │ │ ┌────────────┐ │  │
│  │ │ 72.5       │ │ │ │ 52         │ │  │
│  │ └────────────┘ │ │ └────────────┘ │  │
│  └────────────────┘ └────────────────┘  │
│                                         │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ RPE (1-10)     │ │ Sommeil (h)    │  │
│  │ ┌────────────┐ │ │ ┌────────────┐ │  │
│  │ │ ●●●●●○○○○○ │ │ │ │ 7.5        │ │  │
│  │ │    5/10     │ │ │ └────────────┘ │  │
│  │ └────────────┘ │ │                │  │
│  └────────────────┘ └────────────────┘  │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  Annuler    │  │   Enregistrer   │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Specifications generales des formulaires

```
Presentation  : modal centree / overlay sombre (bg black 50%)
Largeur       : max-width 500px
Champs *      : obligatoires — validation front avant envoi
Bouton Annuler: secondaire (gris) — ferme la modal sans sauvegarder
Bouton Save   : primaire (bleu) — disabled tant que les champs * sont vides
Erreur serveur: alerte inline danger en haut de la modal
Mode edit     : meme modal, pre-remplie avec les valeurs actuelles
                titre change en "Modifier [entite]"
RPE           : slider visuel 1-10 (ou boutons radio avec pastilles)
Date          : date picker natif ou composant calendrier
Select nageur : dropdown avec recherche (si entraineur)
                pre-rempli et desactive (si nageur connecte)
```

---

# 11. Admin — Gestion des roles

## Wireframe

```
┌──────────┬──────────────────────────────────────────────────────┐
│          │  Administration > Utilisateurs             [avatar]  │
│  SWIM AI │──────────────────────────────────────────────────────│
│          │                                                      │
│  [menu]  │  ┌────────────────────────────────────────────────┐  │
│  ───     │  │                                                │  │
│  Admin   │  │ Email          │ Role       │ Actif │ Actions  │  │
│  > Users │  │────────────────┼────────────┼───────┼──────────│  │
│  > Roles │  │ lucas@swim.ai  │[nageur  ▼] │  ✓   │ [save]   │  │
│          │  │────────────────┼────────────┼───────┼──────────│  │
│          │  │ emma@swim.ai   │[entrain.▼] │  ✓   │ [save]   │  │
│          │  │────────────────┼────────────┼───────┼──────────│  │
│          │  │ coach@swim.ai  │[entrain.▼] │  ✓   │ [save]   │  │
│          │  │────────────────┼────────────┼───────┼──────────│  │
│          │  │ admin@swim.ai  │[admin   ▼] │  ✓   │ [save]   │  │
│          │  │                                                │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
│          │  ┌────────────────────────────────────────────────┐  │
│          │  │ ⚠ Attention : changer un role prend effet      │  │
│          │  │   immediatement. L'utilisateur devra se         │  │
│          │  │   reconnecter pour obtenir un nouveau token.    │  │
│          │  └────────────────────────────────────────────────┘  │
│          │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

## Specifications

```
Visible      : uniquement pour le role "admin"
Select role  : dropdown inline dans le tableau (nageur, entraineur, admin)
Bouton save  : apparait uniquement si le role a change (etat != initial)
               appelle PUT /auth/role/{id}
Colonne Actif: toggle switch (true/false)
Warning      : alerte inline permanente en bas
```

## Endpoints utilises

```
GET  /auth/me                → verifier que l'utilisateur est admin
PUT  /auth/role/{user_id}    → changer le role : body { "role": "entraineur" }
```

---

# 12. Navigation et Layout

## Layout global

```
┌──────────┬─────────────────────────────────────────────────┐
│          │  Header                                         │
│          │  ┌─────────────────────────────────┬──────────┐ │
│ SIDEBAR  │  │  Breadcrumb > Page actuelle     │ [Avatar] │ │
│          │  └─────────────────────────────────┴──────────┘ │
│ 240px    │─────────────────────────────────────────────────│
│          │                                                 │
│ Logo     │                                                 │
│ ──────── │           CONTENU PRINCIPAL                     │
│ Menu     │                                                 │
│ items    │           (scrollable)                          │
│          │                                                 │
│          │           padding: 24px                         │
│          │                                                 │
│ ──────── │                                                 │
│ Profil   │                                                 │
│ Deconnex │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

## Sidebar — items par role

```
NAGEUR :
  ├── Dashboard         /dashboard/{mon_id}
  ├── Mes sessions      /sessions
  ├── Mes biometries    /biometries
  └── Mes performances  /performances

ENTRAINEUR :
  ├── Mon equipe        /equipe
  ├── Nageurs           /nageurs
  ├── Sessions          /sessions
  ├── Biometries        /biometries
  └── Performances      /performances

ADMIN :
  ├── Mon equipe        /equipe
  ├── Nageurs           /nageurs
  ├── Sessions          /sessions
  ├── Biometries        /biometries
  ├── Performances      /performances
  └── Administration    /admin
```

## Header

```
Gauche  : Breadcrumb (ex: "Dashboard > Mon profil")
Droite  : Avatar cercle (initiales) + nom + dropdown menu
Dropdown: "Mon profil" | "Se deconnecter"
Height  : 60px
bg      : white / border-bottom: neutral-200
```

## Sidebar

```
bg          : secondary-800
text        : white (opacity 0.7 pour inactif, 1.0 pour actif)
item actif  : bg secondary-900 / bordure gauche 3px primary-500
hover       : bg secondary-900
logo        : blanc / 24px / marge bas 32px
item height : 44px
icones      : 20px / marge droite 12px
```

---

# 13. User Flows par role

## Nageur — Flow principal

```
LOGIN
  │
  ▼
GET /auth/me → role = "nageur", nageur_id = 3
  │
  ▼
REDIRECT → /dashboard/3
  │
  ├── voir ses KPI, chronos, recommandations
  │
  ├── sidebar → "Mes sessions"
  │   └── GET /sessions (filtre auto par nageur_id)
  │       └── clic "+ Nouvelle session" → POST /sessions
  │
  ├── sidebar → "Mes biometries"
  │   └── GET /biometries (filtre auto)
  │       └── clic "+ Saisir" → POST /biometries
  │
  └── sidebar → "Mes performances"
      └── GET /performances (filtre auto)
```

## Entraineur — Flow principal

```
LOGIN
  │
  ▼
GET /auth/me → role = "entraineur"
  │
  ▼
REDIRECT → /equipe
  │
  ├── voir stats equipe, alertes, tableau nageurs
  │
  ├── clic sur un nageur → /dashboard/{nageur_id}
  │   └── voir le dashboard individuel du nageur
  │
  ├── sidebar → "Nageurs"
  │   └── GET /nageurs → liste complete
  │       ├── clic "+ Ajouter nageur" → POST /nageurs
  │       └── clic [edit] → PUT /nageurs/{id}
  │
  ├── sidebar → "Sessions"
  │   └── GET /sessions → toutes les sessions
  │       └── clic "+ Nouvelle" → POST /sessions (choisir nageur)
  │
  └── sidebar → "Biometries"
      └── GET /biometries → toutes les biometries
```

## Admin — Flow principal

```
LOGIN
  │
  ▼
GET /auth/me → role = "admin"
  │
  ▼
Meme flow que entraineur + section admin :
  │
  └── sidebar → "Administration"
      └── liste des utilisateurs
          └── changer les roles via PUT /auth/role/{id}
          └── desactiver des comptes
```

---

# 14. Responsive et Mobile

## Breakpoints

```
Desktop    : >= 1024px   sidebar visible + grille 4 colonnes
Tablette   : 768-1023px  sidebar en overlay (hamburger) + grille 2 colonnes
Mobile     : < 768px     sidebar en overlay + grille 1 colonne + tableaux en cards
```

## Mobile — Dashboard Nageur (cards empilees)

```
┌─────────────────────────┐
│  ☰  SWIM AI    [avatar] │
│─────────────────────────│
│  Bonjour, Lucas         │
│  100m crawl | National  │
│                         │
│  ┌─────────┐ ┌────────┐│
│  │ Dernier │ │Meilleur││
│  │ 58.24s  │ │ 56.80s ││
│  └─────────┘ └────────┘│
│  ┌─────────┐ ┌────────┐│
│  │ Progres │ │Fatigue ││
│  │  -2.4%  │ │ 45/100 ││
│  └─────────┘ └────────┘│
│                         │
│  ┌─────────────────────┐│
│  │ Evolution chronos   ││
│  │ [graphique]         ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │ Recommandations     ││
│  │ ✓ Charge optimale   ││
│  │ ⚠ Sommeil < 7h     ││
│  └─────────────────────┘│
└─────────────────────────┘
```

## Mobile — Tableau → Cards

```
Sur mobile, les tableaux se transforment en cards empilees :

┌─────────────────────────┐
│  Dupont Lucas            │
│  Specialite : 100m crawl │
│  Niveau : National       │
│  ──────────────────────  │
│  [Modifier]   [Voir]    │
└─────────────────────────┘
┌─────────────────────────┐
│  Martin Emma             │
│  Specialite : 200m brasse│
│  Niveau : Regional       │
│  ──────────────────────  │
│  [Modifier]   [Voir]    │
└─────────────────────────┘
```

---

# Recapitulatif des ecrans Figma a creer

```
1.  Login                          → 1 ecran desktop + 1 mobile
2.  Register                       → 1 ecran desktop + 1 mobile
3.  Dashboard Nageur                → 1 desktop + 1 tablette + 1 mobile
4.  Dashboard Equipe (Entraineur)   → 1 desktop + 1 mobile
5.  Liste Nageurs                   → 1 desktop + 1 mobile
6.  Liste Sessions                  → 1 desktop
7.  Liste Biometries                → 1 desktop
8.  Liste Performances              → 1 desktop
9.  Modal Creer Nageur              → 1 ecran
10. Modal Creer Session             → 1 ecran
11. Modal Creer Biometrie           → 1 ecran
12. Modal Creer Performance         → 1 ecran
13. Admin — Gestion roles           → 1 desktop
14. Composants Design System        → 1 page (boutons, badges, inputs, cards)

Total : ~18 ecrans Figma
```
