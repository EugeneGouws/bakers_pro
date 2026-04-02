import { useState } from "react";

// Generic hook: persists state to localStorage automatically on every write.
export default function useLocalStorage(key, initialValue) {
  const [value, setValueRaw] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  function setValue(next) {
    const resolved = typeof next === "function" ? next(value) : next;
    setValueRaw(resolved);
    try {
      localStorage.setItem(key, JSON.stringify(resolved));
    } catch { /* quota exceeded — silent */ }
  }

  return [value, setValue];
}
