// GitHub integration — read community data from raw URLs,
// write via Netlify function (token stays server-side).

const REPO   = import.meta.env.VITE_GITHUB_REPO;   // "EugeneGouws/bakers_pro"
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH || "main";

export async function fetchGitHubJson(path) {
  if (!REPO) throw new Error("VITE_GITHUB_REPO not set");
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;
  const resp = await fetch(url, { cache: "no-cache" });
  if (!resp.ok) throw new Error(`GitHub fetch ${path} → ${resp.status}`);
  return resp.json();
}

// Commits JSON data to the repo via the Netlify server-side proxy.
// content must be a plain JS value (will be JSON-serialised server-side).
export async function commitGitHubJson(path, content, message) {
  const resp = await fetch("/.netlify/functions/github-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content, message }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub commit failed (${resp.status}): ${text}`);
  }
  return resp.json();
}
