# HANDOFF.md

**Last updated:** 2026-03-30 · branch: `main`

## What was accomplished this session

- Migrated data model to GitHub hybrid: community data in GitHub repo, personal data in localStorage only
- Created `data/ingredients.json` (57 ingredients) and `data/recipes.json` (14 recipes) as community source of truth
- Added `src/lib/github.js` — `fetchGitHubJson` + `commitGitHubJson` (via Netlify proxy)
- Added `src/lib/storage.js` — favourites, collections, preferences helpers
- Added `netlify/functions/github-commit.js` — server-side GitHub Contents API proxy; `VITE_GITHUB_TOKEN` stays in Netlify env, never in client bundle
- GitHub sync on app mount via `useEffect` — merges community ingredient prices (local wins if newer) and appends new community recipes; sync status badge in header
- "Share with community" toggle on Scanner tab (default off); shared recipes committed to `data/recipes.json` via GitHub API
- After Apify/Checkers price run: auto-commits updated `data/ingredients.json` to GitHub (non-blocking)
- Favourites (★ star toggle) per recipe in Recipe Book — stored in `bakerspro_favourites`
- Named collections (+ button with dropdown + new collection input) in Recipe Book — stored in `bakerspro_collections`; My Collections summary section below recipe list
- Updated `CLAUDE.md`, `README.md`, `.env`, `.env.example`

## Current state

| Layer | Status | Notes |
|---|---|---|
| Scanner (URL import) | ✅ stable | Netlify function + JSON-LD + HTML fallback |
| Scanner (file import) | ✅ stable | .txt .md .docx .pdf .xlsx |
| Ingredients DB | ✅ stable | inline price editing, bulk Apify/Checkers update, status badges |
| Costing tab | ✅ stable | overhead formula, sell-price suggestions, edit mode |
| Recipe Book | ✅ stable | contents list, live cost, ★ favourites, collections, delete |
| GitHub community sync | ✅ stable | mount fetch + post-Apify commit + recipe share |
| Live Prices | ❌ not started | Coming Soon placeholder |
| Tests | ❌ not started | no test framework configured |

## Known bugs

None currently recorded.

## Backlog

- **Recipe Book: search/filter** — filter list by title as the collection grows
- **Recipe Book: duplicate detection** — warn on import if a recipe with the same title already exists
- **Live Prices tab** — SA grocery price lookup (no paid API)
- **Packaging & markup as separate add-ons** — allow per-recipe packaging cost and markup % on top of overhead
- **Contributor identity** — currently hardcoded `"anonymous"`; could allow user to set a display name in preferences

## Next session plan

1. **▶ Recipe Book search/filter** — add a search input above the contents list (top priority)
2. **Duplicate detection** — check title match on import, prompt to replace or keep both
3. **Live Prices tab** — SA grocery price lookup

## Architecture reminder

- All state lives in `BakersCostPro.jsx` — one component, no context/redux
- `dbState` and `recipes` are localStorage-backed; write via `saveDb()` / `saveRecipes()` after every mutation
- GitHub is the community source of truth; local data is personal overrides layered on top
- Prices compute at render time (`getIngredientWithCost`) — never stored in recipe objects
- `src/data/recipes.json` is the offline fallback seed only; community data lives in `data/recipes.json` (repo root)
- GitHub writes go via `/.netlify/functions/github-commit` — never call GitHub API directly from the client
- Do not add browser-specific APIs — keep `fetch`-only for future React Native port
