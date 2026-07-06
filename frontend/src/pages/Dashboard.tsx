import { useState, useEffect, useRef } from "react";
import { getNageurs, getDashboard } from "../api/api";
import type { Nageur, DashboardResponse } from "../types";
import type { Utilisateur } from "../types";
import KpiCard from "../components/KpiCard";
import ChronoChart from "../components/ChronoChart";
import Recommandations from "../components/Recommandations";
import { DownloadIcon } from "../components/Icons";
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

function couleurFatigue(v: number | null | undefined) {
  if (v == null) return theme.texteDoux;
  if (v >= 70) return theme.danger;
  if (v >= 50) return theme.warning;
  return theme.succes;
}

function couleurAcwr(v: number | null | undefined) {
  if (v == null) return theme.texteDoux;
  if (v > 1.5) return theme.danger;
  if (v > 1.3) return theme.warning;
  if (v < 0.8) return theme.primary;
  return theme.succes;
}

function StatCard({
  titre,
  valeur,
  sousTitre,
  couleur,
}: {
  titre: string;
  valeur: number;
  sousTitre: string;
  couleur: string;
}) {
  return (
    <div
      style={{
        background: theme.fondCarte,
        borderRadius: "14px",
        border: `1px solid ${theme.bordure}`,
        boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        padding: "18px 20px",
        borderLeft: `4px solid ${couleur}`,
        flex: 1,
        minWidth: "140px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "12px",
          color: theme.texteDoux,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {titre}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "28px",
          fontWeight: 800,
          color: couleur,
          fontFamily: theme.policeTitre,
          lineHeight: 1,
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
}

function DashboardDetail({ dashboard }: { dashboard: DashboardResponse }) {
  const carte: React.CSSProperties = {
    background: theme.fondCarte,
    padding: "24px",
    borderRadius: "16px",
    border: `1px solid ${theme.bordure}`,
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            { label: "Recommandations", val: dashboard.recommandations.length },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>
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

      <div>
        <h3
          style={{
            margin: "0 0 14px",
            color: theme.neutral,
            fontFamily: theme.policeTitre,
            fontSize: "17px",
          }}
        >
          Indicateurs clés
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Groupe Performance */}
          <div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: theme.texteDoux,
              }}
            >
              Performance
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
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
                icone="⏱️"
              />
              <KpiCard
                titre="Meilleur chrono"
                valeur={
                  dashboard.kpi.meilleur_chrono
                    ? `${dashboard.kpi.meilleur_chrono}s`
                    : "—"
                }
                couleur={theme.succes}
                icone="🏆"
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
                    ? theme.texteDoux
                    : dashboard.kpi.progression < 0
                      ? theme.succes
                      : theme.warning
                }
                icone="📈"
                sousTitre={
                  dashboard.kpi.progression !== null
                    ? dashboard.kpi.progression < 0
                      ? "En amélioration"
                      : "À surveiller"
                    : undefined
                }
              />
              <KpiCard
                titre="RPE moyen"
                valeur={dashboard.kpi.rpe_moyen ?? "—"}
                couleur={theme.warning}
                icone="💪"
                sousTitre="Effort perçu /10"
              />
            </div>
          </div>

          {/* Groupe Récupération & Santé */}
          <div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: theme.texteDoux,
              }}
            >
              Récupération & Santé
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              <KpiCard
                titre="HRV moyenne"
                valeur={
                  dashboard.kpi.hrv_moyenne
                    ? `${dashboard.kpi.hrv_moyenne} ms`
                    : "—"
                }
                couleur="#8b5cf6"
                icone="💜"
                sousTitre="Variabilité cardiaque"
              />
              <KpiCard
                titre="FC repos"
                valeur={
                  dashboard.kpi.fc_repos ? `${dashboard.kpi.fc_repos} bpm` : "—"
                }
                couleur={theme.danger}
                icone="❤️"
              />
              <KpiCard
                titre="Sommeil moyen"
                valeur={
                  dashboard.kpi.sommeil_moyen
                    ? `${dashboard.kpi.sommeil_moyen}h`
                    : "—"
                }
                couleur={theme.secondary}
                icone="🌙"
              />
              <KpiCard
                titre="Score fatigue"
                valeur={
                  dashboard.kpi.fatigue !== null
                    ? `${dashboard.kpi.fatigue}/100`
                    : "—"
                }
                couleur={
                  dashboard.kpi.fatigue === null
                    ? theme.texteDoux
                    : dashboard.kpi.fatigue >= 70
                      ? theme.danger
                      : dashboard.kpi.fatigue >= 50
                        ? theme.warning
                        : theme.succes
                }
                icone="⚡"
                sousTitre={
                  dashboard.kpi.fatigue !== null
                    ? dashboard.kpi.fatigue >= 70
                      ? "Surmenage"
                      : dashboard.kpi.fatigue >= 50
                        ? "Vigilance"
                        : "En forme"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div style={carte}>
        <h3
          style={{
            margin: "0 0 16px",
            color: theme.neutral,
            fontFamily: theme.policeTitre,
            fontSize: "17px",
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
                style={{ color: theme.texteDoux, fontSize: "13px", margin: 0 }}
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

      {dashboard.historique_chronos.length > 0 && (
        <div style={carte}>
          <h3
            style={{
              margin: "0 0 16px",
              color: theme.neutral,
              fontFamily: theme.policeTitre,
              fontSize: "17px",
            }}
          >
            Évolution des chronos
          </h3>
          <ChronoChart data={dashboard.historique_chronos} />
        </div>
      )}

      <Recommandations recommandations={dashboard.recommandations} />
    </div>
  );
}

function DashboardEntraineur({ utilisateur }: { utilisateur: Utilisateur }) {
  const [nageurs, setNageurs] = useState<Nageur[]>([]);
  const [dashboards, setDashboards] = useState<
    Record<number, DashboardResponse | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [nageurSelectionne, setNageurSelectionne] = useState<number | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

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
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  const selectionnerNageur = async (id: number) => {
    if (nageurSelectionne === id) {
      setNageurSelectionne(null);
      return;
    }
    setNageurSelectionne(id);
    if (!(id in dashboards)) {
      setLoadingDetail(true);
      try {
        const d = await getDashboard(id);
        setDashboards((prev) => ({ ...prev, [id]: d }));
      } catch (_) {
        setDashboards((prev) => ({ ...prev, [id]: null }));
      } finally {
        setLoadingDetail(false);
      }
    }
    setTimeout(
      () =>
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      100,
    );
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
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `rapport_equipe_${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };

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

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
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
            {getGreeting()}, {utilisateur.prenom} 👋
          </h1>
          <p style={{ color: theme.texteDoux, margin: 0, fontSize: "14px" }}>
            Vue d'ensemble de votre équipe
          </p>
        </div>
        <button
          onClick={exporterCSV}
          disabled={nageurs.length === 0}
          style={{
            padding: "10px 18px",
            background: theme.neutral,
            color: theme.blanc,
            border: "none",
            borderRadius: "10px",
            cursor: nageurs.length === 0 ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            opacity: nageurs.length === 0 ? 0.5 : 1,
          }}
        >
          <DownloadIcon size={16} color="currentColor" strokeWidth={2.5} />
          Exporter CSV
        </button>
      </div>

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
          Chargement de l'équipe…
        </div>
      )}

      {!loading && (
        <>
          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <StatCard
              titre="Effectif"
              valeur={nageurs.length}
              sousTitre="nageurs suivis"
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
            <div
              style={{
                textAlign: "center",
                padding: "60px",
                color: theme.texteDoux,
              }}
            >
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🏊</p>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: theme.neutral,
                  margin: "0 0 6px",
                }}
              >
                Aucun nageur enregistré
              </p>
            </div>
          ) : (
            <div
              style={{
                ...carte,
                padding: 0,
                overflow: "hidden",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${theme.bordure}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontFamily: theme.policeTitre,
                    color: theme.neutral,
                    fontWeight: 700,
                  }}
                >
                  Vue équipe
                </h2>
                <span style={{ fontSize: "12px", color: theme.texteDoux }}>
                  Cliquez sur un nageur pour voir son dashboard
                </span>
              </div>
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
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: "11px",
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
                    const isSelected = nageurSelectionne === n.id;
                    return (
                      <tr
                        key={n.id}
                        onClick={() => selectionnerNageur(n.id)}
                        style={{
                          borderTop: `1px solid ${theme.bordure}`,
                          cursor: "pointer",
                          background: isSelected ? "#eff6ff" : theme.blanc,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = theme.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.background = isSelected
                            ? "#eff6ff"
                            : theme.blanc;
                        }}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: isSelected
                                  ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                                  : "#e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                                color: isSelected ? "#fff" : theme.texteDoux,
                                flexShrink: 0,
                                transition: "all 0.2s ease",
                              }}
                            >
                              {n.prenom[0]}
                              {n.nom[0]}
                            </div>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: isSelected
                                  ? theme.primary
                                  : theme.neutral,
                              }}
                            >
                              {n.prenom} {n.nom}
                            </span>
                          </div>
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
                            fontWeight: 600,
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {nageurSelectionne && (
            <div
              ref={detailRef}
              style={{
                marginTop: "24px",
                borderTop: `2px solid ${theme.primary}20`,
                paddingTop: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "24px",
                    background: theme.primary,
                    borderRadius: "2px",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontFamily: theme.policeTitre,
                    color: theme.neutral,
                    fontWeight: 700,
                  }}
                >
                  Dashboard —{" "}
                  {nageurs.find((n) => n.id === nageurSelectionne)?.prenom}{" "}
                  {nageurs.find((n) => n.id === nageurSelectionne)?.nom}
                </h2>
                <button
                  onClick={() => setNageurSelectionne(null)}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: `1px solid ${theme.bordure}`,
                    borderRadius: "8px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: theme.texteDoux,
                    fontWeight: 500,
                  }}
                >
                  ✕ Fermer
                </button>
              </div>
              {loadingDetail ? (
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
                  Chargement…
                </div>
              ) : dashboards[nageurSelectionne] ? (
                <DashboardDetail dashboard={dashboards[nageurSelectionne]!} />
              ) : (
                <p style={{ color: theme.texteDoux }}>
                  Impossible de charger les données de ce nageur.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DashboardNageur({ utilisateur }: { utilisateur: Utilisateur }) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (utilisateur.nageur_id) {
      chargerDashboard(utilisateur.nageur_id);
    }
  }, [utilisateur]);

  const chargerDashboard = async (id: number) => {
    setLoading(true);
    setErreur("");
    try {
      setDashboard(await getDashboard(id));
    } catch (_) {
      setErreur("Impossible de charger le dashboard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: theme.policeTexte }}>
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
          {getGreeting()}, {utilisateur.prenom} 👋
        </h1>
        <p style={{ color: theme.texteDoux, margin: 0, fontSize: "14px" }}>
          Vos indicateurs de performance et de récupération
        </p>
      </div>
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
      {dashboard && <DashboardDetail dashboard={dashboard} />}
    </div>
  );
}

function Dashboard({ utilisateur }: DashboardProps) {
  const estNageur = utilisateur.role === "nageur";
  return estNageur ? (
    <DashboardNageur utilisateur={utilisateur} />
  ) : (
    <DashboardEntraineur utilisateur={utilisateur} />
  );
}

export default Dashboard;
