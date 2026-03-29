# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run lint       # Run ESLint (flat config, eslint.config.js)
npm run preview    # Serve the production build locally
```

No test framework is configured.

## Architecture

**Baker's Cost Pro** is a single-page React 19 app (Vite) for South African bakers. No backend, no paid APIs — all processing runs in the browser.

### Key files

- `src/main.jsx` — entry point, mounts `<BakersCostPro>` to `#root`
- `src/BakersCostPro.jsx` — entire app (~1 000 lines): data, state, logic, and UI in one component
- `src/data/recipes.json` — 14 pre-seeded recipes from `Cake Costings.xlsx`, used as first-load seed
- `src/index.css` — global styles and CSS custom properties (dark-mode-aware)

### BakersCostPro.jsx internals

**Data constants (top of file)**
- `INGREDIENTS_DB` — 78 ZAR-priced ingredients (`{ name, aliases[], unit, costPerUnit, pkg }`), sourced from Cake_Costings.xlsx
- `FREE_INGREDIENTS` — Set of zero-cost ingredients (water variants) never added to the DB
- `C` — design tokens object (amber, success, danger colours)

**Core utilities**
- `matchIngredientEff(name, unit, db)` — 3-step fuzzy matcher against mutable `dbState` (exact alias → partial alias → substring)
- `calcOverhead(ingredientTotal)` — 5% operating + 5% equipment + 5% supplies + R16 packaging = ×1.15 + R16
- `initDb()` — loads DB from localStorage or seeds from `INGREDIENTS_DB`
- `initRecipes()` — loads recipes from localStorage; seeds from `src/data/recipes.json` if empty
- `Badge` — tiny inline component for status chips

**State (all in a single component)**
`tab` ("scan"|"db"|"cost"|"book"|"prices"), `dbState` (mutable ingredient DB), `recipes` (array), `activeRecipeId`, `editingRecipe` (working copy while editing), `editingCell` (inline DB price edit), `importMode`, `urlInput`, `importing`, `err`

**Five tabs**
1. **Scanner** — URL import (corsproxy.io + JSON-LD/HTML fallback) or file upload (.txt .md .docx .pdf .xlsx)
2. **Ingredients DB** — searchable table; click any R/unit value to edit inline; Status/Last Updated columns
3. **Costing** — pill selector for recipe history; per-ingredient breakdown + overhead totals + sell-price suggestions; Edit button opens inline edit mode (title + quantities)
4. **Recipe Book** — numbered contents-page list of all recipes with live cost price; click to open in Costing; ✕ to delete
5. **Live Prices** — Coming Soon placeholder

**Recipe import flow**
- URL: `fetch` via `https://corsproxy.io/?url=...` → `extractJsonLdRecipe` (schema.org JSON-LD, handles `@graph`) → fallback `extractFromHtml` (CSS class heuristic)
- File: dynamic `import()` per extension — mammoth (.docx), unpdf (.pdf), xlsx (.xlsx), native text (.txt/.md)
- `finishImport(parsed)` — auto-adds unmatched ingredients to DB with `needsCosting: true`; skips `FREE_INGREDIENTS`; saves recipe to localStorage

**localStorage keys**
- `bakerspro_db` — ingredient DB with price overrides and `dateLastUpdated`
- `bakerspro_recipes` — recipe history array

### Styling conventions

All component styles are inline React style objects. `src/index.css` holds only resets and CSS custom properties. Amber `#BA7517`, success `#3B6D11`, danger `#A32D2D`. Responsive breakpoint: 1024 px.

### Platform portability notes

Structured to ease a future React Native / Expo iOS port: `fetch` only (no browser-specific APIs), comments annotate `<input>` → `ImagePicker`, `table` → `FlatList`, etc.
