import requests

BASE = "http://localhost:8000"

# ── 1. Login avec le compte Maxime ──
login = requests.post(f"{BASE}/auth/login", data={
    "username": "maxime.garnier@swimai.fr",
    "password": "MaximeSwim2025"
})
token = login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("✅ Connecté")

# ── 2. Récupérer le nageur_id de Maxime ──
me = requests.get(f"{BASE}/auth/me", headers=headers).json()
nageur_id = me["nageur_id"]
print(f"✅ nageur_id = {nageur_id}")

# ── 3. Sessions (6 par semaine, 8 semaines) ──
sessions_data = [
    {"date": "2025-03-03", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-04", "type_seance": "technique",    "duree_min": 75},
    {"date": "2025-03-05", "type_seance": "sprint",       "duree_min": 60},
    {"date": "2025-03-06", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-07", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-03-08", "type_seance": "endurance",    "duree_min": 100},
    {"date": "2025-03-10", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-11", "type_seance": "technique",    "duree_min": 75},
    {"date": "2025-03-12", "type_seance": "sprint",       "duree_min": 60},
    {"date": "2025-03-13", "type_seance": "endurance",    "duree_min": 95},
    {"date": "2025-03-14", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-03-15", "type_seance": "endurance",    "duree_min": 100},
    {"date": "2025-03-17", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-18", "type_seance": "technique",    "duree_min": 80},
    {"date": "2025-03-19", "type_seance": "sprint",       "duree_min": 60},
    {"date": "2025-03-20", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-21", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-03-22", "type_seance": "endurance",    "duree_min": 105},
    {"date": "2025-03-24", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-25", "type_seance": "technique",    "duree_min": 75},
    {"date": "2025-03-26", "type_seance": "sprint",       "duree_min": 65},
    {"date": "2025-03-27", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-03-28", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-03-29", "type_seance": "endurance",    "duree_min": 100},
    {"date": "2025-03-31", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-04-01", "type_seance": "technique",    "duree_min": 75},
    {"date": "2025-04-02", "type_seance": "sprint",       "duree_min": 60},
    {"date": "2025-04-03", "type_seance": "endurance",    "duree_min": 95},
    {"date": "2025-04-04", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-04-05", "type_seance": "endurance",    "duree_min": 100},
    {"date": "2025-04-07", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-04-08", "type_seance": "technique",    "duree_min": 80},
    {"date": "2025-04-09", "type_seance": "sprint",       "duree_min": 60},
    {"date": "2025-04-10", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-04-11", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-04-12", "type_seance": "endurance",    "duree_min": 110},
    {"date": "2025-04-14", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-04-15", "type_seance": "technique",    "duree_min": 75},
    {"date": "2025-04-16", "type_seance": "sprint",       "duree_min": 60},
    {"date": "2025-04-17", "type_seance": "endurance",    "duree_min": 95},
    {"date": "2025-04-18", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-04-19", "type_seance": "endurance",    "duree_min": 100},
    {"date": "2025-04-22", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-04-23", "type_seance": "technique",    "duree_min": 75},
    {"date": "2025-04-24", "type_seance": "sprint",       "duree_min": 65},
    {"date": "2025-04-25", "type_seance": "endurance",    "duree_min": 90},
    {"date": "2025-04-26", "type_seance": "récupération", "duree_min": 45},
    {"date": "2025-04-27", "type_seance": "endurance",    "duree_min": 105},
]

session_ids = []
for s in sessions_data:
    res = requests.post(f"{BASE}/sessions/", json={**s, "nageur_id": nageur_id}, headers=headers)
    if res.status_code in (200, 201):
        session_ids.append(res.json()["id"])
print(f"✅ {len(session_ids)} sessions créées")

# ── 4. Performances 1500m crawl — progression réaliste ──
chronos = [
    942, 940, 938, 937, 935, 933, 931, 930,  # semaines 1-2 : ~15:42 → amélioration
    928, 926, 925, 924, 922, 920, 919, 918,  # semaines 3-4
    917, 916, 915, 914, 913, 912, 911, 910,  # semaines 5-6 : plateau
    909, 908, 907, 906, 905, 904,            # semaines 7-8 : pic
]

for i, (sid, chrono) in enumerate(zip(session_ids, chronos)):
    dist = 1500
    vitesse = round(dist / chrono, 2)
    requests.post(f"{BASE}/performances/", json={
        "session_id":  sid,
        "distance_m":  dist,
        "temps_s":     chrono,
        "style_nage":  "crawl",
        "vitesse_moy": vitesse,
    }, headers=headers)
print(f"✅ {len(chronos)} performances créées")

# ── 5. Biométries — fatigue modérée, HRV correcte ──
biometries_data = [
    {"date": "2025-03-03", "hrv_ms": 68, "fc_repos": 48, "rpe": 6, "sommeil_h": 7.5},
    {"date": "2025-03-10", "hrv_ms": 65, "fc_repos": 49, "rpe": 7, "sommeil_h": 7.0},
    {"date": "2025-03-17", "hrv_ms": 62, "fc_repos": 50, "rpe": 7, "sommeil_h": 6.5},
    {"date": "2025-03-24", "hrv_ms": 60, "fc_repos": 51, "rpe": 8, "sommeil_h": 6.0},
    {"date": "2025-03-31", "hrv_ms": 58, "fc_repos": 52, "rpe": 8, "sommeil_h": 6.5},
    {"date": "2025-04-07", "hrv_ms": 63, "fc_repos": 50, "rpe": 7, "sommeil_h": 7.0},
    {"date": "2025-04-14", "hrv_ms": 66, "fc_repos": 48, "rpe": 6, "sommeil_h": 7.5},
    {"date": "2025-04-22", "hrv_ms": 70, "fc_repos": 47, "rpe": 5, "sommeil_h": 8.0},
]

for b in biometries_data:
    requests.post(f"{BASE}/biometries/", json={**b, "nageur_id": nageur_id}, headers=headers)
print(f"✅ {len(biometries_data)} biométries créées")

print("\n🏊 Maxime Garnier est prêt pour la démo !")
print(f"   Email    : maxime.garnier@swimai.fr")
print(f"   Password : MaximeSwim2025")
print(f"   nageur_id: {nageur_id}")