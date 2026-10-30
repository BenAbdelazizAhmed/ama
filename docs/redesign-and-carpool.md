# AMANAFARM redesign and animal transport

The home page now puts marketplace search, the four main categories and recent listings first. A warm ivory / olive palette, simpler navigation, restrained cards and responsive layouts connect the existing animals, products, services and wholesale pages. The existing Angular/Spring architecture and authentication flow are retained.

The new `/carpool` page supports:

- Published transport offers for all 24 Tunisian governorates.
- Origin, destination, date, animal type and accompaniment filters; time / price sorting.
- Signed-in publishing, client and server validation, and persistent MySQL storage.
- A detail dialog, direct telephone / WhatsApp contact and owner-only deletion.
- Loading, empty, retry and failed-submission states, keyboard focus trapping and Escape dismissal.
- Entry points in desktop navigation, mobile navigation, the home page and animal detail pages.

## Run locally

Start the existing MySQL database and backend as documented in the repository README. Hibernate's existing `ddl-auto=update` setting creates the new `carpool_trips` table. No old tables or data are removed. Deploy the updated backend alongside the frontend before using transport publishing.

```bash
cd backend
./mvnw spring-boot:run
```

```bash
cd frontend
npm ci
npm start
```

Visit `http://localhost:4200/carpool`. Trips start empty; no demonstration offers, ratings or verified-driver claims are inserted.

## API

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/trips` | Public | Upcoming offers ordered by departure |
| POST | `/api/trips` | Signed in | Validate and create; owner identity comes from the session |
| DELETE | `/api/trips/{id}` | Owner | Delete own offer; another user's offer returns 403 |

Departure values are local Tunis times (`Africa/Tunis`); the form labels this explicitly. Price is in TND per animal. The capacity is the driver's advertised capacity; this is a direct-contact listing service with no online booking, payment or automatic seat reservation. Owners can remove offers that are no longer available.

## Validation

```bash
cd frontend
npm run build
npm run test:frontend
```

```bash
cd backend
./mvnw -Dtest=CarpoolTripServiceTest,TripRequestTest test
```

Completed here: Angular production build; 13 frontend behavior tests; 8 backend service tests; 5 request-validation tests. The backend was compiled with these tests. The frontend tests exercise actual component behavior with HTTP stubs, not a live browser. Browser screenshots and a live MySQL integration test could not be completed in the execution environment. Check the desktop/mobile layout and publish a trip with the running backend before production rollout.

## Styling

The new home and transport views have their own component styles. `frontend/src/farm-theme.css` is loaded after the legacy stylesheet to restyle shared navigation, footer and existing marketplace pages without deleting the legacy modal/form rules. Its scoped overrides are a compatibility layer; a subsequent cleanup can remove redundant legacy declarations page by page.

## Frontend refinement

The shared shell, home page and transport view use a restrained forest-green identity, a typographic wordmark, locally bundled SVG icons, consistent cards and field styling, and responsive layouts. Header, footer, marketplace headings, auth dialogs and animal detail links share the same theme.

The hero uses responsive WebP images (212 KB desktop / 66 KB small) instead of the original 2.7 MB PNG. Marketplace loading skeletons, recoverable error states and partial-failure notices are backed by real request status. Homepage search terms are applied when opening animals, products or services. Four additional frontend behavior tests cover loading, empty responses, partial failures, cached offers and retry recovery.
