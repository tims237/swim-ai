import { useState, useEffect } from "react";
import { getNageurs, getDashboard } from "../api/api";
import type { Nageur, DashboardResponse } from "../types";
import type { Utilisateur } from "../types";
import KpiCard from "../components/KpiCard";
import ChronoChart from "../components/ChronoChart";
import Recommandations from "../components/Recommandations";
import theme from "../theme";

interface DashboardProps {
  utilisateur: Utilisateur;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatDate() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Dashboard({ utilisateur }: DashboardProps) {
  const [nageurs, setNageurs] = useState<Nageur[]>([]);
  const [nageurId, setNageurId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  const estNageur = utilisateur.role === "nageur";

  useEffect(() => {
    if (estNageur && utilisateur.nageur_id) {
      // Nageur → charger directement son propre dashboard, sans select
      chargerDashboard(utilisateur.nageur_id);
    } else {
      // Entraîneur/admin → charger la liste pour le select
      chargerNageurs();
    }
  }, [utilisateur]);

  const chargerNageurs = async () => {
    try {
      const data = await getNageurs();
      setNageurs(data);
    } catch (_) {
      // silencieux
    }
  };

  const chargerDashboard = async (id: number) => {
    setLoading(true);
    setErreur("");
    try {
      const data = await getDashboard(id);
      setDashboard(data);
      setNageurId(id);
    } catch (_) {
      setErreur("Impossible de charger le dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const carte: React.CSSProperties = {
    background: theme.fondCarte,
    padding: "24px",
    borderRadius: "16px",
    border: `1px solid ${theme.bordure}`,
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  };

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      {/* En-tête page */}
      <div style={{ marginBottom: "28px" }}>
        <p
          style={{
            color: theme.texteDoux,
            fontSize: "13px",
            fontWeight: 500,
            margin: "0 0 4px",
            textTransform: "capitalize",
          }}
        >
          {formatDate()}
        </p>
        <h1
          style={{
            fontFamily: theme.policeTitre,
            color: theme.neutral,
            margin: "0 0 4px",
            fontSize: "26px",
            fontWeight: 800,
          }}
        >
          {getGreeting()}
          {estNageur ? `, ${utilisateur.prenom} 👋` : ""}
        </h1>
        <p style={{ color: theme.texteDoux, margin: 0, fontSize: "14px" }}>
          {estNageur
            ? "Vos indicateurs de performance et de récupération"
            : "Sélectionnez un nageur pour voir ses données"}
        </p>
      </div>

      {/* Select nageur — visible uniquement pour les entraîneurs */}
      {!estNageur && (
        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: theme.texteDoux,
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Nageur sélectionné
          </label>
          <select
            value={nageurId ?? ""}
            onChange={(e) =>
              e.target.value && chargerDashboard(Number(e.target.value))
            }
            style={{
              padding: "11px 16px",
              borderRadius: "10px",
              border: `1px solid ${theme.bordure}`,
              fontSize: "14px",
              background: theme.blanc,
              cursor: "pointer",
              minWidth: "280px",
              fontFamily: theme.policeTexte,
              color: theme.texte,
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "40px",
            }}
          >
            <option value="">-- Sélectionner un nageur --</option>
            {nageurs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.prenom} {n.nom}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: theme.texteDoux,
            padding: "20px 0",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              border: `2px solid ${theme.bordure}`,
              borderTopColor: theme.primary,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          Chargement en cours…
        </div>
      )}
      {erreur && (
        <div
          style={{
            padding: "14px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            color: "#dc2626",
            fontSize: "14px",
          }}
        >
          {erreur}
        </div>
      )}

      {dashboard && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* En-tête nageur */}
          <div
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.blanc,
              padding: "22px 28px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontFamily: theme.policeTitre,
                  fontWeight: 700,
                }}
              >
                🏊 {dashboard.nageur.prenom} {dashboard.nageur.nom}
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "13px",
                }}
              >
                {dashboard.nageur.specialite ?? "Spécialité non renseignée"} ·{" "}
                {dashboard.nageur.niveau ?? "Niveau non renseigné"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              {[
                { label: "Sessions", val: dashboard.historique_chronos.length },
                {
                  label: "Recommandations",
                  val: dashboard.recommandations.length,
                },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.75)",
                      marginTop: "3px",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div>
            <h3
              style={{
                marginBottom: "14px",
                color: theme.neutral,
                fontFamily: theme.policeTitre,
                fontSize: "18px",
              }}
            >
              Indicateurs clés
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              <KpiCard
                titre="Dernier chrono"
                valeur={
                  dashboard.kpi.dernier_chrono
                    ? `${dashboard.kpi.dernier_chrono}s`
                    : "—"
                }
                couleur={theme.primary}
              />
              <KpiCard
                titre="Meilleur chrono"
                valeur={
                  dashboard.kpi.meilleur_chrono
                    ? `${dashboard.kpi.meilleur_chrono}s`
                    : "—"
                }
                couleur={theme.succes}
              />
              <KpiCard
                titre="Progression"
                valeur={
                  dashboard.kpi.progression !== null
                    ? `${dashboard.kpi.progression}%`
                    : "—"
                }
                couleur={
                  dashboard.kpi.progression === null
                    ? theme.texteDoux // pas de données → gris neutre
                    : dashboard.kpi.progression < 0
                      ? theme.succes // négatif = plus rapide = bon
                      : theme.warning // positif = plus lent = attention
                }
              />
              <KpiCard
                titre="HRV moyenne"
                valeur={
                  dashboard.kpi.hrv_moyenne
                    ? `${dashboard.kpi.hrv_moyenne} ms`
                    : "—"
                }
                couleur="#8b5cf6"
              />
              <KpiCard
                titre="FC repos"
                valeur={
                  dashboard.kpi.fc_repos ? `${dashboard.kpi.fc_repos} bpm` : "—"
                }
                couleur={theme.danger}
              />
              <KpiCard
                titre="RPE moyen"
                valeur={dashboard.kpi.rpe_moyen ?? "—"}
                couleur={theme.warning}
              />
              <KpiCard
                titre="Sommeil moyen"
                valeur={
                  dashboard.kpi.sommeil_moyen
                    ? `${dashboard.kpi.sommeil_moyen}h`
                    : "—"
                }
                couleur={theme.secondary}
              />
              <KpiCard
                titre="Score fatigue"
                valeur={
                  dashboard.kpi.fatigue !== null
                    ? `${dashboard.kpi.fatigue}/100`
                    : "—"
                }
                couleur={theme.danger}
              />
            </div>
          </div>

          {/* Charge entraînement */}
          <div style={carte}>
            <h3
              style={{
                marginBottom: "16px",
                color: theme.neutral,
                fontFamily: theme.policeTitre,
                fontSize: "18px",
              }}
            >
              Charge d'entraînement
            </h3>
            <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
              {[
                {
                  label: "Charge aiguë (7j)",
                  valeur: dashboard.charge.charge_aigue
                    ? `${dashboard.charge.charge_aigue} min`
                    : "—",
                },
                {
                  label: "Charge chronique (28j)",
                  valeur: dashboard.charge.charge_chronique
                    ? `${dashboard.charge.charge_chronique} min`
                    : "—",
                },
                {
                  label: "ACWR",
                  valeur: dashboard.charge.acwr ?? "—",
                  couleur:
                    (dashboard.charge.acwr ?? 0) > 1.3
                      ? theme.danger
                      : theme.succes,
                },
              ].map(({ label, valeur, couleur }) => (
                <div key={label}>
                  <p
                    style={{
                      color: theme.texteDoux,
                      fontSize: "13px",
                      margin: 0,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: "24px",
                      fontWeight: 700,
                      margin: "4px 0 0",
                      color: couleur ?? theme.neutral,
                    }}
                  >
                    {valeur}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Graphique chronos */}
          {dashboard.historique_chronos.length > 0 && (
            <div style={carte}>
              <h3
                style={{
                  marginBottom: "16px",
                  color: theme.neutral,
                  fontFamily: theme.policeTitre,
                  fontSize: "18px",
                }}
              >
                Évolution des chronos
              </h3>
              <ChronoChart data={dashboard.historique_chronos} />
            </div>
          )}

          <Recommandations recommandations={dashboard.recommandations} />
        </div>
      )}

      {!nageurId && !loading && !estNageur && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 60px",
            color: theme.texteDoux,
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "28px",
            }}
          >
            🏊
          </div>
          <p
            style={{
              fontSize: "17px",
              fontWeight: 600,
              color: theme.neutral,
              margin: "0 0 8px",
            }}
          >
            Aucun nageur sélectionné
          </p>
          <p style={{ fontSize: "14px", margin: 0 }}>
            Choisissez un nageur dans la liste ci-dessus pour afficher son
            tableau de bord
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
