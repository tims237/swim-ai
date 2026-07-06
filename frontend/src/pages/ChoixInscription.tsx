import theme from "../theme";

function ChoixInscription() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.tertiary,
        fontFamily: theme.policeTexte,
      }}
    >
      <div
        style={{
          background: theme.blanc,
          padding: "40px",
          borderRadius: "20px",
          width: "440px",
          maxWidth: "90%",
          border: `1px solid ${theme.bordure}`,
          boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
          animation: "fadeIn 0.4s ease-out",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <img
            src="/logo.png"
            alt="Swim AI"
            style={{
              width: "64px",
              height: "64px",
              objectFit: "contain",
              marginBottom: "16px",
            }}
          />
          <h1
            style={{
              fontFamily: theme.policeTitre,
              fontSize: "24px",
              fontWeight: 800,
              color: theme.neutral,
              margin: 0,
            }}
          >
            Créer un compte
          </h1>
          <p
            style={{
              color: theme.texteDoux,
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            Choisissez votre profil pour commencer
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <a
            href="/register/nageur"
            style={{
              display: "block",
              padding: "20px",
              borderRadius: "14px",
              border: `2px solid ${theme.primary}`,
              textDecoration: "none",
              background: `${theme.primary}08`,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 20px ${theme.primary}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: theme.primary,
                fontSize: "16px",
                marginBottom: "4px",
              }}
            >
              Je suis nageur
            </div>
            <div style={{ fontSize: "13px", color: theme.texteDoux }}>
              Suivez vos performances, chronos et récupération
            </div>
          </a>
          <a
            href="/register/entraineur"
            style={{
              display: "block",
              padding: "20px",
              borderRadius: "14px",
              border: `2px solid ${theme.secondary}`,
              textDecoration: "none",
              background: `${theme.secondary}08`,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 20px ${theme.secondary}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: theme.secondary,
                fontSize: "16px",
                marginBottom: "4px",
              }}
            >
              Je suis entraîneur
            </div>
            <div style={{ fontSize: "13px", color: theme.texteDoux }}>
              Gérez votre équipe, analysez les données, exportez
            </div>
          </a>
        </div>

        <a
          href="/"
          style={{
            display: "block",
            marginTop: "24px",
            width: "100%",
            padding: "12px",
            background: "transparent",
            border: `1px solid ${theme.bordure}`,
            color: theme.texteDoux,
            fontSize: "14px",
            borderRadius: "10px",
            fontWeight: 500,
            transition: "all 0.2s ease",
            textDecoration: "none",
            textAlign: "center",
            boxSizing: "border-box",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.tertiary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          ← Retour à la connexion
        </a>
      </div>
    </div>
  );
}

export default ChoixInscription;
