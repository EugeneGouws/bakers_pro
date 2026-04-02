import { useState } from "react";

import useDb         from "./hooks/useDb.js";
import useRecipes    from "./hooks/useRecipes.js";
import useApify      from "./hooks/useApify.js";

import { loadFavourites, saveFavourites, loadCollections, saveCollections } from "./lib/storage.js";
import { matchIngredientEff, calcOverhead, FREE_INGREDIENTS, todayStr }      from "./lib/ingredients.js";
import { importFromFile }                                                     from "./lib/recipeImport.js";
import { convertToBaseUnits }                                                 from "./lib/apify.js";

import Header           from "./components/ui/Header.jsx";
import TabBar           from "./components/ui/TabBar.jsx";
import PriceReviewModal from "./components/ui/PriceReviewModal.jsx";

import ScannerTab       from "./components/tabs/ScannerTab.jsx";
import IngredientsDbTab from "./components/tabs/IngredientsDbTab.jsx";
import CostingTab       from "./components/tabs/CostingTab.jsx";
import RecipeBookTab    from "./components/tabs/RecipeBookTab.jsx";
import LivePricesTab    from "./components/tabs/LivePricesTab.jsx";

export default function App() {

  // ── Navigation ───────────────────────────────────────────────
  const [tab, setTab] = useState("scan");

  // ── Persisted state ──────────────────────────────────────────
  const [dbState, setDb]       = useDb();
  const [recipes, setRecipes]  = useRecipes();

  const [favourites, setFavouritesRaw]   = useState(() => loadFavourites());
  const [collections, setCollectionsRaw] = useState(() => loadCollections());

  function setFavourites(next) { setFavouritesRaw(next); saveFavourites(next); }
  function setCollections(next) { setCollectionsRaw(next); saveCollections(next); }

  // ── Apify price-update cycle ─────────────────────────────────
  const apify = useApify();

  // ── Import UI state ──────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [error,     setError]     = useState(null);

  // ── Ingredients DB UI state ──────────────────────────────────
  const [dbSearch,             setDbSearch]             = useState("");
  const [selectedIngredients,  setSelectedIngredients]  = useState(new Set());
  const [editingCell,          setEditingCell]          = useState(null);
  const [editValue,            setEditValue]            = useState("");
  const [editingPackage,       setEditingPackage]       = useState(null);
  const [pkgEditVal,           setPkgEditVal]           = useState({ packageValue: "", packageUnit: "", packagePrice: "" });

  // ── Costing / recipe state ───────────────────────────────────
  const [activeRecipeId, setActiveRecipeId] = useState(() => {
    const r = recipes;
    return r.length ? r[r.length - 1].id : null;
  });
  const [editingRecipe,    setEditingRecipe]    = useState(null);
  const [packagingCost,    setPackagingCost]    = useState(16);

  // ── Recipe Book UI state ─────────────────────────────────────
  const [bookShowStarred,  setBookShowStarred]  = useState(false);
  const [collectionMenu,   setCollectionMenu]   = useState(null);
  const [newColName,       setNewColName]       = useState("");

  // ── Derived values ───────────────────────────────────────────
  const recipe     = recipes.find(r => r.id === activeRecipeId) || null;
  const enriched   = recipe
    ? recipe.ingredients.map(ing => {
        const dbMatch   = matchIngredientEff(ing.name, ing.unit, dbState);
        const lineTotal = dbMatch && dbMatch.costPerUnit > 0
          ? parseFloat((dbMatch.costPerUnit * ing.amount).toFixed(4))
          : null;
        return { ...ing, dbMatch, lineTotal };
      })
    : [];
  const ingTotal        = enriched.reduce((s, i) => s + (i.lineTotal || 0), 0);
  const overhead        = recipe ? calcOverhead(ingTotal, packagingCost) : null;
  const matchedCount    = enriched.filter(i => i.dbMatch).length;
  const unmatchedCount  = enriched.filter(i => !i.dbMatch || i.dbMatch.needsCosting).length;
  const needsCostingCount = dbState.filter(i => i.needsCosting || i.costPerUnit === 0).length;

  // ── finishImport ─────────────────────────────────────────────
  function finishImport(parsed) {
    if (!parsed.ingredients.length) throw new Error("No ingredients found in this content.");

    const today = todayStr();
    let currentDb = [...dbState];
    let dbChanged = false;

    for (const ing of parsed.ingredients) {
      if (FREE_INGREDIENTS.has(ing.name.toLowerCase())) continue;
      if (!matchIngredientEff(ing.name, ing.unit, currentDb)) {
        currentDb.push({
          name: ing.name.charAt(0).toUpperCase() + ing.name.slice(1),
          aliases: [ing.name.toLowerCase()],
          unit: ing.unit,
          costPerUnit: 0,
          pkg: "—",
          dateLastUpdated: today,
          needsCosting: true,
        });
        dbChanged = true;
      }
    }

    if (dbChanged) setDb(currentDb);

    const newRecipe = {
      id: crypto.randomUUID(),
      title: parsed.title || "Imported Recipe",
      servings: parsed.servings || 1,
      ingredients: parsed.ingredients.map((ing, i) => ({
        name: ing.name, amount: ing.amount, unit: ing.unit, id: i,
      })),
      importedAt: new Date().toISOString(),
    };

    const updated = [...recipes, newRecipe];
    setRecipes(updated);
    setActiveRecipeId(newRecipe.id);
    setTab("cost");
  }

  // ── Import handlers ──────────────────────────────────────────
  async function onImportFile(file) {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      const parsed = await importFromFile(file);
      if (!parsed.ingredients.length)
        throw new Error("No ingredients found. Make sure the file contains lines like '2 cups flour'.");
      finishImport(parsed);
    } catch (e) {
      setError("File import failed: " + e.message);
    } finally {
      setImporting(false);
    }
  }

  // ── Recipe handlers ──────────────────────────────────────────
  function onStartEditRecipe(r) {
    setEditingRecipe({ id: r.id, title: r.title, ingredients: r.ingredients.map(i => ({ ...i })) });
  }

  function onSaveRecipeEdit() {
    if (!editingRecipe) return;
    const updated = recipes.map(r =>
      r.id === editingRecipe.id
        ? { ...r, title: editingRecipe.title.trim() || r.title, ingredients: editingRecipe.ingredients }
        : r
    );
    setRecipes(updated);
    setEditingRecipe(null);
  }

  function onDeleteRecipe(id) {
    const updated = recipes.filter(r => r.id !== id);
    setRecipes(updated);
    if (activeRecipeId === id)
      setActiveRecipeId(updated.length ? updated[updated.length - 1].id : null);
  }

  // ── Favourites & collections ─────────────────────────────────
  function onToggleFavourite(id) {
    const next = favourites.includes(id)
      ? favourites.filter(f => f !== id)
      : [...favourites, id];
    setFavourites(next);
  }

  function onAddToCollection(recipeId, colName) {
    const col = collections[colName] || [];
    if (col.includes(recipeId)) return;
    const next = { ...collections, [colName]: [...col, recipeId] };
    setCollections(next);
    setCollectionMenu(null);
    setNewColName("");
  }

  function onRemoveFromCollection(recipeId, colName) {
    const col = (collections[colName] || []).filter(id => id !== recipeId);
    const next = col.length
      ? { ...collections, [colName]: col }
      : Object.fromEntries(Object.entries(collections).filter(([k]) => k !== colName));
    setCollections(next);
  }

  // ── DB inline editing ────────────────────────────────────────
  function commitEdit(name, field = "costPerUnit") {
    if (field === "name") {
      const newName = editValue.trim();
      if (!newName) { setEditingCell(null); return; }
      setDb(dbState.map(item => {
        if (item.name !== name) return item;
        // Keep old name in aliases so existing recipes continue to match
        const aliases = item.aliases.includes(item.name.toLowerCase())
          ? item.aliases
          : [...item.aliases, item.name.toLowerCase()];
        return { ...item, name: newName, aliases };
      }));
      setEditingCell(null);
      return;
    }
    if (field === "matchedProductName") {
      setDb(dbState.map(item =>
        item.name === name ? { ...item, matchedProductName: editValue.trim() } : item
      ));
      setEditingCell(null);
      return;
    }
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { setEditingCell(null); return; }
    setDb(dbState.map(item =>
      item.name === name
        ? { ...item, costPerUnit: val, dateLastUpdated: todayStr(), needsCosting: false }
        : item
    ));
    setEditingCell(null);
  }

  function commitPackageEdit(name) {
    const val   = parseFloat(pkgEditVal.packageValue);
    const unit  = pkgEditVal.packageUnit.trim().toLowerCase();
    const price = parseFloat(pkgEditVal.packagePrice);
    if (isNaN(val) || val <= 0 || !unit) { setEditingPackage(null); return; }

    const { baseQuantity, baseUnit } = convertToBaseUnits(val, unit);
    setDb(dbState.map(ing => {
      if (ing.name !== name) return ing;
      const effectivePrice  = price > 0 ? price : (ing.latestPrice ?? 0);
      const pricePerBaseUnit = effectivePrice > 0 && baseQuantity > 0
        ? effectivePrice / baseQuantity
        : ing.pricePerBaseUnit;
      let costPerUnit = ing.costPerUnit;
      const ingUnit = (ing.unit || "").toLowerCase();
      if (pricePerBaseUnit != null) {
        if (baseUnit === "g"     && ingUnit === "g")    costPerUnit = pricePerBaseUnit;
        if (baseUnit === "g"     && ingUnit === "kg")   costPerUnit = pricePerBaseUnit * 1000;
        if (baseUnit === "ml"    && ingUnit === "ml")   costPerUnit = pricePerBaseUnit;
        if (baseUnit === "ml"    && ingUnit === "l")    costPerUnit = pricePerBaseUnit * 1000;
        if (baseUnit === "units" && ingUnit === "each") costPerUnit = effectivePrice > 0 ? effectivePrice / val : costPerUnit;
      }
      const pkgDisplay = price > 0 ? `${val}${unit} · R${price}` : ing.pkg ?? `${val}${unit}`;
      return { ...ing, packageValue: val, packageUnit: unit, baseQuantity, baseUnit,
               pricePerBaseUnit, costPerUnit, pkg: pkgDisplay,
               dateLastUpdated: todayStr(), needsCosting: false };
    }));
    setEditingPackage(null);
  }

  function onDeleteIngredient(name) {
    setDb(dbState.filter(ing => ing.name !== name));
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>

      <Header />

      <TabBar
        tab={tab}
        setTab={setTab}
        needsCostingCount={needsCostingCount}
        recipeCount={recipes.length}
      />

      {tab === "scan" && (
        <ScannerTab
          importing={importing}
          onImportFile={onImportFile}
          error={error}
          onClearError={() => setError(null)}
        />
      )}

      {tab === "db" && (
        <IngredientsDbTab
          dbState={dbState}
          dbSearch={dbSearch}             setDbSearch={setDbSearch}
          selectedIngredients={selectedIngredients} setSelectedIngredients={setSelectedIngredients}
          editingCell={editingCell}       setEditingCell={setEditingCell}
          editValue={editValue}           setEditValue={setEditValue}
          commitEdit={commitEdit}
          editingPackage={editingPackage} setEditingPackage={setEditingPackage}
          pkgEditVal={pkgEditVal}         setPkgEditVal={setPkgEditVal}
          commitPackageEdit={commitPackageEdit}
          priceRunning={apify.priceRunning}
          priceProgress={apify.priceProgress}
          onRunPriceUpdate={() => apify.runPriceUpdate(selectedIngredients, dbState, setDb)}
          needsCostingCount={needsCostingCount}
          onDeleteIngredient={onDeleteIngredient}
        />
      )}

      {tab === "cost" && (
        <CostingTab
          recipes={recipes}
          activeRecipeId={activeRecipeId} setActiveRecipeId={setActiveRecipeId}
          recipe={recipe}
          enriched={enriched}
          ingTotal={ingTotal}
          overhead={overhead}
          matchedCount={matchedCount}
          unmatchedCount={unmatchedCount}
          packagingCost={packagingCost}       setPackagingCost={setPackagingCost}
          editingRecipe={editingRecipe}       setEditingRecipe={setEditingRecipe}
          onSaveRecipeEdit={onSaveRecipeEdit}
          onStartEditRecipe={onStartEditRecipe}
          onGoToScanner={() => setTab("scan")}
          onGoToDb={() => setTab("db")}
        />
      )}

      {tab === "book" && (
        <RecipeBookTab
          recipes={recipes}
          activeRecipeId={activeRecipeId} setActiveRecipeId={setActiveRecipeId}
          favourites={favourites}
          collections={collections}
          bookShowStarred={bookShowStarred} setBookShowStarred={setBookShowStarred}
          collectionMenu={collectionMenu}   setCollectionMenu={setCollectionMenu}
          newColName={newColName}           setNewColName={setNewColName}
          onToggleFavourite={onToggleFavourite}
          onAddToCollection={onAddToCollection}
          onRemoveFromCollection={onRemoveFromCollection}
          onDeleteRecipe={onDeleteRecipe}
          packagingCost={packagingCost}
          matchIngredientEff={(name, unit) => matchIngredientEff(name, unit, dbState)}
          calcOverhead={calcOverhead}
          onGoToScanner={() => setTab("scan")}
          onGoToCosting={() => setTab("cost")}
        />
      )}

      {tab === "live" && <LivePricesTab />}

      <PriceReviewModal
        reviewItem={apify.reviewItem}
        reviewQueue={apify.reviewQueue}
        onAccept={(product) => apify.acceptProduct(product, dbState, setDb)}
        onSkip={apify.skipReview}
      />

    </div>
  );
}
