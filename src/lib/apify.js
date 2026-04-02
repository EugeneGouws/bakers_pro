// ── Normalisation helpers ────────────────────────────────────────────────────
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

// ── Package parsing ──────────────────────────────────────────────────────────
export function parsePackageInfo(str) {
  const s = str || "";
  const multiM = s.match(/(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  if (multiM) {
    return {
      packageValue: parseFloat(multiM[1]) * parseFloat(multiM[2]),
      packageUnit: multiM[3].toLowerCase(),
      rawMatchedPackageText: multiM[0],
    };
  }
  const countM = s.match(/(\d+)\s*(?:s\b|units?\b|eggs?\b|rolls?\b|slices?\b|pcs?\b|pieces?\b)/i);
  if (countM) {
    return { packageValue: parseFloat(countM[1]), packageUnit: "units", rawMatchedPackageText: countM[0] };
  }
  const stdM = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  if (stdM) {
    return { packageValue: parseFloat(stdM[1]), packageUnit: stdM[2].toLowerCase(), rawMatchedPackageText: stdM[0] };
  }
  const looseM = s.match(/\b(loose|each|bunch)\b/i);
  if (looseM) {
    return { packageValue: 1, packageUnit: "units", rawMatchedPackageText: looseM[0] };
  }
  return { packageValue: null, packageUnit: null, rawMatchedPackageText: null };
}

export function convertToBaseUnits(packageValue, packageUnit) {
  if (packageValue == null || packageUnit == null) return { baseQuantity: null, baseUnit: null };
  const u = packageUnit.toLowerCase();
  if (u === "kg") return { baseQuantity: packageValue * 1000, baseUnit: "g" };
  if (u === "g")  return { baseQuantity: packageValue, baseUnit: "g" };
  if (u === "l")  return { baseQuantity: packageValue * 1000, baseUnit: "ml" };
  if (u === "ml") return { baseQuantity: packageValue, baseUnit: "ml" };
  return { baseQuantity: packageValue, baseUnit: "units" };
}

// ── Candidate scoring ────────────────────────────────────────────────────────
function scoreCandidate(ingredient, product) {
  const ingNorm  = normalizeIngredientName(ingredient.name);
  const prodNorm = normalizeProductName(product.name || product.title || "");
  const ingTokens  = ingNorm.split(" ").filter(Boolean);
  const prodTokens = new Set(prodNorm.split(" ").filter(Boolean));

  const overlap   = ingTokens.filter(t => prodTokens.has(t)).length;
  const unionSize = new Set([...ingTokens, ...prodTokens]).size;
  let nameSim = unionSize > 0 ? overlap / unionSize : 0;
  const prodWords = prodNorm.split(" ");
  if (ingTokens.length > 0 && ingTokens.every((t, i) => prodWords[i] === t)) nameSim = Math.min(1, nameSim + 0.15);

  const { packageUnit } = parsePackageInfo(product.name || product.title || "");
  const { baseUnit } = convertToBaseUnits(1, packageUnit);
  const ingUnit   = (ingredient.unit || "").toLowerCase();
  const ingFamily = ["g","kg"].includes(ingUnit) ? "mass" : ["ml","l"].includes(ingUnit) ? "volume" : ["each","units"].includes(ingUnit) ? "count" : "unknown";
  const prodFamily = baseUnit === "g" ? "mass" : baseUnit === "ml" ? "volume" : baseUnit === "units" ? "count" : "unknown";
  const unitScore  = ingFamily === "unknown" || prodFamily === "unknown" ? 0.5 : ingFamily === prodFamily ? 1.0 : 0.0;

  const IRRELEVANT = ["yoghurt","yogurt","muffin","chips","baby","drink","juice","sauce","spread","flavoured","flavored","ice cream","smoothie","milkshake","snack","candy","sweets","pudding"];
  const catScore = IRRELEVANT.some(kw => prodNorm.includes(kw)) ? 0.0 : 1.0;

  const BRANDS = ["cadbury","ina paarman","snowflake","selati","huletts","lancewood","clover","sasko","tastic","rama"];
  const ingBrand  = BRANDS.find(b => ingNorm.includes(b));
  const prodBrand = BRANDS.find(b => prodNorm.includes(b));
  const brandScore = !ingBrand ? 0.5 : ingBrand === prodBrand ? 1.0 : 0.1;

  return (nameSim * 0.50) + (unitScore * 0.20) + (catScore * 0.15) + (brandScore * 0.15);
}

export function chooseBestCandidate(ingredient, candidates) {
  const scored = candidates
    .map(p => ({ product: p, score: scoreCandidate(ingredient, p) }))
    .sort((a, b) => b.score - a.score);
  return { best: scored[0]?.product ?? null, score: scored[0]?.score ?? 0, all: scored };
}

// ── Apify fetch ──────────────────────────────────────────────────────────────
// Returns array of candidate products for a given ingredient.
export async function fetchApifyProducts(ingredient) {
  const apiKey = import.meta.env.VITE_APIFY_KEY;
  if (!apiKey) throw new Error("Apify API key not set. Add VITE_APIFY_KEY to your .env file.");

  const searchUrl = `https://www.checkers.co.za/search?Search=${encodeURIComponent(ingredient.name)}`;
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
  return Array.isArray(candidates) ? candidates : [];
}
