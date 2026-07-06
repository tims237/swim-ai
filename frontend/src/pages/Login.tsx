import { useState } from "react";
import { login } from "../api/api";
import theme from "../theme";

interface LoginProps {
  onLoginReussi: () => void;
}

function Login({ onLoginReussi }: LoginProps) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);

  const handleConnexion = async () => {
    setErreur("");
    setChargement(true);
    try {
      const data = await login(email, motDePasse);
      localStorage.setItem("token", data.access_token);
      onLoginReussi();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err.response?.data?.detail;
      setErreur(
        typeof detail === "string" ? detail : "Email ou mot de passe incorrect",
      );
    } finally {
      setChargement(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${theme.bordure}`,
    borderRadius: "10px",
    boxSizing: "border-box",
    fontFamily: theme.policeTexte,
    fontSize: "14px",
    color: theme.texte,
    background: theme.blanc,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    color: theme.texte,
    fontSize: "13px",
    fontWeight: 600,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        fontFamily: theme.policeTexte,
      }}
    >
      {/* Panel gauche - Branding */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "60px",
          color: theme.blanc,
          position: "relative",
          overflow: "hidden",
          animation: "slideInLeft 0.6s ease-out",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: "480px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              marginBottom: "24px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              padding: "10px",
            }}
          >
            <img
              src="/logo.png"
              alt="Swim AI"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h1
            style={{
              fontFamily: theme.policeTitre,
              fontSize: "48px",
              fontWeight: 800,
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Swim AI
          </h1>
          <p
            style={{
              fontSize: "18px",
              opacity: 0.95,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Optimisez vos performances aquatiques grâce à l'intelligence
            artificielle
          </p>
        </div>
      </div>

      {/* Panel droit - Formulaire */}
      <div
        style={{
          background: theme.blanc,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px",
          animation: "slideInRight 0.6s ease-out",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: theme.policeTitre,
                fontSize: "32px",
                fontWeight: 800,
                color: theme.neutral,
                margin: "0 0 8px",
              }}
            >
              Bienvenue
            </h2>
            <p style={{ color: theme.texteDoux, fontSize: "15px", margin: 0 }}>
              Connectez-vous pour accéder à votre dashboard
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Adresse email</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnexion()}
                placeholder="coach@swimai.com"
                style={{ ...inputStyle, paddingLeft: "40px" }}
                onFocus={(e) => {
                  e.target.style.border = `2px solid ${theme.primary}`;
                  e.target.style.padding = "11px 13px 11px 39px";
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${theme.bordure}`;
                  e.target.style.padding = "12px 14px 12px 40px";
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={afficherMotDePasse ? "text" : "password"}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnexion()}
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  paddingLeft: "40px",
                  paddingRight: "40px",
                }}
                onFocus={(e) => {
                  e.target.style.border = `2px solid ${theme.primary}`;
                  e.target.style.padding = "11px 39px 11px 39px";
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${theme.bordure}`;
                  e.target.style.padding = "12px 40px 12px 40px";
                }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <button
                type="button"
                onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  color: theme.texteDoux,
                }}
              >
                {afficherMotDePasse ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "24px",
            }}
          >
            <a
              href="/forgot-password"
              style={{
                fontSize: "13px",
                color: theme.primary,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Mot de passe oublié ?
            </a>
          </div>

          {erreur && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                color: theme.danger,
                fontSize: "13px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>⚠️</span>
              {erreur}
            </div>
          )}

          <button
            onClick={handleConnexion}
            disabled={chargement || !email || !motDePasse}
            style={{
              width: "100%",
              padding: "14px",
              background:
                chargement || !email || !motDePasse
                  ? "#cbd5e1"
                  : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: theme.blanc,
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              cursor:
                chargement || !email || !motDePasse ? "not-allowed" : "pointer",
              boxShadow:
                chargement || !email || !motDePasse
                  ? "none"
                  : "0 4px 14px rgba(0,85,255,0.3)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              if (!chargement && email && motDePasse) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(0,85,255,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!chargement && email && motDePasse) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 14px rgba(0,85,255,0.3)";
              }
            }}
          >
            {chargement && (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            )}
            {chargement ? "Connexion en cours..." : "Se connecter"}
          </button>

          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "14px",
              color: theme.texteDoux,
            }}
          >
            Pas encore de compte ?{" "}
            <a
              href="/register"
              style={{
                color: theme.primary,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Créer un compte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
