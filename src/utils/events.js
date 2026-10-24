export function safeURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
export function normalizeEvent(raw) {
  const venue = raw._embedded?.venues?.[0] || {};
  const classification = raw.classifications?.[0] || {};
  const start = raw.dates?.start || {};
  const images = [...(raw.images || [])].sort(
    (a, b) =>
      Math.abs(a.width / a.height - 1.6) - Math.abs(b.width / b.height - 1.6) ||
      b.width - a.width,
  );
  const image = images.find((i) => i.width >= 500) || images[0];
  return {
    id: raw.id,
    name: raw.name || "Untitled event",
    image: safeURL(image?.url),
    date: start.localDate || "",
    time: start.localTime || "",
    dateTime: start.dateTime || "",
    timezone: raw.dates?.timezone || venue.timezone || "",
    dateTBA: Boolean(start.dateTBA || start.dateTBD),
    timeTBA: Boolean(start.timeTBA || start.noSpecificTime),
    status: raw.dates?.status?.code || "onsale",
    venue: venue.name || "Venue to be announced",
    city: venue.city?.name || "",
    country: venue.country?.name || "",
    countryCode: venue.country?.countryCode || "",
    address: [venue.address?.line1, venue.state?.name, venue.postalCode]
      .filter(Boolean)
      .join(", "),
    category: classification.segment?.name || "Other",
    genre:
      classification.genre?.name === "Undefined"
        ? ""
        : classification.genre?.name || "",
    info: raw.info || raw.description || "",
    note: raw.pleaseNote || "",
    url: safeURL(raw.url),
    price: raw.priceRanges?.[0] || null,
    accessible: venue.accessibleSeatingDetail || "",
    age: raw.ageRestrictions?.legalAgeEnforced
      ? "Age restrictions apply. See the official event page."
      : "",
  };
}
export function isCompleted(event, now = new Date()) {
  if (event.dateTBA) return false;
  if (event.dateTime) {
    const t = Date.parse(event.dateTime);
    return Number.isFinite(t) && t < now.getTime();
  }
  if (!event.date) return false;
  let today;
  try {
    today = new Intl.DateTimeFormat("en-CA", {
      timeZone: event.timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    today = now.toISOString().slice(0, 10);
  }
  return event.date < today;
}
export function canRegister(event) {
  return (
    !isCompleted(event) &&
    !["cancelled", "canceled", "postponed"].includes(event.status)
  );
}
export function formatDate(
  event,
  options = { month: "short", day: "numeric", year: "numeric" },
) {
  if (event.dateTBA || !event.date) return "Date to be announced";
  const date = new Date(`${event.date}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? "Date to be announced"
    : new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
        date,
      );
}
export function formatTime(event) {
  if (event.timeTBA || !event.time) return "Time to be announced";
  const [h, m] = event.time.split(":");
  return `${Number(h) % 12 || 12}:${m} ${Number(h) >= 12 ? "pm" : "am"}${event.timezone ? ` · ${event.timezone}` : " · venue local time"}`;
}
export function priceLabel(price) {
  if (!price) return "See official pricing";
  try {
    return `From ${new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency || "USD", maximumFractionDigits: 0 }).format(price.min)}`;
  } catch {
    return "See official pricing";
  }
}
