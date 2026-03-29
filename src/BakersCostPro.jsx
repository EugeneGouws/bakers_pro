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

import { useState, useRef } from "react";
import seedRecipes from "./data/recipes.json";

// ============================================================
// INGREDIENT DATABASE  (source: Cake_Costings.xlsx)
// Format: { name, aliases[], unit, costPerUnit, pkg }
// dateLastUpdated and needsCosting are added in state init.
// ============================================================
const INGREDIENTS_DB = [
  { name: "Almond Flour", aliases: ["almond flour", "almond"], unit: "g", costPerUnit: 0.265, pkg: "1000g · R265" },
  { name: "All Spice", aliases: ["all spice", "allspice", "mixed spice"], unit: "g", costPerUnit: 0.64, pkg: "25g · R16" },
  { name: "Banana", aliases: ["banana", "bananas"], unit: "each", costPerUnit: 3, pkg: "6 for R18" },
  { name: "Bicarbonate of Soda", aliases: ["bicarb", "baking soda", "bicarbonate of soda", "bicarbonate", "sodium bicarbonate"], unit: "tsp", costPerUnit: 0.072115, pkg: "208 tsp · R15" },
  { name: "Baking Powder", aliases: ["bpowder", "baking powder"], unit: "tsp", costPerUnit: 0.133333, pkg: "210 tsp · R28" },
  { name: "Brown Sugar", aliases: ["bsugar", "brown sugar", "demerara", "light brown sugar", "dark brown sugar"], unit: "cup", costPerUnit: 2.553191, pkg: "11.75 cup · R30" },
  { name: "Butter (cup)", aliases: ["butter"], unit: "cup", costPerUnit: 28.5, pkg: "2 cup · R57" },
  { name: "Butter (g)", aliases: ["butter"], unit: "g", costPerUnit: 0.114, pkg: "500g · R57" },
  { name: "Buttermilk", aliases: ["buttermilk"], unit: "cup", costPerUnit: 5, pkg: "4 cup · R20" },
  { name: "Caramel Treat", aliases: ["caramel treat", "caramel", "dulce de leche", "caramel spread"], unit: "g", costPerUnit: 0.091639, pkg: "360g · R32.99" },
  { name: "Carrots", aliases: ["carrot", "carrots", "grated carrot", "grated carrots"], unit: "g", costPerUnit: 0.011, pkg: "1000g · R11" },
  { name: "Castor Sugar", aliases: ["castor sugar", "caster sugar", "superfine sugar"], unit: "g", costPerUnit: 0.10598, pkg: "500g · R52.99" },
  { name: "Dry Chillies", aliases: ["chillies dry", "dried chilli", "chilli", "chili flakes", "red chilli"], unit: "g", costPerUnit: 0.2, pkg: "50g · R10" },
  { name: "Dark Chocolate", aliases: ["choc dark", "dark chocolate", "dark choc", "bittersweet chocolate", "70% chocolate"], unit: "slab", costPerUnit: 47, pkg: "1 slab · R47" },
  { name: "Milk Chocolate", aliases: ["choc milk", "milk chocolate", "milk choc"], unit: "slab", costPerUnit: 15, pkg: "1 slab · R15" },
  { name: "White Chocolate", aliases: ["choc white", "white chocolate", "white choc"], unit: "slab", costPerUnit: 11, pkg: "1 slab · R11" },
  { name: "Ground Cinnamon", aliases: ["cinamon", "cinnamon", "ground cinnamon", "cinnamon powder"], unit: "tsp", costPerUnit: 0.394737, pkg: "38 tsp · R15" },
  { name: "Cinnamon Stick", aliases: ["cinnamon rolls", "cinnamon sticks", "cinnamon stick"], unit: "each", costPerUnit: 1.923077, pkg: "13 for R25" },
  { name: "Cloves", aliases: ["clove", "cloves", "ground cloves"], unit: "g", costPerUnit: 0.34, pkg: "25g · R8.50" },
  { name: "Cocoa Powder", aliases: ["coco", "cocoa", "cocoa powder", "cacao", "dutch cocoa", "unsweetened cocoa"], unit: "g", costPerUnit: 0.045, pkg: "1000g · R45" },
  { name: "Coconut Sugar", aliases: ["coconut sugar", "palm sugar"], unit: "g", costPerUnit: 0.256667, pkg: "300g · R77" },
  { name: "Coffee", aliases: ["coffee", "instant coffee", "espresso", "strong coffee"], unit: "g", costPerUnit: 0.26, pkg: "250g · R65" },
  { name: "Condensed Milk", aliases: ["condenced milk", "condensed milk", "sweetened condensed milk"], unit: "g", costPerUnit: 0.064935, pkg: "385g · R25" },
  { name: "Corn Syrup", aliases: ["corn syrup", "golden syrup", "light corn syrup"], unit: "ml", costPerUnit: 0.372093, pkg: "473ml · R176" },
  { name: "Cornflour", aliases: ["cornflour", "cornstarch", "corn flour", "corn starch", "maizena"], unit: "g", costPerUnit: 0.052, pkg: "500g · R26" },
  { name: "Cream", aliases: ["cream", "whipping cream", "double cream", "heavy cream", "fresh cream"], unit: "cup", costPerUnit: 30, pkg: "1 cup · R30" },
  { name: "Cream Cheese", aliases: ["cream cheese", "philadelphia"], unit: "g", costPerUnit: 0.25213, pkg: "230g · R57.99" },
  { name: "Dates", aliases: ["date", "dates", "medjool dates", "pitted dates"], unit: "g", costPerUnit: 0.05, pkg: "500g · R25" },
  { name: "Eggs", aliases: ["egg", "eggs", "large eggs", "xl eggs"], unit: "each", costPerUnit: 1.5, pkg: "30 · R45" },
  { name: "Flake", aliases: ["flake", "chocolate flake", "cadbury flake"], unit: "g", costPerUnit: 0.374688, pkg: "32g · R11.99" },
  { name: "Flour", aliases: ["flour", "cake flour", "all purpose flour", "plain flour", "all-purpose flour"], unit: "cup", costPerUnit: 2.499375, pkg: "16 cup · R39.99" },
  { name: "Food Colouring", aliases: ["food colouring", "food coloring", "food dye", "red food colouring"], unit: "ml", costPerUnit: 0.2625, pkg: "40ml · R10.50" },
  { name: "Gelatine", aliases: ["gelatine", "gelatin", "gelatin powder"], unit: "g", costPerUnit: 0.11, pkg: "250g · R27.50" },
  { name: "Glutagon Flour", aliases: ["glutagon flour", "gluten free flour", "gluten flour", "gluten-free flour"], unit: "g", costPerUnit: 0.082, pkg: "500g · R41" },
  { name: "Hazelnuts", aliases: ["hazelnut", "hazelnuts", "roasted hazelnuts"], unit: "g", costPerUnit: 0.3, pkg: "100g · R30" },
  { name: "Icing Sugar", aliases: ["icing sugar", "powdered sugar", "confectioners sugar", "confectioners' sugar", "icing"], unit: "cup", costPerUnit: 3.25, pkg: "8 cup · R26" },
  { name: "Lemons", aliases: ["lemon", "lemons", "lemon zest", "fresh lemon"], unit: "each", costPerUnit: 1, pkg: "30 · R30" },
  { name: "Marshmallow", aliases: ["marshmallow", "marshmallows", "mini marshmallows"], unit: "g", costPerUnit: 0.08, pkg: "150g · R12" },
  { name: "Mascarpone", aliases: ["mascarpone", "mascarpone cheese"], unit: "g", costPerUnit: 0.16, pkg: "250g · R40" },
  { name: "Milk", aliases: ["milk", "whole milk", "full cream milk", "fresh milk"], unit: "cup", costPerUnit: 3.75, pkg: "8 cup · R30" },
  { name: "Nutmeg", aliases: ["nutmeg", "ground nutmeg"], unit: "g", costPerUnit: 0.38, pkg: "25g · R9.50" },
  { name: "Nutmeg Whole", aliases: ["nutmeg whole", "whole nutmeg"], unit: "g", costPerUnit: 0.6, pkg: "25g · R15" },
  { name: "Oil", aliases: ["oil", "vegetable oil", "sunflower oil", "canola oil", "cooking oil"], unit: "cup", costPerUnit: 9.87375, pkg: "8 cup · R78.99" },
  { name: "Pecan Nuts", aliases: ["pecan", "pecans", "pecan nuts", "pecan halves"], unit: "g", costPerUnit: 0.19, pkg: "1000g · R190" },
  { name: "Poppy Seeds", aliases: ["poppyseeds", "poppy seeds", "poppy seed"], unit: "g", costPerUnit: 0.22, pkg: "250g · R55" },
  { name: "Raisins", aliases: ["raisin", "raisins", "sultanas", "seedless raisins"], unit: "g", costPerUnit: 0.066, pkg: "250g · R16.50" },
  { name: "Salt", aliases: ["salt", "fine salt", "table salt", "sea salt"], unit: "tsp", costPerUnit: 0.01963, pkg: "866 tsp · R17" },
  { name: "Self-raising Flour", aliases: ["self-raising flour", "self raising flour", "sr flour", "self-rise flour"], unit: "g", costPerUnit: 0.01598, pkg: "2500g · R39.95" },
  { name: "White Sugar", aliases: ["sugar", "white sugar", "granulated sugar", "cane sugar"], unit: "cup", costPerUnit: 3.083333, pkg: "12 cup · R37" },
  { name: "Vanilla Extract", aliases: ["vanilla", "vanilla extract", "vanilla essence", "pure vanilla"], unit: "ml", costPerUnit: 0.21, pkg: "100ml · R21" },
  { name: "Vanilla Pod", aliases: ["vanilla pod", "vanilla bean", "vanilla beans"], unit: "each", costPerUnit: 20, pkg: "1 · R20" },
  { name: "Vegetable Shortening", aliases: ["vegatable shortening", "vegetable shortening", "crisco", "shortening", "white fat"], unit: "cup", costPerUnit: 9, pkg: "2 cup · R18" },
  { name: "White Vinegar", aliases: ["vinegar", "white vinegar", "spirit vinegar"], unit: "ml", costPerUnit: 0.016, pkg: "750ml · R12" },
  { name: "Apple Cider Vinegar", aliases: ["vinegar apple cider", "apple cider vinegar", "acv", "cider vinegar"], unit: "ml", costPerUnit: 0.046, pkg: "500ml · R23" },
  { name: "Xanthan Gum", aliases: ["xanthan gum", "xanthan"], unit: "g", costPerUnit: 0.5, pkg: "100g · R50" },
  { name: "Digestive Biscuits", aliases: ["digestive biscuits", "digestives", "biscuits", "graham crackers"], unit: "pack", costPerUnit: 74.56, pkg: "1 pack · R74.56" },
  { name: "Sour Cream", aliases: ["sour cream", "soured cream", "cultured cream"], unit: "ml", costPerUnit: 0.13996, pkg: "250ml · R34.99" },
];

