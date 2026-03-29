# HANDOFF.md

**Last updated:** 2026-03-29 · no git branch (not initialised as a repo yet)

## What was accomplished this session

- Read and parsed `Cake Costings.xlsx` — extracted 14 recipes and 57 canonical ingredients
- Generated `src/data/recipes.json` as a bundled first-load seed
- Fixed `initRecipes()` to seed when localStorage is empty or `[]`
- Added `FREE_INGREDIENTS` exception set — water variants are never added to the DB
- Rebuilt Recipe Book tab as a numbered contents-page list with live cost price per recipe
- Added recipe edit mode in Costing tab — inline editing of title and ingredient quantities
- Added `.xlsx` file import in the Scanner tab (parses Name(unit) + amount columns)
- Removed source/sheet label from Recipe Book rows
- Updated CLAUDE.md and README.md to reflect current architecture

## Current state

| Layer | Status | Notes |
|---|---|---|
| Scanner (URL import) | ✅ stable | corsproxy.io + JSON-LD + HTML fallback |
| Scanner (file import) | ✅ stable | .txt .md .docx .pdf .xlsx |
| Ingredients DB | ✅ stable | inline price editing, status badges |
| Costing tab | ✅ stable | overhead formula, sell-price suggestions, edit mode |
| Recipe Book | ✅ stable | contents list, live cost, delete, edit |
| Live Prices | ❌ not started | Coming Soon placeholder |
| Tests | ❌ not started | no test framework configured |

## Known bugs

None currently recorded.

## Backlog

- **Recipe Book: search/filter** — filter list by title as the collection grows
- **Recipe Book: duplicate detection** — warn on import if a recipe with the same title already exists
- **Recipe Book: categories** — tag recipes (e.g. cakes, cupcakes, pastry) and filter by category
- **Ingredient DB: bulk price update** — import updated prices from a new xlsx without losing manual edits
- **Live Prices tab** — SA grocery price lookup (no paid API)
- **Packaging & markup as separate add-ons** — allow per-recipe packaging cost and markup % on top of overhead

## Next session plan

1. **Recipe Book search** — add a search/filter input above the contents list (top priority)
2. **Duplicate detection** — check title match on import, prompt to replace or keep both
3. **Recipe Book categories** — add a `category` field to recipes, tag UI, filter pills

## Architecture reminder

- All state lives in `BakersCostPro.jsx` — one component, no context/redux
- `dbState` and `recipes` are both localStorage-backed; write via `saveDb()` / `saveRecipes()` after every mutation
- Prices compute at render time (`getIngredientWithCost`) — never stored in recipe objects
- `src/data/recipes.json` is the seed only; user data lives in localStorage
- Do not add browser-specific APIs — keep `fetch`-only for future React Native port
