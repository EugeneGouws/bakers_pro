# HANDOFF.md

**Last updated:** 2026-03-30 (afternoon) · branch: `main`

## What was accomplished this session

**Price update UX overhaul:**
- Apify actor call: reduced from 10 → 5 items per search (focused candidate list)
- All 5 candidates now always shown in modal for user disambiguation (removed silent auto-accept logic)
- Per-ingredient GitHub commit on price selection (moved from post-loop batch commit)
- Enhanced skip button: "Skip — none of these are appropriate"
- Manual "Push to GitHub" button in DB tab for offline edits

**Packaging cost control:**
- Added state: `packagingEnabled` (boolean, default true), `packagingCost` (number, default 16)
- Updated `calcOverhead()` to accept optional `pkgCost` parameter (was hardcoded R16)
- Costing tab UI: inline packaging checkbox toggle + editable R amount field
- Sell-price cards (2×, 2.5×, 3×) recalculate live as packaging amount changes

**Recipe Book starred filter:**
- Added state: `bookShowStarred` (boolean filter toggle)
- New "☆ All / ★ Starred" pill button in Recipe Book header
- Filters recipe list to starred recipes only when active
- Button only appears when user has favorite recipes

**Data sync fix:**
- Updated bundled `INGREDIENTS_DB` in code to match `data/ingredients.json`
- All 57 ingredients now use standardized units (g/ml/each only)
- All ingredients: `dateLastUpdated: "2024-01-01"`, `needsCosting: true`
- Ensures first app load shows correct data without requiring localStorage reset

**Documentation:**
- Updated CLAUDE.md: added new state variables, updated function signatures, added session log
- Updated README.md: clarified unit types, packaging features, Apify flow, filter feature

## Current state

| Layer | Status | Notes |
|---|---|---|
| Scanner (URL import) | ✅ stable | Netlify function + JSON-LD + HTML fallback |
| Scanner (file import) | ✅ stable | .txt .md .docx .pdf .xlsx |
| Ingredients DB | ✅ stable | inline price editing, bulk Apify/Checkers update (5 items, all shown) |
| Costing tab | ✅ stable | overhead formula, optional packaging cost, sell-price suggestions, edit mode |
| Recipe Book | ✅ stable | contents list, live cost, ★ favourites, starred filter, collections |
| GitHub community sync | ✅ stable | mount fetch + per-selection commit + recipe share |
| Price review modal | ⚠️ UX issue | Candidate rows visibility — background contrast insufficient |
| Tests | ❌ not started | no test framework configured |

## Known bugs

1. **Modal candidate row visibility** (Priority: HIGH)
   - Non-top candidates still difficult to read despite background color change
   - Root cause: `var(--color-background-secondary)` lacks sufficient contrast
   - Fix: use `var(--color-background-primary)` or opaque white for better readability
   - Location: `src/BakersCostPro.jsx` line 1931

2. **GitHub commit 502 error on localhost** (Expected)
   - Netlify functions don't run in dev mode (`npm run dev`)
   - Status: Test on production deployment to confirm it works
   - Workaround: use manual "Push to GitHub" button in DB tab for local testing

## Backlog

- **Recipe Book: search/filter** — filter list by title as the collection grows
- **Recipe Book: duplicate detection** — warn on import if a recipe with the same title already exists
- **Contributor identity** — currently hardcoded `"anonymous"`; could allow user to set a display name in preferences
- **Live Prices tab** — placeholder only; marked for removal (design decision pending)
- **Recipe import 404s** — intermittent issue on certain recipe URLs; needs investigation

## Next session plan

1. **Fix modal candidate row visibility** (modal background: try `primary` or `#ffffff`)
   - Test on local dev with `npm run dev`
   - Verify all 5 rows now clearly readable

2. **Test on production deployment** to verify:
   - GitHub commits work (502 error won't happen on Netlify)
   - Packaging controls persist correctly
   - Recipe Book filter works end-to-end

3. **Post-deployment QA**:
   - Clear browser cache, verify fresh ingredient load
   - Test price update flow: select 1-2 items → modal appears → all 5 visible → select one → GitHub commit
   - Test Recipe Book filter: star 2-3 recipes → toggle filter → verify list updates

## Architecture reminder

- All state lives in `BakersCostPro.jsx` — one component, no context/redux
- `dbState` and `recipes` are localStorage-backed; write via `saveDb()` / `saveRecipes()` after every mutation
- GitHub is the community source of truth; local data is personal overrides layered on top
- Prices compute at render time (`getIngredientWithCost`) — never stored in recipe objects
- `src/data/recipes.json` is the offline fallback seed only; community data lives in `data/recipes.json` (repo root)
- GitHub writes go via `/.netlify/functions/github-commit` — never call GitHub API directly from the client
- Do not add browser-specific APIs — keep `fetch`-only for future React Native port
