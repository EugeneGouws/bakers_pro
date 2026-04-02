# HANDOFF.md

**Last updated:** 2026-04-02 · branch: `v2.0` · **Status: v2.0 COMPLETE**

## v2.0 Accomplishments (across 3+ sessions)

**Phase 1-3: Modular refactor (prior sessions)**
- Extracted libs (ingredients.js, storage.js, recipeImport.js, apify.js, productSelection.js) and UI components (Header, TabBar, Badge, Button, Modal)
- Built custom hooks (useDb, useRecipes, useApify) with auto-persistence
- Created all 5 tab components (ScannerTab, IngredientsDbTab, CostingTab, RecipeBookTab, LivePricesTab)

**This session — UI refinement, critical fixes, final features**
- ✅ Renamed "Scanner" → "Upload" tab
- ✅ Redesigned PriceReviewModal: white candidate boxes, amber hover states
- ✅ Fixed CRITICAL CSS bug: index.css never imported (all CSS variables were undefined). Added import to main.jsx, defined missing --color-background variables
- ✅ Fixed Button.jsx undefined CSS variables, duplicate props in RecipeBookTab
- ✅ Stripped URL import from ScannerTab (file drop only)
- ✅ CostingTab: packaging now separate editable row (R16 default), sell multipliers editable (2, 2.5, 3), per-serving block with servings input
- ✅ Added delete option to Ingredients DB table (with confirmation)
- ✅ Synced seed ingredients to correct prices (2026-04-02)

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

**v2.1 enhancements & polish:**
- **Bug #6: Unit mismatch detection** — flag mismatches with badge instead of computing wrong cost (deferred to server-side)
- **Recipe Book: search/filter** — filter list by title, quick find by ingredient
- **Recipe Book: duplicate detection** — warn on import if same title already exists
- **Live Prices tab** — placeholder only; design decision pending
- **Frontend design refactor** — extract color tokens to CSS variables, normalize inline styles, complete dark mode support

**v2.1 community features (future):**
- **GitHub sync** — re-enable shareOnImport toggle, community recipes/prices
- **Contributor identity** — display name in preferences (currently hardcoded "anonymous")
- **Price history** — track price changes over time per ingredient

## Architecture reminder v2.0

- **Modular**: src/ split into components/, hooks/, lib/, data/
- **State management**: Custom hooks (useDb, useRecipes, useApify) with localStorage auto-persist
- **No logic in tabs**: Tabs are display-only; all logic in lib/ or hooks/
- **Prices compute at render**: Never stored in recipe objects; always via matchIngredientEff()
- **Overhead formula**: Total = Ingredients + Supplies(5%) + Operating(5%) + Equipment(5%) + Packaging
- **Keep fetch-only**: No browser-specific APIs for future React Native port
- **v1.0 frozen**: BakersCostPro.jsx serves as reference only; never modify
