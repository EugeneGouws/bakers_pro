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
    ingredients.js         — INGREDIENTS_DB seed, FREE_INGREDIENTS, matchIngredientEff, calcOverhead
    recipeImport.js        — importFromUrl(url), importFromFile(file) → { title, servings, ingredients[] }
    apify.js               — fetchApifyProducts(ingredientName) → candidate[]
    productSelection.js    — applySelectedProduct(ingredient, product, dbState) → updated dbState entry
  data/
    defaultIngredients.js  — 57 ZAR seed ingredients (INGREDIENTS_DB array)
    defaultRecipes.json    — seed recipe library
netlify/functions/
  fetch-recipe.js          — unchanged from v1.0
  github-commit.js         — kept, used in v2.1

## Rules
- No logic in tabs — tabs are display only; all logic lives in lib/ or hooks/
- No browser-specific APIs — keep fetch-only for future RN port
- UI components in components/ui/ must have zero business logic
- All localStorage keys: bakerspro_db | bakerspro_recipes | bakerspro_favourites | bakerspro_collections | bakerspro_preferences
- Never store computed prices in recipe objects — always compute at render via getIngredientWithCost
