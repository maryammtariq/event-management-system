import { describe, it, expect, vi, afterEach } from "vitest";
import {
  normalizeEvent,
  isCompleted,
  canRegister,
  safeURL,
} from "../src/utils/events";
import {
  buildSearchParams,
  searchEvents,
  getEvent,
} from "../src/services/ticketmaster";
import eventsReducer, { fetchEvents } from "../src/features/eventsSlice";
const now = new Date("2026-10-18T12:00:00Z");
afterEach(() => vi.unstubAllGlobals());
describe("Ticketmaster adapter", () => {
  it("normalizes optional data and accepts only secure external URLs", () => {
    const event = normalizeEvent({
      id: "123",
      name: "Live show",
      images: [
        { url: "https://example.com/show.jpg", width: 1000, height: 600 },
      ],
      classifications: [{ segment: { name: "Music" } }],
    });
    expect(event).toMatchObject({
      id: "123",
      name: "Live show",
      category: "Music",
      venue: "Venue to be announced",
      date: "",
      price: null,
    });
    expect(event.image).toBe("https://example.com/show.jpg");
    expect(safeURL("javascript:alert(1)")).toBe("");
  });
  it("constructs documented API filters and encodes search text", () => {
    const params = buildSearchParams(
      {
        keyword: "rock & roll",
        city: "New York",
        country: "US",
        category: "Music",
        date: "2026-11-01",
        endDate: "2026-11-30",
      },
      2,
      "test-key",
    );
    expect(params.get("apikey")).toBe("test-key");
    expect(params.get("keyword")).toBe("rock & roll");
    expect(params.get("classificationName")).toBe("Music");
    expect(params.get("startDateTime")).toBe("2026-11-01T00:00:00Z");
    expect(params.get("endDateTime")).toBe("2026-11-30T23:59:59Z");
    expect(params.get("page")).toBe("2");
    expect(params.get("size")).toBe("12");
  });
  it("does not send requests without a key", () =>
    expect(() => buildSearchParams({}, 0, "")).toThrow("API key"));
  it("handles empty results", async () => {
    vi.stubEnv("VITE_TICKETMASTER_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ page: { totalElements: 0, totalPages: 0 } }),
      }),
    );
    expect((await searchEvents({}, 0)).items).toEqual([]);
    vi.unstubAllEnvs();
  });
  it.each([
    [401, "API key"],
    [429, "limit"],
    [404, "could not be found"],
    [500, "temporarily unavailable"],
  ])("maps HTTP %s to helpful feedback", async (status, message) => {
    vi.stubEnv("VITE_TICKETMASTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(getEvent("test")).rejects.toThrow(message);
    vi.unstubAllEnvs();
  });
  it("ignores an out-of-order response", () => {
    let state = eventsReducer(
      undefined,
      fetchEvents.pending("new", { filters: {} }),
    );
    state = eventsReducer(
      state,
      fetchEvents.fulfilled({ items: [{ id: "old" }] }, "old", { filters: {} }),
    );
    expect(state.items).toEqual([]);
  });
});
describe("event lifecycle", () => {
  it("uses authoritative UTC start time", () => {
    expect(isCompleted({ dateTime: "2026-10-18T11:00:00Z" }, now)).toBe(true);
    expect(isCompleted({ dateTime: "2026-10-18T13:00:00Z" }, now)).toBe(false);
  });
  it("uses venue date when time is unknown", () => {
    expect(
      isCompleted({ date: "2026-10-17", timezone: "America/New_York" }, now),
    ).toBe(true);
    expect(
      isCompleted({ date: "2026-10-18", timezone: "America/New_York" }, now),
    ).toBe(false);
  });
  it("keeps unconfirmed dates upcoming and prevents cancelled/postponed registration", () => {
    expect(isCompleted({ date: "2020-01-01", dateTBA: true }, now)).toBe(false);
    expect(canRegister({ status: "cancelled" })).toBe(false);
    expect(canRegister({ status: "postponed" })).toBe(false);
  });
});
