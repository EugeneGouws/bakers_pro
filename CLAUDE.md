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

**Baker's Cost Pro** is a single-page React 19 app (Vite) for South African bakers. Data is hybrid: GitHub repo as shared community backend (free tier), localStorage for personal data only.

### Key files

- `src/main.jsx` — entry point, mounts `<BakersCostPro>` to `#root`
- `src/BakersCostPro.jsx` — entire app (~1 200 lines): data, state, logic, and UI in one component
- `src/data/recipes.json` — 14 offline-fallback seed recipes (used if GitHub fetch fails)
- `src/lib/github.js` — `fetchGitHubJson(path)` · `commitGitHubJson(path, data, message)`
- `src/lib/storage.js` — personal data helpers: favourites, collections, preferences
- `data/ingredients.json` — community ingredient DB (57 ZAR-priced ingredients, lives in GitHub repo)
- `data/recipes.json` — community recipe collection (lives in GitHub repo)
- `src/index.css` — global styles and CSS custom properties (dark-mode-aware)
- `netlify/functions/fetch-recipe.js` — CORS proxy for URL import
- `netlify/functions/github-commit.js` — server-side GitHub Contents API proxy (keeps token out of bundle)

### BakersCostPro.jsx internals

**Data constants (top of file)**
- `INGREDIENTS_DB` — 57 ZAR-priced ingredients (`{ name, aliases[], unit, costPerUnit, pkg }`), sourced from Cake_Costings.xlsx; used as offline fallback only
- `FREE_INGREDIENTS` — Set of zero-cost ingredients (water variants) never added to the DB
- `C` — design tokens object (amber, success, danger colours)

**Core utilities**
- `matchIngredientEff(name, unit, db)` — 3-step fuzzy matcher against mutable `dbState` (exact alias → partial alias → substring)
- `calcOverhead(ingredientTotal)` — 5% operating + 5% equipment + 5% supplies + R16 packaging = ×1.15 + R16
- `initDb()` — loads DB from localStorage or seeds from `INGREDIENTS_DB`
- `initRecipes()` — loads recipes from localStorage; seeds from `src/data/recipes.json` if empty
- `Badge` — tiny inline component for status chips

**State (all in a single component)**
`tab` ("scan"|"db"|"cost"|"book"|"prices"), `dbState` (mutable ingredient DB), `recipes` (array), `activeRecipeId`, `editingRecipe` (working copy while editing), `editingCell` (inline DB price edit), `importMode`, `urlInput`, `importing`, `err`, `shareOnImport` (community share toggle), `syncStatus` (null|"syncing"|"synced"|"offline"), `favourites` (string[]), `collections` ({ [name]: string[] }), `collectionMenu` (open recipe id)

**Five tabs**
1. **Scanner** — URL import (Netlify function + JSON-LD/HTML fallback) or file upload (.txt .md .docx .pdf .xlsx); "Share with community" toggle (default off)
2. **Ingredients DB** — searchable table; click any R/unit value to edit inline; Status/Last Updated columns; bulk Apify/Checkers price update
3. **Costing** — pill selector for recipe history; per-ingredient breakdown + overhead totals + sell-price suggestions; Edit button opens inline edit mode (title + quantities)
4. **Recipe Book** — numbered list with live cost price; ★ favourite toggle; + collection button with dropdown; My Collections summary section; click to open in Costing; ✕ to delete
5. **Live Prices** — Coming Soon placeholder

**GitHub sync (on mount)**
`useEffect` fetches `data/ingredients.json` and `data/recipes.json` from GitHub raw URL via `fetchGitHubJson`. Merge rule: local ingredient price wins if `dateLastUpdated` is newer (user manually edited); community recipes are appended if not already present by id. Silent fail → app continues from localStorage/bundle. Sync status shown as badge in header.

**Recipe import flow**
- URL: `fetch` via `/.netlify/functions/fetch-recipe` → `extractJsonLdRecipe` (schema.org JSON-LD, handles `@graph`) → fallback `extractFromHtml` (CSS class heuristic)
- File: dynamic `import()` per extension — mammoth (.docx), unpdf (.pdf), xlsx (.xlsx), native text (.txt/.md)
- `finishImport(parsed)` — auto-adds unmatched ingredients to DB with `needsCosting: true`; skips `FREE_INGREDIENTS`; saves recipe to localStorage; if `shareOnImport` is true, fetches + appends + commits `data/recipes.json` to GitHub

**Price update → GitHub commit**
After a successful Apify/Checkers bulk price run, `data/ingredients.json` is committed to GitHub via `commitGitHubJson` (non-blocking, errors logged to console only). Commit message: `"Price update: [names] via Checkers"`.

**localStorage keys**
- `bakerspro_db` — full ingredient DB with personal price overrides and `dateLastUpdated`
- `bakerspro_recipes` — personal (non-shared) recipe array
- `bakerspro_favourites` — `string[]` of starred recipe IDs
- `bakerspro_collections` — `{ [collectionName]: string[] }` of recipe ID arrays
- `bakerspro_preferences` — UI preferences object (reserved for future use)

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_APIFY_KEY` | `.env` + Netlify | Apify API key for Checkers price scraping |
| `VITE_GITHUB_REPO` | `.env` + Netlify | `owner/repo` — used to build raw GitHub URLs |
| `VITE_GITHUB_BRANCH` | `.env` + Netlify | Branch to read/write (default: `main`) |
| `VITE_GITHUB_TOKEN` | Netlify only | PAT with Contents:write — read by Netlify function via `process.env`, never client-side |

### Styling conventions

All component styles are inline React style objects. `src/index.css` holds only resets and CSS custom properties. Amber `#BA7517`, success `#3B6D11`, danger `#A32D2D`. Responsive breakpoint: 1024 px.

### Platform portability notes

Structured to ease a future React Native / Expo iOS port: `fetch` only (no browser-specific APIs), comments annotate `<input>` → `ImagePicker`, `table` → `FlatList`, etc.

---

## Session log

- 2026-03-30: Session clean — no mistakes. Migrated data model to GitHub hybrid (community data) + localStorage (personal). Added favourites, collections, share toggle, sync status.
