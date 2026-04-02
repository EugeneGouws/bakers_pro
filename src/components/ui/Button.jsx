export default function Button({ children, onClick, disabled, variant = "primary", style = {}, ...props }) {
  const base = {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
    fontSize: 14,
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.15s",
  };

  const variants = {
    primary: {
      background: "var(--color-amber, #EF9F27)",
      color: "#fff",
    },
    secondary: {
      background: "var(--color-background-secondary)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
    },
    danger: {
      background: "var(--color-danger-bg, #FCEBEB)",
      color: "var(--color-danger, #A32D2D)",
    },
    ghost: {
      background: "none",
      color: "var(--color-text-secondary)",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
