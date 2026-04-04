import { useRef, useState, useEffect } from "react";
import { importFromFile } from "../../lib/recipeImport.js";
import { matchIngredientEff } from "../../lib/ingredients.js";
import { detectAiBackend, suggestIngredientFixes, triggerModelDownload, fetchOllamaModels } from "../../lib/parseValidator.js";
import ImportConfirmModal from "./ImportConfirmModal.jsx";

const C = {
  amber:       "#BA7517",
  amberMid:    "#EF9F27",
  amberBg:     "#FAEEDA",
  amberTxt:    "#633806",
  amberBorder: "#FAC775",
  danger:      "#A32D2D",
  dangerBg:    "#FCEBEB",
};

const AI_CONSENT_KEY = 'bakerspro_consent_ai';

// Props: { dbIngredients, onImportComplete }
export default function ScannerTab({ dbIngredients, onImportComplete }) {
  const fileRef = useRef(null);

  const [importing,     setImporting]     = useState(false);
  const [error,         setError]         = useState(null);
  const [aiBackend,     setAiBackend]     = useState('none');
  const [ollamaModels,  setOllamaModels]  = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [timeoutMs,     setTimeoutMs]     = useState(45000);
  // reviewData: null | { parsed, ingredients, aiStatus }
  const [reviewData,    setReviewData]    = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(AI_CONSENT_KEY);

    detectAiBackend().then(b => {
      let resolved = b;
      if (b === 'chrome-needs-download') {
        if (saved === 'accepted')  resolved = 'chrome';
        if (saved === 'declined')  resolved = 'none';
      }
      setAiBackend(resolved);

      fetchOllamaModels().then(models => {
        setOllamaModels(models);
        if (resolved === 'chrome') {
          setSelectedModel('gemini-nano');
        } else if (models.length > 0) {
          setSelectedModel(models[0]);
        }
      });
    });
  }, []);

  async function handleAiConsentAccept() {
    localStorage.setItem(AI_CONSENT_KEY, 'accepted');
    setAiBackend('chrome');
    setSelectedModel('gemini-nano');
    triggerModelDownload().catch(() => {});
  }

  function handleAiConsentDecline() {
    localStorage.setItem(AI_CONSENT_KEY, 'declined');
    setAiBackend('none');
    setSelectedModel(ollamaModels[0] ?? null);
  }

  const modelOptions = [
    ...(aiBackend === 'chrome' ? [{ value: 'gemini-nano', label: 'Gemini Nano (on-device)' }] : []),
    ...ollamaModels.map(m => ({ value: m, label: m })),
  ];

  function resolveSelection() {
    if (!selectedModel) return { backend: aiBackend, model: null };
    if (selectedModel === 'gemini-nano') return { backend: 'chrome', model: null };
    return { backend: 'ollama', model: selectedModel };
  }

  async function handleFile(file) {
    if (!file || importing) return;
    setError(null);
    setImporting(true);

    let parsed;
    try {
      parsed = await importFromFile(file);
      if (!parsed.ingredients.length)
        throw new Error("No ingredients found. Make sure the file has lines like '2 cups flour'.");
    } catch (e) {
      setError("File import failed: " + e.message);
      setImporting(false);
      return;
    }

    setImporting(false);

    const { backend, model } = resolveSelection();
    const aiActive = backend !== 'none' && backend !== 'chrome-needs-download';

    // Tag each ingredient with _matchStatus
    const taggedIngredients = parsed.ingredients.map(ing => {
      const dbMatch = matchIngredientEff(ing.name, ing.unit, dbIngredients);
      return {
        ...ing,
        _matchStatus: dbMatch ? 'matched' : (aiActive ? 'loading' : 'unmatched'),
        _suggestion: null,
      };
    });

    const unmatchedNames = taggedIngredients
      .filter(ing => ing._matchStatus === 'loading')
      .map(ing => ing.name);

    const initialStatus = aiActive && unmatchedNames.length > 0
      ? 'loading'
      : (aiActive ? 'done' : 'unavailable');

    setReviewData({ parsed, ingredients: taggedIngredients, aiStatus: initialStatus });

    if (!aiActive || !unmatchedNames.length) return;

    console.log('[AI] Backend:', backend, '| model:', model ?? 'gemini-nano', '| timeout:', timeoutMs);
    console.log('[AI] Unmatched names to fix:', unmatchedNames);

    suggestIngredientFixes(unmatchedNames, dbIngredients, backend, model, timeoutMs)
      .then(({ resolved, needsConfirm }) => {
        console.log('[AI] resolved:', resolved.length, '| needsConfirm:', needsConfirm.length);
        const resolvedMap = Object.fromEntries(resolved.map(r => [r.original, r]));
        const confirmMap  = Object.fromEntries(needsConfirm.map(r => [r.original, r]));
        setReviewData(prev => {
          if (!prev) return null;
          const updated = prev.ingredients.map(ing => {
            if (ing._matchStatus !== 'loading') return ing;
            if (resolvedMap[ing.name]) return { ...ing, _matchStatus: 'ai-resolved', _suggestion: resolvedMap[ing.name].suggested };
            if (confirmMap[ing.name])  return { ...ing, _matchStatus: 'ai-suggested', _suggestion: confirmMap[ing.name].suggested };
            return { ...ing, _matchStatus: 'unmatched' };
          });
          return { ...prev, ingredients: updated, aiStatus: 'done' };
        });
      })
      .catch(err => {
        console.warn('[AI] suggestIngredientFixes error:', err);
        setReviewData(prev => {
          if (!prev) return null;
          const updated = prev.ingredients.map(ing =>
            ing._matchStatus === 'loading' ? { ...ing, _matchStatus: 'unmatched' } : ing
          );
          return { ...prev, ingredients: updated, aiStatus: 'error' };
        });
      });
  }

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

      {/* AI DOWNLOAD CONSENT PANEL */}
      {aiBackend === 'chrome-needs-download' && (
        <div style={{
          background: C.amberBg, border: `1px solid ${C.amberBorder}`,
          borderRadius: 10, padding: "20px", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: C.amberTxt }}>
            Improve imports with on-device AI?
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: C.amberTxt, lineHeight: 1.6 }}>
            Gemini Nano can check and correct recipe imports — ingredient names, quantities, and units.
            Runs entirely on your device; your data never leaves your browser.
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: C.amber, fontWeight: 500 }}>
            Requires a one-time 1.7 GB download.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleAiConsentAccept} style={{
              background: C.amber, color: "#fff", border: "none",
              borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
            }}>
              Download &amp; enable (1.7 GB)
            </button>
            <button onClick={handleAiConsentDecline} style={{
              background: "none", border: `1px solid ${C.amberBorder}`, color: C.amberTxt,
              borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer",
            }}>
              Continue without AI
            </button>
          </div>
        </div>
      )}

      {/* FILE DROP ZONE + AI STATUS PANEL */}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 10 }}>

        <div
          onClick={() => !importing && fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          style={{
            flex: 1,
            border: `2px dashed ${importing ? C.amberMid : "var(--color-border-tertiary)"}`,
            borderRadius: 12, padding: "3rem 2rem",
            textAlign: "center", cursor: importing ? "default" : "pointer",
            background: importing ? C.amberBg : "var(--color-background-secondary)",
            transition: "all 0.15s",
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

        {/* AI STATUS PANEL */}
        <div style={{
          width: 180, flexShrink: 0,
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: 12, padding: "16px 14px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
            AI Status
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
              background:
                aiBackend === "chrome"                ? "#3B6D11" :
                aiBackend === "ollama"                ? C.amber :
                aiBackend === "chrome-needs-download" ? C.amberMid :
                "#BABABA",
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {aiBackend === "chrome"                ? "Gemini Nano" :
               aiBackend === "ollama"                ? "Ollama" :
               aiBackend === "chrome-needs-download" ? "Not downloaded" :
               "No AI"}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            {aiBackend === "chrome"                ? "On-device · checks each import" :
             aiBackend === "ollama"                ? "Dev mode · localhost:11434" :
             aiBackend === "chrome-needs-download" ? "1.7 GB download required" :
             "Imports confirmed without AI"}
          </p>

          {modelOptions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--color-text-secondary)" }} htmlFor="ai-model">
                Model
              </label>
              <select
                id="ai-model"
                value={selectedModel ?? ''}
                onChange={e => setSelectedModel(e.target.value)}
                style={{
                  fontSize: 12, padding: "3px 6px", borderRadius: 5,
                  border: "1px solid var(--color-border-secondary)",
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-primary)", cursor: "pointer", width: "100%",
                }}
              >
                {modelOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {aiBackend !== 'none' && aiBackend !== 'chrome-needs-download' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: "var(--color-text-secondary)" }} htmlFor="ai-timeout">
                Timeout
              </label>
              <select
                id="ai-timeout"
                value={timeoutMs}
                onChange={e => setTimeoutMs(Number(e.target.value))}
                style={{
                  fontSize: 12, padding: "3px 6px", borderRadius: 5,
                  border: "1px solid var(--color-border-secondary)",
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-primary)", cursor: "pointer", width: "100%",
                }}
              >
                {[
                  [15000,  "15s"],
                  [30000,  "30s"],
                  [45000,  "45s"],
                  [60000,  "1 min"],
                  [90000,  "1m 30s"],
                  [120000, "2 min"],
                  [180000, "3 min"],
                ].map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {aiBackend === "chrome-needs-download" && (
            <button onClick={handleAiConsentAccept} style={{
              background: C.amber, color: "#fff", border: "none",
              borderRadius: 6, padding: "6px 8px", fontSize: 11,
              cursor: "pointer", fontWeight: 600, width: "100%",
            }}>
              Download (1.7 GB)
            </button>
          )}
        </div>

      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".txt,.md,.docx,.pdf,.xlsx"
        onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        style={{ display: "none" }}
      />

      <p style={{ margin: "0 0 24px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        Tip: for best results, make sure the file has ingredient lines like "2 cups flour" or "500g butter".
        PDF and DOCX processing runs entirely in your browser.
      </p>

      {/* HOW IT WORKS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { step: "1", title: "Upload",           desc: "Drop or browse a .txt, .md, .docx, .pdf, or .xlsx recipe file" },
          { step: "2", title: "Review",           desc: "Confirm parsed ingredients before saving — AI checks while you read" },
          { step: "3", title: "DB matched",       desc: "Each ingredient is matched to your price database" },
          { step: "4", title: "Costs calculated", desc: "Full breakdown with overhead, packaging and markup" },
        ].map(item => (
          <div key={item.step} style={{
            background: "var(--color-background-secondary)", borderRadius: 10,
            padding: "14px", border: "0.5px solid var(--color-border-tertiary)",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: C.amberBg, color: C.amber, fontSize: 13, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
            }}>{item.step}</div>
            <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{item.title}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
        ℹ All data stored locally on your device
      </p>

      {/* IMPORT CONFIRM MODAL */}
      {reviewData && (
        <ImportConfirmModal
          reviewData={reviewData}
          onAccept={finalParsed => { onImportComplete(finalParsed); setReviewData(null); }}
          onImportAsIs={() => { onImportComplete(reviewData.parsed); setReviewData(null); }}
          onCancel={() => setReviewData(null)}
        />
      )}
    </div>
  );
}
