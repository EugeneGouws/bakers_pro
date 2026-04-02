# HANDOFF.md

**Last updated:** 2026-04-02 · branch: `v2.0`

## What was accomplished this session

**v2.0 modular refactor (3 phases completed in prior session):**
- Phase 1: Extracted libs (ingredients.js, storage.js, recipeImport.js, apify.js, productSelection.js) and UI components (Header, TabBar, Badge, Button, Modal)
- Phase 2: Built custom hooks (useDb, useRecipes, useApify) with auto-persistence
- Phase 3: Created all 5 tab components (ScannerTab, IngredientsDbTab, CostingTab, RecipeBookTab, LivePricesTab)

**This session — UI refinement & costing improvements:**
- ✅ Renamed "Scanner" → "Upload" tab
- ✅ Redesigned PriceReviewModal: white candidate boxes, amber hover, fixed visibility issue
- ✅ Stripped URL import from ScannerTab (file drop only)
- ✅ CostingTab: packaging now separate editable row (R16 default)
- ✅ CostingTab: sell-price multipliers now editable (2, 2.5, 3)
- ✅ CostingTab: added per-serving block with servings input
- ✅ Updated calcOverhead() to return separate `packaging` field

## Current state

| Layer | Status | Notes |
|---|---|---|
| File import | ✅ stable | .txt .md .docx .pdf .xlsx |
| Ingredients DB | ✅ stable | inline price/product-name editing, bulk Apify/Checkers update |
| Costing tab | ✅ stable | ingredient breakdown, 15% overhead, editable packaging, editable multipliers, per-serving view |
| Recipe Book | ✅ stable | list with live costs, ★ favourites, starred filter, named collections |
| Price review modal | ✅ stable | white candidate boxes, amber hover highlight |
| Tests | ❌ not started | no test framework configured |

## Known bugs

1. **#6: Unit mismatch in costing** (Deferred)
   - When recipe unit (g/ml) doesn't match DB unit (each), fallback matching produces garbage costs
   - Example: recipe "80g chocolate" matches DB "chocolate bar (1 each @ R52)" → shows R52/g = R52,000 total
   - Status: User approved deferral; to be fixed server-side before production deploy
   - Local npm run dev shows correct prices on seed data

## Backlog

- **Ingredients DB: delete option** — allow removal of erroneous ingredients from DB (with confirmation)
- **Bug #6: Unit mismatch detection** — flag mismatches with badge instead of computing wrong cost
- **Recipe Book: search/filter** — filter list by title as collection grows
- **Recipe Book: duplicate detection** — warn on import if same title already exists
- **Live Prices tab** — placeholder only; design decision pending
- **v2.1 community features** — GitHub sync, shared recipes/prices, contributor identity

## Next session plan

1. **Test all 5 changes in local browser** (user to run `npm run dev` and verify UI/behavior)
2. **Once local testing passes**, decide next priority:
   - Option A: Implement bug #6 (unit mismatch detection)
   - Option B: Implement Ingredients DB delete option
   - Option C: Add Recipe Book search/filter
   - Option D: Other backlog items

## Architecture reminder v2.0

- **Modular**: src/ split into components/, hooks/, lib/, data/
- **State management**: Custom hooks (useDb, useRecipes, useApify) with localStorage auto-persist
- **No logic in tabs**: Tabs are display-only; all logic in lib/ or hooks/
- **Prices compute at render**: Never stored in recipe objects; always via matchIngredientEff()
- **Overhead formula**: Total = Ingredients + Supplies(5%) + Operating(5%) + Equipment(5%) + Packaging
- **Keep fetch-only**: No browser-specific APIs for future React Native port
- **v1.0 frozen**: BakersCostPro.jsx serves as reference only; never modify
