# Gather · Event Management System

**Live evaluation demo:** https://gather-event-management.vercel.app/events

Open the live demo, create a browser-only demo account, select an event, register, visit My events, refresh to show persistence, and cancel the registration. No Node.js installation is needed for the hosted demo. Live Ticketmaster data and event details, direct page refreshes, and login routing were verified on the hosted production build on 24 October 2026.

A responsive event discovery and registration app for Web Programming Assignment 2. Built with React, Redux Toolkit, React Router and the Ticketmaster Discovery API.

## Run locally

Requirements: **Node.js 22.12 or newer**, npm, a modern browser, and a Ticketmaster Consumer Key.

1. Open a terminal in this project folder.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   On Windows PowerShell, use `Copy-Item .env.example .env` instead.
4. Sign up at [Ticketmaster Developer Portal](https://developer.ticketmaster.com/), create an app and copy its **Consumer Key**. Edit `.env`:
   ```dotenv
   VITE_TICKETMASTER_API_KEY=your_actual_consumer_key
   ```
5. Start the app:
   ```bash
   npm run dev
   ```
6. Open the localhost URL printed by Vite, normally `http://localhost:5173`.

Restart Vite after changing `.env`. Without a key, the app displays setup instructions rather than inventing event data. Account registration and login still work without a key.

Do not open `index.html` by double-clicking. Vite must serve the project. Use localhost or HTTPS for the browser cryptography API used by account registration.

## Features

- Account registration, login and logout; name, email and password validation.
- Session restoration on refresh using Local Storage.
- Live Ticketmaster event list and individual event details.
- Keyword and city search; country, category and date range filters.
- Soonest, relevance and alphabetical sorting; paginated results.
- Search state stored in the URL, so filters survive a refresh and browser navigation.
- Date, time, venue, address, category, image, price and additional event information.
- Login required to register; return to the selected event after login or signup.
- Duplicate prevention; one registration per event per account.
- Per-account My Events dashboard with upcoming and completed views.
- Cancellation of upcoming registrations, with confirmation.
- Completed history retained; past/cancelled/postponed events cannot receive new registrations.
- Loading skeletons, empty results, error feedback, retry controls and missing-key instructions.
- Responsive navigation and layouts, labelled forms, keyboard focus indicators, skip link, reduced-motion support and status announcements.

**Local registration is a coursework simulation.** It does not purchase or reserve a real Ticketmaster ticket. Official tickets are accessed through the event's Ticketmaster link.

## Try the app

1. Create a demo account using an email address and a demo password of at least eight characters. No email is sent.
2. Search for a city in a supported country. The default is the United States; choose Worldwide to remove the country filter. The app does not assume Ticketmaster covers Pakistan.
3. Select an event and choose **Register for event**.
4. Visit **My events**, refresh and confirm that the registration remains.
5. Log out and create another account. Its My Events list starts empty.
6. Log back into the first account to recover its registrations.
7. Cancel an upcoming registration and confirm the removal.

If an event has already started, it is shown as completed. Ticketmaster does not consistently provide end times, so the start is the cutoff. For an event without a precise start time, completion is determined after its local venue date. Events with unconfirmed dates remain upcoming.

## Commands

| Command              | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start the Vite development server         |
| `npm run build`      | Build production files into `dist/`       |
| `npm run preview`    | Serve the production build locally        |
| `npm test`           | Run the Vitest unit and integration tests |
| `npm run test:watch` | Run Vitest in watch mode                  |
| `npm run test:e2e`   | Run the Playwright browser tests          |
| `npm run format`     | Format source code and tests              |

Install a browser before running the browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

Browser tests start their own Vite server on port 4173 with a test-only placeholder key and intercept Ticketmaster requests with synthetic fixtures. They require **no real API key** and do not consume API quota. Fixtures are confined to test files and are never used by the application. Real API acceptance testing still requires your Consumer Key.

The optional environment variable `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point browser tests at an existing Chromium installation.

## Project structure

```text
src/
  app/store.js                  Store setup and persistence subscription
  components/                   Reusable layout, cards, feedback and route guard
  features/authSlice.js          User, authentication progress and errors
  features/eventsSlice.js        Search results, details and API request states
  features/registrationsSlice.js Per-user registrations and cancellation
  features/uiSlice.js            Notifications and storage warning state
  pages/                        Discovery, detail, account and dashboard views
  services/auth.js              Frontend credential and session simulation
  services/ticketmaster.js      API requests, parameters and error translation
  utils/events.js               API normalization, formatting and lifecycle rules
  utils/storage.js              Versioned Local Storage and defensive parsing
  styles.css                    Shared styles and responsive breakpoints
tests/
  auth.test.js                  Validation, hashing, login and storage failures
  events.test.js                API mapping, filters, errors and event lifecycle
  registrations.test.js         Duplicates, account isolation and cancellation
  e2e/app.spec.js                Full browser flows and responsive checks
```

## Redux and routing decisions

`configureStore` combines four `createSlice` reducers. Components read state with `useSelector` and send actions using `useDispatch`. `createAsyncThunk` handles API fetching and asynchronous password derivation.

- `auth`: current public user, submission status and error. Credential records are maintained by the auth service, not stored in the public user state.
- `events`: result list, pagination, selected event, loading/error states and active request IDs. Requests are aborted on navigation; older responses cannot overwrite a more recent result.
- `registrations`: a `byUser` map keyed by account ID. Registration snapshots remain available without refetching the API.
- `ui`: temporary notification and a persistent storage-failure warning.

Auth sessions and registrations persist through a store subscription. API results are fetched again when needed. Search filters are URL parameters rather than duplicated Redux state.

| Route         | Purpose                        | Access                             |
| ------------- | ------------------------------ | ---------------------------------- |
| `/`           | Redirect to discovery          | Public                             |
| `/events`     | Search and browse              | Public                             |
| `/events/:id` | Event details and registration | Public; login required to register |
| `/login`      | Log in                         | Guests                             |
| `/register`   | Create account                 | Guests                             |
| `/my-events`  | Personal registrations         | Protected                          |
| Other paths   | Helpful 404 screen             | Public                             |

## Ticketmaster integration

Requests use the documented Discovery API root `https://app.ticketmaster.com/discovery/v2`:

- `GET /events.json` for event search.
- `GET /events/{id}.json` for full details.
- `apikey`, `keyword`, `city`, `countryCode`, `classificationName`, `startDateTime`, `endDateTime`, `sort`, `size` and `page` are applied as appropriate.

Dates submitted in the filter are UTC boundaries; displayed event times are local to the venue and labelled with its timezone when available. Results use 12 items per page. Pagination respects Ticketmaster's first-1,000-results browsing window; narrow the filters to explore more specific results. Filters are submitted explicitly to avoid sending a request for every keystroke.

The adapter tolerates missing images, venue details, prices and dates. Network failures, timeouts, invalid keys, removed events and rate limits have readable feedback. Check official listings for current availability: stored registrations are snapshots and are not live ticket inventory.

## Persistence and security scope

This is the frontend authentication simulation requested by the assignment, not a production identity service. Data belongs to the current browser profile and origin and can be edited by its owner. Clearing site storage removes accounts and registrations. Other browsers and devices do not share the data. Concurrent editing across multiple tabs is not synchronized.

Demo passwords are salted and derived using PBKDF2-SHA-256 (100,000 iterations) through Web Crypto instead of being stored as plaintext. This does **not** turn local authentication into real access control. Use a demo password and avoid sensitive personal information.

`.env` and environment variants are ignored by Git; `.env.example` is deliberately blank. Vite's `VITE_` values are embedded into the browser build and visible in network requests. Environment variables keep your key out of the source repository, but a frontend API key cannot be secret from app visitors. A production service should apply suitable key restrictions and use a backend where needed.

## GitHub submission

The assignment asks for **only your accessible GitHub repository URL**. It does not require public hosting. Keep the full Git history when uploading; do not create a new repository containing only a single ZIP upload.

If using an exported project ZIP, enable viewing hidden files and preserve the included `.git` directory. From this project folder, create an **empty** repository on GitHub, then run (replace YOUR_USERNAME with your actual username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/event-management-system.git
git push -u origin main
```

If the remote already exists, use `git remote set-url origin ...` instead. Do not initialize the remote with another README. Verify the repository's source and commit history on GitHub. If private, give the instructor access using their actual GitHub username; otherwise make it public only when you intend to share the source.

No API key, account password, `node_modules/` or `dist/` should be uploaded. Git commits in this project record the actual implementation stages; they are not backdated. Review and understand the implementation before submitting it under your course's assistance rules.

## References

- [React documentation](https://react.dev/learn)
- [Redux Toolkit configureStore](https://redux-toolkit.js.org/api/configureStore)
- [React Router declarative routing](https://reactrouter.com/start/declarative/routing)
- [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)

The UI and application structure are custom to this project. Google Fonts serves DM Sans and Manrope with local sans-serif fallbacks. Interface icons use Lucide; event imagery comes from Ticketmaster API results.

## Hosted evaluation demo

The hosted Vercel build uses `VITE_TICKETMASTER_PROXY=true` and stores the key under server-only `TICKETMASTER_API_KEY`. The narrow `/api/ticketmaster` GET endpoint forwards event search and detail requests, limits page size and permitted parameters, and caches successful results briefly. No authentication data is sent to this endpoint. Account authentication and registrations remain the assignment's browser-only simulation.

`vercel.json` routes client-side React Router URLs back to `index.html`, while preserving API endpoints. For local Vite development, the original `.env` Consumer Key setup continues to work. To run server endpoints locally, use Vercel's development server with the server environment variables configured.
