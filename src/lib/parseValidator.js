// Two backends, one interface.
// Production: Chrome Built-in AI (Gemini Nano) — window.LanguageModel or window.ai.languageModel
// Dev:        Ollama running on localhost:11434
// If neither available: returns original parsed recipe, corrected: false

const SYSTEM_PROMPT = `You are a recipe validation assistant for a South African baking cost app.
You receive the original raw recipe text, a machine-parsed version, and a list of known ingredient names.

Check the parsed recipe against the raw text and:
1. Fix the title if wrong or missing
2. Fix servings/yield if wrong or missing
3. Add ingredients that appear in the raw text but are missing from the parsed list
4. Fix ingredient names that are garbled or truncated
5. Fix quantities and units that are obviously wrong (e.g. "2 butter" → "250g butter")
6. Normalise ingredient names to match the known list where a clear match exists
7. Do NOT invent ingredients that are not in the raw text

Respond only with a JSON object matching this schema exactly:
{
  "title": string,
  "servings": number,
  "ingredients": [{ "name": string, "quantity": number, "unit": string }],
  "corrections": [string]
}
The corrections array lists every change made in plain English. If nothing was changed, return an empty array.`;

const OLLAMA_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    servings: { type: "number" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
        },
        required: ["name", "quantity", "unit"],
      },
    },
    corrections: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["title", "servings", "ingredients", "corrections"],
};

/**
 * @returns {Promise<'chrome'|'ollama'|'none'>}
 */
export async function detectAiBackend() {
  if (import.meta.env.DEV) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      await fetch("http://localhost:11434", { signal: controller.signal });
      clearTimeout(timeout);
      return "ollama";
    } catch {
      // fall through
    }
  }

  try {
    const api = window.LanguageModel ?? window.ai?.languageModel ?? null;
    if (api) {
      const result = await (api.availability?.() ?? api.capabilities?.());
      const status = typeof result === "string" ? result : result?.available;
      if (status === "readily" || status === "after-download") {
        return "chrome";
      }
    }
  } catch {
    // fall through
  }

  return "none";
}

/**
 * Internal: map parsed ingredients (which use `amount`) to `quantity` for the AI prompt.
 */
function toPromptShape(parsed) {
  return {
    ...parsed,
    ingredients: parsed.ingredients.map(({ name, amount, unit, ...rest }) => ({
      name,
      quantity: amount ?? rest.quantity ?? 0,
      unit,
    })),
  };
}

/**
 * Internal: map AI response (which uses `quantity`) back to `amount` for finishImport.
 */
function fromResponseShape(data) {
  return {
    ...data,
    ingredients: (data.ingredients || []).map(({ name, quantity, unit }) => ({
      name,
      amount: quantity ?? 0,
      unit,
    })),
  };
}

/**
 * @param {string} rawText
 * @param {object} parsed        — { title, servings, ingredients: [{name, amount, unit}] }
 * @param {Array}  dbIngredients — current dbState, used for name normalisation hints
 * @returns {Promise<{ result: object, corrected: boolean, corrections: string[], error: string|null }>}
 */
export async function validateParsedRecipe(rawText, parsed, dbIngredients) {
  const backend = await detectAiBackend();
  const promptParsed = toPromptShape(parsed);

  const userMessage =
    `RAW TEXT:\n${rawText}\n\nPARSED RECIPE:\n${JSON.stringify(promptParsed, null, 2)}` +
    `\n\nKNOWN INGREDIENT NAMES:\n${dbIngredients.map((i) => i.name).join(", ")}`;

  if (backend === "chrome") {
    try {
      const api = window.LanguageModel ?? window.ai?.languageModel;
      const session = await api.create({ systemPrompt: SYSTEM_PROMPT });
      const response = await session.prompt(userMessage);
      session.destroy();
      let data;
      try {
        data = JSON.parse(response);
      } catch {
        return { result: parsed, corrected: false, corrections: [], error: "Model returned invalid JSON" };
      }
      const corrections = data.corrections || [];
      return {
        result: fromResponseShape(data),
        corrected: corrections.length > 0,
        corrections,
        error: null,
      };
    } catch (e) {
      return { result: parsed, corrected: false, corrections: [], error: e.message };
    }
  }

  if (backend === "ollama") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const resp = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "qwen2.5:1.5b",
          stream: false,
          format: OLLAMA_SCHEMA,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      });
      clearTimeout(timeout);
      const json = await resp.json();
      let data;
      try {
        data = JSON.parse(json.message.content);
      } catch {
        return { result: parsed, corrected: false, corrections: [], error: "Model returned invalid JSON" };
      }
      const corrections = data.corrections || [];
      return {
        result: fromResponseShape(data),
        corrected: corrections.length > 0,
        corrections,
        error: null,
      };
    } catch (e) {
      return { result: parsed, corrected: false, corrections: [], error: e.message };
    }
  }

  return { result: parsed, corrected: false, corrections: [], error: null };
}
