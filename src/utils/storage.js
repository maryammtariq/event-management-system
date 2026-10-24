export const KEYS = {
  users: "gather.users.v1",
  session: "gather.session.v1",
  registrations: "gather.registrations.v1",
};
export function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function loadRegistrations() {
  const data = readJSON(KEYS.registrations, {});
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  return Object.fromEntries(
    Object.entries(data)
      .filter(([key, list]) => key && Array.isArray(list))
      .map(([key, list]) => [
        key,
        list.filter((r) => r?.event?.id && typeof r.event.name === "string"),
      ]),
  );
}
