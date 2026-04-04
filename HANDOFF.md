# HANDOFF.md

**Last updated:** 2026-04-04 · branch: `v2.1` · **Status: v2.1 in progress**

## What was accomplished this session

- ✅ Non-blocking import flow — `onImportComplete` fires immediately; AI validation runs in the background via `.then()`
- ✅ Correction toast — fixed-bottom, auto-dismisses after 30s; Review opens inline diff panel with per-correction table; Accept all overwrites the saved recipe
- ✅ `detectAiBackend()` updated — accepts `'available'` and `'downloadable'` as aliases; returns `'chrome-needs-download'` when model needs downloading
- ✅ `triggerModelDownload()` exported — fires a silent Gemini Nano session create/destroy to trigger the browser download
- ✅ Chrome session — `expectedInputLanguages`/`expectedOutputLanguages` added to suppress browser warnings
- ✅ `validateParsedRecipe()` — optional 5th `backendOverride` param; treats `'chrome-needs-download'` as `'chrome'`
- ✅ Ollama timeout reduced 120s → 15s; `gemma3n:e2b` and `gemma3n:e4b` added to model picker
- ✅ AI download consent panel in ScannerTab — explains 1.7 GB download, two buttons, decision persisted to `bakerspro_consent_ai`
- ✅ Storage consent banner in App.jsx — fixed bottom, standard privacy notice, persisted to `bakerspro_consent_storage`
- ✅ Fixed `correctionToast`/`toast` naming crash bug in ScannerTab

## Current state

| Layer | Status | Notes |
|---|---|---|
| File import | ✅ stable | .txt .md .docx .pdf .xlsx |
| AI validation | ✅ stable | Gemini Nano (Chrome) + Ollama (dev); background, non-blocking |
| Correction toast | ✅ stable | Review/Dismiss, Accept all, 30s auto-dismiss |
| Consent screens | ✅ stable | Storage consent banner + AI download prompt |
| Ingredients DB | ✅ stable | Inline editing, bulk Apify/Checkers update, delete |
| Costing tab | ✅ stable | Ingredient breakdown, overhead, editable packaging/multipliers |
| Recipe Book | ✅ stable | List with live costs, ★ favourites, named collections |
| Price review modal | ✅ stable | White candidate boxes, amber hover |
| Tests | ❌ not started | No test framework configured |

## Known bugs

1. **#6: Unit mismatch in costing** (Deferred)
   - When recipe unit (g/ml) doesn't match DB unit (each), fallback matching produces garbage costs
   - Example: recipe "80g chocolate" matches DB "chocolate bar (1 each @ R52)" → shows R52/g
   - Status: User approved deferral; to be fixed server-side before production deploy

## v2.1 Backlog (Priority Order)

**Ready to implement:**
1. **Recipe Book: search/filter** — filter list by title, quick find by ingredient
2. **Recipe Book: duplicate detection** — warn on import if same title already exists
3. **Frontend design refactor** — extract colour tokens to CSS variables, normalise inline styles, complete dark mode

**Deferred (pending feedback):**
- **Bug #6: Unit mismatch detection** — awaiting beta testing; fix will be server-side

**Future (v2.2+):**
- **GitHub sync** — re-enable shareOnImport, community recipes/prices
- **Contributor identity** — display name in preferences
- **Price history** — track changes over time per ingredient

## Next session plan

1. **[TOP PRIORITY] Recipe Book search/filter** — add a search input above the recipe list; filter by title as user types
2. **Duplicate detection on import** — check existing recipe titles before calling `finishImport`; show a confirmation if match found
3. **Frontend design overhaul** — normalise inline styles across all tabs, flesh out dark mode

## Architecture reminder

- **Dependency direction:** tabs → lib/hooks → storage. Never the reverse.
- **Stable files (avoid touching):** `BakersCostPro.jsx` (v1.0 reference), `src/lib/storage.js`, `src/data/defaultIngredients.js`
- **Prices compute at render:** never stored in recipe objects; always via `matchIngredientEff()`
- **No logic in tabs:** all business logic lives in `lib/` or `hooks/`
- **localStorage keys:** `bakerspro_db` · `bakerspro_recipes` · `bakerspro_favourites` · `bakerspro_collections` · `bakerspro_preferences` · `bakerspro_consent_storage` · `bakerspro_consent_ai`
