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

// Props: { tab, setTab, needsCostingCount, recipeCount }
export default function TabBar({ tab, setTab, needsCostingCount, recipeCount }) {
  const tabs = [
    { id: "scan",  label: "Upload" },
    { id: "db",    label: needsCostingCount > 0 ? `Ingredients DB (${needsCostingCount})` : "Ingredients DB" },
    { id: "cost",  label: "Costing" },
    { id: "book",  label: recipeCount > 0 ? `Recipe Book (${recipeCount})` : "Recipe Book" },
  ];

  return (
    <div style={{ display: "flex", marginBottom: -1 }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 18px", fontSize: 13,
            fontWeight: active ? 500 : 400,
            color: active ? C.amber : "var(--color-text-secondary)",
            background: "none", border: "none",
            borderBottom: active ? `2px solid ${C.amber}` : "2px solid transparent",
            cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap",
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}
