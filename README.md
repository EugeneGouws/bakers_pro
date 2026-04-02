# Baker's Cost Pro — SA Edition

A recipe costing tool for South African bakers. Community data is shared via GitHub; personal data stays on your device. No subscriptions, no paid APIs.

## Features

- **Recipe import** — upload `.txt`, `.md`, `.docx`, `.pdf`, `.xlsx`
- **Ingredient DB** — 57 ZAR-priced ingredients (g/ml/each units); click any price to edit inline; bulk price update via Apify/Checkers (5 candidates shown for user selection); tracks last-updated date and costing status
- **Costing** — per-ingredient breakdown with 15% overhead (5% operations + 5% equipment + 5% supplies) + packaging cost (default R16, editable); sell-price multipliers 2×, 2.5×, 3× (user-editable)
- **Recipe Book** — numbered list of all recipes with live cost price; ★ favourites; filter to starred recipes only; named collections; inline edit of title and quantities
- **Community sync** — on load, fetches shared ingredient prices and community recipes from GitHub; "Community synced" badge confirms live data
- **Share with community** — optional toggle on import; shared recipes are committed to the GitHub repo for all users

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

## First load

On first open the app seeds from `src/data/recipes.json`, then silently merges community data from GitHub. To reset personal data: `localStorage.clear()` in the browser console, then reload.
