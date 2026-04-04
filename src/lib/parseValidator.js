import { matchIngredientEff } from './ingredients.js';

const OLLAMA_URL = 'http://localhost:11434/api/chat';

const SUGGEST_SYSTEM = `You are a JSON API. You only output raw JSON, never text, never markdown, never explanations.
Given a list of ingredient names, return what each one most likely means.
Output format: {"suggestions":[{"from":string,"to":string}]}
Omit entries you are not confident about.
South African terms: koekmeel=cake flour, koeksoda=bicarbonate of soda, konfyt=jam, amasi=buttermilk, stork bake=margarine, rama=margarine`;

const SUGGEST_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to:   { type: 'string' },
        },
        required: ['from', 'to'],
      },
    },
  },
  required: ['suggestions'],
};

/**
 * Detects which AI backend is available.
 * @returns {Promise<'chrome'|'chrome-needs-download'|'ollama'|'none'>}
 */
export async function detectAiBackend() {
  if (typeof window !== 'undefined' && window.LanguageModel) {
    try {
      const available = await window.LanguageModel.availability();
      console.log('[AI] Chrome LanguageModel availability:', available);
      if (available === 'readily' || available === 'available') return 'chrome';
      if (available === 'after-download' || available === 'downloadable') return 'chrome-needs-download';
    } catch (e) {
      console.warn('[AI] Chrome availability check failed:', e.message);
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      console.log('[AI] Ollama reachable at localhost:11434');
      return 'ollama';
    }
  } catch (e) {
    // not available
  }

  console.log('[AI] No backend detected — returning none');
  return 'none';
}

/**
 * Fetch list of installed Ollama model names.
 * @returns {Promise<string[]>}
 */
export async function fetchOllamaModels() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.models || []).map(m => m.name);
  } catch {
    return [];
  }
}

/**
 * Triggers a silent Gemini Nano model download.
 * @returns {Promise<boolean>}
 */
export async function triggerModelDownload() {
  if (typeof window === 'undefined' || !window.LanguageModel) return false;
  try {
    const session = await window.LanguageModel.create({ systemPrompt: '' });
    session.destroy();
    return true;
  } catch {
    return false;
  }
}

/**
 * Takes only unmatched ingredient name strings.
 * Asks the AI what each one likely means, then re-runs matchIngredientEff
 * on each suggestion to split into silently-resolved vs needs-confirmation.
 *
 * @param {string[]} unmatchedNames
 * @param {object[]} dbIngredients
 * @param {string}   backend         — 'chrome' | 'ollama' | 'none'
 * @param {string}   model           — Ollama model name
 * @param {number}   timeoutMs
 * @returns {Promise<{ resolved, needsConfirm, corrections }>}
 */
export async function suggestIngredientFixes(
  unmatchedNames,
  dbIngredients,
  backend,
  model = 'qwen2.5:3b',
  timeoutMs = 20000,
) {
  if (!unmatchedNames.length) return { resolved: [], needsConfirm: [], corrections: [] };

  const resolvedBackend = backend === 'chrome-needs-download' ? 'chrome' : backend;
  if (resolvedBackend === 'none') return { resolved: [], needsConfirm: [], corrections: [] };

  const userMessage = `Ingredient names to clean: ${unmatchedNames.join(', ')}`;

  console.log('[AI] Sending unmatched names:', unmatchedNames);
  console.log('[AI] Prompt chars:', SUGGEST_SYSTEM.length + userMessage.length);

  let raw;
  if (resolvedBackend === 'chrome') {
    raw = await _runChrome(SUGGEST_SYSTEM, userMessage, timeoutMs);
  } else {
    raw = await _runOllama(SUGGEST_SYSTEM, userMessage, model, timeoutMs, SUGGEST_SCHEMA);
  }

  console.log('[AI] suggestIngredientFixes raw:', raw);
  const json = parseModelResponse(raw);
  if (!json?.suggestions) throw new Error('Invalid response from AI — expected {"suggestions":[...]}');

  const resolved    = [];
  const needsConfirm = [];
  const corrections  = [];

  for (const { from, to } of json.suggestions) {
    if (!from || !to) continue;
    const dbEntry = matchIngredientEff(to, null, dbIngredients);
    if (dbEntry) {
      resolved.push({ original: from, suggested: to, dbEntry });
      corrections.push(`"${from}" → "${to}"`);
    } else {
      needsConfirm.push({ original: from, suggested: to });
      corrections.push(`"${from}" → "${to}" (needs confirmation)`);
    }
  }

  console.log('[AI] resolved:', resolved.length, '| needsConfirm:', needsConfirm.length);
  return { resolved, needsConfirm, corrections };
}

// ── Internal inference helpers ───────────────────────────────────────────────

async function _runChrome(systemPrompt, userMessage, timeoutMs) {
  const session = await window.LanguageModel.create({
    systemPrompt,
    expectedInputLanguages: ['en'],
    expectedOutputLanguages: ['en'],
  });
  try {
    console.log('[Nano] Session created — sending prompt');
    const raw = await Promise.race([
      session.prompt(userMessage, { responseConstraint: SUGGEST_SCHEMA }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    console.log('[Nano] Raw response:', raw);
    return raw;
  } finally {
    session.destroy();
  }
}

async function _runOllama(systemPrompt, userMessage, model, timeoutMs, jsonSchema) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
  try {
    console.log('[Ollama] Sending to model:', model);
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: jsonSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage },
        ],
      }),
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data    = await response.json();
    const content = data.message?.content;
    console.log('[Ollama] Raw response content:', content);
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function parseModelResponse(raw) {
  if (!raw) return null;
  try {
    const clean = raw.replace(/^```[\w]*\n?|```$/gm, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
}

/**
 * Checks whether Ollama is reachable on localhost.
 * @returns {Promise<boolean>}
 */
export async function isOllamaAvailable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    return false;
  }
}
