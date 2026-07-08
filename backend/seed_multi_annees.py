#!/usr/bin/env python3
"""
Léa Bernard — 200m brasse — données de 2020 à 2026 (7 saisons)
pour tester le sélecteur de saison du dashboard.
"""
import sys
sys.path.insert(0, '/app')

from datetime import date, timedelta, datetime, timezone
from passlib.context import CryptContext
from app.database import SessionLocal
from app.models import Nageur, Session as SessionModel, Biometrie, Performance, Utilisateur

pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')
db = SessionLocal()

# ── Nageur ──────────────────────────────────────────────────────────
nageur = db.query(Nageur).filter(Nageur.nom == 'Bernard', Nageur.prenom == 'Léa').first()
if not nageur:
    nageur = Nageur(nom='Bernard', prenom='Léa', date_naissance=date(1998, 4, 12),
                    specialite='200m brasse', niveau='Régional')
    db.add(nageur)
    db.flush()
    print(f"Nageur créé : Léa Bernard (id={nageur.id})")
else:
    print(f"Nageur existant : Léa Bernard (id={nageur.id})")

# ── Compte utilisateur ───────────────────────────────────────────────
u = db.query(Utilisateur).filter(Utilisateur.email == 'lea@test.com').first()
if not u:
    u = Utilisateur(email='lea@test.com', mot_de_passe=pwd.hash('password123'),
                    nom='Bernard', prenom='Léa', nageur_id=nageur.id, role='nageur',
                    actif=True, consentement_donnees_sante=True,
                    date_consentement=datetime.now(timezone.utc))
    db.add(u)
    db.flush()
    print("Compte lea@test.com créé")
else:
    u.mot_de_passe = pwd.hash('password123')
    u.nageur_id = nageur.id

# ── Purge ────────────────────────────────────────────────────────────
for s in db.query(SessionModel).filter(SessionModel.nageur_id == nageur.id).all():
    db.query(Performance).filter(Performance.session_id == s.id).delete()
db.query(SessionModel).filter(SessionModel.nageur_id == nageur.id).delete()
db.query(Biometrie).filter(Biometrie.nageur_id == nageur.id).delete()
db.flush()

# ── Sessions + chronos 2020→2026 ─────────────────────────────────────
# Chronos 200m brasse : progression de 168s (débutante 2020) → 132s (confirmée 2026)
# 2 sessions par mois : 1 endurance/technique, 1 sprint avec chrono
MOIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
TYPES = ['endurance', 'technique', 'récupération', 'endurance']

# Chrono de départ et progression annuelle
chronos_par_an = {
    2020: [168.5, 167.2, 166.0, 164.8, 163.5, 162.3, 161.0, 159.8, 158.5, 157.3, 156.0, 154.8],
    2021: [153.5, 152.2, 151.0, 149.8, 148.5, 147.3, 146.0, 144.8, 143.5, 142.3, 141.0, 139.8],
    2022: [138.5, 137.3, 136.2, 135.1, 134.0, 132.9, 131.8, 130.8, 149.5, 148.2, 147.0, 145.8],  # blessure été → reprise
    2023: [144.5, 143.2, 142.0, 140.8, 139.5, 138.3, 137.0, 135.8, 134.5, 133.3, 132.0, 130.8],
    2024: [149.5, 148.2, 147.0, 145.8, 144.5, 143.3, 142.0, 140.8, 139.5, 138.3, 137.0, 135.8],  # repart de plus loin (changement coach)
    2025: [134.5, 133.2, 132.0, 140.8, 139.5, 138.3, 137.0, 135.8, 134.5, 133.3, 132.0, 130.8],  # rechute courte en avril
    2026: [136.5, 135.8, 135.0, 134.2, 133.5, 132.7, 132.0, None],  # en cours (jusqu'à juillet)
}

import random
random.seed(42)

for annee, chronos in chronos_par_an.items():
    for idx, mois in enumerate(MOIS):
        if idx >= len(chronos):
            break
        chrono = chronos[idx]
        if chrono is None:
            continue

        # Session endurance milieu de mois
        type_s = TYPES[idx % len(TYPES)]
        jour1 = min(8 + random.randint(0, 4), 28)
        s1 = SessionModel(nageur_id=nageur.id, date=date(annee, mois, jour1),
                          type_seance=type_s, duree_min=85 + random.randint(-10, 10))
        db.add(s1)
        db.flush()

        # Session sprint avec chrono en fin de mois
        jour2 = min(20 + random.randint(0, 5), 28)
        s2 = SessionModel(nageur_id=nageur.id, date=date(annee, mois, jour2),
                          type_seance='sprint', duree_min=75 + random.randint(-5, 10))
        db.add(s2)
        db.flush()

        # Chrono avec légère variation aléatoire
        temps = round(chrono + random.uniform(-0.3, 0.3), 2)
        vitesse = round(200 / temps, 3)
        db.add(Performance(session_id=s2.id, distance_m=200, temps_s=temps,
                           style_nage='brasse', vitesse_moy=vitesse))

# ── Biométries 28 derniers jours ────────────────────────────────────
today = date.today()
for i in range(28, 0, -1):
    db.add(Biometrie(nageur_id=nageur.id, date=today - timedelta(days=i),
                     hrv_ms=round(68 + i * 0.05, 1), fc_repos=60, rpe=5, sommeil_h=7.5))

db.commit()
db.close()

# Compte le nombre de sessions et chronos créés
total_mois = sum(len([c for c in ch if c is not None]) for ch in chronos_par_an.values())
print()
print("✅ Léa Bernard — 7 saisons de données (2020 → 2026)")
print(f"   {total_mois * 2} sessions créées | {total_mois} chronos 200m brasse")
print("   Email : lea@test.com  |  Mot de passe : password123")
print()
print("   Saisons disponibles dans le sélecteur :")
for a in sorted(chronos_par_an.keys()):
    chronos_valides = [c for c in chronos_par_an[a] if c is not None]
    print(f"   • Saison {a} — {len(chronos_valides)} chronos")
