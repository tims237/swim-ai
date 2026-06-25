// seed.js
// ─────────────────────────────────────────────────────────────
// Script de "semis" (seed) : remplit la base Swim AI avec des
// données réalistes via l'API FastAPI (comme le fait le front).
//
// Lancement :  node seed.js
//
// Pré-requis : le backend doit tourner (docker compose up) et
// le compte coach@swimai.com / test1234 doit exister.
// ─────────────────────────────────────────────────────────────

import axios from "axios";

const API = "http://localhost:8000";
const EMAIL = "coach@swimai.com";
const PASSWORD = "test1234";

// ── Petits utilitaires pour générer des valeurs réalistes ──────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const round = (v, d = 2) => Number(v.toFixed(d));
const choice = (arr) => arr[randInt(0, arr.length - 1)];

// Date au format YYYY-MM-DD, il y a "joursAvant" jours
const dateIlYaJours = (joursAvant) => {
  const d = new Date();
  d.setDate(d.getDate() - joursAvant);
  return d.toISOString().slice(0, 10);
};

// ── Les 7 nageurs (noms français, spécialités/niveaux réalistes) ─
const NAGEURS = [
  { nom: "Dupont",   prenom: "Lucas",   date_naissance: "2002-03-15", specialite: "100m crawl",    niveau: "national" },
  { nom: "Martin",   prenom: "Emma",    date_naissance: "2004-07-22", specialite: "200m brasse",   niveau: "régional" },
  { nom: "Bernard",  prenom: "Hugo",    date_naissance: "2001-11-08", specialite: "50m papillon",  niveau: "national" },
  { nom: "Petit",    prenom: "Léa",     date_naissance: "2003-01-30", specialite: "400m nage libre", niveau: "régional" },
  { nom: "Moreau",   prenom: "Nathan",  date_naissance: "2000-09-12", specialite: "200m dos",      niveau: "national" },
  { nom: "Laurent",  prenom: "Chloé",   date_naissance: "2005-05-03", specialite: "100m papillon", niveau: "départemental" },
  { nom: "Garnier",  prenom: "Maxime",  date_naissance: "2002-12-19", specialite: "1500m nage libre", niveau: "national" },
];

// Types de séances et styles de nage possibles
const TYPES_SEANCE = ["endurance", "sprint", "technique", "récupération"];
const STYLES = ["crawl", "dos", "brasse", "papillon"];
const DISTANCES = [50, 100, 200, 400];

// Vitesse moyenne réaliste (m/s) selon le style — sert à calculer le temps
const VITESSE_PAR_STYLE = {
  crawl: 1.7,      // le plus rapide
  papillon: 1.55,
  dos: 1.45,
  brasse: 1.25,    // le plus lent
};

// ── Création d'une biométrie réaliste pour une date donnée ─────
// Les plages respectent la physiologie d'un nageur entraîné.
function biometrieRealiste(nageurId, date) {
  return {
    nageur_id: nageurId,
    date: date,
    hrv_ms: round(rand(45, 85), 1),   // variabilité cardiaque (haut = bien récupéré)
    fc_repos: randInt(45, 60),         // fréquence cardiaque repos (bas = bien entraîné)
    rpe: randInt(4, 9),                // effort perçu 1-10
    sommeil_h: round(rand(6.5, 9), 1), // heures de sommeil
  };
}

// ── Création d'une performance réaliste pour une session ───────
function performanceRealiste(sessionId) {
  const style = choice(STYLES);
  const distance = choice(DISTANCES);
  const vitesseBase = VITESSE_PAR_STYLE[style];
  // On ajoute une petite variation individuelle (±8%)
  const vitesse = round(vitesseBase * rand(0.92, 1.08), 2);
  const temps = round(distance / vitesse, 2); // temps = distance / vitesse
  return {
    session_id: sessionId,
    distance_m: distance,
    temps_s: temps,
    style_nage: style,
    vitesse_moy: vitesse,
  };
}

// ── Programme principal ────────────────────────────────────────
async function main() {
  console.log("🏊 Swim AI — Script de remplissage de la base\n");

  // 1) Connexion → récupération du token
  console.log("→ Connexion en tant que coach...");
  const params = new URLSearchParams();
  params.append("username", EMAIL);
  params.append("password", PASSWORD);

  let token;
  try {
    const res = await axios.post(`${API}/auth/login`, params);
    token = res.data.access_token;
    console.log("  ✅ Connecté, token reçu.\n");
  } catch (e) {
    console.error("  ❌ Échec de connexion. Le backend tourne-t-il ? Le compte existe-t-il ?");
    console.error("     Détail :", e.response?.data?.detail || e.message);
    process.exit(1);
  }

  // Axios avec le token ajouté automatiquement
  const api = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  let totalSessions = 0;
  let totalBiometries = 0;
  let totalPerformances = 0;

  // 2) Pour chaque nageur : créer le nageur, ses sessions, biométries, performances
  for (const n of NAGEURS) {
    let nageurId;
    try {
      const res = await api.post("/nageurs/", n);
      nageurId = res.data.id;
      console.log(`→ Nageur créé : ${n.prenom} ${n.nom} (id ${nageurId})`);
    } catch (e) {
      // Si le nageur existe déjà (doublon), on le saute proprement
      const detail = e.response?.data?.detail || e.message;
      console.log(`  ⚠️  ${n.prenom} ${n.nom} non créé (${detail}) — on continue.`);
      continue;
    }

    // ── Sessions : une toutes les ~3 jours sur les 30 derniers jours ──
    const nbSessions = randInt(6, 9);
    for (let i = 0; i < nbSessions; i++) {
      const date = dateIlYaJours(i * 3 + randInt(0, 2));
      let sessionId;
      try {
        const res = await api.post("/sessions/", {
          nageur_id: nageurId,
          date: date,
          type_seance: choice(TYPES_SEANCE),
          duree_min: randInt(45, 120),
        });
        sessionId = res.data.id;
        totalSessions++;
      } catch (e) {
        console.log(`    ⚠️ session non créée : ${e.response?.data?.detail || e.message}`);
        continue;
      }

      // ── Performances : 1 à 3 par session ──
      const nbPerf = randInt(1, 3);
      for (let p = 0; p < nbPerf; p++) {
        try {
          await api.post("/performances/", performanceRealiste(sessionId));
          totalPerformances++;
        } catch (e) {
          console.log(`      ⚠️ perf non créée : ${e.response?.data?.detail || e.message}`);
        }
      }

      // ── Biométrie du jour de la séance ──
      try {
        await api.post("/biometries/", biometrieRealiste(nageurId, date));
        totalBiometries++;
      } catch (e) {
        console.log(`    ⚠️ biométrie non créée : ${e.response?.data?.detail || e.message}`);
      }
    }
  }

  console.log("\n─────────────────────────────────────");
  console.log("✅ Terminé !");
  console.log(`   Sessions créées      : ${totalSessions}`);
  console.log(`   Biométries créées    : ${totalBiometries}`);
  console.log(`   Performances créées  : ${totalPerformances}`);
  console.log("─────────────────────────────────────");
  console.log("Recharge ton appli (http://localhost:3000) pour voir les données 🏊");
}

main();