// Baker's Cost Pro — SA Edition
// Recipe import + Ingredient Costing
// Stack: React (Vite) — browser-only, no backend required
// ============================================================
// iOS PORT NOTES:
//   - Replace file/URL inputs with DocumentPicker / fetch
//   - Replace inline styles with StyleSheet.create()
//   - fetch() works the same in React Native
//   - Remove HTML-specific elements (table → FlatList etc.)
//   - Use react-native-safe-area-context for safe areas
// ============================================================

import { useState, useEffect, useRef } from "react";
import seedRecipes from "./data/recipes.json";
import { fetchGitHubJson, commitGitHubJson } from "./lib/github.js";
import { loadFavourites, saveFavourites, loadCollections, saveCollections } from "./lib/storage.js";

// ============================================================
// INGREDIENT DATABASE  (source: data/ingredients.json)
// Format: { name, aliases[], unit, costPerUnit, pkg }
// dateLastUpdated and needsCosting are added in state init.
// ============================================================
const INGREDIENTS_DB = [
  { name: "Almond Flour", aliases: ["almond flour","almond"], unit: "g", costPerUnit: 0.265, pkg: "1000g · R265" },
  { name: "All Spice", aliases: ["all spice","allspice","mixed spice"], unit: "g", costPerUnit: 0.64, pkg: "25g · R16" },
  { name: "Banana", aliases: ["banana","bananas"], unit: "each", costPerUnit: 3, pkg: "6 · R18" },
  { name: "Bicarbonate of Soda", aliases: ["bicarb","baking soda","bicarbonate of soda","bicarbonate","sodium bicarbonate"], unit: "ml", costPerUnit: 0.014423, pkg: "1040ml · R15" },
  { name: "Baking Powder", aliases: ["bpowder","baking powder"], unit: "ml", costPerUnit: 0.026667, pkg: "1050ml · R28" },
  { name: "Brown Sugar", aliases: ["bsugar","brown sugar","demerara","light brown sugar","dark brown sugar"], unit: "g", costPerUnit: 0.010638, pkg: "2820g · R30" },
  { name: "Butter (cup)", aliases: ["butter"], unit: "ml", costPerUnit: 0.11875, pkg: "480ml · R57" },
  { name: "Butter (g)", aliases: ["butter"], unit: "g", costPerUnit: 0.114, pkg: "500g · R57" },
  { name: "Buttermilk", aliases: ["buttermilk"], unit: "ml", costPerUnit: 0.020833, pkg: "960ml · R20" },
  { name: "Caramel Treat", aliases: ["caramel treat","caramel","dulce de leche","caramel spread"], unit: "g", costPerUnit: 0.091639, pkg: "360g · R32.99" },
  { name: "Carrots", aliases: ["carrot","carrots","grated carrot","grated carrots"], unit: "g", costPerUnit: 0.011, pkg: "1000g · R11" },
  { name: "Castor Sugar", aliases: ["castor sugar","caster sugar","superfine sugar"], unit: "g", costPerUnit: 0.10598, pkg: "500g · R52.99" },
  { name: "Dry Chillies", aliases: ["chillies dry","dried chilli","chilli","chili flakes","red chilli"], unit: "g", costPerUnit: 0.2, pkg: "50g · R10" },
  { name: "Dark Chocolate", aliases: ["choc dark","dark chocolate","dark choc","bittersweet chocolate","70% chocolate"], unit: "each", costPerUnit: 47, pkg: "1 · R47" },
  { name: "Milk Chocolate", aliases: ["choc milk","milk chocolate","milk choc"], unit: "each", costPerUnit: 15, pkg: "1 · R15" },
  { name: "White Chocolate", aliases: ["choc white","white chocolate","white choc"], unit: "each", costPerUnit: 11, pkg: "1 · R11" },
  { name: "Ground Cinnamon", aliases: ["cinamon","cinnamon","ground cinnamon","cinnamon powder"], unit: "ml", costPerUnit: 0.078947, pkg: "190ml · R15" },
  { name: "Cinnamon Stick", aliases: ["cinnamon rolls","cinnamon sticks","cinnamon stick"], unit: "each", costPerUnit: 1.923077, pkg: "13 · R25" },
  { name: "Cloves", aliases: ["clove","cloves","ground cloves"], unit: "g", costPerUnit: 0.34, pkg: "25g · R8.50" },
  { name: "Cocoa Powder", aliases: ["coco","cocoa","cocoa powder","cacao","dutch cocoa","unsweetened cocoa"], unit: "g", costPerUnit: 0.045, pkg: "1000g · R45" },
  { name: "Coconut Sugar", aliases: ["coconut sugar","palm sugar"], unit: "g", costPerUnit: 0.256667, pkg: "300g · R77" },
  { name: "Coffee", aliases: ["coffee","instant coffee","espresso","strong coffee"], unit: "g", costPerUnit: 0.26, pkg: "250g · R65" },
  { name: "Condensed Milk", aliases: ["condenced milk","condensed milk","sweetened condensed milk"], unit: "g", costPerUnit: 0.064935, pkg: "385g · R25" },
  { name: "Corn Syrup", aliases: ["corn syrup","golden syrup","light corn syrup"], unit: "ml", costPerUnit: 0.372093, pkg: "473ml · R176" },
  { name: "Cornflour", aliases: ["cornflour","cornstarch","corn flour","corn starch","maizena"], unit: "g", costPerUnit: 0.052, pkg: "500g · R26" },
  { name: "Cream", aliases: ["cream","whipping cream","double cream","heavy cream","fresh cream"], unit: "ml", costPerUnit: 0.125, pkg: "240ml · R30" },
  { name: "Cream Cheese", aliases: ["cream cheese","philadelphia"], unit: "g", costPerUnit: 0.25213, pkg: "230g · R57.99" },
  { name: "Dates", aliases: ["date","dates","medjool dates","pitted dates"], unit: "g", costPerUnit: 0.05, pkg: "500g · R25" },
  { name: "Eggs", aliases: ["egg","eggs","large eggs","xl eggs"], unit: "each", costPerUnit: 1.5, pkg: "30 · R45" },
  { name: "Flake", aliases: ["flake","chocolate flake","cadbury flake"], unit: "g", costPerUnit: 0.374688, pkg: "32g · R11.99" },
  { name: "Flour", aliases: ["flour","cake flour","all purpose flour","plain flour","all-purpose flour"], unit: "g", costPerUnit: 0.010414, pkg: "3840g · R39.99" },
  { name: "Food Colouring", aliases: ["food colouring","food coloring","food dye","red food colouring"], unit: "ml", costPerUnit: 0.2625, pkg: "40ml · R10.50" },
  { name: "Gelatine", aliases: ["gelatine","gelatin","gelatin powder"], unit: "g", costPerUnit: 0.11, pkg: "250g · R27.50" },
  { name: "Glutagon Flour", aliases: ["glutagon flour","gluten free flour","gluten flour","gluten-free flour"], unit: "g", costPerUnit: 0.082, pkg: "500g · R41" },
  { name: "Hazelnuts", aliases: ["hazelnut","hazelnuts","roasted hazelnuts"], unit: "g", costPerUnit: 0.3, pkg: "100g · R30" },
  { name: "Icing Sugar", aliases: ["icing sugar","powdered sugar","confectioners sugar","confectioners' sugar","icing"], unit: "g", costPerUnit: 0.013542, pkg: "1920g · R26" },
  { name: "Lemons", aliases: ["lemon","lemons","lemon zest","fresh lemon"], unit: "each", costPerUnit: 1, pkg: "30 · R30" },
  { name: "Marshmallow", aliases: ["marshmallow","marshmallows","mini marshmallows"], unit: "g", costPerUnit: 0.08, pkg: "150g · R12" },
  { name: "Mascarpone", aliases: ["mascarpone","mascarpone cheese"], unit: "g", costPerUnit: 0.16, pkg: "250g · R40" },
  { name: "Milk", aliases: ["milk","whole milk","full cream milk","fresh milk"], unit: "ml", costPerUnit: 0.015625, pkg: "1920ml · R30" },
  { name: "Nutmeg", aliases: ["nutmeg","ground nutmeg"], unit: "g", costPerUnit: 0.38, pkg: "25g · R9.50" },
  { name: "Nutmeg Whole", aliases: ["nutmeg whole","whole nutmeg"], unit: "g", costPerUnit: 0.6, pkg: "25g · R15" },
  { name: "Oil", aliases: ["oil","vegetable oil","sunflower oil","canola oil","cooking oil"], unit: "ml", costPerUnit: 0.041141, pkg: "1920ml · R78.99" },
  { name: "Pecan Nuts", aliases: ["pecan","pecans","pecan nuts","pecan halves"], unit: "g", costPerUnit: 0.19, pkg: "1000g · R190" },
  { name: "Poppy Seeds", aliases: ["poppyseeds","poppy seeds","poppy seed"], unit: "g", costPerUnit: 0.22, pkg: "250g · R55" },
  { name: "Raisins", aliases: ["raisin","raisins","sultanas","seedless raisins"], unit: "g", costPerUnit: 0.066, pkg: "250g · R16.50" },
  { name: "Salt", aliases: ["salt","fine salt","table salt","sea salt"], unit: "g", costPerUnit: 0.003926, pkg: "4330g · R17" },
  { name: "Self-raising Flour", aliases: ["self-raising flour","self raising flour","sr flour","self-rise flour"], unit: "g", costPerUnit: 0.01598, pkg: "2500g · R39.95" },
  { name: "White Sugar", aliases: ["sugar","white sugar","granulated sugar","cane sugar"], unit: "g", costPerUnit: 0.012847, pkg: "2880g · R37" },
  { name: "Vanilla Extract", aliases: ["vanilla","vanilla extract","vanilla essence","pure vanilla"], unit: "ml", costPerUnit: 0.21, pkg: "100ml · R21" },
  { name: "Vanilla Pod", aliases: ["vanilla pod","vanilla bean","vanilla beans"], unit: "each", costPerUnit: 20, pkg: "1 · R20" },
  { name: "Vegetable Shortening", aliases: ["vegatable shortening","vegetable shortening","crisco","shortening","white fat"], unit: "ml", costPerUnit: 0.0375, pkg: "480ml · R18" },
  { name: "White Vinegar", aliases: ["vinegar","white vinegar","spirit vinegar"], unit: "ml", costPerUnit: 0.016, pkg: "750ml · R12" },
  { name: "Apple Cider Vinegar", aliases: ["vinegar apple cider","apple cider vinegar","acv","cider vinegar"], unit: "ml", costPerUnit: 0.046, pkg: "500ml · R23" },
  { name: "Xanthan Gum", aliases: ["xanthan gum","xanthan"], unit: "g", costPerUnit: 0.5, pkg: "100g · R50" },
  { name: "Digestive Biscuits", aliases: ["digestive biscuits","digestives","biscuits","graham crackers"], unit: "each", costPerUnit: 74.56, pkg: "1 · R74.56" },
  { name: "Sour Cream", aliases: ["sour cream","soured cream","cultured cream"], unit: "ml", costPerUnit: 0.13996, pkg: "250ml · R34.99" }
];

