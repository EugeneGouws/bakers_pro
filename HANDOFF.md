# HANDOFF.md

**Last updated:** 2026-03-31 · branch: `main`

## What was accomplished this session

**v1.0 local-only release (previous session, now complete):**
- Removed all GitHub sync: mount useEffect, syncStatus/communityDate state, sync badges, "Push to GitHub" button
- Removed commitGitHubJson calls from finishImport() and acceptReviewProduct()
- Removed unused `fetchGitHubJson`/`commitGitHubJson` import
- Updated INGREDIENTS_DB: all 57 ingredients refreshed to 2026 ZA retail (Checkers/PnP), dateLastUpdated: "2026-03-31", needsCosting: false
- Fixed price review modal contrast: rows 2–5 now use `var(--color-background)` with `var(--color-border-secondary)`

**Ingredient costing bug fixes (this session):**
- Fixed chocolate/each-unit pricing: products measured in grams (e.g. 80g slab) now set costPerUnit = full product price (1 slab = 1 unit), not garbage per-gram value
- Removed matchConfidence field from applyMatchedProductToIngredient return value
- Removed % match badge from price review modal header and candidate rows
- Removed matchConfidence badge from DB table Status column

**Matched product column (this session):**
- Added "Matched product" column to Ingredients DB table
- Shows exact Checkers product name used for last price update
- Click to inline-edit; persists to localStorage via saveDb()
- commitEdit() now accepts field parameter ("costPerUnit" | "matchedProductName")

**URL import overhaul (this session):**
- Netlify function now uses `recipe-scraper` for ~40 whitelisted sites (AllRecipes, BBC Good Food, Food Network, etc.)
- Falls back to server-side JSON-LD/cheerio parsing for all other sites
- Returns structured JSON { title, servings, ingredients[] } — no more raw HTML to client
- Removed client-side extractJsonLdRecipe, extractFromJsonLd, extractFromHtml functions
- importFromUrl() now consumes JSON directly, clears input on success
- Updated Scanner help text

## Current state

| Layer | Status | Notes |
|---|---|---|
| Scanner (URL import) | ✅ stable | recipe-scraper + JSON-LD fallback, server-side |
| Scanner (file import) | ✅ stable | .txt .md .docx .pdf .xlsx |
| Ingredients DB | ✅ stable | inline price/product-name editing, bulk Apify/Checkers update |
| Costing tab | ✅ stable | overhead formula, optional packaging cost, sell-price suggestions, edit mode |
| Recipe Book | ✅ stable | contents list, live cost, ★ favourites, starred filter, collections |
| GitHub community sync | ✅ removed | v1.0 is local-only; v1.1 feature |
| Price review modal | ✅ stable | contrast fixed, % match badges removed |
| Tests | ❌ not started | no test framework configured |

## Known bugs

1. **URL import: sites requiring JavaScript rendering** (Expected limitation)
   - Neither `recipe-scraper` nor the JSON-LD fallback can execute JS
   - Affects: dynamically rendered recipe pages (e.g. some Wordpress themes)
   - Workaround: use file import (.txt paste or .docx)

2. **recipe-scraper whitelist only covers ~40 domains**
   - Sites not in the whitelist fall through to JSON-LD parsing, which handles most standard recipe sites
   - If both fail, user sees clear error message

## Backlog

- **v1.1 community sync** — re-enable shareOnImport toggle + GitHub commit flows (state/UI already preserved)
- **Recipe Book: search/filter** — filter list by title as collection grows
- **Recipe Book: duplicate detection** — warn on import if same title already exists
- **Live Prices tab** — placeholder only; design decision pending
- **Contributor identity** — hardcoded "anonymous"; could allow display name in preferences

## Next session plan

1. **Test URL import** on production Netlify deployment:
   - AllRecipes URL → ingredients parse correctly
   - Unknown site with JSON-LD → falls through to cheerio fallback, still works
   - Site with no markup → clear error shown

2. **Test price update flow end-to-end:**
   - Select ingredient → Apify runs → modal shows candidates → select one → DB updates, persists after refresh
   - Matched product name appears in DB table column
   - Click product name → inline edit → save → persists

3. **Test chocolate pricing fix:**
   - Dark/Milk/White Chocolate: select 80g slab @ R25 → costPerUnit = R25 (not R0.3125)

4. **QA v1.0 checklist** (if not yet done):
   - No GitHub errors in console on cold load
   - No sync badges in header, no "Push to GitHub" button
   - Modal rows 2–5 clearly readable in both light and dark mode

## Architecture reminder

- All state lives in `BakersCostPro.jsx` — one component, no context/redux
- `dbState` and `recipes` are localStorage-backed; write via `saveDb()` / `saveRecipes()` after every mutation
- App is local-only for v1.0 — no GitHub calls at runtime; `src/lib/github.js` kept for v1.1
- Prices compute at render time (`getIngredientWithCost`) — never stored in recipe objects
- `src/data/recipes.json` is the offline fallback seed only
- Netlify function `fetch-recipe.js` now returns JSON (not HTML) — client expects `{ title, servings, ingredients[] }`
- Do not add browser-specific APIs — keep `fetch`-only for future React Native port
