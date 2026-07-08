import { useState, useEffect, useRef } from "react";
import { getNageurs, getDashboard } from "../api/api";
import type { Nageur, DashboardResponse } from "../types";
import type { Utilisateur } from "../types";
import ChronoChart from "../components/ChronoChart";
import Recommandations from "../components/Recommandations";
import { DownloadIcon } from "../components/Icons";
import Spinner from "../components/Spinner";
import {
  Calendar, ChevronDown, TrendingUp, TrendingDown,
  Minus, AlertTriangle, Activity, Moon, Zap, Heart,
} from "lucide-react";
import theme from "../theme";

interface DashboardProps { utilisateur: Utilisateur }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatDate() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function acwrColor(v: number | null) {
  if (v == null) return "#94A3B8";
  if (v < 0.8)  return "#F59E0B";
  if (v <= 1.3) return "#10B981";
  return "#EF4444";
}

function acwrLabel(v: number | null) {
  if (v == null) return "—";
  if (v < 0.8)   return "Sous-charge";
  if (v <= 1.3)  return "Optimal";
  return "Surcharge";
}

function Carte({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", ...style }}>
      {children}
    </div>
  );
}

function SectionTitre({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: theme.policeTitre, fontSize: "15px", fontWeight: 700, color: "#0F172A", marginBottom: "14px", margin: "0 0 14px" }}>
      {children}
    </h3>
  );
}

function KpiBlock({ titre, valeur, unite = "", delta = null, deltaSuffix = "", inverseDelta = false, accent, Icon }: {
  titre: string; valeur: string | number | null; unite?: string;
  delta?: number | null; deltaSuffix?: string; inverseDelta?: boolean;
  accent: string; Icon?: React.ElementType;
}) {
  const affiche = valeur !== null && valeur !== undefined ? `${valeur}${unite}` : "—";
  const deltaColor = delta === null ? "#94A3B8"
    : (inverseDelta ? delta < 0 : delta > 0) ? "#10B981" : "#EF4444";

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {Icon ? <Icon size={15} color={accent} /> : <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: accent }} />}
      </div>
      <div>
        <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, marginBottom: "4px" }}>{titre}</div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: "#0F172A", fontFamily: theme.policeTitre, lineHeight: 1.1 }}>
          {affiche}
        </div>
      </div>
      {delta !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: deltaColor }}>
          {delta === 0 ? <Minus size={13} color="#94A3B8" /> : (inverseDelta ? delta < 0 : delta > 0) ? <TrendingUp size={13} color="#10B981" /> : <TrendingDown size={13} color="#EF4444" />}
          <span style={{ fontWeight: 500 }}>{delta > 0 ? "+" : ""}{delta}{deltaSuffix}</span>
          <span style={{ color: "#CBD5E1" }}>vs préc.</span>
        </div>
      )}
    </div>
  );
}

