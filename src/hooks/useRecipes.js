import { useState } from "react";
import { initRecipes, saveRecipes } from "../lib/storage.js";

// Provides the recipes list with automatic localStorage persistence.
// Returns [recipes, setRecipes]
// setRecipes(newList) — replaces state and persists immediately.
export default function useRecipes() {
  const [recipes, setRecipesRaw] = useState(initRecipes);

  function setRecipes(next) {
    const resolved = typeof next === "function" ? next(recipes) : next;
    setRecipesRaw(resolved);
    saveRecipes(resolved);
  }

  return [recipes, setRecipes];
}
