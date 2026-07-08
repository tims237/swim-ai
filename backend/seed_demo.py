#!/usr/bin/env python3
"""
Seed de démonstration — Swim AI
Génère 5 nageurs avec des profils contrastés pour la soutenance.
Exécuter : docker exec swim_ai_backend python seed_demo.py
"""

import sys, os
sys.path.insert(0, '/app')

from datetime import date, timedelta, datetime, timezone
from passlib.context import CryptContext
from sqlalchemy.orm import Session as OrmSession

from app.database import SessionLocal
from app.models import Nageur, Session as SessionModel, Biometrie, Performance, Utilisateur

pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')
db: OrmSession = SessionLocal()
today = date.today()

# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

def j(n: int) -> date:
    """Retourne la date d'il y a n jours."""
    return today - timedelta(days=n)

def upsert_nageur(nom, prenom, naissance, specialite, niveau) -> Nageur:
    n = db.query(Nageur).filter(Nageur.nom == nom, Nageur.prenom == prenom).first()
    if n:
        n.date_naissance = naissance
        n.specialite     = specialite
        n.niveau         = niveau
    else:
        n = Nageur(nom=nom, prenom=prenom, date_naissance=naissance,
                   specialite=specialite, niveau=niveau)
        db.add(n)
    db.flush()
    return n

def upsert_utilisateur(email, nom, prenom, nageur_id, role='nageur') -> Utilisateur:
    u = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if u:
        u.nom       = nom
        u.prenom    = prenom
        u.nageur_id = nageur_id
        u.role      = role
        u.mot_de_passe = pwd.hash('password123')
        u.consentement_donnees_sante = True
    else:
        u = Utilisateur(
            email=email, mot_de_passe=pwd.hash('password123'),
            nom=nom, prenom=prenom, nageur_id=nageur_id, role=role,
            actif=True, consentement_donnees_sante=True,
            date_consentement=datetime.now(timezone.utc),
        )
        db.add(u)
    db.flush()
    return u

def purger(nageur_id: int):
    """Supprime sessions/biométries/performances existantes pour ce nageur."""
    for s in db.query(SessionModel).filter(SessionModel.nageur_id == nageur_id).all():
        db.query(Performance).filter(Performance.session_id == s.id).delete()
    db.query(SessionModel).filter(SessionModel.nageur_id == nageur_id).delete()
    db.query(Biometrie).filter(Biometrie.nageur_id == nageur_id).delete()
    db.flush()

def ajouter_session(nageur_id, date_s, type_s, duree) -> SessionModel:
    s = SessionModel(nageur_id=nageur_id, date=date_s, type_seance=type_s, duree_min=duree)
    db.add(s)
    db.flush()
    return s

def ajouter_perf(session_id, distance, temps, style):
    vitesse = round(distance / temps, 3)
    p = Performance(session_id=session_id, distance_m=distance,
                    temps_s=round(temps, 2), style_nage=style, vitesse_moy=vitesse)
    db.add(p)

def ajouter_bio(nageur_id, date_b, hrv, fc, rpe, sommeil):
    b = Biometrie(nageur_id=nageur_id, date=date_b,
                  hrv_ms=hrv, fc_repos=fc, rpe=rpe, sommeil_h=sommeil)
    db.add(b)


# ─────────────────────────────────────────────────────────────────────
# 1. SOPHIE LEFEBVRE — Élite nationale, 100m dos
#    Profil : ACWR optimal (1.1), HRV bonne, en progression constante
#    charge_7j=385 / charge_28j=1400  →  ACWR = 4×385/1400 = 1.10
# ─────────────────────────────────────────────────────────────────────
print("→ Sophie Lefebvre...")
sophie = upsert_nageur('Lefebvre', 'Sophie', date(2001, 3, 15), '100m dos', 'Élite nationale')
upsert_utilisateur('sophie@test.com', 'Lefebvre', 'Sophie', sophie.id)
purger(sophie.id)

# Sessions semaine courante (charge_7j = 385)
sessions_sophie_recentes = [
    (j(7), 'endurance',    90),
    (j(5), 'technique',    75),
    (j(4), 'sprint',       80),
    (j(2), 'endurance',    85),
    (j(1), 'récupération', 55),
]
# Sessions semaines précédentes (charge_28j - 385 = 1015)
sessions_sophie_hist = [
    (j(28), 'endurance',    90), (j(26), 'technique',    80),
    (j(25), 'sprint',       95), (j(23), 'endurance',    85),
    (j(22), 'récupération', 60), (j(20), 'sprint',       95),
    (j(18), 'endurance',    90), (j(16), 'technique',    85),
    (j(14), 'sprint',       90), (j(12), 'endurance',    85),
    (j(10), 'récupération', 60), (j( 8), 'endurance',    80),
]

chronos_sophie = [68.8, 68.4, 67.9, 67.5, 67.1, 66.8, 66.5, 66.3]
perf_idx = 0
for i, (d, t, dur) in enumerate(sessions_sophie_hist + sessions_sophie_recentes):
    s = ajouter_session(sophie.id, d, t, dur)
    if t == 'sprint' and perf_idx < len(chronos_sophie):
        ajouter_perf(s.id, 100, chronos_sophie[perf_idx], 'dos')
        perf_idx += 1