// ============================================================
// OVERHEAD FORMULA (reverse-engineered from Cake_Costings.xlsx)
//   Operating  = 5% of ingredients
//   Equipment  = 5% of ingredients
//   Supplies   = 5% of ingredients + packaging cost
//   Total      = Ingredients + Supplies + Operating + Equipment
// ============================================================
function calcOverhead(ingredientTotal, pkgCost = 16) {
  const opCost    = ingredientTotal * 0.05;
  const equipment = ingredientTotal * 0.05;
  const supplies  = ingredientTotal * 0.05 + pkgCost;
  const total     = ingredientTotal + supplies + opCost + equipment;
  return { supplies, opCost, equipment, total };
}

// ============================================================
// INGREDIENT TEXT PARSER
// Used by both file import and URL import (after text extraction)
// ============================================================
const UNICODE_FRACS = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3,
  '¼': 0.25, '¾': 0.75, '⅛': 0.125,
  '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};
const UNIT_NORM = {
  cup: 'ml', cups: 'ml',
  tsp: 'ml', teaspoon: 'ml', teaspoons: 'ml',
  tbsp: 'ml', tablespoon: 'ml', tablespoons: 'ml', tbs: 'ml',
  g: 'g', gram: 'g', grams: 'g', kg: 'g',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'ml', liter: 'ml', liters: 'ml', litre: 'ml', litres: 'ml',
  slab: 'each', slabs: 'each',
  pack: 'each', packs: 'each', packet: 'each', packets: 'each',
  each: 'each', whole: 'each',
};
const UNIT_WORDS = new Set(Object.keys(UNIT_NORM));
const SKIP_LINE_RE = /^(ingredients|method|directions|instructions|for\s+the|preparation|preheat|oven|bake|mix|combine|stir|beat|fold|pour|grease|line\s+a)/i;
// Ingredients that have no cost and should never be added to the DB
const FREE_INGREDIENTS = new Set(["water", "warm water", "hot water", "cold water", "boiling water", "ice water", "iced water"]);

function parseAmountStr(s) {
  for (const [ch, val] of Object.entries(UNICODE_FRACS)) s = s.replace(ch, String(val));
  s = s.trim();
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(s) || 0;
}

function parseIngredientLine(raw) {
  let line = raw.trim();
  for (const [ch, val] of Object.entries(UNICODE_FRACS))
    line = line.replace(new RegExp(ch, 'g'), ' ' + val + ' ');
  line = line.replace(/^[-•*·]\s*/, '').trim();
  if (line.length < 2 || SKIP_LINE_RE.test(line)) return null;

  const amtM = line.match(/^(\d+(?:\s+\d+\/\d+|\/\d+|\.\d+)?)\s*/);
  if (!amtM) return null;

  let amount = parseAmountStr(amtM[1]);
  let rest = line.slice(amtM[0].length).trim();

  let unit = 'each';
  const unitM = rest.match(/^([a-zA-Z]+)\.?\s+(.*)/);
  if (unitM && UNIT_WORDS.has(unitM[1].toLowerCase())) {
    const rawU = unitM[1].toLowerCase();
    unit = UNIT_NORM[rawU];
    rest = unitM[2];
    if (rawU === 'kg') amount *= 1000;
    if (rawU === 'l' || rawU === 'liter' || rawU === 'liters' || rawU === 'litre' || rawU === 'litres') amount *= 1000;
    if (rawU === 'cup' || rawU === 'cups') amount *= 240;
    if (rawU === 'tsp' || rawU === 'teaspoon' || rawU === 'teaspoons') amount *= 5;
    if (rawU === 'tbsp' || rawU === 'tablespoon' || rawU === 'tablespoons' || rawU === 'tbs') amount *= 15;
  }

  const name = rest.replace(/,.*$/, '').replace(/\([^)]*\)/g, '').trim().toLowerCase();
  if (!name || name.length < 2 || name.split(' ').length > 7) return null;
  return { name, amount: Math.round(amount * 1000) / 1000, unit };
}

function parseRecipeText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let title = 'Imported Recipe';
  let servings = 1;
  const ingredients = [];
  let passedTitle = false;

  for (const line of lines) {
    const servM = line.match(/(?:serves?|makes?|yields?)\s*:?\s*(\d+)/i);
    if (servM) { servings = parseInt(servM[1]); continue; }
    if (/^(method|directions|instructions|preparation|steps?)\b/i.test(line)) break;
    if (/^ingredients\b/i.test(line)) { passedTitle = true; continue; }

    const parsed = parseIngredientLine(line);
    if (parsed) {
      ingredients.push(parsed);
      passedTitle = true;
    } else if (!passedTitle && !line.match(/^\d/) && line.length < 80) {
      title = line;
    }
  }
  return { title, servings, ingredients };
}

// ============================================================
// URL RECIPE PARSER  (JSON-LD schema.org/Recipe + HTML fallback)
// ============================================================
function extractJsonLdRecipe(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      let data = JSON.parse(script.textContent);
      // Handle @graph wrapper (common on Yoast SEO sites)
      if (data['@graph']) {
        data = data['@graph'].find(item => {
          const t = item['@type'];
          return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'));
        });
        if (!data) continue;
      }
      const t = data['@type'];
      if (t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))) return data;
    } catch { /* malformed JSON-LD, skip */ }
  }
  return null;
}

function extractFromJsonLd(jsonLd) {
  const title = jsonLd.name || 'Imported Recipe';
  let servings = 1;
  if (jsonLd.recipeYield) {
    const m = String(jsonLd.recipeYield).match(/\d+/);
    if (m) servings = parseInt(m[0]);
  }
  const ingredients = (jsonLd.recipeIngredient || [])
    .map(s => parseIngredientLine(String(s)))
    .filter(Boolean);
  return { title, servings, ingredients };
}

function extractFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const title = doc.querySelector('h1')?.textContent?.trim() || doc.title || 'Imported Recipe';
  const candidates = [...doc.querySelectorAll('[class*="ingredient" i], [id*="ingredient" i]')];
  const lines = candidates.map(el => el.textContent.trim()).filter(Boolean);
  const ingredients = lines.map(l => parseIngredientLine(l)).filter(Boolean);
  return { title, servings: 1, ingredients };
}

// ============================================================
// DESIGN TOKENS
// ============================================================
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

function Badge({ label, bg, color }) {
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 100,
      background: bg || "var(--color-background-secondary)",
      color: color || "var(--color-text-secondary)",
      fontWeight: 500, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ============================================================
// HELPERS
// ============================================================
function isOutdated(dateStr) {
  if (!dateStr) return true;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 > 30;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: '2-digit' });
}

function initDb() {
  try {
    const saved = localStorage.getItem('bakerspro_db');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return INGREDIENTS_DB.map(item => ({ ...item, dateLastUpdated: '2024-01-01', needsCosting: true }));
}

function initRecipes() {
  try {
    const saved = localStorage.getItem('bakerspro_recipes');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && parsed.length > 0) return parsed;
  } catch { /* ignore */ }
  // Empty or missing: seed from bundled xlsx data and persist
  localStorage.setItem('bakerspro_recipes', JSON.stringify(seedRecipes));
  return seedRecipes;
}

function saveDb(db) {
  localStorage.setItem('bakerspro_db', JSON.stringify(db));
}

