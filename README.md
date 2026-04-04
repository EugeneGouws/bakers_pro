# Baker's Cost Pro — SA Edition

A recipe costing tool for South African bakers. Community data is shared via GitHub; personal data stays on your device. No subscriptions, no paid APIs.

## Features

- **Recipe import** — upload `.txt`, `.md`, `.docx`, `.pdf`, `.xlsx`
- **Ingredient DB** — 57 ZAR-priced ingredients (g/ml/each units); click any price to edit inline; bulk price update via Apify/Checkers (5 candidates shown for user selection); tracks last-updated date and costing status
- **Costing** — per-ingredient breakdown with 15% overhead (5% operations + 5% equipment + 5% supplies) + packaging cost (default R16, editable); sell-price multipliers 2×, 2.5×, 3× (user-editable)
- **Recipe Book** — numbered list of all recipes with live cost price; ★ favourites; filter to starred recipes only; named collections; inline edit of title and quantities
- **Ingredient deletion** — click ✕ to remove erroneous ingredients from the database (with confirmation)
- **On-device AI validation** — after import, a review modal shows each ingredient's match status live. Gemini Nano (Chrome) or Ollama (dev) checks unmatched names in the background; per-row status tags (matched / AI-resolved / needs confirmation / unmatched). Requires a one-time 1.7 GB download on Chrome; user-consented.
- **Ingredient pre-selection on import** — after a recipe is loaded, all new and outdated ingredients are pre-selected in the DB tab for an immediate price update run. Selection clears automatically after a price update completes.

## Stack

React 19 · Vite 8 · mammoth (docx) · unpdf (pdf) · xlsx · Netlify Functions

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## Environment variables

Create a `.env` file (see `.env.example`):

```
VITE_APIFY_KEY=        # Apify API key for Checkers price scraping
VITE_GITHUB_REPO=EugeneGouws/bakers_pro
VITE_GITHUB_BRANCH=main
```

## Deploying (Netlify)

Set these in **Netlify → Site settings → Environment variables**:

| Variable | Purpose |
|---|---|
| `VITE_APIFY_KEY` | Apify key |
| `VITE_GITHUB_REPO` | `owner/repo` |
| `VITE_GITHUB_BRANCH` | branch (e.g. `main`) |
| `VITE_GITHUB_TOKEN` | GitHub PAT with `Contents: write` — used server-side by the Netlify function only |

## Data model

| Layer | Storage | Contents |
|---|---|---|
| Community | GitHub `data/ingredients.json` | Shared ingredient prices |
| Community | GitHub `data/recipes.json` | Shared recipe collection |
| Personal | localStorage `bakerspro_db` | Personal price overrides |
| Personal | localStorage `bakerspro_recipes` | Private (non-shared) recipes |
| Personal | localStorage `bakerspro_favourites` | Starred recipe IDs |
| Personal | localStorage `bakerspro_collections` | Named recipe sets |
| Personal | localStorage `bakerspro_consent_storage` | Storage consent acknowledgement |
| Personal | localStorage `bakerspro_consent_ai` | AI download consent (accepted/declined) |

## First load

On first open the app seeds from `src/data/recipes.json`. To reset personal data: `localStorage.clear()` in the browser console, then reload.

## Roadmap

**v2.0** (complete)
- Modular React refactor with local-first architecture
- Recipe import from files (.txt, .md, .docx, .pdf, .xlsx)
- Ingredient DB with inline editing and bulk price updates via Apify/Checkers
- Costing calculator with overhead formula and configurable packaging/markup
- Recipe collection with favorites and named groupings

**v2.1** (in progress)
- ✅ On-device AI validation (Gemini Nano / Ollama) — background correction toast
- ✅ Consent screens — storage notice and AI download prompt
- Recipe Book search/filter by title
- Duplicate recipe detection on import
- Full frontend design overhaul

**v2.2+** (planned)
- Community sync — shared ingredient prices and recipes via GitHub
- Contributor identity — display name in preferences
- Price history tracking per ingredient
