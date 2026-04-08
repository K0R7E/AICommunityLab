# AI Community Lab — full stack (anonymous MVP)

This repository contains:

- **`ai-community-lab-frontend/`** — Angular 21 SPA (Netlify). Ratings, reviews, categories, and tool listings work **without login**. With `apiBaseUrl` empty (production build default), the UI uses an in-browser **mock** store.
- **`ai-community-lab-backend/`** — ASP.NET Core 8 Web API + EF Core + PostgreSQL. **No authentication** in this phase: all ratings and reviews are anonymous.
- **`database_schema.sql`** (repo root) — same DDL as in the backend folder; use it to create tables in PostgreSQL.

## Prerequisites

- **Frontend:** Node.js 20+, npm.
- **Backend:** [.NET 8 SDK](https://dotnet.microsoft.com/download), PostgreSQL 14+ (recommended).

## Database setup

1. Create a database, e.g. `ai_community_lab`.
2. Apply the schema:

   ```bash
   psql -d ai_community_lab -f database_schema.sql
   ```

   Use `-U <role>` if your PostgreSQL user is not the default (on many Macs there is **no** `postgres` role — use your OS username or the role from `psql -d postgres -c '\du'`).

3. Optional sample rows (fixed tool UUIDs for stable URLs):

   ```bash
   psql -d ai_community_lab -f ai-community-lab-backend/seed_data.sql
   ```

**`role "postgres" does not exist`:** Your server has no user named `postgres`. Point `appsettings.json` → `Username=` at an existing superuser (often your Mac login name), or run `createuser -s postgres`, or set `ConnectionStrings__DefaultConnection` as in `ai-community-lab-backend/README.md`.

If you skip `seed_data.sql`, the API will still **seed categories and tools automatically** on first run **only when the `Categories` table is empty** (`SeedData` in the backend).

## Backend (local)

```bash
cd ai-community-lab-backend
# Edit appsettings.json → ConnectionStrings:DefaultConnection if needed
dotnet restore
dotnet run --launch-profile http
```

- HTTP: `http://localhost:5080`
- Swagger UI (Development): `http://localhost:5080/swagger`

CORS allows `http://localhost:4200` and `https://aicommunitylab.netlify.app`.

## Frontend (local)

```bash
cd ai-community-lab-frontend
npm install
npm start
```

The **development** build replaces `environment.ts` with `environment.development.ts`, which points `apiBaseUrl` at `http://localhost:5080`. Production / `ng build` uses an **empty** `apiBaseUrl` so the SPA can use **relative** `/api/...` (Docker nginx) or the in-browser mock on Netlify.

## Docker (full stack locally)

```bash
docker compose up --build
```

- UI: **http://localhost:8080** (nginx → API `/api/*`)
- API / Swagger: **http://localhost:5080/swagger**
- Postgres: **localhost:5432** (`postgres` / `postgres`, DB `ai_community_lab`)

See **[DOCKER.md](./DOCKER.md)** for image details, volumes, and how this relates to Netlify.

## Netlify

Netlify only hosts the **static Angular build**. It does **not** run Docker Compose, PostgreSQL, or the .NET API.

1. **Base directory:** `ai-community-lab-frontend`
2. **Build:** `npm run build:netlify` (in `netlify.toml`) runs `scripts/netlify-env.cjs` then `ng build`
3. **Environment variable:** `NETLIFY_API_BASE_URL` = public API origin, **no** trailing slash (e.g. `https://api.example.com`). If unset, the site keeps the **mock** API.
4. Host the API + database elsewhere (VPS + `docker compose`, Railway, Fly.io, Render, etc.) and add your Netlify URL(s) to the API **`Cors:AllowedOrigins`** env/config.

Full walkthrough: **[DOCKER.md](./DOCKER.md)**.

## API summary

| Area | Endpoints |
|------|-----------|
| Categories | `GET /api/categories` |
| Tools | `GET /api/tools?categoryId=` · `GET /api/tools/{id}` · `GET /api/tools/top-rated?timeframe=week&limit=5` |
| Ratings | `GET /api/tools/{toolId}/ratings/average` · `POST /api/tools/{toolId}/ratings` `{ "stars": 1-5 }` |
| Reviews | `GET /api/tools/{toolId}/reviews?page=&pageSize=` · `POST /api/tools/{toolId}/reviews` `{ "authorName"?, "text" }` · `POST /api/reviews/{id}/upvote` · `POST /api/reviews/{id}/downvote` |

Reviews do **not** store star ratings in the database (only the `Ratings` table does). Tool list/detail DTOs expose **`averageRating`** / **`ratingCount`** computed from `Ratings`.

## Anonymous behaviour

There is **no user table** and **no login**. Anyone can submit star ratings, text reviews, and helpful votes. In production you may want rate limiting, CAPTCHA, or moderation — not included in this phase.

More detail: `ai-community-lab-backend/README.md` and `ai-community-lab-frontend/README.md`.
