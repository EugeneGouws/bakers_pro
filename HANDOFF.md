# HANDOFF.md

**Last updated:** 2026-04-04 · branch: `v2.1` · **Status: v2.1 in progress**

## What was accomplished this session

- ✅ `suggestIngredientFixes` — replaces `validateParsedRecipe`; sends only unmatched ingredient names to AI (~100 chars vs 3000+); splits results into `resolved` (silent) and `needsConfirm` (user choice)
- ✅ `ImportConfirmModal` — new component; opens immediately on file parse; per-ingredient status column (matched/loading/ai-resolved/ai-suggested/unmatched); pulsing amber dot while AI runs; live row updates when AI resolves; Yes/No inline for ai-suggested; Accept merges all; Use as parsed ignores AI
- ✅ `ScannerTab` — wired to `ImportConfirmModal`; tags ingredients via `matchIngredientEff` before opening modal; fires `suggestIngredientFixes` in background; functional state guard handles modal-closed-before-AI-returns safely
- ✅ Nano `responseConstraint` — passes JSON schema to `session.prompt()` to hard-constrain output shape; equivalent to Ollama's `format` parameter
- ✅ System prompt — rewritten as explicit JSON API with SA/Afrikaans baking glossary embedded (koekmeel, koeksoda, konfyt, amasi, stork bake, rama)
- ✅ Post-import pre-selection — `finishImport` selects all `needsCosting` / `costPerUnit === 0` / outdated (>30 days) ingredients so DB tab is ready for an immediate price run
- ✅ Price update deselect — `onRunPriceUpdate` awaits completion then clears `selectedIngredients`
- ✅ AI integration skill doc saved to `~/.claude/skills/ai-integration/SKILL.md`

## Current state

| Layer | Status | Notes |
|---|---|---|
| File import | ✅ stable | .txt .md .docx .pdf .xlsx |
| AI validation | ✅ stable | Focused unmatched-only flow; Nano responseConstraint; SA glossary |
| ImportConfirmModal | ✅ stable | Live status tags, pulsing dot, Yes/No confirm, Use as parsed |
| Post-import pre-selection | ✅ stable | New + outdated ingredients selected on recipe save |
| Price update | ✅ stable | Clears selection on completion |
| Consent screens | ✅ stable | Storage consent banner + AI download prompt |
| Ingredients DB | ✅ stable | Inline editing, bulk Apify/Checkers update, delete |
| Costing tab | ✅ stable | Ingredient breakdown, overhead, editable packaging/multipliers |
| Recipe Book | ✅ stable | List with live costs, ★ favourites, named collections |
| Price review modal | ✅ stable | White candidate boxes, amber hover |
| Tests | ❌ not started | No test framework configured |

## Known bugs

1. **#6: Unit mismatch in costing** (Deferred)
   - When recipe unit (g/ml) doesn't match DB unit (each), fallback matching produces garbage costs
   - Example: recipe "80g chocolate" matches DB "chocolate bar (1 each @ R52)" → shows R52/g
   - Status: User approved deferral; to be fixed server-side before production deploy

## v2.1 Backlog (Priority Order)

**Ready to implement:**
1. **Recipe Book: search/filter** — filter list by title, quick find by ingredient
2. **Recipe Book: duplicate detection** — warn on import if same title already exists
3. **Frontend design refactor** — extract colour tokens to CSS variables, normalise inline styles, complete dark mode

**Deferred (pending feedback):**
- **Bug #6: Unit mismatch detection** — awaiting beta testing; fix will be server-side

**Future (v2.2+):**
- **GitHub sync** — re-enable shareOnImport, community recipes/prices
- **Contributor identity** — display name in preferences
- **Price history** — track changes over time per ingredient

## Next session plan

1. **[TOP PRIORITY] Recipe Book search/filter** — add a search input above the recipe list; filter by title as user types
2. **Duplicate detection on import** — check existing recipe titles before calling `finishImport`; show a confirmation if match found
3. **Frontend design overhaul** — normalise inline styles across all tabs, flesh out dark mode

## Architecture reminder

- **Dependency direction:** tabs → lib/hooks → storage. Never the reverse.
- **Stable files (avoid touching):** `BakersCostPro.jsx` (v1.0 reference), `src/lib/storage.js`, `src/data/defaultIngredients.js`
- **Prices compute at render:** never stored in recipe objects; always via `matchIngredientEff()`
- **No logic in tabs:** all business logic lives in `lib/` or `hooks/`
- **localStorage keys:** `bakerspro_db` · `bakerspro_recipes` · `bakerspro_favourites` · `bakerspro_collections` · `bakerspro_preferences` · `bakerspro_consent_storage` · `bakerspro_consent_ai`
- **AI skill doc:** `~/.claude/skills/ai-integration/SKILL.md` — covers both backends, prompt engineering, unmatched-only pattern, timeout values, testing checklist
