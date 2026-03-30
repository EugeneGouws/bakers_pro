// Server-side proxy for GitHub Contents API writes.
// GITHUB_TOKEN and GITHUB_REPO are Netlify environment variables — never in the client bundle.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: "Method Not Allowed" };
  }

  const token  = process.env.VITE_GITHUB_TOKEN;
  const repo   = process.env.VITE_GITHUB_REPO;
  const branch = process.env.VITE_GITHUB_BRANCH || "main";

  if (!token || !repo) {
    return { statusCode: 500, headers: CORS_HEADERS, body: "GitHub not configured on server" };
  }

  let path, content, message;
  try {
    ({ path, content, message } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Invalid JSON body" };
  }

  if (!path || content === undefined || !message) {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Missing path, content, or message" };
  }

  // Restrict writes to the data/ directory only
  if (!path.startsWith("data/")) {
    return { statusCode: 403, headers: CORS_HEADERS, body: "Forbidden: only data/ paths are writable" };
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const ghHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  // Fetch current file SHA (required by GitHub API for updates; omit for new files)
  let sha;
  try {
    const getResp = await fetch(`${apiUrl}?ref=${branch}`, { headers: ghHeaders });
    if (getResp.ok) {
      const file = await getResp.json();
      sha = file.sha;
    }
    // 404 means new file — proceed without SHA
  } catch {
    // Network error fetching SHA — attempt commit anyway
  }

  const jsonString    = JSON.stringify(content, null, 2);
  const encodedContent = Buffer.from(jsonString, "utf-8").toString("base64");

  const putBody = {
    message,
    content: encodedContent,
    branch,
    ...(sha ? { sha } : {}),
  };

  const putResp = await fetch(apiUrl, {
    method: "PUT",
    headers: ghHeaders,
    body: JSON.stringify(putBody),
  });

  if (!putResp.ok) {
    const errorText = await putResp.text();
    return { statusCode: putResp.status, headers: CORS_HEADERS, body: errorText };
  }

  const result = await putResp.json();
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      sha:    result.content?.sha,
      commit: result.commit?.sha,
    }),
  };
};
