import Modal from "./Modal.jsx";

// Local copy of parsePackageInfo used only for display in candidate cards
function parsePackageInfo(str) {
  const s = str || "";
  const multiM = s.match(/(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  if (multiM) {
    return {
      packageValue: parseFloat(multiM[1]) * parseFloat(multiM[2]),
      packageUnit: multiM[3].toLowerCase(),
    };
  }
  const countM = s.match(/(\d+)\s*(?:s\b|units?\b|eggs?\b|rolls?\b|slices?\b|pcs?\b|pieces?\b)/i);
  if (countM) {
    return { packageValue: parseFloat(countM[1]), packageUnit: "units" };
  }
  const stdM = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  if (stdM) {
    return { packageValue: parseFloat(stdM[1]), packageUnit: stdM[2].toLowerCase() };
  }
  return { packageValue: null, packageUnit: null };
}

// Props: { reviewItem, reviewQueue, onAccept, onSkip }
export default function PriceReviewModal({ reviewItem, reviewQueue, onAccept, onSkip }) {
  if (!reviewItem) return null;

  const remaining = reviewQueue.length;

  return (
    <Modal open onClose={onSkip} style={{ maxWidth: 520, padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid var(--color-border-tertiary)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Choose product{remaining > 0 ? ` · ${remaining + 1} remaining` : ""}
            </p>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {reviewItem.ingredient.name}
            </h3>
          </div>
          <button
            onClick={onSkip}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary)", padding: 4, lineHeight: 1 }}
          >✕</button>
        </div>
      </div>

      {/* Candidate list */}
      <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {reviewItem.all.map(({ product }, idx) => {
          const titleStr = product.name || product.title || "Unknown product";
          const priceRaw = product.price ?? product.currentPrice ?? null;
          const price = priceRaw != null
            ? (typeof priceRaw === "string" ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) : Number(priceRaw))
            : null;
          const { packageValue, packageUnit } = parsePackageInfo(titleStr);
          return (
            <button
              key={idx}
              onClick={() => onAccept(product)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderRadius: 8, gap: 12,
                border: "2px solid var(--color-border-secondary)",
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#BA7517";
                e.currentTarget.style.background = "#FAEEDA";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--color-border-secondary)";
                e.currentTarget.style.background = "#fff";
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: "0 0 4px", fontSize: 14, fontWeight: 500,
                  color: "var(--color-text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {titleStr}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {price != null ? `R${price.toFixed(2)}` : "Price unavailable"}
                  {packageValue != null ? ` · ${packageValue}${packageUnit}` : ""}
                </p>
              </div>
              <span style={{
                padding: "6px 14px", fontSize: 12, borderRadius: 6, flexShrink: 0,
                background: "var(--color-background-secondary)",
                color: "var(--color-text-primary)",
                fontWeight: 500, border: "1px solid var(--color-border-secondary)",
                whiteSpace: "nowrap",
              }}>Select</span>
            </button>
          );
        })}
      </div>

      {/* Skip */}
      <div style={{ padding: "0 24px 20px" }}>
        <button
          onClick={onSkip}
          style={{
            width: "100%", padding: "10px", fontSize: 13,
            border: "1px solid var(--color-border-secondary)",
            background: "var(--color-background)",
            color: "var(--color-text-secondary)",
            borderRadius: 8, cursor: "pointer",
          }}
        >Skip — none of these match</button>
      </div>
    </Modal>
  );
}
