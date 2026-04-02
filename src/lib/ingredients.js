export { INGREDIENTS_DB, FREE_INGREDIENTS } from "../data/defaultIngredients.js";

// ── Overhead formula (reverse-engineered from Cake_Costings.xlsx) ──────────
//   Operating  = 5% of ingredients
//   Equipment  = 5% of ingredients
//   Supplies   = 5% of ingredients + packaging cost
//   Total      = Ingredients + Supplies + Operating + Equipment
export function calcOverhead(ingredientTotal, pkgCost = 16) {
  const opCost    = ingredientTotal * 0.05;
  const equipment = ingredientTotal * 0.05;
  const supplies  = ingredientTotal * 0.05;
  const total     = ingredientTotal + supplies + opCost + equipment + pkgCost;
  return { supplies, opCost, equipment, packaging: pkgCost, total };
}

// ── Ingredient DB lookup ────────────────────────────────────────────────────
export function matchIngredientEff(name, unit, db) {
  const n = (name || "").toLowerCase().trim();
  const u = (unit || "").toLowerCase().trim();
  let m = db.find(d => d.aliases.some(a => a === n) && d.unit === u);
  if (m) return m;
  m = db.find(d => d.aliases.some(a => a.includes(n) || n.includes(a)) && d.unit === u);
  if (m) return m;
  return db.find(d => d.aliases.some(a => a === n || a.includes(n) || n.includes(a))) || null;
}

// ── Date helpers ────────────────────────────────────────────────────────────
export function isOutdated(dateStr) {
  if (!dateStr) return true;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 > 30;
}

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "2-digit" });
}
