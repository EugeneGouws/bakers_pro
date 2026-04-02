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
* All localStorage keys: bakerspro\_db | bakerspro\_recipes | bakerspro\_favourites | bakerspro\_collections | bakerspro\_preferences
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

## Session Log

### 2026-04-02: UI redesign & costing features (v2.0 refinement)
- ✅ Renamed "Scanner" → "Upload" tab across TabBar and empty states
- ✅ Redesigned PriceReviewModal: equal visibility candidates (white backgrounds, amber hover), fixed visibility issue (solid #fff bg, thicker borders, amber highlight on hover)
- ✅ Stripped URL import from ScannerTab — file drop only (.txt/.md/.docx/.pdf/.xlsx)
- ✅ CostingTab refactored: (1) packaging now separate editable row (R16 default, user-editable float), (2) sell multipliers editable (2, 2.5, 3), (3) per-serving block with servings input
- ✅ calcOverhead() updated to return separate `packaging` field
- ✅ Removed packagingEnabled state from App.jsx
- ⏳ Bug #6 (unit mismatch detection in costing) deferred — user approved, to be fixed server-side before deploy
