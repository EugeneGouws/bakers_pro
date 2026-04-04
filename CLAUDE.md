# CLAUDE.md — v2.0

## Commands

npm run dev | npm run build | npm run lint | npm run preview

## Architecture

Baker's Cost Pro v2.0 — React 19 + Vite, local-first, modular.
All personal data lives in localStorage. Community features are v2.1+.

## Folder structure

src/
App.jsx                  — tab routing, shared state provider
main.jsx                 — entry point
components/
tabs/
ScannerTab.jsx
ImportConfirmModal.jsx
IngredientsDbTab.jsx
CostingTab.jsx
RecipeBookTab.jsx
LivePricesTab.jsx
ui/
Header.jsx
TabBar.jsx
Badge.jsx
Button.jsx
Modal.jsx
PriceReviewModal.jsx
hooks/
useDb.js
useRecipes.js
useApify.js
useLocalStorage.js
lib/
storage.js             — localStorage read/write (initDb, saveDb, initRecipes, saveRecipes, loadFavourites, saveFavourites, loadCollections, saveCollections)
ingredients.js         — INGREDIENTS\_DB seed, FREE\_INGREDIENTS, matchIngredientEff, calcOverhead
recipeImport.js        — importFromUrl(url), importFromFile(file) → { title, servings, ingredients\[] }
apify.js               — fetchApifyProducts(ingredientName) → candidate\[]
productSelection.js    — applySelectedProduct(ingredient, product, dbState) → updated dbState entry
data/
defaultIngredients.js  — 57 ZAR seed ingredients (INGREDIENTS\_DB array)
defaultRecipes.json    — seed recipe library
netlify/functions/
fetch-recipe.js          — unchanged from v1.0
github-commit.js         — kept, used in v2.1

## Rules

* No logic in tabs — tabs are display only; all logic lives in lib/ or hooks/
* No browser-specific APIs — keep fetch-only for future RN port
* UI components in components/ui/ must have zero business logic
* All localStorage keys: bakerspro\_db | bakerspro\_recipes | bakerspro\_favourites | bakerspro\_collections | bakerspro\_preferences | bakerspro\_consent\_storage | bakerspro\_consent\_ai
* Never store computed prices in recipe objects — always compute at render via getIngredientWithCost
* No changing BakersCostPro.jsx. it serves as a reference for creating the new files and will persist as V1.0
* **CSS variables MUST be defined in `src/index.css` AND `src/index.css` MUST be imported in `src/main.jsx`.** Every `var(--color-*)` used in a component must have a corresponding `:root` definition in index.css. If you add a new CSS variable, verify it exists in both light and dark mode blocks. Never assume a CSS variable exists — grep for it first.

## Mistakes Log

### 2026-04-02: index.css never imported — all CSS variables were undefined
- **Root cause:** During the v2.0 scaffold, `src/index.css` was created with CSS custom properties (`--color-background`, `--color-text-primary`, etc.) but was never imported in `src/main.jsx`. Every `var(--color-*)` in every component resolved to nothing (transparent/inherit).
- **Impact:** The PriceReviewModal appeared transparent — content behind bled through. This persisted across multiple sessions because components happened to use enough inline fallback colors to look "mostly right" in casual testing.
- **Fix:** Added `import './index.css'` to `src/main.jsx`. Also added missing `--color-background` and `--color-background-primary` variable definitions to both light and dark mode blocks.
- **Status:** ✅ Fixed. Modal and all UI now renders with correct colors and opacity.
- **Prevention:** Always verify that global CSS files are imported at the entry point. When debugging "transparent" or "invisible" UI, check that CSS custom properties actually resolve — inspect computed styles in DevTools or grep for the variable definition.

## Mistakes Log (continued)

### 2026-04-04: ScannerTab state name mismatch — toast/correctionToast crash
- **Root cause:** State was declared as `correctionToast`/`setCorrectionToast` but all consuming code (`showCorrectionToast`, `handleAcceptAll`, `handleDismiss`, JSX) referenced the undeclared `toast`/`setToast`. Would crash at runtime on first correction result.
- **Fix:** Renamed state to `toast`/`setToast` to match all usage sites.
- **Prevention:** After writing a component with useState, scan all usages of the setter name before closing the file.

## Session Log

### 2026-04-04: Focused AI ingredient-fix flow, post-import pre-selection (v2.1)
- ✅ parseValidator: replaced validateParsedRecipe with suggestIngredientFixes (unmatched names only, ~100 chars vs 3000+)
- ✅ parseValidator: Nano responseConstraint added to force JSON shape; system prompt rewritten as JSON API with SA glossary
- ✅ ImportConfirmModal: per-ingredient status tags (matched/loading/ai-resolved/ai-suggested/unmatched); live update as AI resolves
- ✅ ScannerTab: wired to ImportConfirmModal; unmatched-only AI pattern; functional state guard for closed-modal safety
- ✅ App.jsx: price update clears selection on completion; finishImport pre-selects new+outdated ingredients in DB tab
- ✅ Session was clean — no bugs introduced

### 2026-04-04: Background validation, Gemini Nano, consent screens (v2.1 partial)
- ✅ ScannerTab: non-blocking import — onImportComplete fires immediately, AI validates in background
- ✅ Correction toast: fixed-bottom, auto-dismisses 30s, Review opens inline diff panel, Accept all overwrites saved recipe
- ✅ parseValidator: detectAiBackend() supports 'available'/'downloadable' aliases; returns 'chrome-needs-download' for pending download
- ✅ triggerModelDownload() exported — fires silent Gemini Nano download after user consent
- ✅ Chrome session: expectedInputLanguages/expectedOutputLanguages added to suppress warnings
- ✅ Ollama timeout: 120s → 15s; gemma3n:e2b + gemma3n:e4b added to model picker
- ✅ AI download consent panel in ScannerTab: explains 1.7 GB download, persists decision to localStorage
- ✅ Storage consent banner in App.jsx: fixed bottom, standard privacy notice, persists to localStorage

### 2026-04-02: UI redesign, costing features, delete option (v2.0 complete)
- ✅ Renamed "Scanner" → "Upload" tab across TabBar and empty states
- ✅ Redesigned PriceReviewModal: equal visibility candidates (white backgrounds, amber hover), fixed visibility issue (solid bg, thicker borders)
- ✅ Stripped URL import from ScannerTab — file drop only (.txt/.md/.docx/.pdf/.xlsx)
- ✅ CostingTab refactored: (1) packaging now separate editable row (R16 default), (2) sell multipliers editable (2, 2.5, 3), (3) per-serving block with servings input
- ✅ Fixed critical CSS bug: index.css never imported, added missing --color-background variables
- ✅ Fixed Button.jsx undefined CSS variables, duplicate props, erroneous seed data
- ✅ Added delete option to Ingredients DB table (with confirmation dialog)
- ✅ Synced seed ingredients to correct prices (2026-04-02)
- ⏳ Bug #6 (unit mismatch detection) deferred — user approved, to be fixed server-side before deploy
