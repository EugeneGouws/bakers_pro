// Personal data stored only on this device — never pushed to GitHub.

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

export const loadFavourites  = () => loadJson("bakerspro_favourites",  []);
export const saveFavourites  = (v) => saveJson("bakerspro_favourites",  v);

export const loadCollections = () => loadJson("bakerspro_collections", {});
export const saveCollections = (v) => saveJson("bakerspro_collections", v);

export const loadPreferences = () => loadJson("bakerspro_preferences", {});
export const savePreferences = (v) => saveJson("bakerspro_preferences", v);
