# Verification results

Verified on 18 October 2026 in Node.js 24 and Chromium 153.

| Check                                                            | Result    |
| ---------------------------------------------------------------- | --------- |
| Production Vite build                                            | Passed    |
| Vitest automated tests                                           | 19 passed |
| Playwright browser scenarios                                     | 5 passed  |
| Discovery horizontal overflow at 1440, 390 and 320 px            | None      |
| Event detail horizontal overflow at 390 px                       | None      |
| Account form horizontal overflow at 320 px                       | None      |
| Browser exceptions observed during responsive and account checks | None      |
| Production missing-key setup screen                              | Verified  |

The browser scenarios cover:

1. Account creation, event registration, refresh persistence, duplicate prevention, account separation, login and cancellation.
2. Event search, category filtering, empty results and Ticketmaster rate-limit feedback.
3. Completed registration history, cancellation restrictions and blocked registration for a past event.
4. Desktop/mobile layout checks.
5. Date-range validation, URL persistence, sorting and pagination.

Desktop and mobile screenshots were inspected during development. They are internal test outputs, not real event listings.

## Remaining external checks

A personal Ticketmaster Consumer Key was not available during development. Browser tests intercept API requests using explicit synthetic fixtures confined to the test suite. Live search and detail requests require a valid key before submission. The app itself has no mock-data fallback.

GitHub upload and instructor accessibility must be checked after the repository is created on the student's account.

## Reproduce

```bash
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

In the development environment, the normal Playwright browser download was unavailable. The same Playwright suite was run against an existing Chromium-compatible binary through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. This override is optional on a standard local setup.
