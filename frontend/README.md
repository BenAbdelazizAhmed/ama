# AMANAFARM Frontend

Angular frontend for the AMANAFARM platform — a marketplace for livestock, agricultural products, and farm services.

## Quick Start

```bash
npm install
npm run start     # http://localhost:4200
npm run build     # production build to dist/
```

## Architecture

```
src/
├── app/
│   ├── components/   # page components (home, animals, products, services, etc.)
│   ├── services/     # state.service.ts (auth state, token, cart)
│   └── app.component.*  # root component (auth modal, navigation)
├── assets/
├── index.html        # Angular entry point
├── main.ts           # app bootstrap
└── styles.css        # global styles
```

## Backend

API runs at `http://localhost:8080`. See [AMANAFARMBACKEND](../AMANAFARMBACKEND) for the Spring Boot backend.
