import { useState } from "react";
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

// Props: { recipes, activeRecipeId, setActiveRecipeId, recipe, enriched, ingTotal, overhead,
//          matchedCount, unmatchedCount,
//          packagingCost, setPackagingCost,
//          editingRecipe, setEditingRecipe, onSaveRecipeEdit, onStartEditRecipe,
//          onGoToScanner, onGoToDb }
export default function CostingTab({
  recipes, activeRecipeId, setActiveRecipeId,
  recipe, enriched, ingTotal, overhead,
  matchedCount, unmatchedCount,
  packagingCost, setPackagingCost,
  editingRecipe, setEditingRecipe,
  onSaveRecipeEdit, onStartEditRecipe,
  onGoToScanner, onGoToDb,
}) {
  // Local UI state for editable multipliers and per-serving
  const [multipliers, setMultipliers] = useState([2, 2.5, 3]);
  const [servings, setServings] = useState(() => recipe?.servings || 1);

  if (!recipes || recipes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-secondary)" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>💰</div>
        <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>No recipe imported yet</p>
        <p style={{ margin: "0 0 20px", fontSize: 13 }}>Go to the Upload tab to import a recipe</p>
        <button onClick={onGoToScanner} style={{
          padding: "9px 22px", borderRadius: 6, background: C.amber, color: "#fff",
          border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
        }}>Go to Upload</button>
      </div>
    );
  }

  function updateMultiplier(idx, val) {
    setMultipliers(m => m.map((v, i) => i === idx ? val : v));
  }

  return (
    <div>
      {/* RECIPE HISTORY SELECTOR */}
      {recipes.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--color-text-secondary)" }}>Recipe history</p>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {[...recipes].reverse().map(r => (
              <button
                key={r.id}
                onClick={() => setActiveRecipeId(r.id)}
                style={{
                  padding: "6px 14px", fontSize: 12, borderRadius: 100, whiteSpace: "nowrap",
                  border: `0.5px solid ${r.id === activeRecipeId ? C.amber : "var(--color-border-secondary)"}`,
                  background: r.id === activeRecipeId ? C.amberBg : "none",
                  color: r.id === activeRecipeId ? C.amber : "var(--color-text-secondary)",
                  cursor: "pointer", fontWeight: r.id === activeRecipeId ? 500 : 400,
                }}
              >
                {r.title} · {new Date(r.importedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
              </button>
            ))}
          </div>
        </div>
      )}

      {recipe && editingRecipe?.id === recipe.id ? (
        /* EDIT MODE */
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <input
              value={editingRecipe.title}
              onChange={e => setEditingRecipe(er => ({ ...er, title: e.target.value }))}
              style={{ fontSize: 17, fontWeight: 500, flex: 1, marginRight: 12, padding: "6px 10px", borderRadius: 6 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onSaveRecipeEdit} style={{
                padding: "7px 16px", fontSize: 13, borderRadius: 6,
                background: C.amber, color: "#fff", border: "none", cursor: "pointer", fontWeight: 500,
              }}>Save</button>
              <button onClick={() => setEditingRecipe(null)} style={{
                padding: "7px 14px", fontSize: 13, borderRadius: 6,
                border: "0.5px solid var(--color-border-secondary)",
                background: "none", color: "var(--color-text-secondary)", cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  {["Ingredient", "Amount", "Unit"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 0 ? "left" : "right",
                      padding: `8px ${i === 2 ? "0" : "10px"} 8px ${i === 0 ? "0" : "10px"}`,
                      fontWeight: 500, color: "var(--color-text-secondary)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editingRecipe.ingredients.map((ing, idx) => (
                  <tr key={ing.id ?? idx} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "7px 10px 7px 0" }}>
                      <input
                        type="text"
                        value={ing.name}
                        onChange={e => setEditingRecipe(er => ({
                          ...er,
                          ingredients: er.ingredients.map((x, i) =>
                            i === idx ? { ...x, name: e.target.value } : x
                          ),
                        }))}
                        style={{ width: "100%", fontSize: 13, padding: "3px 6px", borderRadius: 4, color: "var(--color-text-primary)" }}
                      />
                    </td>
                    <td style={{ padding: "7px 10px", textAlign: "right" }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={ing.amount}
                        onChange={e => setEditingRecipe(er => ({
                          ...er,
                          ingredients: er.ingredients.map((x, i) =>
                            i === idx ? { ...x, amount: parseFloat(e.target.value) || 0 } : x
                          ),
                        }))}
                        style={{ width: 80, textAlign: "right", fontSize: 13, padding: "3px 6px", borderRadius: 4 }}
                      />
                    </td>
                    <td style={{ padding: "7px 0 7px 10px", textAlign: "right" }}>
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={e => setEditingRecipe(er => ({
                          ...er,
                          ingredients: er.ingredients.map((x, i) =>
                            i === idx ? { ...x, unit: e.target.value } : x
                          ),
                        }))}
                        style={{ width: 60, textAlign: "right", fontSize: 13, padding: "3px 6px", borderRadius: 4, color: "var(--color-text-secondary)" }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : recipe ? (
        <div>
          {/* RECIPE HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: "0 0 5px", fontSize: 19, fontWeight: 500, color: "var(--color-text-primary)" }}>
                {recipe.title}
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge label={`${recipe.ingredients.length} ingredients`} />
                <Badge label={`${matchedCount} matched`} bg={C.successBg} color={C.success} />
                {unmatchedCount > 0 && (
                  <Badge label={`${unmatchedCount} need pricing`} bg={C.amberBg} color={C.amber} />
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onStartEditRecipe(recipe)}
                style={{
                  padding: "6px 14px", fontSize: 12, borderRadius: 6,
                  border: `0.5px solid ${C.amber}`,
                  background: "none", color: C.amber, cursor: "pointer",
                }}
              >Edit</button>
              <button
                onClick={onGoToScanner}
                style={{
                  padding: "6px 14px", fontSize: 12, borderRadius: 6,
                  border: "0.5px solid var(--color-border-secondary)",
                  background: "none", color: "var(--color-text-secondary)", cursor: "pointer",
                }}
              >Import another</button>
            </div>
          </div>

          {/* INGREDIENTS TABLE */}
          <div style={{ overflowX: "auto", marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  {["Ingredient", "Amount", "Unit", "R / unit", "Total"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 0 ? "left" : "right",
                      padding: `8px ${i === 4 ? "0" : "10px"} 8px ${i === 0 ? "0" : "10px"}`,
                      fontWeight: 500, color: "var(--color-text-secondary)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((ing) => (
                  <tr key={ing.id} style={{
                    borderBottom: "0.5px solid var(--color-border-tertiary)",
                    opacity: ing.dbMatch ? 1 : 0.65,
                  }}>
                    <td style={{ padding: "9px 10px 9px 0" }}>
                      <span style={{ color: "var(--color-text-primary)" }}>{ing.name}</span>
                      {ing.dbMatch?.needsCosting && (
                        <span style={{
                          fontSize: 10, marginLeft: 6, background: C.amberBg, color: C.amber,
                          padding: "1px 6px", borderRadius: 4, fontWeight: 500,
                        }}>needs pricing</span>
                      )}
                      {!ing.dbMatch && (
                        <span style={{
                          fontSize: 10, marginLeft: 6, background: C.dangerBg, color: C.danger,
                          padding: "1px 6px", borderRadius: 4, fontWeight: 500,
                        }}>not in DB</span>
                      )}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--color-text-primary)" }}>{ing.amount}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--color-text-secondary)" }}>{ing.unit}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--color-text-secondary)" }}>
                      {ing.dbMatch && ing.dbMatch.costPerUnit > 0
                        ? `R${ing.dbMatch.costPerUnit < 1 ? ing.dbMatch.costPerUnit.toFixed(4) : ing.dbMatch.costPerUnit.toFixed(2)}`
                        : "—"}
                    </td>
                    <td style={{ padding: "9px 0 9px 10px", textAlign: "right", fontWeight: 500, color: ing.lineTotal ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                      {ing.lineTotal != null ? `R${ing.lineTotal.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* COST BREAKDOWN */}
          {overhead && (
            <div style={{
              background: "var(--color-background-secondary)", borderRadius: 12,
              padding: "16px 20px", border: "0.5px solid var(--color-border-tertiary)", marginBottom: 16,
            }}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>Cost breakdown</p>

              {/* Ingredients */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Ingredients</span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{ingTotal.toFixed(2)}</span>
              </div>

              {/* Supplies (5% flat) */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Supplies (5%)</span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{overhead.supplies.toFixed(2)}</span>
              </div>

              {/* Operating costs (5%) */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Operating costs (5%)</span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{overhead.opCost.toFixed(2)}</span>
              </div>

              {/* Equipment (5%) */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Equipment (5%)</span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{overhead.equipment.toFixed(2)}</span>
              </div>

              {/* Packaging — editable */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Packaging</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>R</span>
                  <input
                    type="number" min="0" step="0.5"
                    value={packagingCost}
                    onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)}
                    style={{
                      width: 56, textAlign: "right", fontSize: 13, padding: "3px 6px", borderRadius: 4,
                      background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)",
                      color: "var(--color-text-primary)", fontWeight: 500,
                    }}
                  />
                </div>
              </div>

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 8px", fontSize: 16 }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Total cost</span>
                <span style={{ fontWeight: 500, color: C.amber, fontSize: 20 }}>R{overhead.total.toFixed(2)}</span>
              </div>

              {/* SELL PRICE CARDS — editable multipliers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
                {multipliers.map((mult, idx) => (
                  <div key={idx} style={{
                    background: C.amberBg, borderRadius: 8, padding: "10px 12px",
                    border: `0.5px solid ${C.amberBorder}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#854F0B" }}>Sell at</span>
                      <input
                        type="number" min="0.1" step="0.1"
                        value={mult}
                        onChange={e => updateMultiplier(idx, parseFloat(e.target.value) || 1)}
                        style={{
                          width: 42, fontSize: 11, fontWeight: 600, padding: "1px 4px", borderRadius: 3,
                          border: "1px solid rgba(133, 79, 11, 0.25)", background: "rgba(255,255,255,0.5)",
                          color: "#854F0B", textAlign: "center",
                        }}
                      />
                      <span style={{ fontSize: 11, color: "#854F0B" }}>×</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: C.amberTxt }}>
                      R{(overhead.total * mult).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PER SERVING BLOCK */}
          {overhead && (
            <div style={{
              background: "var(--color-background-secondary)", borderRadius: 12,
              padding: "16px 20px", border: "0.5px solid var(--color-border-tertiary)", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>Per serving</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Servings</label>
                  <input
                    type="number" min="1" step="1"
                    value={servings}
                    onChange={e => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: 52, textAlign: "center", fontSize: 13, padding: "4px 6px", borderRadius: 4,
                      border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)",
                      color: "var(--color-text-primary)", fontWeight: 500,
                    }}
                  />
                </div>
              </div>

              {/* Cost per serving */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Cost per serving</span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{(overhead.total / servings).toFixed(2)}</span>
              </div>

              {/* Sell per serving for each multiplier */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10 }}>
                {multipliers.map((mult, idx) => (
                  <div key={idx} style={{
                    background: C.amberBg, borderRadius: 8, padding: "10px 12px",
                    border: `0.5px solid ${C.amberBorder}`,
                  }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#854F0B" }}>Sell at {mult}×</p>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: C.amberTxt }}>
                      R{((overhead.total * mult) / servings).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEEDS PRICING WARNING */}
          {unmatchedCount > 0 && (
            <div style={{
              background: C.amberBg, borderRadius: 8,
              padding: "12px 16px", border: `0.5px solid ${C.amberBorder}`,
            }}>
              <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 500, color: "#854F0B" }}>
                {unmatchedCount} ingredient{unmatchedCount > 1 ? "s" : ""} need pricing
              </p>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#854F0B" }}>
                {enriched.filter(i => !i.dbMatch || i.dbMatch.needsCosting).map(i => i.name).join(", ")}
              </p>
              <button
                onClick={onGoToDb}
                style={{
                  padding: "6px 14px", fontSize: 12, borderRadius: 6,
                  background: C.amber, color: "#fff",
                  border: "none", cursor: "pointer", fontWeight: 500,
                }}
              >Update prices in DB</button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