function saveRecipes(recipes) {
  localStorage.setItem('bakerspro_recipes', JSON.stringify(recipes));
}

// ============================================================
// PRICE UPDATE HELPERS  (Apify / Checkers integration)
// ============================================================

function normalizeIngredientName(str) {
  return (str || "")
    .toLowerCase().trim()
    .replace(/\bkilograms?\b/g, "kg").replace(/\bgrams?\b/g, "g")
    .replace(/\blitres?\b|\bliters?\b/g, "l")
    .replace(/\bmillilitres?\b|\bmilliliters?\b/g, "ml")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeProductName(str) {
  return (str || "")
    .toLowerCase().trim()
    .replace(/\bcheckers\b|\bspar\b|\bpnp\b|\bpick n pay\b|\bwoolworths\b|\bshoprite\b/g, "")
    .replace(/\bper\s+(?:kg|g|ml|l|unit)\b/g, "")
    .replace(/\bkilograms?\b/g, "kg").replace(/\bgrams?\b/g, "g")
    .replace(/\blitres?\b|\bliters?\b/g, "l")
    .replace(/\bmillilitres?\b|\bmilliliters?\b/g, "ml")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

// Extract structured package size from a product title string
function parsePackageInfo(str) {
  const s = str || "";
  // Multi-pack: "6 x 1L", "6x500ml"
  const multiM = s.match(/(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  if (multiM) {
    return {
      packageValue: parseFloat(multiM[1]) * parseFloat(multiM[2]),
      packageUnit: multiM[3].toLowerCase(),
      rawMatchedPackageText: multiM[0],
    };
  }
  // Count pack: "18s", "12 eggs", "6 rolls"
  const countM = s.match(/(\d+)\s*(?:s\b|units?\b|eggs?\b|rolls?\b|slices?\b|pcs?\b|pieces?\b)/i);
  if (countM) {
    return { packageValue: parseFloat(countM[1]), packageUnit: "units", rawMatchedPackageText: countM[0] };
  }
  // Standard weight/volume: "2.5kg", "500g", "1L", "750ml"
  const stdM = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  if (stdM) {
    return { packageValue: parseFloat(stdM[1]), packageUnit: stdM[2].toLowerCase(), rawMatchedPackageText: stdM[0] };
  }
  // Loose/each/bunch produce
  const looseM = s.match(/\b(loose|each|bunch)\b/i);
  if (looseM) {
    return { packageValue: 1, packageUnit: "units", rawMatchedPackageText: looseM[0] };
  }
  return { packageValue: null, packageUnit: null, rawMatchedPackageText: null };
}

// Convert package to base units: kg→g, l→ml, count stays units
function convertToBaseUnits(packageValue, packageUnit) {
  if (packageValue == null || packageUnit == null) return { baseQuantity: null, baseUnit: null };
  const u = packageUnit.toLowerCase();
  if (u === "kg") return { baseQuantity: packageValue * 1000, baseUnit: "g" };
  if (u === "g")  return { baseQuantity: packageValue, baseUnit: "g" };
  if (u === "l")  return { baseQuantity: packageValue * 1000, baseUnit: "ml" };
  if (u === "ml") return { baseQuantity: packageValue, baseUnit: "ml" };
  return { baseQuantity: packageValue, baseUnit: "units" };
}

// Score a single Checkers product candidate against an ingredient (returns 0–1)
function scoreCandidate(ingredient, product) {
  const ingNorm  = normalizeIngredientName(ingredient.name);
  const prodNorm = normalizeProductName(product.name || product.title || "");
  const ingTokens  = ingNorm.split(" ").filter(Boolean);
  const prodTokens = new Set(prodNorm.split(" ").filter(Boolean));

  // 50%: Jaccard token overlap + bonus if product title starts with the ingredient tokens in order
  const overlap   = ingTokens.filter(t => prodTokens.has(t)).length;
  const unionSize = new Set([...ingTokens, ...prodTokens]).size;
  let nameSim = unionSize > 0 ? overlap / unionSize : 0;
  const prodWords = prodNorm.split(" ");
  if (ingTokens.length > 0 && ingTokens.every((t, i) => prodWords[i] === t)) nameSim = Math.min(1, nameSim + 0.15);

  // 20%: unit/package family match (mass/volume/count)
  const { packageUnit } = parsePackageInfo(product.name || product.title || "");
  const { baseUnit } = convertToBaseUnits(1, packageUnit);
  const ingUnit   = (ingredient.unit || "").toLowerCase();
  const ingFamily = ["g", "kg"].includes(ingUnit) ? "mass" : ["ml", "l"].includes(ingUnit) ? "volume" : ["each", "units"].includes(ingUnit) ? "count" : "unknown";
  const prodFamily = baseUnit === "g" ? "mass" : baseUnit === "ml" ? "volume" : baseUnit === "units" ? "count" : "unknown";
  const unitScore  = ingFamily === "unknown" || prodFamily === "unknown" ? 0.5 : ingFamily === prodFamily ? 1.0 : 0.0;

  // 15%: penalise processed/irrelevant product categories
  const IRRELEVANT = ["yoghurt", "yogurt", "muffin", "chips", "baby", "drink", "juice", "sauce", "spread", "flavoured", "flavored", "ice cream", "smoothie", "milkshake", "snack", "candy", "sweets", "pudding"];
  const catScore = IRRELEVANT.some(kw => prodNorm.includes(kw)) ? 0.0 : 1.0;

  // 15%: brand match (neutral 0.5 when ingredient has no brand preference)
  const BRANDS = ["cadbury", "ina paarman", "snowflake", "selati", "huletts", "lancewood", "clover", "sasko", "tastic", "rama"];
  const ingBrand  = BRANDS.find(b => ingNorm.includes(b));
  const prodBrand = BRANDS.find(b => prodNorm.includes(b));
  const brandScore = !ingBrand ? 0.5 : ingBrand === prodBrand ? 1.0 : 0.1;

  return (nameSim * 0.50) + (unitScore * 0.20) + (catScore * 0.15) + (brandScore * 0.15);
}

// Returns { best, score, all } — all is sorted descending by score
function chooseBestCandidate(ingredient, candidates) {
  const scored = candidates
    .map(p => ({ product: p, score: scoreCandidate(ingredient, p) }))
    .sort((a, b) => b.score - a.score);
  return { best: scored[0]?.product ?? null, score: scored[0]?.score ?? 0, all: scored };
}

// Merge matched Checkers product data onto an ingredient record
function applyMatchedProductToIngredient(ingredient, product, score) {
  const titleStr = product.name || product.title || "";
  const priceRaw = product.price ?? product.currentPrice ?? product.pricePerUnit ?? null;
  const price    = typeof priceRaw === "string" ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) : Number(priceRaw ?? 0);
  const { packageValue, packageUnit, rawMatchedPackageText } = parsePackageInfo(titleStr);
  const { baseQuantity, baseUnit } = convertToBaseUnits(packageValue, packageUnit);
  const pricePerBaseUnit = price > 0 && baseQuantity > 0 ? price / baseQuantity : null;

  // Update costPerUnit where a direct base-unit conversion exists.
  // cup/tsp/tbsp/slab/pack have no universal gram equivalent — preserve existing value.
  let costPerUnit = ingredient.costPerUnit;
  const ingUnit = (ingredient.unit || "").toLowerCase();
  if (pricePerBaseUnit != null) {
    if (baseUnit === "g"     && ingUnit === "g")    costPerUnit = pricePerBaseUnit;
    if (baseUnit === "g"     && ingUnit === "kg")   costPerUnit = pricePerBaseUnit * 1000;
    if (baseUnit === "ml"    && ingUnit === "ml")   costPerUnit = pricePerBaseUnit;
    if (baseUnit === "ml"    && ingUnit === "l")    costPerUnit = pricePerBaseUnit * 1000;
    if (baseUnit === "units" && ingUnit === "each") costPerUnit = price > 0 ? price / (packageValue || 1) : costPerUnit;
  }

  return {
    ...ingredient,
    costPerUnit,
    needsCosting: false,
    dateLastUpdated: todayStr(),
    matchedProductName: titleStr,
    retailer: "checkers",
    latestPrice: price,
    packageValue,
    packageUnit,
    baseQuantity,
    baseUnit,
    pricePerBaseUnit,
    matchConfidence: score,
    rawMatchedPackageText,
  };
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BakersCostPro() {

  // ── Tab & scanner mode ──────────────────────────────────────
  const [tab, setTab]             = useState("scan");
  const [importMode, setImportMode] = useState("url"); // "url" | "file"
  const [urlInput, setUrlInput]   = useState("");
  const [importing, setImporting] = useState(false);

  // ── DB state (mutable, localStorage-backed) ─────────────────
  const [dbState, setDbState]     = useState(initDb);
  const [dbSearch, setDbSearch]   = useState("");
  const [editingCell, setEditingCell] = useState(null); // { name }
  const [editValue, setEditValue] = useState("");

  // ── Recipe history ──────────────────────────────────────────
  const [recipes, setRecipes]         = useState(initRecipes);
  const [activeRecipeId, setActiveRecipeId] = useState(() => {
    const r = initRecipes();
    return r.length ? r[r.length - 1].id : null;
  });

  // ── Recipe editing ──────────────────────────────────────────
  const [editingRecipe, setEditingRecipe] = useState(null); // working copy { id, title, ingredients[] }

  // ── Misc ────────────────────────────────────────────────────
  const [err, setErr]             = useState(null);
  const fileRef                   = useRef(null);

  // ── Community sharing ────────────────────────────────────────
  const [shareOnImport, setShareOnImport] = useState(false);
  const [syncStatus, setSyncStatus]       = useState(null); // null | "syncing" | "synced" | "offline"
  const [communityDate, setCommunityDate] = useState(null); // lastUpdated from data/ingredients.json

  // ── Personal: favourites & collections (localStorage only) ──
  const [favourites, setFavourites]   = useState(() => loadFavourites());
  const [collections, setCollections] = useState(() => loadCollections());
  const [collectionMenu, setCollectionMenu] = useState(null); // recipe id whose menu is open
  const [newColName, setNewColName]   = useState("");

  // ── Costing: packaging control ───────────────────────────────
  const [packagingEnabled, setPackagingEnabled] = useState(true);
  const [packagingCost, setPackagingCost]       = useState(16);

  // ── Recipe Book: filter controls ─────────────────────────────
  const [bookShowStarred, setBookShowStarred]   = useState(false);

  // ── Price update ─────────────────────────────────────────────
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());
  const [priceRunning, setPriceRunning]     = useState(false);
  const [priceProgress, setPriceProgress]   = useState(null); // { done, total, current }
  const [reviewQueue, setReviewQueue]       = useState([]);
  const [reviewItem, setReviewItem]         = useState(null);
  const [editingPackage, setEditingPackage] = useState(null); // { name }
  const [pkgEditVal, setPkgEditVal]         = useState({ packageValue: "", packageUnit: "", packagePrice: "" });

  // ── GitHub community sync (runs once on mount) ──────────────
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      setSyncStatus("syncing");
      try {
        const [ghDbRaw, ghRecipesRaw] = await Promise.all([
          fetchGitHubJson("data/ingredients.json"),
          fetchGitHubJson("data/recipes.json"),
        ]);
        if (cancelled) return;

        // Support both old bare-array format and new { lastUpdated, items } format
        const ghIngredients = ghDbRaw.items ?? ghDbRaw;
        const ghRecipeItems = ghRecipesRaw.items ?? ghRecipesRaw;
        if (ghDbRaw.lastUpdated) setCommunityDate(ghDbRaw.lastUpdated);

        // Merge ingredients: local price edit wins when dateLastUpdated is newer
        setDbState(local => {
          const merged = ghIngredients.map(ghIng => {
            const loc = local.find(l => l.name === ghIng.name);
            if (loc && loc.dateLastUpdated > ghIng.dateLastUpdated) return loc;
            return ghIng;
          });
          const localOnly = local.filter(l => !merged.find(m => m.name === l.name));
          return [...merged, ...localOnly];
        });

        // Merge recipes: add community recipes that aren't in local yet
        setRecipes(local => {
          const localIds = new Set(local.map(r => r.id));
          const newCommunity = ghRecipeItems.filter(r => !localIds.has(r.id));
          return newCommunity.length ? [...local, ...newCommunity] : local;
        });

        setSyncStatus("synced");
      } catch {
        setSyncStatus("offline"); // silent — app works from local data
      }
    };
    sync();
    return () => { cancelled = true; };
  }, []);

  // ── Derived ─────────────────────────────────────────────────
  const recipe = recipes.find(r => r.id === activeRecipeId) || null;

  const matchIngredientEff = (name, unit, db = dbState) => {
    const n = (name || '').toLowerCase().trim();
    const u = (unit || '').toLowerCase().trim();
    let m = db.find(d => d.aliases.some(a => a === n) && d.unit === u);
    if (m) return m;
    m = db.find(d => d.aliases.some(a => a.includes(n) || n.includes(a)) && d.unit === u);
    if (m) return m;
    return db.find(d => d.aliases.some(a => a === n || a.includes(n) || n.includes(a))) || null;
  };

  const getIngredientWithCost = (ing) => {
    const dbMatch = matchIngredientEff(ing.name, ing.unit);
    const lineTotal = dbMatch && dbMatch.costPerUnit > 0
      ? parseFloat((dbMatch.costPerUnit * ing.amount).toFixed(4))
      : null;
    return { ...ing, dbMatch, lineTotal };
  };

  const enriched     = recipe ? recipe.ingredients.map(getIngredientWithCost) : [];
  const ingTotal     = enriched.reduce((s, i) => s + (i.lineTotal || 0), 0);
  const overhead     = recipe ? calcOverhead(ingTotal, packagingEnabled ? packagingCost : 0) : null;
  const matchedCount = enriched.filter(i => i.dbMatch).length;
  const unmatchedCount = enriched.filter(i => !i.dbMatch || i.dbMatch.needsCosting).length;
  const filteredDb   = dbState.filter(i => !dbSearch || i.name.toLowerCase().includes(dbSearch.toLowerCase()));
  const needsCostingCount = dbState.filter(i => i.needsCosting || i.costPerUnit === 0).length;

  // ── finishImport ────────────────────────────────────────────
  const finishImport = (parsed) => {
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
          pkg: '—',
          dateLastUpdated: today,
          needsCosting: true,
        });
        dbChanged = true;
      }
    }

    if (dbChanged) { setDbState(currentDb); saveDb(currentDb); }

    const newRecipe = {
      id: crypto.randomUUID(),
      title: parsed.title || 'Imported Recipe',
      servings: parsed.servings || 1,
      ingredients: parsed.ingredients.map((ing, i) => ({
        name: ing.name, amount: ing.amount, unit: ing.unit, id: i,
      })),
      importedAt: new Date().toISOString(),
    };

    const updated = [...recipes, newRecipe];
    setRecipes(updated);
    saveRecipes(updated);
    setActiveRecipeId(newRecipe.id);
    setTab('cost');

    // Optionally push to community GitHub repo
    if (shareOnImport) {
      const communityRecipe = {
        ...newRecipe,
        contributor: "anonymous",
        dateAdded: todayStr(),
        tags: [],
      };
      fetchGitHubJson("data/recipes.json")
        .then(existing => {
          const items = existing.items ?? existing;
          const already = items.some(r => r.id === communityRecipe.id);
          if (already) return;
          return commitGitHubJson(
            "data/recipes.json",
            { lastUpdated: todayStr(), items: [...items, communityRecipe] },
            `Add recipe: ${communityRecipe.title}`
          );
        })
        .catch(e => console.warn("GitHub recipe share failed:", e.message));
    }
  };

  // ── URL import ──────────────────────────────────────────────
  const importFromUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setImporting(true);
    setErr(null);
    try {
      const resp = await fetch("/.netlify/functions/fetch-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (resp.status === 404) throw new Error("Fetch function not found (404). Run `netlify dev` locally, or check Netlify deployment.");
      if (resp.status === 502) throw new Error(`Could not reach that URL. The site may be down or blocking external requests.`);
      if (!resp.ok) throw new Error(`The recipe site returned HTTP ${resp.status}. It may block external requests.`);
      const html = await resp.text();

      const jsonLd = extractJsonLdRecipe(html);
      if (jsonLd) {
        const parsed = extractFromJsonLd(jsonLd);
        if (parsed.ingredients.length > 0) { finishImport(parsed); return; }
      }

      // Fallback: CSS class heuristic
      const parsed = extractFromHtml(html);
      if (!parsed.ingredients.length)
        throw new Error("No recipe data found. The site may not use standard recipe markup, or may require JavaScript to render.");
      finishImport(parsed);
    } catch (e) {
      setErr("URL import failed: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  // ── File import ─────────────────────────────────────────────
  const importFromFile = async (file) => {
    if (!file) return;
    setImporting(true);
    setErr(null);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let parsed;

      if (ext === 'txt' || ext === 'md') {
        parsed = parseRecipeText(await file.text());

      } else if (ext === 'docx') {
        const mammoth = await import('mammoth');
        const ab = await file.arrayBuffer();
        const { value: text } = await mammoth.extractRawText({ arrayBuffer: ab });
        parsed = parseRecipeText(text);

      } else if (ext === 'pdf') {
        const { extractText } = await import('unpdf');
        const ab = await file.arrayBuffer();
        const result = await extractText(new Uint8Array(ab), { mergePages: true });
        const text = typeof result === 'string' ? result : (result.text ?? result.pages?.join('\n') ?? '');
        parsed = parseRecipeText(text);

      } else if (ext === 'xlsx') {
        const XLSX = await import('xlsx');
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(ab));
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const title = rows[0]?.[0]?.toString().trim() || file.name.replace(/\.xlsx$/i, '');
        const XLSX_SKIP = new Set(['Ingredients','Supplies','Opperating Costs','Equipment','Total Cost','Selling Price']);
        const ingredients = rows.slice(1)
          .filter(r => r[0] && !XLSX_SKIP.has(r[0].toString().trim()) && r[1] != null && r[1] !== '')
          .map(r => {
            const raw = r[0].toString();
            const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
            const name = (m ? m[1].trim() : raw.trim()).toLowerCase();
            const rawUnit = m ? m[2].trim().toLowerCase() : 'each';
            const unit = UNIT_NORM[rawUnit] || rawUnit;
            return { name, amount: Number(r[1]) || 0, unit };
          })
          .filter(i => i.name.length > 1 && !FREE_INGREDIENTS.has(i.name));
        parsed = { title, servings: 1, ingredients };

      } else {
        throw new Error(`Unsupported file type ".${ext}". Use .txt, .md, .docx, .pdf, or .xlsx`);
      }

      if (!parsed.ingredients.length)
        throw new Error("No ingredients found. Make sure the file contains lines like '2 cups flour'.");
      finishImport(parsed);
    } catch (e) {
      setErr("File import failed: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  // ── Recipe edit handlers ─────────────────────────────────────
  const startEditRecipe = (r) => setEditingRecipe({
    id: r.id, title: r.title,
    ingredients: r.ingredients.map(i => ({ ...i })),
  });

  const saveRecipeEdit = () => {
    if (!editingRecipe) return;
    const updated = recipes.map(r =>
      r.id === editingRecipe.id
        ? { ...r, title: editingRecipe.title.trim() || r.title, ingredients: editingRecipe.ingredients }
        : r
    );
    setRecipes(updated);
    saveRecipes(updated);
    setEditingRecipe(null);
  };

  // ── Delete recipe ────────────────────────────────────────────
  const deleteRecipe = (id) => {
    const updated = recipes.filter(r => r.id !== id);
    setRecipes(updated);
    saveRecipes(updated);
    if (activeRecipeId === id)
      setActiveRecipeId(updated.length ? updated[updated.length - 1].id : null);
  };

  // ── Favourites ───────────────────────────────────────────────
  const toggleFavourite = (id) => {
    const next = favourites.includes(id)
      ? favourites.filter(f => f !== id)
      : [...favourites, id];
    setFavourites(next);
    saveFavourites(next);
  };

  // ── Collections ──────────────────────────────────────────────
  const addToCollection = (recipeId, colName) => {
    const col = collections[colName] || [];
    if (col.includes(recipeId)) return;
    const next = { ...collections, [colName]: [...col, recipeId] };
    setCollections(next);
    saveCollections(next);
    setCollectionMenu(null);
    setNewColName("");
  };

  const removeFromCollection = (recipeId, colName) => {
    const col = (collections[colName] || []).filter(id => id !== recipeId);
    const next = col.length
      ? { ...collections, [colName]: col }
      : Object.fromEntries(Object.entries(collections).filter(([k]) => k !== colName));
    setCollections(next);
    saveCollections(next);
  };

  // ── DB inline editing ────────────────────────────────────────
  const commitEdit = (name) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { setEditingCell(null); return; }
    const updated = dbState.map(item =>
      item.name === name
        ? { ...item, costPerUnit: val, dateLastUpdated: todayStr(), needsCosting: false }
        : item
    );
    setDbState(updated);
    saveDb(updated);
    setEditingCell(null);
  };

  // ── Package inline editing ────────────────────────────────────
  const commitPackageEdit = (name) => {
    const val   = parseFloat(pkgEditVal.packageValue);
    const unit  = pkgEditVal.packageUnit.trim().toLowerCase();
    const price = parseFloat(pkgEditVal.packagePrice);
    if (isNaN(val) || val <= 0 || !unit) { setEditingPackage(null); return; }
    const { baseQuantity, baseUnit } = convertToBaseUnits(val, unit);
    const updated = dbState.map(ing => {
      if (ing.name !== name) return ing;
      const effectivePrice = price > 0 ? price : (ing.latestPrice ?? 0);
      const pricePerBaseUnit = effectivePrice > 0 && baseQuantity > 0 ? effectivePrice / baseQuantity : ing.pricePerBaseUnit;
      let costPerUnit = ing.costPerUnit;
      const ingUnit = (ing.unit || "").toLowerCase();
      if (pricePerBaseUnit != null) {
        if (baseUnit === "g"     && ingUnit === "g")    costPerUnit = pricePerBaseUnit;
        if (baseUnit === "g"     && ingUnit === "kg")   costPerUnit = pricePerBaseUnit * 1000;
        if (baseUnit === "ml"    && ingUnit === "ml")   costPerUnit = pricePerBaseUnit;
        if (baseUnit === "ml"    && ingUnit === "l")    costPerUnit = pricePerBaseUnit * 1000;
        if (baseUnit === "units" && ingUnit === "each") costPerUnit = effectivePrice > 0 ? effectivePrice / val : costPerUnit;
      }
      const pkgDisplay = price > 0
        ? `${val}${unit} · R${price}`
        : ing.pkg ?? `${val}${unit}`;
      return { ...ing, packageValue: val, packageUnit: unit, baseQuantity, baseUnit, pricePerBaseUnit, costPerUnit, pkg: pkgDisplay, dateLastUpdated: todayStr(), needsCosting: false };
    });
    setDbState(updated);
    saveDb(updated);
    setEditingPackage(null);
  };

  // ── Apify / Checkers bulk price update ───────────────────────
  const runPriceUpdate = async () => {
    if (priceRunning || selectedIngredients.size === 0) return;
    const apiKey = import.meta.env.VITE_APIFY_KEY;
    if (!apiKey) { setErr("Apify API key not set. Add VITE_APIFY_KEY to your .env file."); return; }

    setPriceRunning(true);
    setErr(null);
    const targets = dbState.filter(ing => selectedIngredients.has(ing.name));
    setPriceProgress({ done: 0, total: targets.length, current: targets[0]?.name ?? "" });

    let currentDb = [...dbState];
    const toReview = [];
    const errors   = [];

    for (let i = 0; i < targets.length; i++) {
      const ing = currentDb.find(d => d.name === targets[i].name) ?? targets[i];
      setPriceProgress({ done: i, total: targets.length, current: ing.name });
      try {
        const searchUrl = `https://www.checkers.co.za/search?Search=${encodeURIComponent(ing.name)}`;
        const resp = await fetch(
          `https://api.apify.com/v2/acts/tXYgrsQcGx4ReKqdW/run-sync-get-dataset-items?token=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maxItems: 5, startUrl: searchUrl }),
          }
        );
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const candidates = await resp.json();
        if (!Array.isArray(candidates) || candidates.length === 0) continue;

        const { best, score, all } = chooseBestCandidate(ing, candidates);
        // Always queue for review — show all 5 candidates to user for disambiguation
        toReview.push({ ingredient: ing, all, best, score });
      } catch (e) {
        errors.push(`"${ing.name}": ${e.message}`);
      }
    }

    setDbState(currentDb);
    saveDb(currentDb);
    setSelectedIngredients(new Set());
    setPriceProgress({ done: targets.length, total: targets.length, current: "" });
    if (errors.length > 0) setErr(`Price update errors — ${errors.join("; ")}`);

    if (toReview.length > 0) {
      setReviewItem(toReview[0]);
      setReviewQueue(toReview.slice(1));
    }
    setPriceRunning(false);
  };

  const advanceReviewQueue = () => {
    if (reviewQueue.length > 0) {
      setReviewItem(reviewQueue[0]);
      setReviewQueue(reviewQueue.slice(1));
    } else {
      setReviewItem(null);
    }
  };

  const acceptReviewProduct = (product) => {
    if (!reviewItem) return;
    const score = reviewItem.all.find(x => x.product === product)?.score ?? reviewItem.score;
    const updated = dbState.map(d => {
      if (d.name !== reviewItem.ingredient.name) return d;
      const applied = applyMatchedProductToIngredient(d, product, score);
      // Update unit to match packageUnit if they differ (g, ml, each)
      const newUnit = applied.baseUnit || d.unit;
      // Format pkg string: "{baseQuantity}{baseUnit} · R{price}"
      const newPkg = applied.baseQuantity && applied.baseUnit
        ? `${applied.baseQuantity}${applied.baseUnit} · R${applied.latestPrice?.toFixed(2) ?? product.price}`
        : d.pkg;
      return { ...applied, unit: newUnit, pkg: newPkg };
    });
    setDbState(updated);
    saveDb(updated);
    // Commit to GitHub immediately
    commitGitHubJson(
      "data/ingredients.json",
      { lastUpdated: todayStr(), items: updated },
      `Price update: ${reviewItem.ingredient.name} via Checkers`
    ).catch(e => console.warn("GitHub commit failed:", e.message));
    advanceReviewQueue();
  };

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{ padding: "1.5rem 1.5rem 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: C.amberBg,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
          }}>🎂</div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: -0.3 }}>
            Baker's Cost Pro
          </h1>
          <Badge label="SA Edition" bg={C.amberBg} color={C.amber} />
        </div>
        <div style={{ margin: "0 0 1rem 44px", display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Recipe import · Ingredient costing · SA pricing
          </p>
          {syncStatus === "syncing" && (
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", opacity: 0.7 }}>Syncing…</span>
          )}
          {syncStatus === "synced" && (
            <Badge
              label={communityDate ? `Community: ${communityDate}` : "Community synced"}
              bg={C.successBg} color={C.success}
            />
          )}
          {syncStatus === "offline" && (
            <Badge label="Offline mode" bg={C.amberBg} color={C.amber} />
          )}
        </div>

        {/* TAB BAR */}
        <div style={{ display: "flex", marginBottom: -1 }}>
          {[
            { id: "scan",   label: "Scanner" },
            { id: "db",     label: needsCostingCount > 0 ? `Ingredients DB (${needsCostingCount})` : "Ingredients DB" },
            { id: "cost",   label: "Costing" },
            { id: "book",   label: recipes.length > 0 ? `Recipe Book (${recipes.length})` : "Recipe Book" },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 18px", fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? C.amber : "var(--color-text-secondary)",
                background: "none", border: "none",
                borderBottom: active ? `2px solid ${C.amber}` : "2px solid transparent",
                cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap",
              }}>{t.label}</button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "1.5rem" }}>

        {/* ERROR BANNER */}
        {err && (
          <div style={{
            background: C.dangerBg, color: C.danger,
            border: "0.5px solid #F7C1C1",
            borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
          }}>
            <span>{err}</span>
            <button onClick={() => setErr(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, flexShrink: 0, fontSize: 14 }}>✕</button>
          </div>
        )}

        {/* ══ SCANNER TAB ══════════════════════════════════════ */}
        {tab === "scan" && (
          <div>
            {/* MODE TOGGLE */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { id: "url",  label: "🔗  From URL" },
                { id: "file", label: "📄  From File" },
              ].map(m => (
                <button key={m.id} onClick={() => { setImportMode(m.id); setErr(null); }} style={{
                  padding: "8px 20px", fontSize: 13, borderRadius: 8,
                  border: `0.5px solid ${importMode === m.id ? C.amber : "var(--color-border-secondary)"}`,
                  background: importMode === m.id ? C.amberBg : "none",
                  color: importMode === m.id ? C.amber : "var(--color-text-secondary)",
                  cursor: "pointer", fontWeight: importMode === m.id ? 500 : 400,
                }}>{m.label}</button>
              ))}
            </div>

            {/* ── OPTION A: URL ── */}
            {importMode === "url" && (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input
                    type="url"
                    placeholder="https://www.example.com/chocolate-cake-recipe"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && importFromUrl()}
                    style={{ flex: 1 }}
                    disabled={importing}
                  />
                  <button
                    onClick={importFromUrl}
                    disabled={importing || !urlInput.trim()}
                    style={{
                      padding: "0 20px", height: 40,
                      background: importing || !urlInput.trim() ? "var(--color-background-secondary)" : C.amber,
                      color: importing || !urlInput.trim() ? "var(--color-text-secondary)" : "#fff",
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      cursor: importing || !urlInput.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                    }}
                  >{importing ? "Importing…" : "Import Recipe"}</button>
                </div>
                <p style={{ margin: "0 0 24px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  Works best with recipe sites that use standard markup (AllRecipes, BBC Good Food, Food Network, etc.).
                  Uses a free CORS proxy — requires an internet connection. Sites that load content via JavaScript may not work.
                </p>
              </div>
            )}

            {/* ── OPTION B: FILE ── */}
            {importMode === "file" && (
              <div>
                <div
                  onClick={() => !importing && fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); importFromFile(e.dataTransfer.files[0]); }}
                  style={{
                    border: `2px dashed ${importing ? C.amberMid : "var(--color-border-tertiary)"}`,
                    borderRadius: 12, padding: "3rem 2rem",
                    textAlign: "center", cursor: importing ? "default" : "pointer",
                    background: importing ? C.amberBg : "var(--color-background-secondary)",
                    marginBottom: 10, transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{importing ? "⏳" : "📄"}</div>
                  <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {importing ? "Reading file…" : "Drop a recipe file here"}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
                    or tap to browse — <strong>.txt</strong>, <strong>.md</strong>, <strong>.docx</strong>, <strong>.pdf</strong>, <strong>.xlsx</strong> supported
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.docx,.pdf,.xlsx"
                  onChange={e => importFromFile(e.target.files?.[0])}
                  style={{ display: "none" }}
                />
                <p style={{ margin: "0 0 24px", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  Tip: for best results, make sure the file has the ingredient list in the format
                  "2 cups flour", "500g butter", etc. PDF and DOCX processing runs entirely in your browser.
                </p>
              </div>
            )}

            {/* COMMUNITY SHARE TOGGLE */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 8, marginBottom: 20,
              background: shareOnImport ? C.successBg : "var(--color-background-secondary)",
              border: `0.5px solid ${shareOnImport ? "#B2D98A" : "var(--color-border-tertiary)"}`,
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
                <input
                  type="checkbox"
                  checked={shareOnImport}
                  onChange={e => setShareOnImport(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.success }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  Share with community
                </span>
              </label>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                {shareOnImport
                  ? "Recipe will be added to the community recipe book"
                  : "Recipe stays on this device only"}
              </span>
            </div>

            {/* HOW IT WORKS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { step: "1", title: "Import",         desc: "Paste a recipe URL or upload a .txt / .docx / .pdf file" },
                { step: "2", title: "Ingredients read", desc: "Ingredient lines are extracted and parsed automatically" },
                { step: "3", title: "DB matched",      desc: "Each ingredient is matched to your price database" },
                { step: "4", title: "Costs calculated", desc: "Full breakdown with overhead, packaging and markup" },
              ].map(item => (
                <div key={item.step} style={{
                  background: "var(--color-background-secondary)", borderRadius: 10,
                  padding: "14px", border: "0.5px solid var(--color-border-tertiary)",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: C.amberBg, color: C.amber,
                    fontSize: 13, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
                  }}>{item.step}</div>
                  <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ INGREDIENTS DB TAB ═══════════════════════════════ */}
        {tab === "db" && (
          <div>
            {/* PRICE UPDATE TOOLBAR */}
            <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={runPriceUpdate}
                disabled={priceRunning || selectedIngredients.size === 0}
                style={{
                  padding: "8px 18px", fontSize: 13, borderRadius: 8, fontWeight: 500,
                  background: priceRunning || selectedIngredients.size === 0 ? "var(--color-background-secondary)" : C.amber,
                  color: priceRunning || selectedIngredients.size === 0 ? "var(--color-text-secondary)" : "#fff",
                  border: "none",
                  cursor: priceRunning || selectedIngredients.size === 0 ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {priceRunning
                  ? "Updating…"
                  : `Update selected prices${selectedIngredients.size > 0 ? ` (${selectedIngredients.size})` : ""}`}
              </button>
              {priceProgress && (
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {priceProgress.done < priceProgress.total
                    ? `${priceProgress.done} / ${priceProgress.total} — checking "${priceProgress.current}"…`
                    : `Done — ${priceProgress.total} ingredient${priceProgress.total !== 1 ? "s" : ""} processed`}
                </span>
              )}
              <button
                onClick={() => {
                  commitGitHubJson(
                    "data/ingredients.json",
                    { lastUpdated: todayStr(), items: dbState },
                    "Manual ingredient sync"
                  ).then(() => setErr("Synced to GitHub")).catch(e => setErr(`GitHub sync failed: ${e.message}`));
                }}
                style={{
                  padding: "6px 12px", fontSize: 11, borderRadius: 6, fontWeight: 500,
                  background: "var(--color-background-secondary)", color: "var(--color-text-secondary)",
                  border: "0.5px solid var(--color-border-secondary)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >Push to GitHub</button>
            </div>

            {/* SEARCH + BADGE */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search ingredients…"
                value={dbSearch}
                onChange={e => setDbSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              {needsCostingCount > 0 && (
                <Badge label={`${needsCostingCount} need costing`} bg={C.amberBg} color={C.amber} />
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                    {/* Select-all checkbox */}
                    <th style={{ padding: "8px 10px 8px 0", width: 32 }}>
                      <input
                        type="checkbox"
                        checked={filteredDb.length > 0 && filteredDb.every(i => selectedIngredients.has(i.name))}
                        ref={el => {
                          if (el) el.indeterminate =
                            filteredDb.some(i => selectedIngredients.has(i.name)) &&
                            !filteredDb.every(i => selectedIngredients.has(i.name));
                        }}
                        onChange={() => {
                          const allChecked = filteredDb.every(i => selectedIngredients.has(i.name));
                          const next = new Set(selectedIngredients);
                          filteredDb.forEach(i => allChecked ? next.delete(i.name) : next.add(i.name));
                          setSelectedIngredients(next);
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    {["Ingredient", "Unit", "R / unit", "Last updated", "Status", "Package"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i >= 2 && i <= 3 ? "center" : "left",
                        padding: "8px 10px 8px 0", fontWeight: 500, color: "var(--color-text-secondary)",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDb.map((ing) => {
                    const editing    = editingCell?.name === ing.name;
                    const editingPkg = editingPackage?.name === ing.name;
                    const needsCost  = ing.needsCosting || ing.costPerUnit === 0;
                    const outdated   = isOutdated(ing.dateLastUpdated);
                    const checked    = selectedIngredients.has(ing.name);
                    return (
                      <tr key={ing.name} style={{
                        borderBottom: "0.5px solid var(--color-border-tertiary)",
                        background: checked ? C.amberBg : "transparent",
                      }}>
                        {/* Row checkbox */}
                        <td style={{ padding: "8px 10px 8px 0" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = new Set(selectedIngredients);
                              checked ? next.delete(ing.name) : next.add(ing.name);
                              setSelectedIngredients(next);
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px 8px 0", color: "var(--color-text-primary)", minWidth: 140 }}>
                          {ing.name}
                        </td>
                        <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)" }}>
                          {ing.unit}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          {editing ? (
                            <input
                              type="number" min="0" step="0.0001"
                              value={editValue} autoFocus
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(ing.name)}
                              onKeyDown={e => {
                                if (e.key === "Enter") commitEdit(ing.name);
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              style={{ width: 80, textAlign: "right", fontSize: 13, padding: "2px 6px", borderRadius: 4 }}
                            />
                          ) : (
                            <button
                              onClick={() => { setEditingCell({ name: ing.name }); setEditValue(String(ing.costPerUnit)); }}
                              title="Click to edit"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                fontWeight: 500, color: needsCost ? C.danger : C.amber,
                                fontSize: 13, padding: "2px 4px", borderRadius: 4,
                                textDecoration: "underline dotted",
                              }}
                            >
                              R{ing.costPerUnit < 0.1 ? ing.costPerUnit.toFixed(5) : ing.costPerUnit < 1 ? ing.costPerUnit.toFixed(4) : ing.costPerUnit.toFixed(2)}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 12 }}>
                          {fmtDate(ing.dateLastUpdated)}
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {needsCost && <Badge label="Needs costing" bg={C.amberBg} color={C.amber} />}
                            {outdated && !needsCost && <Badge label="Outdated" bg={C.amberBg} color={C.amber} />}
                            {!needsCost && !outdated && <Badge label="OK" bg={C.successBg} color={C.success} />}
                            {ing.matchConfidence != null && (
                              <Badge
                                label={`${Math.round(ing.matchConfidence * 100)}% match`}
                                bg={C.successBg} color={C.success}
                              />
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "8px 0 8px 10px", color: "var(--color-text-secondary)", fontSize: 12 }}>
                          {editingPkg ? (
                            /* Inline package editor — qty · unit · price */
                            <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <input
                                type="number" min="0" step="any" autoFocus
                                value={pkgEditVal.packageValue}
                                onChange={e => setPkgEditVal(v => ({ ...v, packageValue: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === "Enter") commitPackageEdit(ing.name);
                                  if (e.key === "Escape") setEditingPackage(null);
                                }}
                                placeholder="qty"
                                style={{ width: 52, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}
                              />
                              <input
                                type="text"
                                value={pkgEditVal.packageUnit}
                                onChange={e => setPkgEditVal(v => ({ ...v, packageUnit: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === "Enter") commitPackageEdit(ing.name);
                                  if (e.key === "Escape") setEditingPackage(null);
                                }}
                                placeholder="g/ml"
                                style={{ width: 44, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}
                              />
                              <input
                                type="number" min="0" step="any"
                                value={pkgEditVal.packagePrice}
                                onChange={e => setPkgEditVal(v => ({ ...v, packagePrice: e.target.value }))}
                                onBlur={() => commitPackageEdit(ing.name)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") commitPackageEdit(ing.name);
                                  if (e.key === "Escape") setEditingPackage(null);
                                }}
                                placeholder="R"
                                style={{ width: 48, fontSize: 12, padding: "2px 4px", borderRadius: 4 }}
                              />
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPackage({ name: ing.name });
                                setPkgEditVal({ packageValue: String(ing.packageValue ?? ""), packageUnit: ing.packageUnit ?? "", packagePrice: "" });
                              }}
                              title="Click to edit package info"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: C.amber, fontSize: 12, padding: "2px 4px", borderRadius: 4,
                                textDecoration: "underline dotted", textAlign: "left",
                              }}
                            >
                              {ing.packageValue != null ? `${ing.packageValue}${ing.packageUnit}` : (ing.pkg ?? "—")}
                              {ing.pricePerBaseUnit != null ? ` · R${ing.pricePerBaseUnit.toFixed(4)}/${ing.baseUnit}` : ""}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
              {filteredDb.length} of {dbState.length} ingredients · Click any <em>R / unit</em> value to edit · Prices in ZAR
            </p>
          </div>
        )}

        {/* ══ COSTING TAB ══════════════════════════════════════ */}
        {tab === "cost" && (
          <div>
            {recipes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-secondary)" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>💰</div>
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>No recipe imported yet</p>
                <p style={{ margin: "0 0 20px", fontSize: 13 }}>Go to the Scanner tab to import a recipe</p>
                <button onClick={() => setTab("scan")} style={{
                  padding: "9px 22px", borderRadius: 6, background: C.amber, color: "#fff",
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}>Go to Scanner</button>
              </div>
            ) : (
              <div>
                {/* RECIPE HISTORY SELECTOR */}
                {recipes.length > 1 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--color-text-secondary)" }}>Recipe history</p>
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                      {[...recipes].reverse().map(r => (
                        <button
                          key={r.id}
                          onClick={() => setActiveRecipeId(r.id)}
                          style={{
                            padding: "6px 14px", fontSize: 12, borderRadius: 100, whiteSpace: "nowrap",
                            border: `0.5px solid ${r.id === activeRecipeId ? C.amber : "var(--color-border-secondary)"}`,
                            background: r.id === activeRecipeId ? C.amberBg : "none",
                            color: r.id === activeRecipeId ? C.amber : "var(--color-text-secondary)",
                            cursor: "pointer", fontWeight: r.id === activeRecipeId ? 500 : 400,
                          }}
                        >
                          {r.title} · {new Date(r.importedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {recipe && editingRecipe?.id === recipe.id ? (
                  /* ── EDIT MODE ── */
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <input
                        value={editingRecipe.title}
                        onChange={e => setEditingRecipe(er => ({ ...er, title: e.target.value }))}
                        style={{ fontSize: 17, fontWeight: 500, flex: 1, marginRight: 12, padding: "6px 10px", borderRadius: 6 }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveRecipeEdit} style={{
                          padding: "7px 16px", fontSize: 13, borderRadius: 6,
                          background: C.amber, color: "#fff", border: "none", cursor: "pointer", fontWeight: 500,
                        }}>Save</button>
                        <button onClick={() => setEditingRecipe(null)} style={{
                          padding: "7px 14px", fontSize: 13, borderRadius: 6,
                          border: "0.5px solid var(--color-border-secondary)",
                          background: "none", color: "var(--color-text-secondary)", cursor: "pointer",
                        }}>Cancel</button>
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                            {["Ingredient", "Amount", "Unit"].map((h, i) => (
                              <th key={h} style={{
                                textAlign: i === 0 ? "left" : "right",
                                padding: `8px ${i === 2 ? "0" : "10px"} 8px ${i === 0 ? "0" : "10px"}`,
                                fontWeight: 500, color: "var(--color-text-secondary)",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {editingRecipe.ingredients.map((ing, idx) => (
                            <tr key={ing.id ?? idx} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                              <td style={{ padding: "7px 10px 7px 0", color: "var(--color-text-primary)" }}>{ing.name}</td>
                              <td style={{ padding: "7px 10px", textAlign: "right" }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={ing.amount}
                                  onChange={e => setEditingRecipe(er => ({
                                    ...er,
                                    ingredients: er.ingredients.map((x, i) =>
                                      i === idx ? { ...x, amount: parseFloat(e.target.value) || 0 } : x
                                    ),
                                  }))}
                                  style={{ width: 80, textAlign: "right", fontSize: 13, padding: "3px 6px", borderRadius: 4 }}
                                />
                              </td>
                              <td style={{ padding: "7px 0 7px 10px", textAlign: "right", color: "var(--color-text-secondary)" }}>{ing.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : recipe ? (
                  <div>
                    {/* RECIPE HEADER */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                      <div>
                        <h2 style={{ margin: "0 0 5px", fontSize: 19, fontWeight: 500, color: "var(--color-text-primary)" }}>
                          {recipe.title}
                        </h2>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Badge label={`${recipe.ingredients.length} ingredients`} />
                          <Badge label={`${matchedCount} matched`} bg={C.successBg} color={C.success} />
                          {unmatchedCount > 0 && (
                            <Badge label={`${unmatchedCount} need pricing`} bg={C.amberBg} color={C.amber} />
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => startEditRecipe(recipe)}
                          style={{
                            padding: "6px 14px", fontSize: 12, borderRadius: 6,
                            border: `0.5px solid ${C.amber}`,
                            background: "none", color: C.amber, cursor: "pointer",
                          }}
                        >Edit</button>
                        <button
                          onClick={() => setTab("scan")}
                          style={{
                            padding: "6px 14px", fontSize: 12, borderRadius: 6,
                            border: "0.5px solid var(--color-border-secondary)",
                            background: "none", color: "var(--color-text-secondary)", cursor: "pointer",
                          }}
                        >Import another</button>
                      </div>
                    </div>

                    {/* INGREDIENTS TABLE */}
                    <div style={{ overflowX: "auto", marginBottom: 20 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                            {["Ingredient", "Amount", "Unit", "R / unit", "Total"].map((h, i) => (
                              <th key={h} style={{
                                textAlign: i === 0 ? "left" : "right",
                                padding: `8px ${i === 4 ? "0" : "10px"} 8px ${i === 0 ? "0" : "10px"}`,
                                fontWeight: 500, color: "var(--color-text-secondary)",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {enriched.map((ing) => (
                            <tr key={ing.id} style={{
                              borderBottom: "0.5px solid var(--color-border-tertiary)",
                              opacity: ing.dbMatch ? 1 : 0.65,
                            }}>
                              <td style={{ padding: "9px 10px 9px 0" }}>
                                <span style={{ color: "var(--color-text-primary)" }}>{ing.name}</span>
                                {ing.dbMatch?.needsCosting && (
                                  <span style={{
                                    fontSize: 10, marginLeft: 6, background: C.amberBg, color: C.amber,
                                    padding: "1px 6px", borderRadius: 4, fontWeight: 500,
                                  }}>needs pricing</span>
                                )}
                                {!ing.dbMatch && (
                                  <span style={{
                                    fontSize: 10, marginLeft: 6, background: C.dangerBg, color: C.danger,
                                    padding: "1px 6px", borderRadius: 4, fontWeight: 500,
                                  }}>not in DB</span>
                                )}
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--color-text-primary)" }}>{ing.amount}</td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--color-text-secondary)" }}>{ing.unit}</td>
                              <td style={{ padding: "9px 10px", textAlign: "right", color: "var(--color-text-secondary)" }}>
                                {ing.dbMatch && ing.dbMatch.costPerUnit > 0
                                  ? `R${ing.dbMatch.costPerUnit < 1 ? ing.dbMatch.costPerUnit.toFixed(4) : ing.dbMatch.costPerUnit.toFixed(2)}`
                                  : "—"}
                              </td>
                              <td style={{ padding: "9px 0 9px 10px", textAlign: "right", fontWeight: 500, color: ing.lineTotal ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                                {ing.lineTotal != null ? `R${ing.lineTotal.toFixed(2)}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* COST BREAKDOWN */}
                    {overhead && (
                      <div style={{
                        background: "var(--color-background-secondary)", borderRadius: 12,
                        padding: "16px 20px", border: "0.5px solid var(--color-border-tertiary)", marginBottom: 16,
                      }}>
                        <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>Cost breakdown</p>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Ingredients</span>
                          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{ingTotal.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-secondary)", cursor: "pointer" }}>
                            <input type="checkbox" checked={packagingEnabled} onChange={e => setPackagingEnabled(e.target.checked)} />
                            Supplies (5% + packaging)
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {packagingEnabled && (
                              <input
                                type="number" min="0" step="0.5"
                                value={packagingCost}
                                onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)}
                                style={{ width: 50, textAlign: "right", fontSize: 12, padding: "3px 6px", borderRadius: 4, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-primary)" }}
                              />
                            )}
                            <span style={{ fontWeight: 500, color: "var(--color-text-primary)", minWidth: 60, textAlign: "right" }}>R{overhead.supplies.toFixed(2)}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Operating costs (5%)</span>
                          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{overhead.opCost.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
                          <span style={{ color: "var(--color-text-secondary)" }}>Equipment (5%)</span>
                          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{overhead.equipment.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 8px", fontSize: 16 }}>
                          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Total cost</span>
                          <span style={{ fontWeight: 500, color: C.amber, fontSize: 20 }}>R{overhead.total.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
                          {[{ label: "Sell at 2×", mult: 2 }, { label: "Sell at 2.5×", mult: 2.5 }, { label: "Sell at 3×", mult: 3 }].map(s => (
                            <div key={s.label} style={{
                              background: C.amberBg, borderRadius: 8, padding: "10px 12px",
                              border: `0.5px solid ${C.amberBorder}`,
                            }}>
                              <p style={{ margin: "0 0 4px", fontSize: 11, color: "#854F0B" }}>{s.label}</p>
                              <p style={{ margin: 0, fontSize: 17, fontWeight: 500, color: C.amberTxt }}>
                                R{(overhead.total * s.mult).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NEEDS PRICING WARNING */}
                    {unmatchedCount > 0 && (
                      <div style={{
                        background: C.amberBg, borderRadius: 8,
                        padding: "12px 16px", border: `0.5px solid ${C.amberBorder}`,
                      }}>
                        <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 500, color: "#854F0B" }}>
                          {unmatchedCount} ingredient{unmatchedCount > 1 ? "s" : ""} need pricing
                        </p>
                        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#854F0B" }}>
                          {enriched.filter(i => !i.dbMatch || i.dbMatch.needsCosting).map(i => i.name).join(", ")}
                        </p>
                        <button
                          onClick={() => setTab("db")}
                          style={{
                            padding: "6px 14px", fontSize: 12, borderRadius: 6,
                            background: C.amber, color: "#fff",
                            border: "none", cursor: "pointer", fontWeight: 500,
                          }}
                        >Update prices in DB →</button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* ══ RECIPE BOOK TAB ══════════════════════════════════ */}
        {tab === "book" && (
          <div>
            {recipes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-text-secondary)" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📚</div>
                <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>No recipes yet</p>
                <p style={{ margin: "0 0 20px", fontSize: 13 }}>Import a recipe from the Scanner tab</p>
                <button onClick={() => setTab("scan")} style={{
                  padding: "9px 22px", borderRadius: 6, background: C.amber, color: "#fff",
                  border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}>Go to Scanner</button>
              </div>
            ) : (
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
                  const totalCost = ingTotal > 0 ? calcOverhead(ingTotal, packagingEnabled ? packagingCost : 0).total : null;
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
                        onClick={e => { e.stopPropagation(); toggleFavourite(r.id); }}
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
                        onClick={() => { setActiveRecipeId(r.id); setTab("cost"); }}
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
                        onClick={() => { setActiveRecipeId(r.id); setTab("cost"); }}
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
                                onClick={() => addToCollection(r.id, col)}
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
                                onKeyDown={e => { if (e.key === "Enter" && newColName.trim()) addToCollection(r.id, newColName.trim()); }}
                                style={{ flex: 1, fontSize: 12, padding: "4px 8px", borderRadius: 6 }}
                                autoFocus
                              />
                              <button
                                onClick={() => { if (newColName.trim()) addToCollection(r.id, newColName.trim()); }}
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
                        onClick={e => { e.stopPropagation(); deleteRecipe(r.id); }}
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
                                onClick={() => { setActiveRecipeId(id); setTab("cost"); }}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  fontSize: 13, color: C.amber, padding: "3px 0", textDecoration: "underline dotted",
                                }}
                              >{rec.title}</button>
                              <button
                                onClick={() => removeFromCollection(id, colName)}
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
            )}
          </div>
        )}


      </div>{/* end CONTENT */}

      {/* ══ PRICE REVIEW MODAL ══════════════════════════════════ */}
      {reviewItem && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "var(--color-background-primary)", borderRadius: 12,
            padding: 24, maxWidth: 560, width: "100%", maxHeight: "80vh",
            overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Review match {reviewQueue.length > 0 ? `· ${reviewQueue.length + 1} remaining` : ""}
                </p>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {reviewItem.ingredient.name}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>
                  Best match: {Math.round(reviewItem.score * 100)}% confidence — select a product or skip
                </p>
              </div>
              <button
                onClick={advanceReviewQueue}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary)", padding: 4, lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Candidate list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reviewItem.all.map(({ product, score }, idx) => {
                const titleStr = product.name || product.title || "Unknown product";
                const priceRaw = product.price ?? product.currentPrice ?? null;
                const price = priceRaw != null
                  ? (typeof priceRaw === "string" ? parseFloat(priceRaw.replace(/[^0-9.]/g, "")) : Number(priceRaw))
                  : null;
                const { packageValue, packageUnit } = parsePackageInfo(titleStr);
                const isTop = idx === 0;
                return (
                  <div key={idx} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", borderRadius: 8, gap: 10,
                    border: `0.5px solid ${isTop ? C.amber : "var(--color-border-tertiary)"}`,
                    background: isTop ? C.amberBg : "var(--color-background-secondary)",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: "0 0 2px", fontSize: 13,
                        fontWeight: isTop ? 500 : 400,
                        color: "var(--color-text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {titleStr}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>
                        {price != null ? `R${price.toFixed(2)}` : "Price unavailable"}
                        {packageValue != null ? ` · ${packageValue}${packageUnit}` : ""}
                        {" · "}
                        <span style={{ color: score >= 0.60 ? C.success : C.danger }}>
                          {Math.round(score * 100)}% match
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => acceptReviewProduct(product)}
                      style={{
                        padding: "5px 14px", fontSize: 12, borderRadius: 6, flexShrink: 0,
                        background: C.amber, color: "#fff", border: "none", cursor: "pointer", fontWeight: 500,
                      }}
                    >Select</button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={advanceReviewQueue}
              style={{
                marginTop: 16, width: "100%", padding: "9px", fontSize: 13,
                border: "0.5px solid var(--color-border-secondary)",
                background: "none", color: "var(--color-text-secondary)",
                borderRadius: 8, cursor: "pointer",
              }}
            >Skip — none of these are appropriate</button>
          </div>
        </div>
      )}

    </div>
  );
}
