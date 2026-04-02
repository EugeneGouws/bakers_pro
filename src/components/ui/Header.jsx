import Badge from "./Badge.jsx";

const C = {
  amber:       "#BA7517",
  amberMid:    "#EF9F27",
  amberBg:     "#FAEEDA",
  amberTxt:    "#633806",
  amberBorder: "#FAC775",
  success:     "#3B6D11",
  successBg:   "#EAF3DE",
  danger:      "#A32D2D",
  dangerBg:    "#FCEBEB",
};

export default function Header() {
  return (
    <div style={{ padding: "1.5rem 1.5rem 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, background: C.amberBg,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>🎂</div>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: -0.3 }}>
          Baker's Cost Pro
        </h1>
        <Badge label="SA Edition" bg={C.amberBg} color={C.amber} />
      </div>
      <div style={{ margin: "0 0 1rem 44px", display: "flex", alignItems: "center", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          Recipe import · Ingredient costing · SA pricing
        </p>
      </div>
    </div>
  );
}
