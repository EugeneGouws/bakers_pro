const C = {
  amber:       "#BA7517",
  amberBg:     "#FAEEDA",
  dangerBg:    "#FCEBEB",
  danger:      "#A32D2D",
};

export default function NewIngredientModal({ isOpen, newIngredients, onConfirm, onCancel }) {
  if (!isOpen || !newIngredients || newIngredients.length === 0) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "var(--color-background-primary)",
        borderRadius: 12, padding: 24, maxWidth: 400,
        border: "1px solid var(--color-border-secondary)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
      }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>
          New ingredients detected
        </h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          The following ingredient{newIngredients.length !== 1 ? "s are" : " is"} not in your database. They will be added as new entries:
        </p>

        <div style={{
          background: C.dangerBg, borderRadius: 8, padding: 12, marginBottom: 16,
          border: `0.5px solid ${C.danger}`,
        }}>
          <ul style={{ margin: 0, paddingLeft: 20, color: C.danger, fontSize: 13 }}>
            {newIngredients.map((ing) => (
              <li key={ing.name} style={{ marginBottom: 4 }}>
                {ing.name}
              </li>
            ))}
          </ul>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--color-text-secondary)" }}>
          You can add prices for these ingredients later in the Ingredients DB tab.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "7px 16px", fontSize: 13, borderRadius: 6,
              background: "none", border: "0.5px solid var(--color-border-secondary)",
              color: "var(--color-text-secondary)", cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={() => onConfirm()}
            style={{
              padding: "7px 16px", fontSize: 13, borderRadius: 6,
              background: C.amber, color: "#fff", border: "none", cursor: "pointer", fontWeight: 500,
            }}
          >Add to recipe</button>
        </div>
      </div>
    </div>
  );
}
