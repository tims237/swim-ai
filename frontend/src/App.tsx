import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { getMe } from "./api/api";
import type { Utilisateur } from "./types";
import Dashboard from "./pages/Dashboard";
import Nageurs from "./pages/Nageurs";
import Sessions from "./pages/Sessions";
import Biometries from "./pages/Biometries";
import Performances from "./pages/Performances";
import Profil from "./pages/Profil";
import Login from "./pages/Login";
import RegisterNageur from "./pages/RegisterNageur";
import RegisterEntraineur from "./pages/RegisterEntraineur";
import ChoixInscription from "./pages/ChoixInscription";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import {
  DashboardIcon,
  SessionIcon,
  HeartIcon,
  TimerIcon,
  UserIcon,
  LogOutIcon,
  ChartIcon,
  MenuIcon,
} from "./components/Icons";
import theme from "./theme";
import "./App.css";

function PublicRoutes({ onLoginReussi }: { onLoginReussi: () => void }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<ChoixInscription />} />
        <Route path="/register/nageur" element={<RegisterNageur />} />
        <Route path="/register/entraineur" element={<RegisterEntraineur />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Login onLoginReussi={onLoginReussi} />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppConnectee({
  utilisateur,
  onDeconnexion,
}: {
  utilisateur: Utilisateur;
  onDeconnexion: () => void;
}) {
  const estNageur = utilisateur.role === "nageur";
  const estEntraineur =
    utilisateur.role === "entraineur" || utilisateur.role === "admin";

  const menuNageur = [
    { to: "/", label: "Dashboard", icon: DashboardIcon },
    { to: "/sessions", label: "Sessions", icon: SessionIcon },
    { to: "/biometries", label: "Biométries", icon: HeartIcon },
    { to: "/performances", label: "Performances", icon: TimerIcon },
  ];

  const menuEntraineur = [
    { to: "/", label: "Dashboard", icon: DashboardIcon },
    { to: "/nageurs", label: "Nageurs", icon: UserIcon },
    { to: "/sessions", label: "Sessions", icon: SessionIcon },
    { to: "/biometries", label: "Biométries", icon: HeartIcon },
    { to: "/performances", label: "Performances", icon: ChartIcon },
  ];

  const menu = estNageur ? menuNageur : menuEntraineur;
  const [sidebarOuverte, setSidebarOuverte] = useState(true);
  const [logoHover, setLogoHover] = useState(false);

  return (
    <BrowserRouter>
      <div
        style={{
          display: "flex",
          height: "100vh",
          fontFamily: theme.policeTexte,
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <nav
          onClick={() => {
            if (!sidebarOuverte) setSidebarOuverte(true);
          }}
          style={{
            width: sidebarOuverte ? "260px" : "68px",
            background: "#ffffff",
            padding: sidebarOuverte ? "20px 16px" : "20px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            flexShrink: 0,
            borderRight: "1px solid #e5e7eb",
            boxShadow: "2px 0 16px rgba(0, 0, 0, 0.04)",
            position: "fixed",
            left: 0,
            top: 0,
            height: "100vh",
            overflowY: "auto",
            overflowX: "hidden",
            transition: "width 0.3s ease, padding 0.3s ease",
            cursor: !sidebarOuverte ? "pointer" : "default",
          }}
        >
          {/* Logo + Hamburger */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOuverte ? "space-between" : "center",
              marginBottom: "8px",
              padding: "4px 0",
              minHeight: "40px",
            }}
          >
            {sidebarOuverte ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "6px 8px",
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="Swim AI"
                    style={{ width: "32px", height: "32px", objectFit: "contain" }}
                  />
                  <h2
                    style={{
                      color: "#0f172a",
                      margin: 0,
                      fontSize: "20px",
                      fontFamily: theme.policeTitre,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Swim AI
                  </h2>
                </div>
                <button
                  onClick={() => setSidebarOuverte(false)}
                  title="Réduire le menu"
                  style={{
                    background: "transparent", border: "none", borderRadius: "8px",
                    padding: "8px", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#94a3b8", transition: "background 0.2s ease, color 0.2s ease", flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  <MenuIcon size={20} strokeWidth={2} color="currentColor" />
                </button>
              </>
            ) : (
              <div
                onMouseEnter={() => setLogoHover(true)}
                onMouseLeave={() => setLogoHover(false)}
                onClick={() => setSidebarOuverte(true)}
                title="Ouvrir le menu"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: "8px", borderRadius: "8px",
                  transition: "background 0.2s ease",
                  background: logoHover ? "#f1f5f9" : "transparent",
                }}
              >
                {logoHover ? (
                  <MenuIcon size={22} color="#64748b" strokeWidth={2} />
                ) : (
                  <img src="/logo.png" alt="Swim AI" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                )}
              </div>
            )}
          </div>

          {/* Badge rôle */}
          {sidebarOuverte && (
            <span
              style={{
                display: "inline-block", marginBottom: "16px",
                fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: estNageur ? "#059669" : "#d97706",
                background: estNageur ? "#d1fae5" : "#fef3c7",
                padding: "4px 10px", borderRadius: "5px", alignSelf: "flex-start",
                border: `1px solid ${estNageur ? "#a7f3d0" : "#fde68a"}`,
                whiteSpace: "nowrap",
              }}
            >
              {utilisateur.role}
            </span>
          )}

          {/* Séparateur collapsed */}
          {!sidebarOuverte && (
            <div style={{ height: "1px", background: "#f1f5f9", margin: "8px 0 12px" }} />
          )}

          {/* Navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {menu.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to + label} to={to} end={to === "/"}
                title={!sidebarOuverte ? label : undefined}
                onClick={(e) => e.stopPropagation()}
                style={({ isActive }) => ({
                  color: isActive ? "#0055FF" : "#64748b",
                  textDecoration: "none",
                  padding: sidebarOuverte ? "11px 12px" : "12px",
                  borderRadius: "10px",
                  background: isActive ? "#eff6ff" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "14px",
                  display: "flex", alignItems: "center",
                  justifyContent: sidebarOuverte ? "flex-start" : "center",
                  gap: sidebarOuverte ? "12px" : "0",
                  transition: "all 0.2s ease",
                  border: isActive ? "1px solid #dbeafe" : "1px solid transparent",
                  whiteSpace: "nowrap", overflow: "hidden",
                })}
              >
                <Icon size={18} strokeWidth={2.5} />
                {sidebarOuverte && label}
              </NavLink>
            ))}
          </div>

          {/* Profil + déconnexion */}
          <div style={{ marginTop: "auto", paddingTop: "16px" }}>
            {sidebarOuverte ? (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", background: "#f8fafc" }}>

                {/* Infos profil — cliquable → page profil */}
                <NavLink
                  to="/profil"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      padding: "14px 14px 12px",
                      display: "flex", alignItems: "center", gap: "10px",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#EFF6FF"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #0055FF, #06B6D4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: "13px", fontWeight: 700,
                        flexShrink: 0, letterSpacing: "0.02em",
                      }}
                    >
                      {utilisateur.prenom?.[0]?.toUpperCase()}
                      {utilisateur.nom?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {utilisateur.prenom} {utilisateur.nom}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                        {utilisateur.email}
                      </div>
                    </div>
                  </div>
                </NavLink>

                {/* Séparateur */}
                <div style={{ height: "1px", background: "#e2e8f0" }} />

                {/* Bouton déconnexion */}
                <button
                  onClick={(e) => { e.stopPropagation(); onDeconnexion(); }}
                  style={{
                    width: "100%", padding: "10px 14px", background: "transparent",
                    color: "#dc2626", border: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "8px",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <LogOutIcon size={15} />
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onDeconnexion(); }}
                title="Déconnexion"
                style={{
                  width: "100%", padding: "12px", background: "#fef2f2",
                  color: "#dc2626", border: "1px solid #fecaca",
                  borderRadius: "10px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.borderColor = "#fecaca"; }}
              >
                <LogOutIcon size={16} />
              </button>
            )}
          </div>
        </nav>

        {/* Contenu */}
        <main
          style={{
            marginLeft: sidebarOuverte ? "260px" : "68px",
            flex: 1, padding: "32px",
            background: theme.tertiary,
            height: "100vh", overflowY: "auto",
            transition: "margin-left 0.3s ease",
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard utilisateur={utilisateur} />} />
            {estEntraineur && <Route path="/nageurs" element={<Nageurs />} />}
            <Route path="/sessions" element={<Sessions utilisateur={utilisateur} />} />
            <Route path="/biometries" element={<Biometries utilisateur={utilisateur} />} />
            <Route path="/performances" element={<Performances utilisateur={utilisateur} />} />
            <Route path="/profil" element={<Profil utilisateur={utilisateur} />} />
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "80px", color: theme.texteDoux }}>
                  <p style={{ fontSize: "48px" }}>🏊</p>
                  <h2 style={{ marginTop: "16px", color: theme.neutral }}>Page introuvable</h2>
                  <a href="/" style={{ color: theme.primary }}>Retour au dashboard</a>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      getMe()
        .then((u) => setUtilisateur(u))
        .catch(() => { localStorage.removeItem("token"); })
        .finally(() => setChargement(false));
    } else {
      setChargement(false);
    }
  }, []);

  const handleLoginReussi = async () => {
    try { const u = await getMe(); setUtilisateur(u); }
    catch { localStorage.removeItem("token"); }
  };

  const handleDeconnexion = () => {
    localStorage.removeItem("token");
    setUtilisateur(null);
  };

  if (chargement) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme.tertiary, color: theme.texteDoux, fontFamily: theme.policeTexte, fontSize: "16px" }}>
        Chargement...
      </div>
    );
  }

  if (!utilisateur) return <PublicRoutes onLoginReussi={handleLoginReussi} />;
  return <AppConnectee utilisateur={utilisateur} onDeconnexion={handleDeconnexion} />;
}

export default App;