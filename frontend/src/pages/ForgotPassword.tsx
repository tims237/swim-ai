import { useState, FormEvent } from "react";
import { motDePasseOublie } from "../api/api";
import theme from "../theme";
import Spinner from "../components/Spinner";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setChargement(true);
    try {
      await motDePasseOublie(email);
    } catch {
      // Erreur réseau ou serveur — on affiche quand même le message générique
      // (sécurité : ne pas révéler si l'email existe ou non)
    } finally {
      setChargement(false);
      setEnvoye(true);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${theme.bordure}`,
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: theme.policeTexte,
    color: theme.texte,
    background: theme.blanc,
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.tertiary,
      }}
    >
      <div
        style={{
          background: theme.blanc,
          padding: "40px",
          borderRadius: "20px",
          width: "400px",
          border: `1px solid ${theme.bordure}`,
          boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
          fontFamily: theme.policeTexte,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              marginBottom: "16px",
              boxShadow: "0 10px 30px rgba(0,85,255,0.25)",
              padding: "8px",
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
              fontSize: "24px",
              fontWeight: 800,
              color: theme.neutral,
              margin: 0,
            }}
          >
            Mot de passe oublié
          </h1>
          <p
            style={{
              color: theme.texteDoux,
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {envoye ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <p
                style={{
                  color: theme.succes,
                  fontWeight: 600,
                  fontSize: "15px",
                  margin: 0,
                }}
              >
                ✅ Email envoyé !
              </p>
              <p
                style={{
                  color: theme.texteDoux,
                  fontSize: "13px",
                  marginTop: "8px",
                }}
              >
                Si cet email est enregistré, vous recevrez un lien valable 30
                minutes.
              </p>
            </div>
            <a
              href="/"
              style={{
                color: theme.primary,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ← Retour à la connexion
            </a>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: theme.texte,
                }}
              >
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="votre@email.com"
                onFocus={(e) => {
                  e.target.style.border = `2px solid ${theme.primary}`;
                  e.target.style.padding = "11px 13px";
                }}
                onBlur={(e) => {
                  e.target.style.border = `1px solid ${theme.bordure}`;
                  e.target.style.padding = "12px 14px";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={chargement || !email}
              style={{
                padding: "14px",
                background:
                  chargement || !email
                    ? "#cbd5e1"
                    : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: theme.blanc,
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: chargement || !email ? "not-allowed" : "pointer",
                boxShadow:
                  chargement || !email
                    ? "none"
                    : "0 4px 14px rgba(0,85,255,0.3)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {chargement && <Spinner size="small" color="white" />}
              {chargement ? "Envoi en cours..." : "Envoyer le lien"}
            </button>

            <a
              href="/"
              style={{
                textAlign: "center",
                color: theme.texteDoux,
                fontSize: "13px",
              }}
            >
              ← Retour à la connexion
            </a>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
