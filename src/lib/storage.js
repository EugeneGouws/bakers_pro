// Personal data stored only on this device — never pushed to GitHub.

import { INGREDIENTS_DB } from "../data/defaultIngredients.js";
import seedRecipes from "../data/defaultRecipes.json";

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initDb() {
  try {
    const saved = localStorage.getItem("bakerspro_db");
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return INGREDIENTS_DB.map(item => ({ ...item, dateLastUpdated: "2026-03-31", needsCosting: false }));
}

export function saveDb(db) {
  saveJson("bakerspro_db", db);
}

export function initRecipes() {
  try {
    const saved = localStorage.getItem("bakerspro_recipes");
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && parsed.length > 0) return parsed;
  } catch { /* ignore */ }
  localStorage.setItem("bakerspro_recipes", JSON.stringify(seedRecipes));
  return seedRecipes;
}

export function saveRecipes(recipes) {
  saveJson("bakerspro_recipes", recipes);
}

export const loadFavourites  = () => loadJson("bakerspro_favourites",  []);
export const saveFavourites  = (v) => saveJson("bakerspro_favourites",  v);

export const loadCollections = () => loadJson("bakerspro_collections", {});
export const saveCollections = (v) => saveJson("bakerspro_collections", v);

export const loadPreferences = () => loadJson("bakerspro_preferences", {});
export const savePreferences = (v) => saveJson("bakerspro_preferences", v);
