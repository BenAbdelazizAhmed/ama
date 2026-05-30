# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AmanaFarm** is a marketplace platform for the agricultural sector in Tunisia, connecting buyers and sellers of livestock, agricultural products, services, and wholesale items.

## Commands

### Quick Start (Windows)
```powershell
# Start backend only
.\start.ps1

# Start backend + frontend
.\start.ps1 -Frontend
```
The script auto-kills any process on port 8081, builds the backend JAR if missing, then launches both servers.

### Frontend (`frontend/`)
```bash
npm install
npm start          # dev server on http://localhost:4200
npm run build      # production build → dist/amana-exact-angular/
```

### Backend (`backend/`)
```bash
./mvnw.cmd spring-boot:run      # Windows, runs on http://localhost:8080
./mvnw spring-boot:run          # Linux/Mac
./mvnw.cmd clean package -DskipTests   # Build JAR only
./mvnw.cmd test                  # Run tests
```

## Architecture

Two-tier app: Angular 18 SPA → Spring Boot REST API → MySQL 8.

### Frontend (`frontend/src/app/`)

Standalone component architecture (no NgModules). Key patterns:
- **State management**: Angular signals in `services/state.service.ts` (cart, auth state)
- **Auth flow**: `core/` contains the JWT interceptor that attaches `Authorization: Bearer` headers to every outgoing request. Auth modal lives in `app.component.ts`.
- **Routing**: Lazy-loaded routes in `app.routes.ts`
- **API base URL**: Configured per-environment in `src/environments/`. Dev points to `https://amanafarm.tn/api`; to run against local backend, change `apiBaseUrl` in `environment.ts` to `http://localhost:8080/api`.

### Backend (`backend/src/main/java/com/example/amanafarm_backend/`)

Standard Spring Boot layered architecture: `controller/ → service/ → repository/ → model/`

- **Security**: `config/SecurityConfig.java` + `config/JwtAuthenticationFilter.java`. JWT secret and 24h expiry are in `application.properties`. CORS allows `localhost:*`, `127.0.0.1:*`, and `amanafarm.tn`.
- **Entities**: `Animal`, `Product`, `Worker`, `ServiceRequest`, `JobOffer`, `ProfessionalProfile`, `WholesaleItem`, `User`. All use JPA with Hibernate auto-DDL.
- **Seed data**: `config/DemoListingSeeder.java` seeds sample listings on startup.
- **Auth endpoints**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/social`

### Database

MySQL 8 on `localhost:3306/amanafarm_db`. Credentials in `backend/src/main/resources/application.properties`. Hibernate manages schema with `ddl-auto=update`.

## Key Conventions

- Backend uses **Lombok** — don't manually write getters/setters/constructors on entities; use `@Data`, `@Builder`, etc.
- Frontend components are **standalone** — always add `imports: []` in `@Component` instead of declaring in a module.
- The `src/` directory at the repo root contains legacy static HTML files and is **not** part of the current application.
