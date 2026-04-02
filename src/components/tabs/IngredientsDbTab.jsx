import Badge from "../ui/Badge.jsx";

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

function isOutdated(dateStr) {
  if (!dateStr) return true;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 > 30;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
}

// Props: { dbState, dbSearch, setDbSearch, selectedIngredients, setSelectedIngredients,
//          editingCell, setEditingCell, editValue, setEditValue, commitEdit,
//          editingPackage, setEditingPackage, pkgEditVal, setPkgEditVal, commitPackageEdit,
//          priceRunning, priceProgress, onRunPriceUpdate, needsCostingCount, onDeleteIngredient }
// commitEdit(name, field) — field: "name" | "costPerUnit" | "matchedProductName"
export default function IngredientsDbTab({
  dbState, dbSearch, setDbSearch,
  selectedIngredients, setSelectedIngredients,
  editingCell, setEditingCell, editValue, setEditValue, commitEdit,
  editingPackage, setEditingPackage, pkgEditVal, setPkgEditVal, commitPackageEdit,
  priceRunning, priceProgress, onRunPriceUpdate,
  needsCostingCount, onDeleteIngredient,
}) {
  const filteredDb = dbState.filter(i =>
    !dbSearch || i.name.toLowerCase().includes(dbSearch.toLowerCase())
  );

  return (
    <div>
      {/* PRICE UPDATE TOOLBAR */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={onRunPriceUpdate}
          disabled={priceRunning || selectedIngredients.size === 0}
          style={{
            padding: "8px 18px", fontSize: 13, borderRadius: 8, fontWeight: 500,
            background: priceRunning || selectedIngredients.size === 0 ? "var(--color-background-secondary)" : C.amber,
            color: priceRunning || selectedIngredients.size === 0 ? "var(--color-text-secondary)" : "#fff",
            border: "none",
            cursor: priceRunning || selectedIngredients.size === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {priceRunning
            ? "Updating…"
            : `Update selected prices${selectedIngredients.size > 0 ? ` (${selectedIngredients.size})` : ""}`}
        </button>
        {priceProgress && (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            {priceProgress.done < priceProgress.total
              ? `${priceProgress.done} / ${priceProgress.total} — checking "${priceProgress.current}"…`
              : `Done — ${priceProgress.total} ingredient${priceProgress.total !== 1 ? "s" : ""} processed`}
          </span>
        )}
      </div>

      {/* SEARCH + BADGE */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search ingredients…"
          value={dbSearch}
          onChange={e => setDbSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {needsCostingCount > 0 && (
          <Badge label={`${needsCostingCount} need costing`} bg={C.amberBg} color={C.amber} />
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              {/* Select-all checkbox */}
              <th style={{ padding: "8px 10px 8px 0", width: 32 }}>
                <input
                  type="checkbox"
                  checked={filteredDb.length > 0 && filteredDb.every(i => selectedIngredients.has(i.name))}
                  ref={el => {
                    if (el) el.indeterminate =
                      filteredDb.some(i => selectedIngredients.has(i.name)) &&
                      !filteredDb.every(i => selectedIngredients.has(i.name));
                  }}
                  onChange={() => {
                    const allChecked = filteredDb.every(i => selectedIngredients.has(i.name));
                    const next = new Set(selectedIngredients);
                    filteredDb.forEach(i => allChecked ? next.delete(i.name) : next.add(i.name));
                    setSelectedIngredients(next);
                  }}
                  style={{ cursor: "pointer" }}
                />
              </th>
              {["Ingredient", "Unit", "R / unit", "Last updated", "Status", "Package", "Matched product", ""].map((h, i) => (
                <th key={h} style={{
                  textAlign: i >= 2 && i <= 3 ? "center" : "left",
                  padding: "8px 10px 8px 0", fontWeight: 500, color: "var(--color-text-secondary)",
                  whiteSpace: "nowrap", minWidth: i === 6 ? 180 : "auto",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDb.map((ing) => {
              const editingName    = editingCell?.name === ing.name && editingCell?.field === "name";
              const editing        = editingCell?.name === ing.name && editingCell?.field === "costPerUnit";
              const editingProdName = editingCell?.name === ing.name && editingCell?.field === "matchedProductName";
              const editingPkg     = editingPackage?.name === ing.name;
              const needsCost      = ing.needsCosting || ing.costPerUnit === 0;
              const outdated       = isOutdated(ing.dateLastUpdated);
              const checked        = selectedIngredients.has(ing.name);
              return (
                <tr key={ing.name} style={{
                  borderBottom: "0.5px solid var(--color-border-tertiary)",
                  background: checked ? C.amberBg : "transparent",
                }}>
                  {/* Row checkbox */}
                  <td style={{ padding: "8px 10px 8px 0" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(selectedIngredients);
                        checked ? next.delete(ing.name) : next.add(ing.name);
                        setSelectedIngredients(next);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ padding: "8px 10px 8px 0", minWidth: 140 }}>
                    {editingName ? (
                      <input
                        type="text" autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(ing.name, "name")}
                        onKeyDown={e => {
                          if (e.key === "Enter") commitEdit(ing.name, "name");
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        style={{ width: "100%", fontSize: 13, padding: "2px 6px", borderRadius: 4 }}
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingCell({ name: ing.name, field: "name" }); setEditValue(ing.name); }}
                        title="Click to rename (used as Apify search term)"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--color-text-primary)", fontSize: 13,
                          padding: "2px 4px", borderRadius: 4,
                          textDecoration: "underline dotted",
                          textAlign: "left",
                        }}
                      >{ing.name}</button>
                    )}
                  </td>
                  <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)" }}>
                    {ing.unit}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    {editing ? (
                      <input
                        type="number" min="0" step="0.0001"
                        value={editValue} autoFocus
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(ing.name)}
                        onKeyDown={e => {
                          if (e.key === "Enter") commitEdit(ing.name);
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        style={{ width: 80, textAlign: "right", fontSize: 13, padding: "2px 6px", borderRadius: 4 }}
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingCell({ name: ing.name, field: "costPerUnit" }); setEditValue(String(ing.costPerUnit)); }}
                        title="Click to edit"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          fontWeight: 500, color: needsCost ? C.danger : C.amber,
                          fontSize: 13, padding: "2px 4px", borderRadius: 4,
                          textDecoration: "underline dotted",
                        }}
                      >
                        R{ing.costPerUnit < 0.1 ? ing.costPerUnit.toFixed(5) : ing.costPerUnit < 1 ? ing.costPerUnit.toFixed(4) : ing.costPerUnit.toFixed(2)}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 12 }}>
                    {fmtDate(ing.dateLastUpdated)}
                  </td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {needsCost && <Badge label="Needs costing" bg={C.amberBg} color={C.amber} />}
                      {outdated && !needsCost && <Badge label="Outdated" bg={C.amberBg} color={C.amber} />}
                      {!needsCost && !outdated && <Badge label="OK" bg={C.successBg} color={C.success} />}
                    </div>
                  </td>
                  <td style={{ padding: "8px 0 8px 10px", color: "var(--color-text-secondary)", fontSize: 12 }}>
                    {editingPkg ? (
                      <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input
                          type="number" min="0" step="any" autoFocus
                          value={pkgEditVal.packageValue}
                          onChange={e => setPkgEditVal(v => ({ ...v, packageValue: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitPackageEdit(ing.name);
                            if (e.key === "Escape") setEditingPackage(null);
                          }}
                          placeholder="qty"
                          style={{ width: 52, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}
                        />
                        <input
                          type="text"
                          value={pkgEditVal.packageUnit}
                          onChange={e => setPkgEditVal(v => ({ ...v, packageUnit: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitPackageEdit(ing.name);
                            if (e.key === "Escape") setEditingPackage(null);
                          }}
                          placeholder="g/ml"
                          style={{ width: 44, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}
                        />
                        <input
                          type="number" min="0" step="any"
                          value={pkgEditVal.packagePrice}
                          onChange={e => setPkgEditVal(v => ({ ...v, packagePrice: e.target.value }))}
                          onBlur={() => commitPackageEdit(ing.name)}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitPackageEdit(ing.name);
                            if (e.key === "Escape") setEditingPackage(null);
                          }}
                          placeholder="R"
                          style={{ width: 48, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}
                        />
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPackage({ name: ing.name });
                          setPkgEditVal({ packageValue: String(ing.packageValue ?? ""), packageUnit: ing.packageUnit ?? "", packagePrice: "" });
                        }}
                        title="Click to edit package info"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: C.amber, fontSize: 12, padding: "2px 4px", borderRadius: 4,
                          textDecoration: "underline dotted", textAlign: "left",
                        }}
                      >
                        {ing.packageValue != null ? `${ing.packageValue}${ing.packageUnit}` : (ing.pkg ?? "—")}
                        {ing.pricePerBaseUnit != null ? ` · R${ing.pricePerBaseUnit.toFixed(4)}/${ing.baseUnit}` : ""}
                      </button>
                    )}
                  </td>
                  {/* Matched product */}
                  <td style={{ padding: "8px 10px 8px 0", color: "var(--color-text-secondary)", fontSize: 12, minWidth: 180 }}>
                    {editingProdName ? (
                      <input
                        type="text" autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(ing.name, "matchedProductName")}
                        onKeyDown={e => {
                          if (e.key === "Enter") commitEdit(ing.name, "matchedProductName");
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        style={{ width: "100%", fontSize: 12, padding: "2px 6px", borderRadius: 4 }}
                      />
                    ) : ing.matchedProductName ? (
                      <button
                        onClick={() => { setEditingCell({ name: ing.name, field: "matchedProductName" }); setEditValue(ing.matchedProductName); }}
                        title="Click to edit"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--color-text-secondary)", fontSize: 12, padding: "2px 4px", borderRadius: 4,
                          textDecoration: "underline dotted", textAlign: "left",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180, display: "block",
                        }}
                      >{ing.matchedProductName}</button>
                    ) : (
                      <span style={{ opacity: 0.4 }}>—</span>
                    )}
                  </td>
                  {/* Delete button */}
                  <td style={{ padding: "8px 10px 8px 0", textAlign: "center" }}>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${ing.name}" from ingredients?`)) {
                          onDeleteIngredient(ing.name);
                        }
                      }}
                      title="Delete ingredient"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 14, color: C.danger, padding: "2px 6px", borderRadius: 4,
                        opacity: 0.6, lineHeight: 1,
                      }}
                    >✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
        {filteredDb.length} of {dbState.length} ingredients · Click any <em>Ingredient</em> name to rename (affects Apify search) · Click <em>R / unit</em> to edit price · Prices in ZAR
      </p>
    </div>
  );
}
