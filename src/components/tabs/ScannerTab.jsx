import { useRef } from "react";

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

// Props: { importing, onImportFile, error, onClearError }
export default function ScannerTab({ importing, onImportFile, error, onClearError }) {
  const fileRef = useRef(null);

  return (
    <div>
      {/* ERROR BANNER */}
      {error && (
        <div style={{
          background: C.dangerBg, color: C.danger,
          border: "0.5px solid #F7C1C1",
          borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
        }}>
          <span>{error}</span>
          <button onClick={onClearError} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, flexShrink: 0, fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* FILE DROP ZONE */}
      <div
        onClick={() => !importing && fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onImportFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${importing ? C.amberMid : "var(--color-border-tertiary)"}`,
          borderRadius: 12, padding: "3rem 2rem",
          textAlign: "center", cursor: importing ? "default" : "pointer",
          background: importing ? C.amberBg : "var(--color-background-secondary)",
          marginBottom: 10, transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>{importing ? "⏳" : "📄"}</div>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {importing ? "Reading file…" : "Drop a recipe file here"}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          or tap to browse — <strong>.txt</strong>, <strong>.md</strong>, <strong>.docx</strong>, <strong>.pdf</strong>, <strong>.xlsx</strong> supported
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,.docx,.pdf,.xlsx"
        onChange={e => onImportFile(e.target.files?.[0])}
        style={{ display: "none" }}
      />
      <p style={{ margin: "0 0 24px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        Tip: for best results, make sure the file has ingredient lines like "2 cups flour" or "500g butter".
        PDF and DOCX processing runs entirely in your browser.
      </p>

      {/* HOW IT WORKS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { step: "1", title: "Upload",            desc: "Drop or browse a .txt, .md, .docx, .pdf, or .xlsx recipe file" },
          { step: "2", title: "Ingredients read",  desc: "Ingredient lines are extracted and parsed automatically" },
          { step: "3", title: "DB matched",        desc: "Each ingredient is matched to your price database" },
          { step: "4", title: "Costs calculated",  desc: "Full breakdown with overhead, packaging and markup" },
        ].map(item => (
          <div key={item.step} style={{
            background: "var(--color-background-secondary)", borderRadius: 10,
            padding: "14px", border: "0.5px solid var(--color-border-tertiary)",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: C.amberBg, color: C.amber,
              fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
            }}>{item.step}</div>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
