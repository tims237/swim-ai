import { useState } from "react";
import theme from "../theme";

interface KpiCardProps {
  titre: string;
  valeur: string | number;
  couleur?: string;
  sousTitre?: string;
}

function KpiCard({
  titre,
  valeur,
  couleur = theme.primary,
  sousTitre,
}: KpiCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#fafbff" : theme.blanc,
        borderRadius: "12px",
        padding: "18px 20px",
        border: `1px solid ${hovered ? couleur + "40" : theme.bordure}`,
        boxShadow: hovered
          ? `0 4px 16px ${couleur}18`
          : "0 1px 4px rgba(0,0,0,0.06)",
        borderLeft: `4px solid ${couleur}`,
        transition: "all 0.2s ease",
        cursor: "default",
      }}
    >
      <p
        style={{
          color: theme.texteDoux,
          fontSize: "12px",
          fontWeight: 600,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {titre}
      </p>
      <p
        style={{
          fontSize: "26px",
          fontWeight: 800,
          margin: "6px 0 0",
          color: couleur,
          fontFamily: theme.policeTitre,
          lineHeight: 1,
        }}
      >
        {valeur}
      </p>
      {sousTitre && (
        <p
          style={{
            fontSize: "12px",
            color: theme.texteDoux,
            marginTop: "6px",
            margin: "6px 0 0",
          }}
        >
          {sousTitre}
        </p>
      )}
    </div>
  );
}

export default KpiCard;
