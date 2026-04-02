export default function Modal({ open, onClose, children, style = {} }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--color-background)",
          borderRadius: 12,
          padding: 24,
          width: "min(92vw, 520px)",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
