# AMANAFARM agent notes

Use this repo for two apps: Angular frontend in [frontend](frontend) and Spring Boot backend in [backend](backend).

## Quick start

- Frontend (from [frontend](frontend)): `npm install`, `npm run start`, `npm run build`
- Backend (from [backend](backend)): `mvn spring-boot:run`, `mvn test`

## Architecture map

- Frontend entry: [frontend/src/main.ts](frontend/src/main.ts) and [frontend/src/index.html](frontend/src/index.html)
- Frontend config: [frontend/angular.json](frontend/angular.json)
- Backend packages: controller, service, repository, model, dto, auth, config under [backend/src/main/java/com/example/amanafarm_backend](backend/src/main/java/com/example/amanafarm_backend)

## Runtime config

- Backend port: 8080
- Database: MySQL at jdbc:mysql://localhost:3306/amanafarm_db (see [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties))

## References

- Repo README: [README.md](README.md)
- Angular README: [frontend/README.md](frontend/README.md)
- Angular config: [frontend/angular.json](frontend/angular.json)
- Backend config: [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties)
- Maven config: [backend/pom.xml](backend/pom.xml)
