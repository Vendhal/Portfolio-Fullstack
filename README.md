# Full-Stack Portfolio (React + Spring Boot + MySQL)![CI](https://github.com/Vendhal/Portfolio-Fullstack/actions/workflows/ci.yml/badge.svg)

A modern, interactive portfolio for a 3-member team. Frontend in React, backend in Spring Boot, MySQL database, containerized with Docker Compose, and CI with GitHub Actions. Optional: Deploy frontend to GitHub Pages, backend via Docker Compose on a server.

## Features
- React SPA with sections: Team, Projects, Contact
- REST API: `/api/team`, `/api/projects`, `/api/contact`
- MySQL persistence with Spring Data JPA
- Docker Compose for local full-stack run
- CI for build (frontend + backend)
- GitHub Pages workflow for frontend

## Repo Structure
- `frontend/`: React (Vite) app
- `backend/`: Spring Boot app
- `db/`: SQL and data seed helpers (optional)
- `.github/workflows/`: CI and deploy workflows
- `docker-compose.yml`: Local full-stack orchestration

## Quick Start (Local Dev)

Prereqs: Node 18+, Java 17, Maven, Docker + Docker Compose.

1) Start DB + Backend + Frontend with Compose:

- Copy `.env.example` to `.env` and adjust if needed
- Run: `docker compose up --build`
- Open: `http://localhost:3000`

2) Run services separately (dev mode):

- Backend: update `backend/src/main/resources/application.properties` to point to your local MySQL, then:
  - `cd backend`
  - `./mvnw spring-boot:run` (or `mvn spring-boot:run` if Maven installed)
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

## Environment Variables
See `.env.example` for common variables used by Docker Compose:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`
- `BACKEND_PORT`, `FRONTEND_PORT`
- `SPRING_PROFILES_ACTIVE`
- `VITE_API_BASE_URL` (optional; baked into the frontend during build)

## GitHub Pages (Frontend)
- The workflow at `.github/workflows/deploy-frontend.yml` builds `frontend` and publishes static files to GitHub Pages.
- Set `VITE_API_BASE_URL` (e.g., to your public backend URL) as a repo variable/secret to allow the static site to call your live API.


## Endpoints
- `GET /api/team` – list team members
- `GET /api/projects` – list projects
- `POST /api/contact` – create a contact message

## Notes
- Sample seed data is auto-created at startup if tables are empty.
- CORS is enabled permissively for simplicity; tighten for production.
- You can swap MySQL with a managed DB; just adjust env vars.

## Backend Deployment (Docker Compose)

1. Copy `.env.example` to `.env` and update the values:
   - Choose secure values for `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD`.
   - Adjust `BACKEND_PORT`/`FRONTEND_PORT` if you cannot use 8080/80 on the host.
   - If the frontend will be accessed directly (without the built-in Nginx proxy), set `VITE_API_BASE_URL` to your public backend URL (e.g. `https://portfolio.example.com/api`).
2. Build and start the stack in production mode:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

   The override file enables restart policies, publishes ports, and (optionally) passes the API base URL into the frontend build.
3. After the containers report healthy, browse to `http://<your-host>` (or the domain pointing at the server). The frontend container proxies `/api/*` requests to the backend.
4. To roll out updates, pull the latest code and rerun the same command with `--build` (or `--pull` if you publish images to a registry). Compose will recreate only the services that changed.
5. Logs & maintenance:
   - `docker compose logs -f backend` to tail the Spring Boot service.
   - `docker compose exec db mysql -u$DB_USER -p$DB_PASSWORD $DB_NAME` for manual DB access.
   - Data is persisted in the `db_data` volume; remove it intentionally with `docker volume rm` if you want a clean seed.
Continuous Integration:
The GitHub Actions workflow in .github/workflows/ci.yml runs on every push and pull request to main.\nIt builds the Spring Boot backend with Maven (including tests) and compiles the Vite frontend to catch regressions before deploys.
