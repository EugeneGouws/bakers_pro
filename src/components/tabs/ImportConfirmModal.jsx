import { useState, useEffect } from "react";

const C = {
  amber:       "#BA7517",
  amberMid:    "#EF9F27",
  amberBg:     "#FAEEDA",
  amberTxt:    "#633806",
  amberBorder: "#FAC775",
  green:       "#3B6D11",
  greenBg:     "#EEF5E8",
  danger:      "#A32D2D",
  dangerBg:    "#FCEBEB",
};

/**
 * Props:
 *   reviewData: { parsed, ingredients, aiStatus }
 *     ingredients: [{ name, amount, unit, _matchStatus, _suggestion }]
 *       _matchStatus: 'matched' | 'unmatched' | 'loading' | 'ai-resolved' | 'ai-suggested'
 *     aiStatus: 'loading' | 'done' | 'error' | 'unavailable'
 *   onAccept(finalParsed)  — called with corrected parsed object
 *   onImportAsIs()         — import original without AI changes
 *   onCancel()
 */
export default function ImportConfirmModal({ reviewData, onAccept, onImportAsIs, onCancel }) {
  const [userChoices, setUserChoices] = useState({});
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 700);
    return () => clearInterval(id);
  }, []);

  if (!reviewData) return null;

  const { parsed, ingredients, aiStatus } = reviewData;

  function handleAccept() {
    const finalIngredients = ingredients.map((ing, i) => {
      const base = { name: ing.name, amount: ing.amount, unit: ing.unit };
      if (ing._matchStatus === 'ai-resolved') return { ...base, name: ing._suggestion };
      if (ing._matchStatus === 'ai-suggested' && userChoices[i] === true) return { ...base, name: ing._suggestion };
      return base;
    });
    onAccept({ ...parsed, ingredients: finalIngredients });
  }

  function StatusDot({ status }) {
    if (status === 'matched' || status === 'ai-resolved') {
      return <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block", flexShrink: 0 }} />;
    }
    if (status === 'ai-suggested') {
      return <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.amberMid, display: "inline-block", flexShrink: 0 }} />;
    }
    if (status === 'loading') {
      return <span style={{ width: 8, height: 8, borderRadius: "50%", background: pulse ? C.amberMid : C.amberBg, display: "inline-block", flexShrink: 0, transition: "background 0.3s" }} />;
    }
    return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#BABABA", display: "inline-block", flexShrink: 0 }} />;
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: "var(--color-background-secondary)",
        borderRadius: 14, padding: "24px",
        width: "100%", maxWidth: 560,
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {parsed.title}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
            {parsed.servings} serving{parsed.servings !== 1 ? "s" : ""}
            &nbsp;·&nbsp;{ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Ingredients table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
              <th style={{ textAlign: "right", padding: "4px 8px 4px 0", fontWeight: 600, color: "var(--color-text-secondary)", width: 56 }}>Qty</th>
              <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600, color: "var(--color-text-secondary)", width: 48 }}>Unit</th>
              <th style={{ textAlign: "left", padding: "4px 0", fontWeight: 600, color: "var(--color-text-secondary)" }}>Ingredient</th>
              <th style={{ textAlign: "center", padding: "4px 0 4px 8px", fontWeight: 600, color: "var(--color-text-secondary)", width: 20 }}></th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ textAlign: "right", padding: "6px 8px 6px 0", color: "var(--color-text-primary)", verticalAlign: "top" }}>{ing.amount}</td>
                <td style={{ padding: "6px 8px", color: "var(--color-text-secondary)", verticalAlign: "top" }}>{ing.unit}</td>
                <td style={{ padding: "6px 0", color: "var(--color-text-primary)" }}>
                  <span>{ing.name}</span>
                  {ing._matchStatus === 'ai-resolved' && (
                    <span style={{ marginLeft: 6, fontSize: 11 }}>
                      <span style={{
                        background: C.greenBg, border: `1px solid ${C.green}55`,
                        borderRadius: 4, padding: "1px 4px", fontWeight: 700, color: C.green,
                      }}>AI</span>
                      <span style={{ color: C.green, marginLeft: 4 }}>→ "{ing._suggestion}"</span>
                    </span>
                  )}
                  {ing._matchStatus === 'ai-suggested' && (
                    <div style={{ marginTop: 5, fontSize: 12, color: C.amberTxt }}>
                      Did you mean: <em>{ing._suggestion}</em>?
                      <button
                        onClick={() => setUserChoices(c => ({ ...c, [i]: true }))}
                        style={{
                          marginLeft: 8, fontSize: 11, padding: "1px 7px",
                          borderRadius: 4, border: `1px solid ${C.amberBorder}`,
                          background: userChoices[i] === true ? C.amberMid : "none",
                          color: userChoices[i] === true ? "#fff" : C.amberTxt,
                          cursor: "pointer",
                        }}
                      >Yes</button>
                      <button
                        onClick={() => setUserChoices(c => ({ ...c, [i]: false }))}
                        style={{
                          marginLeft: 4, fontSize: 11, padding: "1px 7px",
                          borderRadius: 4, border: "1px solid var(--color-border-secondary)",
                          background: userChoices[i] === false ? "#E0E0E0" : "none",
                          color: "var(--color-text-secondary)",
                          cursor: "pointer",
                        }}
                      >No</button>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: "center", padding: "6px 0 6px 8px", verticalAlign: "top", paddingTop: 10 }}>
                  <StatusDot status={ing._matchStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* AI status footer */}
        {aiStatus === 'loading' && (
          <div style={{
            background: C.amberBg, border: `1px solid ${C.amberBorder}`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.amberTxt,
          }}>
            ⏳ AI checking unmatched ingredients…
          </div>
        )}
        {aiStatus === 'error' && (
          <div style={{
            background: C.dangerBg, border: "1px solid #F7C1C1",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.danger,
          }}>
            AI check failed — review ingredients manually before importing.
          </div>
        )}
        {aiStatus === 'done' && (
          <div style={{
            background: C.greenBg, border: `1px solid ${C.green}33`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.green,
          }}>
            ✓ AI check complete
          </div>
        )}
        {aiStatus === 'unavailable' && (
          <div style={{
            background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--color-text-secondary)",
          }}>
            AI not connected — unmatched ingredients will be added with no price.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "1px solid var(--color-border-secondary)",
              color: "var(--color-text-secondary)",
              borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onImportAsIs}
            style={{
              background: "var(--color-background-secondary)",
              border: "1px solid var(--color-border-secondary)",
              color: "var(--color-text-primary)",
              borderRadius: 6, padding: "8px 16px", fontSize: 13,
              cursor: "pointer", fontWeight: 500,
            }}
          >
            Use as parsed
          </button>
          <button
            onClick={handleAccept}
            style={{
              background: C.amber, color: "#fff",
              border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13,
              cursor: "pointer", fontWeight: 600,
            }}
          >
            {aiStatus === 'loading' ? "Accept (AI running…)" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