# Biométries (25 jours)
for i in range(25, 0, -1):
    ajouter_bio(sophie.id, j(i),
                hrv=round(72 + i * 0.1, 1),   # HRV en amélioration
                fc=57, rpe=5,
                sommeil=round(7.8 + (25 - i) * 0.01, 1))


# ─────────────────────────────────────────────────────────────────────
# 2. JULES MARTIN — Confirmé, 100m crawl
#    Profil : ACWR surcharge (1.6), fatigue élevée, régression chronos
#    charge_7j=560 / charge_28j=1400  →  ACWR = 4×560/1400 = 1.60
# ─────────────────────────────────────────────────────────────────────
print("→ Jules Martin...")
jules = upsert_nageur('Martin', 'Jules', date(2000, 11, 22), '100m crawl', 'Confirmé')
upsert_utilisateur('jules@test.com', 'Martin', 'Jules', jules.id)
purger(jules.id)

# Semaine courante : 7 sessions intenses (surcharge)
sessions_jules_recentes = [
    (j(7), 'sprint',    80), (j(6), 'endurance', 80),
    (j(5), 'sprint',    80), (j(4), 'endurance', 80),
    (j(3), 'sprint',    80), (j(2), 'endurance', 80),
    (j(1), 'sprint',    80),
]
# Semaines précédentes : charge modérée (840min)
sessions_jules_hist = [
    (j(28), 'endurance', 90), (j(26), 'sprint',    85),
    (j(24), 'technique', 80), (j(22), 'endurance', 90),
    (j(20), 'sprint',    80), (j(18), 'endurance', 85),
    (j(16), 'technique', 75), (j(14), 'sprint',    85),
    (j(12), 'endurance', 75), (j( 9), 'sprint',    80),
]

chronos_jules = [55.2, 54.8, 54.5, 54.3, 54.0, 54.2, 54.6, 55.0, 55.4, 55.8]
perf_idx = 0
for d, t, dur in sessions_jules_hist + sessions_jules_recentes:
    s = ajouter_session(jules.id, d, t, dur)
    if t == 'sprint' and perf_idx < len(chronos_jules):
        ajouter_perf(s.id, 100, chronos_jules[perf_idx], 'crawl')
        perf_idx += 1

# Biométries : HRV faible, RPE élevé, sommeil court
for i in range(25, 0, -1):
    ajouter_bio(jules.id, j(i),
                hrv=round(45 - max(0, 7 - i) * 1.5, 1),  # HRV qui chute sur la dernière semaine
                fc=68, rpe=min(10, 7 + max(0, 7 - i)),
                sommeil=round(6.2 - max(0, 7 - i) * 0.1, 1))


# ─────────────────────────────────────────────────────────────────────
# 3. LUCAS MOREL — Intermédiaire, 200m papillon
#    Profil : ACWR sous-charge (0.6), en récupération post-blessure
#    charge_7j=120 / charge_28j=800  →  ACWR = 4×120/800 = 0.60
# ─────────────────────────────────────────────────────────────────────
print("→ Lucas Morel...")
lucas = upsert_nageur('Morel', 'Lucas', date(2003, 7, 8), '200m papillon', 'Intermédiaire')
upsert_utilisateur('lucas@test.com', 'Morel', 'Lucas', lucas.id)
purger(lucas.id)

# Semaine courante : 2 sessions légères (récupération)
sessions_lucas_recentes = [
    (j(6), 'récupération', 60),
    (j(3), 'technique',    60),
]
# Semaines précédentes : reprise progressive après blessure
sessions_lucas_hist = [
    (j(28), 'récupération', 45), (j(25), 'récupération', 50),
    (j(22), 'technique',    60), (j(19), 'récupération', 55),
    (j(17), 'technique',    70), (j(15), 'récupération', 60),
    (j(13), 'endurance',    75), (j(11), 'technique',    65),
    (j( 9), 'endurance',    80), (j( 8), 'technique',    60),
]

chronos_lucas = [151.2, 149.8, 148.5, 147.6]
perf_idx = 0
for d, t, dur in sessions_lucas_hist + sessions_lucas_recentes:
    s = ajouter_session(lucas.id, d, t, dur)
    if t == 'technique' and perf_idx < len(chronos_lucas):
        ajouter_perf(s.id, 200, chronos_lucas[perf_idx], 'papillon')
        perf_idx += 1

# Biométries : HRV excellente, RPE faible, bon sommeil
for i in range(25, 0, -1):
    ajouter_bio(lucas.id, j(i),
                hrv=round(88 + i * 0.05, 1),
                fc=52, rpe=3,
                sommeil=round(8.4 + (25 - i) * 0.02, 1))


