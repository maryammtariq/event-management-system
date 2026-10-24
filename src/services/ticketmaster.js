import { normalizeEvent } from "../utils/events";
const ROOT = "https://app.ticketmaster.com/discovery/v2";
export const hasApiKey = Boolean(
  import.meta.env.VITE_TICKETMASTER_API_KEY?.trim(),
);
export function buildSearchParams(
  filters = {},
  page = 0,
  key = import.meta.env.VITE_TICKETMASTER_API_KEY,
) {
  if (!key?.trim())
    throw new Error(
      "Add your Ticketmaster API key to .env and restart the app.",
    );
  const params = new URLSearchParams({
    apikey: key.trim(),
    size: "12",
    page: String(page),
    sort: filters.sort || "date,asc",
  });
  if (filters.keyword?.trim()) params.set("keyword", filters.keyword.trim());
  if (filters.city?.trim()) params.set("city", filters.city.trim());
  if (filters.country) params.set("countryCode", filters.country);
  if (filters.category) params.set("classificationName", filters.category);
  // Ticketmaster expects UTC timestamps without milliseconds.
  params.set(
    "startDateTime",
    filters.date
      ? `${filters.date}T00:00:00Z`
      : new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
  );
  if (filters.endDate)
    params.set("endDateTime", `${filters.endDate}T23:59:59Z`);
  return params;
}
async function request(path, params, signal) {
  let response;
  try {
    const timeout = AbortSignal.timeout(15000);
    response = await fetch(`${ROOT}/${path}?${params}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    if (error.name === "TimeoutError")
      throw new Error(
        "Ticketmaster took too long to respond. Please try again.",
      );
    throw new Error(
      "Unable to reach Ticketmaster. Check your internet connection and try again.",
    );
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status))
      throw new Error(
        "Ticketmaster rejected the API key. Check your Consumer Key in .env, then restart the app.",
      );
    if (response.status === 429)
      throw new Error(
        "Ticketmaster request limit reached. Please wait a minute before trying again.",
      );
    if (response.status === 404)
      throw new Error(
        "This event could not be found. It may no longer be available.",
      );
    throw new Error(
      "Ticketmaster is temporarily unavailable. Please try again shortly.",
    );
  }
  return response.json();
}
export async function searchEvents(filters, page, signal) {
  const data = await request(
    "events.json",
    buildSearchParams(filters, page),
    signal,
  );
  return {
    items: (data._embedded?.events || []).map(normalizeEvent),
    page: data.page?.number || 0,
    total: data.page?.totalElements || 0,
    totalPages: Math.min(data.page?.totalPages || 0, Math.ceil(1000 / 12)),
  };
}
export async function getEvent(id, signal) {
  const key = import.meta.env.VITE_TICKETMASTER_API_KEY;
  if (!key?.trim())
    throw new Error(
      "Add your Ticketmaster API key to .env and restart the app.",
    );
  return normalizeEvent(
    await request(
      `events/${encodeURIComponent(id)}.json`,
      new URLSearchParams({ apikey: key.trim() }),
      signal,
    ),
  );
}
