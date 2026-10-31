# AMANAFARM marketplace redesign

The Angular/Spring application now uses a consistent marketplace interface across animals, agricultural products, wholesale, services, jobs and animal transport. Search takes priority over the promotional content. Photo cards, category navigation, filters, saved listings, account pages and detail pages share the same forest-green identity and responsive layout. All active marketplace routes request real backend records; empty responses remain empty.

Design references: the search/filter hierarchy of [Airbnb](https://www.airbnb.com/help/article/3740), listing clarity on [Leboncoin](https://www.leboncoin.fr/c/animaux), and route-based discovery on [BlaBlaCar](https://www.blablacar.fr/carpool). These inform interaction patterns; AMANAFARM retains its own branding, Arabic RTL content and Tunisian market conventions.

## Implemented journeys

| Area | Behavior |
| --- | --- |
| Home | Choose a market, search by text/governorate, open actual recent listings |
| Catalogs | Search, categories, region, price interval, availability, sorting, pagination, grid/list view; filters persist in the URL |
| Listings | Publish, edit and delete owned records; upload photos; real API validation; loading, empty, retry and failure states |
| Details | Gallery and lightbox, share link, direct phone/WhatsApp contact, related records and transport link |
| Favorites | Account-backed favorites for all five catalog types; guest intent resumes after login |
| Account | Own listings, upcoming own trips, saved listings, profile editing and current-password-verified password change |
| Transport | Origin/destination, date, animal and accompaniment filtering; signed-in publishing; direct contact; owner-only deletion |
| Help | Searchable FAQ, support contact, about and legal pages |

There is no online payment, booking or automatic capacity reservation. Transport prices are TND per animal, with departure times explicitly local to Tunisia (`Africa/Tunis`). Owners remove trips that are no longer available. Password recovery currently directs users to support; it does not pretend to send a reset email. Social sign-in remains dependent on the existing provider configuration. No fake reviews, listings, visitor totals or verification claims are added.

## Backend and data

New private endpoints are `/api/favorites`, `/api/users/me`, `/api/users/me/password` and POST `/api/media`. Public listing endpoints remain `/api/animals`, `/api/products`, `/api/wholesale`, `/api/workers`, `/api/jobs` and `/api/trips`. Owner identity is derived from the authenticated account; another user's update/delete returns 403. Missing listings return 404. Client-supplied owner IDs, ratings and verification flags cannot establish ownership or trust.

Media accepts JPEG, PNG and WebP with signature checks, up to six files and 5 MB per file. The animal form supports six images; the other catalog forms support one. Upload filenames are generated on the server; uploaded files are served under `/uploads/`. Configure `app.upload.dir` to persistent storage and retain that directory across releases. Interrupted publication can leave uploaded files that have not yet been attached to a listing; automatic orphan cleanup is not implemented.

Deploy frontend and backend together against the existing MySQL service. The existing Hibernate `ddl-auto=update` setting creates the favorites and transport tables and adds the owner/profile/listing fields. Back up the database before rollout and confirm the schema changes against the deployment database. Existing listings without owner IDs stay public and cannot be claimed or edited by arbitrary users.

## Run and verify

Use the repository's configured MySQL/environment settings, then:

```bash
cd backend
./mvnw spring-boot:run
```

```bash
cd frontend
npm ci
npm start
```

Checks:

```bash
cd frontend
NG_CLI_ANALYTICS=false npm run build
npm run test:frontend
```

```bash
cd backend
./mvnw test
```

Completed: Angular production build, 26 frontend behavior tests and 26 backend tests. The frontend suite executes actual TypeScript behavior with controlled HTTP responses; Angular's build checks templates. The backend suite includes 12 Spring MockMvc/JPA integration tests using H2, plus transport, validation and context tests. It covers account privacy, ownership, publication/edit/deletion, favorites persistence, file validation/serving, profile updates and password verification.

Browser visual/mobile interaction checks and integration with the deployed MySQL instance remain pending because those environments were unavailable here. Before production rollout, verify desktop/mobile layouts and the complete register/login, upload, favorites, edit/delete and transport journeys against the running deployment. The changes are delivered on the existing feature branch and draft PR; they have not been merged or deployed.

## Structure

The routed catalogs, detail views, account, info pages and shared form/cards live under `frontend/src/app/features/marketplace`. Their shared stylesheet is registered once in `angular.json`. Home and transport retain dedicated component styles. Shared shell styling lives in `frontend/src/farm-theme.css`. Legacy feature files remain for compatibility but the router uses the new marketplace views. The shared icon component contains local SVG paths; the Lucide CDN script is no longer needed.
