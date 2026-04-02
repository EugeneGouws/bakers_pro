import { useState } from "react";
import { initDb, saveDb } from "../lib/storage.js";

// Provides the ingredients DB state with automatic localStorage persistence.
// Returns [dbState, setDb]
// setDb(newDb) — replaces state and persists immediately.
export default function useDb() {
  const [dbState, setDbRaw] = useState(initDb);

  function setDb(next) {
    const resolved = typeof next === "function" ? next(dbState) : next;
    setDbRaw(resolved);
    saveDb(resolved);
  }

  return [dbState, setDb];
}
