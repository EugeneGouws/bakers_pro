import recipeScraper from "recipe-scraper";
import * as cheerio from "cheerio";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// JSON-LD fallback for sites not in recipe-scraper's whitelist
async function scrapeViaJsonLd(url) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RecipeScraper/1.0)",
      "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!resp.ok) throw new Error(`Site returned HTTP ${resp.status}`);
  const html = await resp.text();
  const $ = cheerio.load(html);

  let recipe = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return;
    try {
      let data = JSON.parse($(el).html());
      // Unwrap @graph arrays
      if (data["@graph"]) data = data["@graph"].find(n => n["@type"] === "Recipe") || null;
      if (data && data["@type"] === "Recipe") recipe = data;
    } catch { /* skip malformed JSON-LD */ }
  });

  if (!recipe || !recipe.recipeIngredient?.length) {
    throw new Error("No recipe data found. The site may not use standard recipe markup, or may require JavaScript to render.");
  }

  const servingsRaw = recipe.recipeYield;
  const servings = Array.isArray(servingsRaw)
    ? parseInt(servingsRaw[0]) || 1
    : parseInt(servingsRaw) || 1;

  return {
    title: recipe.name || "Imported Recipe",
    servings,
    ingredients: recipe.recipeIngredient.map(s => String(s).trim()).filter(Boolean),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
  }

  let url;
  try {
    ({ url } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Invalid JSON body" };
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Missing or invalid url" };
  }

  try {
    let result;
    try {
      // Try recipe-scraper first (supported sites get best structured extraction)
      const recipe = await recipeScraper(url);
      if (!recipe.ingredients?.length) throw new Error("No ingredients found");
      const servings = parseInt(recipe.servings) || 1;
      result = {
        title: recipe.name || recipe.title || "Imported Recipe",
        servings,
        ingredients: recipe.ingredients.map(s => String(s).trim()).filter(Boolean),
      };
    } catch (scraperErr) {
      // Fall back to JSON-LD parsing for unsupported sites
      if (scraperErr.message === "Site not yet supported" || scraperErr.message === "Failed to parse domain") {
        result = await scrapeViaJsonLd(url);
      } else {
        throw scraperErr;
      }
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Failed to scrape recipe",
        hint: "This site may not use standard recipe markup, or may require JavaScript that the scraper doesn't support.",
      }),
    };
  }
};
