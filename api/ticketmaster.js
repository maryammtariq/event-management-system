// Narrow read-only gateway. The API key stays in Vercel's server environment.
const ALLOWED = new Set([
  "keyword",
  "city",
  "countryCode",
  "classificationName",
  "startDateTime",
  "endDateTime",
  "sort",
  "page",
]);
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Use GET." });
  }
  const endpoint = req.query.endpoint;
  if (
    typeof endpoint !== "string" ||
    !/^(events\.json|events\/[A-Za-z0-9_-]{1,100}\.json)$/.test(endpoint)
  )
    return res.status(400).json({ error: "Invalid event endpoint." });
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key)
    return res.status(503).json({ error: "Event service is not configured." });
  const url = new URL("https://app.ticketmaster.com/discovery/v2/" + endpoint);
  url.searchParams.set("apikey", key);
  if (endpoint === "events.json") url.searchParams.set("size", "12");
  for (const [name, value] of Object.entries(req.query)) {
    if (!ALLOWED.has(name) || typeof value !== "string") continue;
    if (value.length > 160)
      return res.status(400).json({ error: "Filter is too long." });
    if (name === "page" && (!/^\d+$/.test(value) || Number(value) > 83))
      return res.status(400).json({ error: "Invalid page." });
    url.searchParams.set(name, value);
  }
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!upstream.ok)
      return res
        .status(
          [401, 403, 404, 429].includes(upstream.status)
            ? upstream.status
            : 502,
        )
        .json({ error: "Event service request failed." });
    const body = await upstream.json();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60",
    );
    return res.status(200).json(body);
  } catch {
    return res
      .status(502)
      .json({ error: "Event service is temporarily unavailable." });
  }
}
