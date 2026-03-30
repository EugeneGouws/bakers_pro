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

  let url;
  try {
    ({ url } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Invalid JSON body" };
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: "Missing or invalid url" };
  }

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BakersCostPro/1.0; +https://bakerspro.netlify.app)",
      Accept: "text/html,application/xhtml+xml,*/*",
    },
  });

  const html = await resp.text();

  return {
    statusCode: resp.ok ? 200 : resp.status,
    headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
