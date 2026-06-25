// src/theme.js
// Design system Swim AI — couleurs et polices issues du Figma
export const theme = {
  // Couleurs
  primary:   "#0055FF",   // bleu vif — accent principal
  secondary: "#06B6D4",   // cyan — accent secondaire
  tertiary:  "#F8FAFC",   // gris très pâle — fond de page
  neutral:   "#1E293B",   // bleu nuit — textes / éléments sombres

  // Nuances utiles
  blanc:      "#FFFFFF",
  texte:      "#1E293B",  // texte principal
  texteDoux:  "#64748B",  // texte secondaire / gris
  bordure:    "#E2E8F0",  // bordures légères
  fondCarte:  "#FFFFFF",

  // États (santé : bon / vigilance / alerte)
  succes:  "#16A34A",     // vert
  warning: "#EA580C",     // orange
  danger:  "#DC2626",     // rouge

  // Polices
  policeTitre: "'Hanken Grotesk', sans-serif",
  policeTexte: "'Inter', sans-serif",

  // Style des cartes (réutilisable)
  carte: {
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    padding: "20px",
  },
};

export default theme;