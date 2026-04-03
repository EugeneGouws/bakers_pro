import { useRef, useState, useEffect } from "react";
import { importFromFile } from "../../lib/recipeImport.js";
import { detectAiBackend, validateParsedRecipe } from "../../lib/parseValidator.js";

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

// Props: { dbIngredients, onImportComplete }
export default function ScannerTab({ dbIngredients, onImportComplete }) {
  const fileRef = useRef(null);

  const [importing,   setImporting]   = useState(false);
  const [aiChecking,  setAiChecking]  = useState(false);
  const [error,       setError]       = useState(null);
  const [aiBackend,   setAiBackend]   = useState("none");
  const [corrections, setCorrections] = useState(null); // null = no pending notice
  const [pendingResult, setPendingResult] = useState(null);

  useEffect(() => {
    detectAiBackend().then(setAiBackend);
  }, []);

  async function handleFile(file) {
    if (!file || importing || aiChecking) return;
    setError(null);
    setCorrections(null);
    setPendingResult(null);
    setImporting(true);

    let rawText = "";
    let parsed;
    try {
      // Read raw text for the AI prompt (best-effort; unsupported types skip AI)
      try { rawText = await file.text(); } catch { rawText = ""; }
      parsed = await importFromFile(file);
      if (!parsed.ingredients.length)
        throw new Error("No ingredients found. Make sure the file contains lines like '2 cups flour'.");
    } catch (e) {
      setError("File import failed: " + e.message);
      setImporting(false);
      return;
    }

    setImporting(false);

    if (aiBackend === "none") {
      onImportComplete(parsed);
      return;
    }

    setAiChecking(true);
    try {
      const { result, corrected, corrections: list } = await validateParsedRecipe(
        rawText, parsed, dbIngredients
      );
      if (corrected && list.length > 0) {
        setCorrections(list);
        setPendingResult(result);
      } else {
        onImportComplete(result);
      }
    } catch {
      onImportComplete(parsed);
    } finally {
      setAiChecking(false);
    }
  }

  function confirmWithCorrections() {
    if (pendingResult) onImportComplete(pendingResult);
    setCorrections(null);
    setPendingResult(null);
  }

  function dismissCorrections() {
    if (pendingResult) onImportComplete(pendingResult);
    setCorrections(null);
    setPendingResult(null);
  }

  const busy = importing || aiChecking;

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
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, flexShrink: 0, fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* AI CORRECTIONS NOTICE */}
      {corrections && (
        <div style={{
          background: "#FFFBEB", color: C.amberTxt,
          border: `1px solid ${C.amberBorder}`,
          borderRadius: 8, padding: "12px 14px", fontSize: 13, marginBottom: 16,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            AI made {corrections.length} correction{corrections.length !== 1 ? "s" : ""}
          </div>
          <ul style={{ margin: "0 0 10px", paddingLeft: 18, lineHeight: 1.7 }}>
            {corrections.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <button
            onClick={confirmWithCorrections}
            style={{
              background: C.amber, color: "#fff", border: "none",
              borderRadius: 6, padding: "6px 14px", fontSize: 13,
              cursor: "pointer", fontWeight: 500,
            }}
          >
            Use corrected recipe
          </button>
          <button
            onClick={dismissCorrections}
            style={{
              background: "none", border: "none", color: C.amber,
              fontSize: 13, cursor: "pointer", marginLeft: 10,
            }}
          >
            Continue anyway
          </button>
        </div>
      )}

      {/* FILE DROP ZONE */}
      <div
        onClick={() => !busy && fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${busy ? C.amberMid : "var(--color-border-tertiary)"}`,
          borderRadius: 12, padding: "3rem 2rem",
          textAlign: "center", cursor: busy ? "default" : "pointer",
          background: busy ? C.amberBg : "var(--color-background-secondary)",
          marginBottom: 10, transition: "all 0.15s",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>{busy ? "⏳" : "📄"}</div>
        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {importing ? "Reading file…" : aiChecking ? "Checking with on-device AI…" : "Drop a recipe file here"}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          or tap to browse — <strong>.txt</strong>, <strong>.md</strong>, <strong>.docx</strong>, <strong>.pdf</strong>, <strong>.xlsx</strong> supported
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,.docx,.pdf,.xlsx"
        onChange={e => handleFile(e.target.files?.[0])}
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

      {/* INFO BADGE */}
      <p style={{ margin: "16px 0 0", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
        {aiBackend === "chrome" && (
          <>ℹ This app stores all data locally on your device. It also uses Chrome's on-device AI to improve recipe imports — your data never leaves your device.</>
        )}
        {aiBackend === "ollama" && (
          <>ℹ Dev mode — using local Ollama for AI validation (qwen2.5:1.5b).</>
        )}
        {aiBackend === "none" && (
          <>ℹ This app stores all data locally on your device.</>
        )}
      </p>
    </div>
  );
}
