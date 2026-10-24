import { test, expect } from "@playwright/test";
// Synthetic fixtures are used only by tests. The application never serves mock events.
function fixture(
  id = "test-1",
  name = "The Midnight Sessions",
  date = "2099-06-12",
  category = "Music",
) {
  return {
    id,
    name,
    dates: {
      start: {
        localDate: date,
        localTime: "19:30:00",
        dateTime: `${date}T18:30:00Z`,
      },
      timezone: "Europe/London",
      status: { code: "onsale" },
    },
    images: [
      {
        url: `https://images.example.test/${id}.svg`,
        width: 1000,
        height: 600,
      },
    ],
    classifications: [{ segment: { name: category }, genre: { name: "Live" } }],
    _embedded: {
      venues: [
        {
          name: "The Garden Hall",
          city: { name: "London" },
          country: { name: "United Kingdom", countryCode: "GB" },
          address: { line1: "12 Garden Street" },
        },
      ],
    },
    priceRanges: [{ currency: "GBP", min: 35, max: 85 }],
    url: "https://www.ticketmaster.com/",
    info: "A night of music, shared moments and new memories.",
  };
}
const fixtures = [
  fixture(),
  fixture("test-2", "A Night at the Theatre", "2099-07-18", "Arts & Theatre"),
  fixture("test-3", "City Championship", "2099-08-09", "Sports"),
  fixture("test-4", "Open Air Summer", "2099-08-16"),
  fixture("test-5", "Sunday Sounds", "2099-09-07"),
  fixture("test-6", "The Weekend Club", "2099-09-20"),
];
async function mockAPI(page) {
  await page.route("https://images.example.test/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600"><defs><linearGradient id="a"><stop stop-color="#445b6b"/><stop offset="1" stop-color="#d6b38d"/></linearGradient></defs><path fill="url(#a)" d="M0 0h1000v600H0z"/><circle fill="#fff2c5" opacity=".3" cx="740" cy="100" r="180"/><path fill="#263f35" d="M0 500Q300 250 500 500T1000 400v200H0z"/></svg>',
    }),
  );
  await page.route("https://app.ticketmaster.com/discovery/v2/**", (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/events\/([^/]+)\.json/);
    if (match)
      return route.fulfill({
        json: fixtures.find((e) => e.id === match[1]) || fixtures[0],
      });
    let events = fixtures;
    const category = url.searchParams.get("classificationName"),
      keyword = url.searchParams.get("keyword");
    if (category)
      events = events.filter(
        (e) => e.classifications[0].segment.name === category,
      );
    if (keyword)
      events = events.filter((e) =>
        e.name.toLowerCase().includes(keyword.toLowerCase()),
      );
    return route.fulfill({
      json: {
        _embedded: { events },
        page: {
          number: Number(url.searchParams.get("page") || 0),
          totalElements: events.length,
          totalPages: 1,
        },
      },
    });
  });
}
async function signup(page, name = "Alice", email = "alice@example.com") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("demopassword123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
}
test.beforeEach(async ({ page }) => mockAPI(page));
test("register, refresh, prevent duplicates, isolate users and cancel", async ({
  page,
}) => {
  await page.goto("/my-events");
  await expect(page).toHaveURL(/login/);
  await signup(page);
  await page.goto("/events/test-1");
  await expect(
    page.getByRole("heading", { name: "The Midnight Sessions" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Register for event" }).click();
  await expect(page.getByText("Registration saved")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Register for event" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Go to My events" }).click();
  await expect(page.locator(".event-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".event-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Log out" }).click();
  await signup(page, "Bob", "bob@example.com");
  await page.goto("/my-events");
  await expect(page.locator(".event-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email address").fill("alice@example.com");
  await page.getByLabel("Password", { exact: true }).fill("demopassword123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.goto("/my-events");
  await expect(page.locator(".event-card")).toHaveCount(1);
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancel registration" }).click();
  await expect(page.locator(".event-card")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".event-card")).toHaveCount(0);
});
test("search, category filtering, empty state and API failure", async ({
  page,
}) => {
  await page.goto("/events");
  await expect(page.locator(".event-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Sports", exact: true }).click();
  await expect(page.locator(".event-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "City Championship" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All events", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search events" })
    .fill("nothing matches");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No events found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".event-card")).toHaveCount(6);
  await page.route("https://app.ticketmaster.com/discovery/v2/**", (r) =>
    r.fulfill({ status: 429, json: {} }),
  );
  await page.getByRole("button", { name: "Sports", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("request limit");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
test("completed history and blocked registration for past events", async ({
  page,
}) => {
  await signup(page);
  await page.evaluate(() => {
    const user = JSON.parse(localStorage.getItem("gather.session.v1"));
    localStorage.setItem(
      "gather.registrations.v1",
      JSON.stringify({
        [user.id]: [
          {
            event: {
              id: "past",
              name: "A past memory",
              date: "2020-01-01",
              dateTime: "2020-01-01T20:00:00Z",
              category: "Music",
              venue: "Garden Hall",
            },
            registeredAt: "2019-01-01",
          },
        ],
      }),
    );
  });
  await page.goto("/my-events");
  await page.getByRole("button", { name: /^Completed/ }).click();
  await expect(
    page.getByRole("heading", { name: "A past memory" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cancel registration" }),
  ).toHaveCount(0);
  await page.route(
    "https://app.ticketmaster.com/discovery/v2/events/past.json*",
    (r) => r.fulfill({ json: fixture("past", "A past memory", "2020-01-01") }),
  );
  await page.goto("/events/past");
  await expect(page.getByText("Registration saved")).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/events/past");
  await expect(
    page.getByRole("button", { name: "Event completed" }),
  ).toBeDisabled();
});
test("desktop and mobile layouts have no horizontal overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1060 });
  await page.goto("/events");
  await expect(page.locator(".event-card")).toHaveCount(6);
  await page.screenshot({ path: "../qa/desktop.png", fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(
      page.getByRole("button", { name: "Search", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (width === 390)
      await page.screenshot({ path: "../qa/mobile.png", fullPage: true });
  }
  expect(errors).toEqual([]);
});