function DashboardDetail({ dashboard }: { dashboard: DashboardResponse }) {
  const initiales = `${dashboard.nageur.prenom?.[0] ?? ""}${dashboard.nageur.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header nageur */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px" }}>{initiales}</span>
          </div>
          <div>
            <h2 style={{ fontFamily: theme.policeTitre, fontWeight: 800, fontSize: "20px", color: "#0F172A", margin: 0 }}>
              {dashboard.nageur.prenom} {dashboard.nageur.nom}
            </h2>
            <p style={{ color: "#64748B", fontSize: "13px", margin: "3px 0 0" }}>
              {dashboard.nageur.specialite ?? "Spécialité non renseignée"}
              {dashboard.nageur.niveau ? ` · ${dashboard.nageur.niveau}` : ""}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#475569" }}>
          <Calendar size={13} color="#94A3B8" />
          <span>Saison 2025</span>
          <ChevronDown size={12} color="#94A3B8" />
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "14px" }}>
        <KpiBlock titre="Chrono actuel"   valeur={dashboard.kpi.dernier_chrono}  unite="s"    delta={dashboard.kpi.progression} deltaSuffix="%" inverseDelta accent={theme.primary}   Icon={Activity} />
        <KpiBlock titre="Meilleur chrono" valeur={dashboard.kpi.meilleur_chrono} unite="s"    accent="#10B981"  Icon={TrendingUp} />
        <KpiBlock titre="HRV"             valeur={dashboard.kpi.hrv_moyenne}     unite=" ms"  accent={theme.secondary} Icon={Heart} />
        <KpiBlock titre="FC repos"        valeur={dashboard.kpi.fc_repos}        unite=" bpm" accent="#EF4444"  Icon={Heart} />
        <KpiBlock titre="RPE moyen"       valeur={dashboard.kpi.rpe_moyen}       accent="#F59E0B"  Icon={Zap} />
        <KpiBlock titre="Sommeil"         valeur={dashboard.kpi.sommeil_moyen}   unite="h"    accent="#8B5CF6"  Icon={Moon} />
      </div>

      {/* Chronos + Charge */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <Carte style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <SectionTitre>Évolution des performances</SectionTitre>
            <select style={{ border: "1px solid #E2E8F0", borderRadius: "6px", fontSize: "12px", padding: "4px 8px", color: "#475569", background: "#F8FAFC" }}>
              <option>100m nage libre</option>
            </select>
          </div>
          {dashboard.historique_chronos.length > 0 ? (
            <ChronoChart data={dashboard.historique_chronos} />
          ) : (
            <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center", color: "#CBD5E1", fontSize: "13px", border: "1px dashed #E2E8F0", borderRadius: "8px" }}>
              Aucune donnée disponible
            </div>
          )}
        </Carte>

        <Carte style={{ padding: "24px" }}>
          <SectionTitre>Charge d'entraînement</SectionTitre>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {dashboard.charge.acwr !== null && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: `${acwrColor(dashboard.charge.acwr)}12`, border: `1px solid ${acwrColor(dashboard.charge.acwr)}30`, borderRadius: "8px", padding: "10px 14px" }}>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>ACWR</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: acwrColor(dashboard.charge.acwr), fontFamily: theme.policeTitre }}>
                    {dashboard.charge.acwr}
                  </div>
                </div>
                <span style={{ background: acwrColor(dashboard.charge.acwr), color: "#fff", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px" }}>
                  {acwrLabel(dashboard.charge.acwr)}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: "24px" }}>
              {[
                { label: "Charge aiguë (7j)",     valeur: dashboard.charge.charge_aigue },
                { label: "Charge chronique (28j)", valeur: dashboard.charge.charge_chronique },
              ].map(({ label, valeur }) => (
                <div key={label}>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", fontFamily: theme.policeTitre }}>
                    {valeur ? `${valeur} min` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Carte>
      </div>

      {/* Biométrie */}
      <Carte style={{ padding: "24px" }}>
        <SectionTitre>Biométrie & Fatigue</SectionTitre>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
          {[
            { label: "HRV (ms)",       valeur: dashboard.kpi.hrv_moyenne,   unite: " ms",  accent: theme.secondary },
            { label: "Sommeil (h)",    valeur: dashboard.kpi.sommeil_moyen, unite: "h",    accent: "#8B5CF6" },
            { label: "RPE (séance)",   valeur: dashboard.kpi.rpe_moyen,     unite: "",     accent: "#F59E0B" },
            { label: "FC repos (bpm)", valeur: dashboard.kpi.fc_repos,      unite: " bpm", accent: "#EF4444" },
            { label: "Score fatigue",  valeur: dashboard.kpi.fatigue,       unite: "/100", accent: "#F97316" },
          ].map(({ label, valeur, unite, accent }) => (
            <div key={label} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "14px 16px", borderLeft: `3px solid ${accent}` }}>
              <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "6px" }}>{label}</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", fontFamily: theme.policeTitre }}>
                {valeur !== null && valeur !== undefined ? `${valeur}${unite}` : "—"}
              </div>
            </div>
          ))}
        </div>
      </Carte>

      <Recommandations recommandations={dashboard.recommandations} />
    </div>
  );
}

function DashboardEntraineur({ utilisateur }: { utilisateur: Utilisateur }) {
  const [nageurs,          setNageurs]          = useState<Nageur[]>([]);
  const [dashboards,       setDashboards]       = useState<Record<number, DashboardResponse | null>>({});
  const [loading,          setLoading]          = useState(true);
  const [nageurSelectionne, setNageurSelectionne] = useState<number | null>(null);
  const [loadingDetail,    setLoadingDetail]    = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void chargerTout(); }, []);

  const chargerTout = async () => {
    setLoading(true);
    try {
      const liste = await getNageurs();
      setNageurs(liste);
      const resultats: Record<number, DashboardResponse | null> = {};
      await Promise.all(liste.map(async (n) => {
        try { resultats[n.id] = await getDashboard(n.id); }
        catch { resultats[n.id] = null; }
      }));
      setDashboards(resultats);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const selectionnerNageur = async (id: number) => {
    if (nageurSelectionne === id) { setNageurSelectionne(null); return; }
    setNageurSelectionne(id);
    if (!(id in dashboards)) {
      setLoadingDetail(true);
      try { const d = await getDashboard(id); setDashboards(prev => ({ ...prev, [id]: d })); }
      catch { setDashboards(prev => ({ ...prev, [id]: null })); }
      finally { setLoadingDetail(false); }
    }
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const exporterCSV = () => {
    const lignes = [["Nom", "Prénom", "Spécialité", "Niveau", "Dernier chrono", "Meilleur chrono", "Progression (%)", "Fatigue", "ACWR"]];
    nageurs.forEach(n => {
      const d = dashboards[n.id];
      lignes.push([n.nom, n.prenom, n.specialite ?? "", n.niveau ?? "", String(d?.kpi?.dernier_chrono ?? ""), String(d?.kpi?.meilleur_chrono ?? ""), String(d?.kpi?.progression ?? ""), String(d?.kpi?.fatigue ?? ""), String(d?.charge?.acwr ?? "")]);
    });
    const blob = new Blob(["\uFEFF" + lignes.map(l => l.join(";")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `rapport_equipe_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const enForme   = nageurs.filter(n => { const f = dashboards[n.id]?.kpi?.fatigue; return f != null && f < 50; }).length;
  const vigilance = nageurs.filter(n => { const f = dashboards[n.id]?.kpi?.fatigue; return f != null && f >= 50 && f < 70; }).length;
  const surmenage = nageurs.filter(n => { const f = dashboards[n.id]?.kpi?.fatigue; return f != null && f >= 70; }).length;

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: "1100px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, margin: "0 0 4px", textTransform: "capitalize" }}>
            {formatDate()}
          </p>
          <h1 style={{ fontFamily: theme.policeTitre, color: "#0F172A", margin: "0 0 4px", fontSize: "24px", fontWeight: 800 }}>
            {getGreeting()}, {utilisateur.prenom} 👋
          </h1>
          <p style={{ color: "#64748B", margin: 0, fontSize: "14px" }}>Vue d'ensemble de votre équipe</p>
        </div>
        <button onClick={exporterCSV} disabled={nageurs.length === 0} style={{ padding: "9px 16px", background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, color: "#fff", border: "none", borderRadius: "8px", cursor: nageurs.length === 0 ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", opacity: nageurs.length === 0 ? 0.5 : 1 }}>
          <DownloadIcon size={15} color="currentColor" strokeWidth={2.5} />
          Exporter CSV
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#94A3B8", padding: "20px 0" }}>
          <Spinner size="small" color="primary" /> Chargement de l'équipe…
        </div>
      ) : (
        <>
          {/* KPI équipe */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
            {[
              { label: "Effectif",   valeur: nageurs.length, sous: "nageurs suivis",  accent: theme.primary },
              { label: "En forme",   valeur: enForme,        sous: "fatigue < 50",    accent: "#10B981" },
              { label: "Vigilance",  valeur: vigilance,      sous: "fatigue 50–70",   accent: "#F59E0B" },
              { label: "Surmenage",  valeur: surmenage,      sous: "fatigue ≥ 70",    accent: "#EF4444" },
            ].map(({ label, valeur, sous, accent }) => (
              <Carte key={label} style={{ padding: "20px" }}>
                <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>{label}</div>
                <div style={{ fontSize: "30px", fontWeight: 800, color: accent, fontFamily: theme.policeTitre, lineHeight: 1, marginBottom: "4px" }}>{valeur}</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>{sous}</div>
              </Carte>
            ))}
          </div>

          {/* Tableau */}
          {nageurs.length === 0 ? (
            <Carte style={{ textAlign: "center", padding: "60px", border: "1px dashed #E2E8F0" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🏊</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#475569", margin: 0 }}>Aucun nageur enregistré</p>
            </Carte>
          ) : (
            <Carte style={{ overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "15px", fontFamily: theme.policeTitre, color: "#0F172A", fontWeight: 700 }}>Vue équipe</h2>
                <span style={{ fontSize: "12px", color: "#94A3B8" }}>Cliquez sur un nageur pour voir son dashboard</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#F8FAFC" }}>
                  <tr>
                    {["Nageur", "Spécialité", "Dernier chrono", "Progression", "Fatigue", "ACWR"].map(h => (
                      <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: "11px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nageurs.map((n, i) => {
                    const d = dashboards[n.id];
                    const isSelected = nageurSelectionne === n.id;
                    const fatigueColor = d?.kpi?.fatigue == null ? "#94A3B8" : d.kpi.fatigue >= 70 ? "#EF4444" : d.kpi.fatigue >= 50 ? "#F59E0B" : "#10B981";
                    return (
                      <tr key={n.id} onClick={() => selectionnerNageur(n.id)} style={{ borderTop: "1px solid #F1F5F9", cursor: "pointer", background: isSelected ? "#EFF6FF" : i % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isSelected ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: isSelected ? "#fff" : "#94A3B8", flexShrink: 0 }}>
                              {n.prenom[0]}{n.nom[0]}
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? theme.primary : "#0F172A" }}>{n.prenom} {n.nom}</span>
                          </div>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: "13px", color: "#475569" }}>{n.specialite ?? "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{d?.kpi?.dernier_chrono ? `${d.kpi.dernier_chrono}s` : "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: "13px", color: "#475569" }}>{d?.kpi?.progression != null ? `${d.kpi.progression}%` : "—"}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: `${fatigueColor}18`, color: fatigueColor }}>
                            {d?.kpi?.fatigue != null ? `${d.kpi.fatigue}/100` : "—"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: `${acwrColor(d?.charge?.acwr ?? null)}18`, color: acwrColor(d?.charge?.acwr ?? null) }}>
                            {d?.charge?.acwr ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Carte>
          )}

          {/* Detail nageur sélectionné */}
          {nageurSelectionne && (
            <div ref={detailRef} style={{ marginTop: "24px", borderTop: `2px solid ${theme.primary}20`, paddingTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: "4px", height: "24px", background: theme.primary, borderRadius: "2px" }} />
                <h2 style={{ margin: 0, fontSize: "17px", fontFamily: theme.policeTitre, color: "#0F172A", fontWeight: 700 }}>
                  Dashboard — {nageurs.find(n => n.id === nageurSelectionne)?.prenom} {nageurs.find(n => n.id === nageurSelectionne)?.nom}
                </h2>
                <button onClick={() => setNageurSelectionne(null)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", color: "#64748B" }}>
                  ✕ Fermer
                </button>
              </div>
              {loadingDetail ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#94A3B8" }}>
                  <Spinner size="small" color="primary" /> Chargement…
                </div>
              ) : dashboards[nageurSelectionne] ? (
                <DashboardDetail dashboard={dashboards[nageurSelectionne]!} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "12px 16px", color: "#DC2626", fontSize: "14px" }}>
                  <AlertTriangle size={15} /> Impossible de charger les données.
                </div>
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
  const [loading,   setLoading]   = useState(true);
  const [erreur,    setErreur]    = useState("");

  useEffect(() => {
    if (utilisateur.nageur_id) chargerDashboard(utilisateur.nageur_id);
  }, [utilisateur]);

  const chargerDashboard = async (id: number) => {
    setLoading(true); setErreur("");
    try { setDashboard(await getDashboard(id)); }
    catch { setErreur("Impossible de charger le dashboard."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: theme.policeTexte, maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <p style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500, margin: "0 0 4px", textTransform: "capitalize" }}>
          {formatDate()}
        </p>
        <h1 style={{ fontFamily: theme.policeTitre, color: "#0F172A", margin: "0 0 4px", fontSize: "24px", fontWeight: 800 }}>
          {getGreeting()}, {utilisateur.prenom} 👋
        </h1>
        <p style={{ color: "#64748B", margin: 0, fontSize: "14px" }}>Vos indicateurs de performance et de récupération</p>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#94A3B8", padding: "20px 0" }}>
          <Spinner size="small" color="primary" /> Chargement en cours…
        </div>
      )}
      {erreur && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "12px 16px", color: "#DC2626", fontSize: "14px" }}>
          <AlertTriangle size={15} /> {erreur}
        </div>
      )}
      {dashboard && <DashboardDetail dashboard={dashboard} />}
    </div>
  );
}

function Dashboard({ utilisateur }: DashboardProps) {
  return utilisateur.role === "nageur"
    ? <DashboardNageur utilisateur={utilisateur} />
    : <DashboardEntraineur utilisateur={utilisateur} />;
}

export default Dashboard;