// ============================================================
// OVERHEAD FORMULA (reverse-engineered from Cake_Costings.xlsx)
//   Operating  = 5% of ingredients
//   Equipment  = 5% of ingredients
//   Supplies   = 5% of ingredients + R16 (fixed packaging)
//   Total      = Ingredients × 1.15 + R16
// ============================================================
function calcOverhead(ingredientTotal) {
  const opCost    = ingredientTotal * 0.05;
  const equipment = ingredientTotal * 0.05;
  const supplies  = ingredientTotal * 0.05 + 16;
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
  cup: 'cup', cups: 'cup',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbs: 'tbsp',
  g: 'g', gram: 'g', grams: 'g', kg: 'g',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'ml', liter: 'ml', liters: 'ml', litre: 'ml', litres: 'ml',
  slab: 'slab', slabs: 'slab',
  pack: 'pack', packs: 'pack', packet: 'pack', packets: 'pack',
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
  return INGREDIENTS_DB.map(item => ({ ...item, dateLastUpdated: '2025-01-01', needsCosting: false }));
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
  const overhead     = recipe ? calcOverhead(ingTotal) : null;
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
  };

  // ── URL import ──────────────────────────────────────────────
  const importFromUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    setImporting(true);
    setErr(null);
    try {
      const proxy = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
      const resp = await fetch(proxy);
      if (!resp.ok) throw new Error(`Could not fetch that URL (HTTP ${resp.status}). The site may block external requests.`);
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
        <p style={{ margin: "0 0 1rem 44px", fontSize: 13, color: "var(--color-text-secondary)" }}>
          Recipe import · Ingredient costing · SA pricing
        </p>

        {/* TAB BAR */}
        <div style={{ display: "flex", marginBottom: -1 }}>
          {[
            { id: "scan",   label: "Scanner" },
            { id: "db",     label: needsCostingCount > 0 ? `Ingredients DB (${needsCostingCount})` : "Ingredients DB" },
            { id: "cost",   label: "Costing" },
            { id: "book",   label: recipes.length > 0 ? `Recipe Book (${recipes.length})` : "Recipe Book" },
            { id: "prices", label: "Live Prices" },
          ].map(t => {
            const active = tab === t.id;
            const isComingSoon = t.id === "prices";
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 18px", fontSize: 13,
                fontWeight: active && !isComingSoon ? 500 : 400,
                color: isComingSoon ? "var(--color-text-secondary)"
                  : active ? C.amber : "var(--color-text-secondary)",
                opacity: isComingSoon ? 0.5 : 1,
                background: "none", border: "none",
                borderBottom: active && !isComingSoon ? `2px solid ${C.amber}` : "2px solid transparent",
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
                    {["Ingredient", "Unit", "R / unit", "Last updated", "Status", "Package"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i >= 2 && i <= 3 ? "center" : i >= 4 ? "left" : "left",
                        padding: "8px 10px 8px 0", fontWeight: 500, color: "var(--color-text-secondary)",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDb.map((ing) => {
                    const editing = editingCell?.name === ing.name;
                    const needsCost = ing.needsCosting || ing.costPerUnit === 0;
                    const outdated  = isOutdated(ing.dateLastUpdated);
                    return (
                      <tr key={ing.name} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                        <td style={{ padding: "8px 10px 8px 0", color: "var(--color-text-primary)", minWidth: 140 }}>
                          {ing.name}
                        </td>
                        <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)" }}>
                          {ing.unit}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          {editing ? (
                            <input
                              type="number"
                              min="0"
                              step="0.0001"
                              value={editValue}
                              autoFocus
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
                          </div>
                        </td>
                        <td style={{ padding: "8px 0 8px 10px", color: "var(--color-text-secondary)", fontSize: 12 }}>
                          {ing.pkg}
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
                        {[
                          { label: "Ingredients",                   value: ingTotal },
                          { label: "Supplies (5% + R16 packaging)", value: overhead.supplies },
                          { label: "Operating costs (5%)",          value: overhead.opCost },
                          { label: "Equipment (5%)",                value: overhead.equipment },
                        ].map(row => (
                          <div key={row.label} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "7px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13,
                          }}>
                            <span style={{ color: "var(--color-text-secondary)" }}>{row.label}</span>
                            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>R{row.value.toFixed(2)}</span>
                          </div>
                        ))}
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
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
                </p>
                {/* Column headers */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr auto auto",
                  padding: "6px 0", borderBottom: `1px solid var(--color-border-tertiary)`,
                  fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)",
                  marginBottom: 2,
                }}>
                  <span>Recipe</span>
                  <span style={{ textAlign: "right", paddingRight: 32 }}>Cost price</span>
                  <span></span>
                </div>
                {recipes.map((r, idx) => {
                  const ingTotal = r.ingredients.reduce((s, ing) => {
                    const m = matchIngredientEff(ing.name, ing.unit);
                    return s + (m && m.costPerUnit > 0 ? m.costPerUnit * ing.amount : 0);
                  }, 0);
                  const totalCost = ingTotal > 0 ? calcOverhead(ingTotal).total : null;
                  const isActive = r.id === activeRecipeId;
                  return (
                    <div
                      key={r.id}
                      style={{
                        display: "grid", gridTemplateColumns: "1fr auto auto",
                        alignItems: "center",
                        padding: "11px 0",
                        borderBottom: "0.5px solid var(--color-border-tertiary)",
                        background: isActive ? C.amberBg : "transparent",
                        marginInline: isActive ? -8 : 0,
                        paddingInline: isActive ? 8 : 0,
                        borderRadius: isActive ? 6 : 0,
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onClick={() => { setActiveRecipeId(r.id); setTab("cost"); }}
                    >
                      <div>
                        <span style={{
                          fontSize: 14, fontWeight: isActive ? 500 : 400,
                          color: isActive ? C.amber : "var(--color-text-primary)",
                          marginRight: 8,
                        }}>
                          {String(idx + 1).padStart(2, "0")}. {r.title}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 14, fontWeight: 500, paddingRight: 20,
                        color: totalCost ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                        textAlign: "right",
                      }}>
                        {totalCost ? `R${totalCost.toFixed(2)}` : "—"}
                      </span>
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
              </div>
            )}
          </div>
        )}

        {/* ══ LIVE PRICES TAB — COMING SOON ════════════════════ */}
        {tab === "prices" && (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
              Coming Soon
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)", maxWidth: 340, marginInline: "auto", lineHeight: 1.7 }}>
              Live SA grocery price lookup will be available in a future update.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
