import { useState, useEffect } from "react";
import { getNageurs, getDashboard } from "../api/api";
import type { Nageur, DashboardResponse } from "../types";
import Spinner from "../components/Spinner";
import theme from "../theme";

function Entraineur() {
  const [nageurs, setNageurs] = useState<Nageur[]>([]);
  const [dashboards, setDashboards] = useState<
    Record<number, DashboardResponse | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [nageurSelectionne, setNageurSelectionne] = useState<number | null>(
    null,
  );

  useEffect(() => {
    void chargerTout();
  }, []);

  const chargerTout = async () => {
    setLoading(true);
    try {
      const liste = await getNageurs();
      setNageurs(liste);
      const resultats: Record<number, DashboardResponse | null> = {};
      await Promise.all(
        liste.map(async (n) => {
          try {
            resultats[n.id] = await getDashboard(n.id);
          } catch (_) {
            resultats[n.id] = null;
          }
        }),
      );
      setDashboards(resultats);
    } catch (_) {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  const exporterCSV = () => {
    const lignes = [
      [
        "Nom",
        "Prénom",
        "Spécialité",
        "Niveau",
        "Dernier chrono",
        "Meilleur chrono",
        "Progression (%)",
        "Fatigue",
        "ACWR",
      ],
    ];
    nageurs.forEach((n) => {
      const d = dashboards[n.id];
      lignes.push([
        n.nom,
        n.prenom,
        n.specialite ?? "",
        n.niveau ?? "",
        String(d?.kpi?.dernier_chrono ?? ""),
        String(d?.kpi?.meilleur_chrono ?? ""),
        String(d?.kpi?.progression ?? ""),
        String(d?.kpi?.fatigue ?? ""),
        String(d?.charge?.acwr ?? ""),
      ]);
    });
    const csv = lignes.map((l) => l.join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `rapport_equipe_${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };

  const couleurAcwr = (v: number | null | undefined) => {
    if (v == null) return theme.texteDoux;
    if (v > 1.5) return theme.danger;
    if (v > 1.3) return theme.warning;
    if (v < 0.8) return theme.primary;
    return theme.succes;
  };

  const couleurFatigue = (v: number | null | undefined) => {
    if (v == null) return theme.texteDoux;
    if (v >= 70) return theme.danger;
    if (v >= 50) return theme.warning;
    return theme.succes;
  };

  // On compte sur TOUS les nageurs, pas seulement ceux dont le dashboard a réussi.
  // Un nageur sans dashboard est compté comme "inconnu" (ni en forme ni surmenage).
  const enForme = nageurs.filter((n) => {
    const f = dashboards[n.id]?.kpi?.fatigue;
    return f != null && f < 50;
  }).length;
  const vigilance = nageurs.filter((n) => {
    const f = dashboards[n.id]?.kpi?.fatigue;
    return f != null && f >= 50 && f < 70;
  }).length;
  const surmenage = nageurs.filter((n) => {
    const f = dashboards[n.id]?.kpi?.fatigue;
    return f != null && f >= 70;
  }).length;

  const carte: React.CSSProperties = {
    background: theme.fondCarte,
    borderRadius: "16px",
    border: `1px solid ${theme.bordure}`,
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  };

  const StatCard = ({
    titre,
    valeur,
    sousTitre,
    couleur,
  }: {
    titre: string;
    valeur: number;
    sousTitre: string;
    couleur: string;
  }) => (
    <div
      style={{
        ...carte,
        padding: "20px",
        borderLeft: `4px solid ${couleur}`,
        flex: 1,
        minWidth: "160px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: theme.texteDoux,
          fontWeight: 600,
        }}
      >
        {titre}
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: "30px",
          fontWeight: 800,
          color: couleur,
          fontFamily: theme.policeTitre,
        }}
      >
        {valeur}
      </p>
      <p
        style={{ margin: "4px 0 0", fontSize: "12px", color: theme.texteDoux }}
      >
        {sousTitre}
      </p>
    </div>
  );

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <h1
          style={{
            fontFamily: theme.policeTitre,
            color: theme.neutral,
            margin: 0,
            fontSize: "28px",
            fontWeight: 800,
          }}
        >
          Vue Entraîneur
        </h1>
        <button
          onClick={exporterCSV}
          disabled={nageurs.length === 0}
          style={{
            padding: "11px 20px",
            background: theme.neutral,
            color: theme.blanc,
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          📥 Exporter CSV
        </button>
      </div>
      <p
        style={{
          color: theme.texteDoux,
          marginBottom: "24px",
          fontSize: "15px",
        }}
      >
        Pilotage collectif et décisions coach
      </p>

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
          <Spinner size="small" color="primary" />
          Chargement des données équipe...
        </div>
      )}

      {!loading && (
        <>
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <StatCard
              titre="Nageurs suivis"
              valeur={nageurs.length}
              sousTitre="dans l'équipe"
              couleur={theme.primary}
            />
            <StatCard
              titre="En forme"
              valeur={enForme}
              sousTitre="fatigue < 50"
              couleur={theme.succes}
            />
            <StatCard
              titre="Vigilance"
              valeur={vigilance}
              sousTitre="fatigue 50–70"
              couleur={theme.warning}
            />
            <StatCard
              titre="Surmenage"
              valeur={surmenage}
              sousTitre="fatigue ≥ 70"
              couleur={theme.danger}
            />
          </div>

          {nageurs.length === 0 ? (
            <p style={{ color: theme.texteDoux }}>Aucun nageur enregistré.</p>
          ) : (
            <div style={{ ...carte, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: theme.tertiary }}>
                  <tr>
                    {[
                      "Nageur",
                      "Spécialité",
                      "Dernier chrono",
                      "Progression",
                      "Fatigue",
                      "ACWR",
                      "Recommandation",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "14px 16px",
                          textAlign: "left",
                          fontSize: "12px",
                          color: theme.texteDoux,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nageurs.map((n) => {
                    const d = dashboards[n.id];
                    return (
                      <tr
                        key={n.id}
                        onClick={() =>
                          setNageurSelectionne(
                            nageurSelectionne === n.id ? null : n.id,
                          )
                        }
                        style={{
                          borderTop: `1px solid ${theme.bordure}`,
                          cursor: "pointer",
                          background:
                            nageurSelectionne === n.id
                              ? theme.tertiary
                              : theme.blanc,
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "14px",
                            fontWeight: 700,
                            color: theme.neutral,
                          }}
                        >
                          {n.prenom} {n.nom}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "14px",
                            color: theme.texte,
                          }}
                        >
                          {n.specialite ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "14px",
                            color: theme.texte,
                          }}
                        >
                          {d?.kpi?.dernier_chrono
                            ? `${d.kpi.dernier_chrono}s`
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "14px",
                            color: theme.texte,
                          }}
                        >
                          {d?.kpi?.progression != null
                            ? `${d.kpi.progression}%`
                            : "—"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background:
                                couleurFatigue(d?.kpi?.fatigue) + "20",
                              color: couleurFatigue(d?.kpi?.fatigue),
                            }}
                          >
                            {d?.kpi?.fatigue != null
                              ? `${d.kpi.fatigue}/100`
                              : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: couleurAcwr(d?.charge?.acwr) + "20",
                              color: couleurAcwr(d?.charge?.acwr),
                            }}
                          >
                            {d?.charge?.acwr ?? "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "13px",
                            color: theme.texteDoux,
                          }}
                        >
                          {d?.recommandations?.[0] ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {nageurSelectionne && dashboards[nageurSelectionne] && (
            <div style={{ ...carte, marginTop: "24px", padding: "24px" }}>
              <h3
                style={{
                  marginBottom: "16px",
                  color: theme.neutral,
                  fontFamily: theme.policeTitre,
                  fontSize: "18px",
                }}
              >
                💡 Recommandations —{" "}
                {nageurs.find((n) => n.id === nageurSelectionne)?.prenom}{" "}
                {nageurs.find((n) => n.id === nageurSelectionne)?.nom}
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {dashboards[nageurSelectionne]!.recommandations.map(
                  (rec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: theme.tertiary,
                        border: `1px solid ${theme.bordure}`,
                        fontSize: "14px",
                        color: theme.texte,
                      }}
                    >
                      {rec}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Entraineur;
