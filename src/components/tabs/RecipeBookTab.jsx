const C = {
  amber:       "#BA7517",
  amberMid:    "#EF9F27",
  amberBg:     "#FAEEDA",
  amberTxt:    "#633806",
  amberBorder: "#FAC775",
  success:     "#3B6D11",
  successBg:   "#EAF3DE",
  danger:      "#A32D2D",
  dangerBg:    "#FCEBEB",
};

// Props: { recipes, activeRecipeId, setActiveRecipeId, favourites, collections,
//          bookShowStarred, setBookShowStarred, collectionMenu, setCollectionMenu,
//          newColName, setNewColName, onToggleFavourite, onAddToCollection,
//          onRemoveFromCollection, onDeleteRecipe, onStartEditRecipe,
//          packagingCost, matchIngredientEff, calcOverhead,
//          onGoToScanner, onGoToCosting }
export default function RecipeBookTab({
  recipes, activeRecipeId, setActiveRecipeId,
  favourites, collections,
  bookShowStarred, setBookShowStarred,
  collectionMenu, setCollectionMenu,
  newColName, setNewColName,
  onToggleFavourite, onAddToCollection, onRemoveFromCollection, onDeleteRecipe,
  packagingCost,
  matchIngredientEff, calcOverhead,
  onGoToScanner, onGoToCosting,
}) {
  if (!recipes || recipes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-secondary)" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📚</div>
        <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>No recipes yet</p>
        <p style={{ margin: "0 0 20px", fontSize: 13 }}>Import a recipe from the Upload tab</p>
        <button onClick={onGoToScanner} style={{
          padding: "9px 22px", borderRadius: 6, background: C.amber, color: "#fff",
          border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
        }}>Go to Upload</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          {bookShowStarred ? favourites.length : recipes.length} recipe{(bookShowStarred ? favourites.length : recipes.length) !== 1 ? "s" : ""}
          {favourites.length > 0 && ` · ${favourites.length} starred`}
        </p>
        {favourites.length > 0 && (
          <button
            onClick={() => setBookShowStarred(s => !s)}
            style={{
              padding: "3px 10px", fontSize: 11, borderRadius: 20, border: "none", cursor: "pointer",
              background: bookShowStarred ? C.amber : "var(--color-background-secondary)",
              color: bookShowStarred ? "#fff" : "var(--color-text-secondary)",
              fontWeight: 500,
            }}
          >
            {bookShowStarred ? "★ Starred" : "☆ All"}
          </button>
        )}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
        padding: "6px 0", borderBottom: `1px solid var(--color-border-tertiary)`,
        fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)",
        marginBottom: 2, gap: 4,
      }}>
        <span></span>
        <span>Recipe</span>
        <span style={{ textAlign: "right", paddingRight: 8 }}>Cost price</span>
        <span></span>
        <span></span>
      </div>

      {recipes.filter(r => !bookShowStarred || favourites.includes(r.id)).map((r, idx) => {
        const ingTotal = r.ingredients.reduce((s, ing) => {
          const m = matchIngredientEff(ing.name, ing.unit);
          return s + (m && m.costPerUnit > 0 ? m.costPerUnit * ing.amount : 0);
        }, 0);
        const totalCost = ingTotal > 0 ? calcOverhead(ingTotal, packagingCost).total : null;
        const isActive  = r.id === activeRecipeId;
        const isFav     = favourites.includes(r.id);
        const inCols    = Object.entries(collections).filter(([, ids]) => ids.includes(r.id)).map(([n]) => n);
        const menuOpen  = collectionMenu === r.id;
        return (
          <div
            key={r.id}
            style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
              alignItems: "center", gap: 4,
              padding: "11px 0",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
              background: isActive ? C.amberBg : "transparent",
              marginInline: isActive ? -8 : 0,
              paddingInline: isActive ? 8 : 0,
              borderRadius: isActive ? 6 : 0,
              position: "relative",
            }}
          >
            {/* Star */}
            <button
              onClick={e => { e.stopPropagation(); onToggleFavourite(r.id); }}
              title={isFav ? "Remove from favourites" : "Add to favourites"}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 16, padding: "0 4px", lineHeight: 1,
                color: isFav ? C.amber : "var(--color-border-tertiary)",
              }}
            >{isFav ? "★" : "☆"}</button>

            {/* Title + collection badges */}
            <div
              style={{ cursor: "pointer" }}
              onClick={() => { setActiveRecipeId(r.id); onGoToCosting(); }}
            >
              <span style={{
                fontSize: 14, fontWeight: isActive ? 500 : 400,
                color: isActive ? C.amber : "var(--color-text-primary)",
              }}>
                {String(idx + 1).padStart(2, "0")}. {r.title}
              </span>
              {inCols.map(col => (
                <span key={col} style={{
                  marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 4,
                  background: "var(--color-background-secondary)",
                  color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)",
                }}>{col}</span>
              ))}
            </div>

            {/* Cost */}
            <span
              style={{
                fontSize: 14, fontWeight: 500, paddingRight: 4,
                color: totalCost ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                textAlign: "right", cursor: "pointer",
              }}
              onClick={() => { setActiveRecipeId(r.id); onGoToCosting(); }}
            >
              {totalCost ? `R${totalCost.toFixed(2)}` : "—"}
            </span>

            {/* Add to collection */}
            <div style={{ position: "relative" }}>
              <button
                onClick={e => { e.stopPropagation(); setCollectionMenu(menuOpen ? null : r.id); setNewColName(""); }}
                title="Add to collection"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, padding: "4px 6px", color: "var(--color-text-secondary)", opacity: 0.6,
                }}
              >+</button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute", right: 0, top: "110%", zIndex: 100,
                    background: "var(--color-background-primary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: 8, padding: 10, minWidth: 180,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Add to collection
                  </p>
                  {Object.keys(collections).map(col => (
                    <button
                      key={col}
                      onClick={() => onAddToCollection(r.id, col)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "6px 8px", fontSize: 13, borderRadius: 6,
                        background: (collections[col] || []).includes(r.id) ? C.amberBg : "none",
                        color: (collections[col] || []).includes(r.id) ? C.amber : "var(--color-text-primary)",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      {col}{(collections[col] || []).includes(r.id) ? " ✓" : ""}
                    </button>
                  ))}
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <input
                      type="text"
                      placeholder="New collection…"
                      value={newColName}
                      onChange={e => setNewColName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && newColName.trim()) onAddToCollection(r.id, newColName.trim()); }}
                      style={{ flex: 1, fontSize: 12, padding: "4px 8px", borderRadius: 6 }}
                      autoFocus
                    />
                    <button
                      onClick={() => { if (newColName.trim()) onAddToCollection(r.id, newColName.trim()); }}
                      disabled={!newColName.trim()}
                      style={{
                        padding: "4px 10px", fontSize: 12, borderRadius: 6,
                        background: newColName.trim() ? C.amber : "var(--color-background-secondary)",
                        color: newColName.trim() ? "#fff" : "var(--color-text-secondary)",
                        border: "none", cursor: newColName.trim() ? "pointer" : "not-allowed",
                      }}
                    >Add</button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={e => { e.stopPropagation(); onDeleteRecipe(r.id); }}
              title="Delete recipe"
              style={{
                padding: "4px 8px", fontSize: 11, borderRadius: 4,
                background: "none", color: "var(--color-text-secondary)",
                border: "none", cursor: "pointer", opacity: 0.5,
              }}
            >✕</button>
          </div>
        );
      })}

      {/* Collections summary */}
      {Object.keys(collections).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            My Collections
          </p>
          {Object.entries(collections).map(([colName, ids]) => (
            <div key={colName} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{colName}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{ids.length} recipe{ids.length !== 1 ? "s" : ""}</span>
              </div>
              {ids.map(id => {
                const rec = recipes.find(r => r.id === id);
                if (!rec) return null;
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 12 }}>
                    <button
                      onClick={() => { setActiveRecipeId(id); onGoToCosting(); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 13, color: C.amber, padding: "3px 0", textDecoration: "underline dotted",
                      }}
                    >{rec.title}</button>
                    <button
                      onClick={() => onRemoveFromCollection(id, colName)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--color-text-secondary)", opacity: 0.5 }}
                    >✕</button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
