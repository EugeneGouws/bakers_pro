# v2.1 Plan — Baker's Cost Pro

## Priority Order

1. **Recipe Book: search/filter**
2. **Duplicate recipe detection on import**
3. **Full frontend design overhaul (Tailwind CSS)**

---

## Feature 1: Recipe Book Search/Filter

**`src/App.jsx`**
- Add `bookSearch` state (string, default `""`)
- Pass `bookSearch` + `setBookSearch` to `RecipeBookTab`

**`src/components/tabs/RecipeBookTab.jsx`**
- Add search input above column headers
- Filter: `recipes.filter(r => (!bookShowStarred || favourites.includes(r.id)) && r.title.toLowerCase().includes(bookSearch.toLowerCase()))`
- Show "X of Y recipes" count
- Clear (✕) button inside input when non-empty

No new hooks or storage needed — purely UI filter.

---

## Feature 2: Duplicate Recipe Detection

**`src/App.jsx` — inside `finishImport()`**

After `if (dbChanged) setDb(currentDb)`, before building `newRecipe`:
```js
const titleExists = recipes.some(
  r => r.title.trim().toLowerCase() === (parsed.title || "Imported Recipe").trim().toLowerCase()
);
if (titleExists) {
  const proceed = window.confirm(`"${parsed.title}" already exists. Import anyway?`);
  if (!proceed) return;
}
```

No new state or components needed — `window.confirm()` is sufficient.

---

## Feature 3: Full Frontend Design Overhaul (Tailwind CSS)

### Install
```
npm install tailwindcss @tailwindcss/vite
```

**`vite.config.js`** — add plugin:
```js
import tailwindcss from '@tailwindcss/vite'
plugins: [react(), tailwindcss()]
```

**`src/index.css`** — replace `:root` block with:
```css
@import "tailwindcss";
@theme {
  --color-amber: #BA7517;
  --color-amber-mid: #EF9F27;
  --color-amber-bg: #FAEEDA;
  --color-amber-txt: #633806;
  --color-success: #3B6D11;
  --color-success-bg: #EAF3DE;
  --color-danger: #A32D2D;
  --color-danger-bg: #FCEBEB;
}
```

### Migration order (smallest → largest)
1. `Badge.jsx`
2. `Button.jsx`
3. `Header.jsx`
4. `TabBar.jsx`
5. `Modal.jsx`
6. `PriceReviewModal.jsx`
7. `ScannerTab.jsx`
8. `LivePricesTab.jsx`
9. `RecipeBookTab.jsx`
10. `CostingTab.jsx`
11. `IngredientsDbTab.jsx`

Remove `C = { amber: ... }` color objects from each tab — replace with Tailwind classes.
Dark mode via Tailwind `dark:` variant, replacing the manual `@media (prefers-color-scheme: dark)` block.

### Implementation sequence
- **Phase A** (1 session): Features 1 + 2 — small, testable immediately
- **Phase B** (1–2 sessions): Feature 3 — one component at a time, build passes at each step

---

## Verification Checklist

**Feature 1**
- [ ] Search filters recipe list in real-time
- [ ] Works combined with starred filter
- [ ] Clear button resets
- [ ] "X of Y" count correct

**Feature 2**
- [ ] Import duplicate → confirm dialog with correct title
- [ ] Cancel → no recipe added
- [ ] Confirm → recipe added normally, navigate to Costing

**Feature 3**
- [ ] `npm run build` passes with no new errors
- [ ] Amber colors and hover states correct
- [ ] Dark mode works
- [ ] Modal overlay regression check (solid background)
