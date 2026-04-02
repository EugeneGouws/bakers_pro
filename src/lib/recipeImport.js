import { FREE_INGREDIENTS } from "./ingredients.js";

// ── Constants ────────────────────────────────────────────────────────────────
const UNICODE_FRACS = {
  '½': 0.5, '⅓': 1/3, '⅔': 2/3,
  '¼': 0.25, '¾': 0.75, '⅛': 0.125,
  '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

export const UNIT_NORM = {
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

// ── Parsing helpers ──────────────────────────────────────────────────────────
function parseAmountStr(s) {
  for (const [ch, val] of Object.entries(UNICODE_FRACS)) s = s.replace(ch, String(val));
  s = s.trim();
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  return parseFloat(s) || 0;
}

export function parseIngredientLine(raw) {
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
    if (['l','liter','liters','litre','litres'].includes(rawU)) amount *= 1000;
    if (['cup','cups'].includes(rawU)) amount *= 240;
    if (['tsp','teaspoon','teaspoons'].includes(rawU)) amount *= 5;
    if (['tbsp','tablespoon','tablespoons','tbs'].includes(rawU)) amount *= 15;
  }

  const name = rest.replace(/,.*$/, '').replace(/\([^)]*\)/g, '').trim().toLowerCase();
  if (!name || name.length < 2 || name.split(' ').length > 7) return null;
  return { name, amount: Math.round(amount * 1000) / 1000, unit };
}

export function parseRecipeText(text) {
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

// ── importFromUrl ────────────────────────────────────────────────────────────
// Returns { title, servings, ingredients[] } or throws on failure.
export async function importFromUrl(url) {
  const resp = await fetch("/.netlify/functions/fetch-recipe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${resp.status}`);
  }

  const data = await resp.json();
  const ingredients = (data.ingredients || [])
    .map(ing => parseIngredientLine(ing))
    .filter(Boolean);

  if (ingredients.length === 0)
    throw new Error("No valid ingredients could be parsed from the recipe.");

  return {
    title: data.title || 'Imported Recipe',
    servings: data.servings || 1,
    ingredients,
  };
}

// ── importFromFile ───────────────────────────────────────────────────────────
// Returns { title, servings, ingredients[] } or throws on failure.
export async function importFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt' || ext === 'md') {
    return parseRecipeText(await file.text());
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const ab = await file.arrayBuffer();
    const { value: text } = await mammoth.extractRawText({ arrayBuffer: ab });
    return parseRecipeText(text);
  }

  if (ext === 'pdf') {
    const { extractText } = await import('unpdf');
    const ab = await file.arrayBuffer();
    const result = await extractText(new Uint8Array(ab), { mergePages: true });
    const text = typeof result === 'string' ? result : (result.text ?? result.pages?.join('\n') ?? '');
    return parseRecipeText(text);
  }

  if (ext === 'xlsx') {
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
    return { title, servings: 1, ingredients };
  }

  throw new Error(`Unsupported file type ".${ext}". Use .txt, .md, .docx, .pdf, or .xlsx`);
}
