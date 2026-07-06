import { useState, FormEvent } from "react";
import { registerEntraineur } from "../api/api";
import theme from "../theme";
import Spinner from "../components/Spinner";

function RegisterEntraineur() {
  const [form, setForm] = useState({
    email: "",
    mot_de_passe: "",
    confirm: "",
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    consentement: false,
  });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErreur("");
    if (form.mot_de_passe.length < 8)
      return setErreur("Le mot de passe doit contenir au moins 8 caractères");
    if (form.mot_de_passe !== form.confirm)
      return setErreur("Les mots de passe ne correspondent pas");
    if (!form.consentement)
      return setErreur("Vous devez accepter les conditions");
    setChargement(true);
    try {
      await registerEntraineur({
        email: form.email,
        mot_de_passe: form.mot_de_passe,
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance || undefined,
        lieu_naissance: form.lieu_naissance || undefined,
        consentement_donnees_sante: true,
      });
      setSucces(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setErreur(e.response?.data?.detail ?? "Erreur lors de l'inscription");
    } finally {
      setChargement(false);
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
  const label: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: theme.texte,
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = `2px solid ${theme.secondary}`;
    e.target.style.padding = "11px 13px";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = `1px solid ${theme.bordure}`;
    e.target.style.padding = "12px 14px";
  };

  if (succes)
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
            width: "420px",
            textAlign: "center",
            border: `1px solid ${theme.bordure}`,
            boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
              marginBottom: "20px",
              boxShadow: "0 10px 30px rgba(6,182,212,0.25)",
              padding: "12px",
            }}
          >
            <img
              src="/logo.png"
              alt="Swim AI"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <h2
            style={{
              color: theme.neutral,
              fontFamily: theme.policeTitre,
              fontWeight: 800,
              fontSize: "26px",
              margin: "0 0 12px",
            }}
          >
            Compte entraîneur créé !
          </h2>
          <p
            style={{
              color: theme.texteDoux,
              marginTop: "0",
              fontSize: "15px",
              lineHeight: 1.5,
            }}
          >
            Votre compte a été créé. Un administrateur doit valider vos droits
            si nécessaire.
          </p>
          <a
            href="/"
            style={{
              display: "block",
              marginTop: "28px",
              padding: "14px",
              background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
              color: theme.blanc,
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "15px",
              boxShadow: "0 4px 14px rgba(6,182,212,0.3)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(6,182,212,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(6,182,212,0.3)";
            }}
          >
            Se connecter
          </a>
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.tertiary,
        padding: "24px 0",
      }}
    >
      <div
        style={{
          background: theme.blanc,
          padding: "40px",
          borderRadius: "20px",
          width: "460px",
          border: `1px solid ${theme.bordure}`,
          boxShadow: "0 10px 40px rgba(15,23,42,0.08)",
          fontFamily: theme.policeTexte,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: theme.policeTitre,
              fontSize: "24px",
              fontWeight: 800,
              color: theme.neutral,
              margin: 0,
            }}
          >
            Inscription Entraîneur
          </h1>
          <p
            style={{
              color: theme.texteDoux,
              fontSize: "13px",
              marginTop: "6px",
            }}
          >
            Gérez votre équipe et suivez vos nageurs
          </p>
        </div>

        <a
          href="/register"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: theme.texteDoux,
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            marginBottom: "20px",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.secondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.texteDoux;
          }}
        >
          ← Retour au choix
        </a>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={label}>Prénom *</label>
              <input
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                required
                style={inputStyle}
                placeholder="Marc"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={label}>Nom *</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
                style={inputStyle}
                placeholder="Dubois"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={label}>Date de naissance</label>
              <input
                type="date"
                value={form.date_naissance}
                onChange={(e) =>
                  setForm({ ...form, date_naissance: e.target.value })
                }
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <label style={label}>Lieu de naissance</label>
              <input
                value={form.lieu_naissance}
                onChange={(e) =>
                  setForm({ ...form, lieu_naissance: e.target.value })
                }
                style={inputStyle}
                placeholder="Paris"
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
          </div>
          <div>
            <label style={label}>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
              placeholder="marc@swimclub.fr"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={label}>
              Mot de passe *{" "}
              <span style={{ color: theme.texteDoux, fontWeight: 400 }}>
                (min. 8 caractères)
              </span>
            </label>
            <input
              type="password"
              value={form.mot_de_passe}
              onChange={(e) =>
                setForm({ ...form, mot_de_passe: e.target.value })
              }
              required
              style={inputStyle}
              placeholder="••••••••"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={label}>Confirmer le mot de passe *</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
              style={inputStyle}
              placeholder="••••••••"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "14px",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: "10px",
                cursor: "pointer",
                alignItems: "flex-start",
              }}
            >
              <input
                type="checkbox"
                checked={form.consentement}
                onChange={(e) =>
                  setForm({ ...form, consentement: e.target.checked })
                }
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "13px",
                  color: theme.texte,
                  lineHeight: "1.5",
                }}
              >
                J'accepte le traitement des données personnelles des nageurs que
                je supervise conformément au{" "}
                <a
                  href="/legal/privacy"
                  target="_blank"
                  style={{ color: theme.primary }}
                >
                  RGPD
                </a>
                . *
              </span>
            </label>
          </div>

          {erreur && (
            <p
              style={{
                color: theme.danger,
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            style={{
              padding: "14px",
              background: chargement
                ? "#cbd5e1"
                : `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`,
              color: theme.blanc,
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: chargement ? "not-allowed" : "pointer",
              boxShadow: chargement ? "none" : "0 4px 14px rgba(6,182,212,0.3)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            {chargement && <Spinner size="small" color="white" />}
            {chargement
              ? "Création en cours..."
              : "Créer mon compte entraîneur"}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: "13px",
              color: theme.texteDoux,
            }}
          >
            Déjà un compte ?{" "}
            <a href="/" style={{ color: theme.primary, fontWeight: 600 }}>
              Se connecter
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterEntraineur;
