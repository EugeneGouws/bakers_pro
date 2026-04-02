export default function Badge({ label, bg, color }) {
  return (
    <span style={{
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 100,
      background: bg || "var(--color-background-secondary)",
      color: color || "var(--color-text-secondary)",
      fontWeight: 500,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}
