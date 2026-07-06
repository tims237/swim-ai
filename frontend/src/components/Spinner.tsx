import theme from "../theme";

interface SpinnerProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white" | "neutral";
  customColor?: string;
  variant?: "circle" | "dots";
}

function Spinner({
  size = "medium",
  color = "white",
  customColor,
  variant = "circle",
}: SpinnerProps) {
  const sizeMap = {
    small: 14,
    medium: 18,
    large: 24,
  };

  const colorMap = {
    primary: theme.primary,
    secondary: theme.secondary,
    white: "#ffffff",
    neutral: theme.neutral,
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = customColor || colorMap[color];

  if (variant === "dots") {
    const dotSize = spinnerSize / 4;
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: `${dotSize}px`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: "50%",
              background: spinnerColor,
              animation: `spinnerDots 0.8s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }

  // Circle variant (default)
  return (
    <div
      style={{
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
        border: `${Math.max(2, spinnerSize / 8)}px solid ${spinnerColor}30`,
        borderTopColor: spinnerColor,
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
    />
  );
}

export default Spinner;