# ─────────────────────────────────────────────────────────────────────
# 4. CAMILLE ROUSSEAU — Élite nationale, 400m nage libre
#    Profil : ACWR optimal (1.05), en grande forme, meilleure progression
#    charge_7j=420 / charge_28j=1600  →  ACWR = 4×420/1600 = 1.05
# ─────────────────────────────────────────────────────────────────────
print("→ Camille Rousseau...")
camille = upsert_nageur('Rousseau', 'Camille', date(1999, 5, 20), '400m nage libre', 'Élite nationale')
upsert_utilisateur('camille@test.com', 'Rousseau', 'Camille', camille.id)
purger(camille.id)

sessions_camille_recentes = [
    (j(7), 'endurance', 90),
    (j(5), 'technique', 80),
    (j(4), 'sprint',    85),
    (j(2), 'endurance', 90),
    (j(1), 'technique', 75),
]
sessions_camille_hist = [
    (j(28), 'endurance', 100), (j(26), 'technique',    90),
    (j(25), 'sprint',    100), (j(23), 'endurance',    95),
    (j(21), 'récupération', 65), (j(19), 'sprint',     100),
    (j(17), 'endurance', 100), (j(15), 'technique',    90),
    (j(13), 'sprint',     90), (j(11), 'endurance',    95),
    (j( 9), 'récupération', 65), (j( 8), 'sprint',     90),
    (j( 8), 'endurance', 100),
]

chronos_camille = [268.4, 266.2, 264.8, 263.1, 261.5, 259.8, 258.2, 256.7]
perf_idx = 0
for d, t, dur in sessions_camille_hist + sessions_camille_recentes:
    s = ajouter_session(camille.id, d, t, dur)
    if t == 'sprint' and perf_idx < len(chronos_camille):
        ajouter_perf(s.id, 400, chronos_camille[perf_idx], 'crawl')
        perf_idx += 1

# Biométries : HRV excellente, RPE modéré, excellent sommeil
for i in range(25, 0, -1):
    ajouter_bio(camille.id, j(i),
                hrv=round(91 + i * 0.04, 1),
                fc=54, rpe=4,
                sommeil=round(8.6 - (25 - i) * 0.01, 1))


# ─────────────────────────────────────────────────────────────────────
# 5. THOMAS PETIT — Débutant, 50m crawl sprint
#    Profil : ACWR légèrement élevé (1.35), amélioration rapide débutant
#    charge_7j=270 / charge_28j=800  →  ACWR = 4×270/800 = 1.35
# ─────────────────────────────────────────────────────────────────────
print("→ Thomas Petit...")
thomas = upsert_nageur('Petit', 'Thomas', date(2005, 1, 30), '50m sprint crawl', 'Débutant')
upsert_utilisateur('thomas@test.com', 'Petit', 'Thomas', thomas.id)
purger(thomas.id)

sessions_thomas_recentes = [
    (j(6), 'sprint',    90),
    (j(4), 'endurance', 90),
    (j(2), 'sprint',    90),
]
sessions_thomas_hist = [
    (j(28), 'endurance', 60), (j(26), 'technique', 55),
    (j(24), 'sprint',    65), (j(22), 'endurance', 60),
    (j(19), 'sprint',    70), (j(17), 'technique', 60),
    (j(14), 'sprint',    70), (j(12), 'endurance', 65),
    (j( 9), 'sprint',    75),
]

chronos_thomas = [31.2, 30.8, 30.5, 30.1, 29.8, 29.5, 29.3, 29.1]
perf_idx = 0
for d, t, dur in sessions_thomas_hist + sessions_thomas_recentes:
    s = ajouter_session(thomas.id, d, t, dur)
    if t == 'sprint' and perf_idx < len(chronos_thomas):
        ajouter_perf(s.id, 50, chronos_thomas[perf_idx], 'crawl')
        perf_idx += 1

# Biométries : HRV moyenne, RPE assez élevé, sommeil moyen (débutant qui force)
for i in range(25, 0, -1):
    ajouter_bio(thomas.id, j(i),
                hrv=round(62 - max(0, 6 - i) * 0.8, 1),
                fc=65, rpe=7,
                sommeil=round(6.8 - max(0, 6 - i) * 0.1, 1))


# ─────────────────────────────────────────────────────────────────────
# Mise à jour du compte entraineur (marc)
# ─────────────────────────────────────────────────────────────────────
print("→ Marc Dubois (entraineur)...")
marc = db.query(Utilisateur).filter(Utilisateur.email == 'marc@test.com').first()
if marc:
    marc.mot_de_passe = pwd.hash('password123')
    marc.consentement_donnees_sante = True

db.commit()
db.close()

print()
print("✅ Seed terminé avec succès !")
print()
print("Comptes créés (mot de passe : password123)")
print("  sophie@test.com    → nageur  — 100m dos        — ACWR 1.10 (optimal)")
print("  jules@test.com     → nageur  — 100m crawl      — ACWR 1.60 (surcharge)")
print("  lucas@test.com     → nageur  — 200m papillon   — ACWR 0.60 (sous-charge)")
print("  camille@test.com   → nageur  — 400m nage libre — ACWR 1.05 (optimal)")
print("  thomas@test.com    → nageur  — 50m sprint      — ACWR 1.35 (vigilance)")
print("  marc@test.com      → entraineur (accès équipe complète)")
