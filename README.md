# Baker's Cost Pro — SA Edition

A browser-only recipe costing tool for South African bakers. No backend, no subscriptions, no paid APIs.

## Features

- **Recipe import** — paste a URL (JSON-LD recipe sites) or upload `.txt`, `.md`, `.docx`, `.pdf`, `.xlsx`
- **Ingredient DB** — 78 ZAR-priced ingredients; click any price to edit inline; tracks last-updated date and costing status
- **Costing** — per-ingredient breakdown with 15% overhead + R16 packaging; sell-price suggestions at 2×, 2.5×, 3×
- **Recipe Book** — numbered list of all saved recipes with live cost price; inline edit of title and quantities
- **Persistence** — ingredient prices and recipe history saved to localStorage; 14 recipes pre-loaded from Cake Costings.xlsx

## Stack

React 19 · Vite 8 · mammoth (docx) · unpdf (pdf) · xlsx

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## First load

On first open the app seeds 14 recipes from `src/data/recipes.json` into localStorage.
To reset to defaults: `localStorage.clear()` in the browser console, then reload.
