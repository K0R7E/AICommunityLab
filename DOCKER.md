# Docker & Netlify

## What runs where

| Piece | Docker Compose | Netlify |
|-------|----------------|---------|
| PostgreSQL | `db` service | **No** — Netlify does not host databases |
| ASP.NET Core API | `api` service | **No** — Netlify is not a generic Docker host for long-running APIs |
| Angular SPA | `web` (nginx + static files + `/api` proxy) | **Yes** — static `dist/` only |

**Netlify** deploys the **built Angular app** (HTML/JS/CSS). It does **not** run `docker-compose` for your site. Run the API + Postgres on another platform (Fly.io, Railway, Render, Azure, AWS, a VPS, or `docker compose` on your own server), then point the Netlify build at that public API URL.

---

## Local full stack (Docker Compose)

From the **repository root**:

```bash
docker compose up --build
```

- **App (browser):** [http://localhost:8080](http://localhost:8080) — nginx serves the SPA and proxies `/api/*` to the API (Angular uses `apiBaseUrl: ''`, so requests go to `/api/...` on the same host).
- **API direct (Swagger):** [http://localhost:5080/swagger](http://localhost:5080/swagger)
- **PostgreSQL:** `localhost:5432`, user `postgres`, password `postgres`, database `ai_community_lab`

On first start, Postgres runs `database_schema.sql` and `seed_data.sql` from `ai-community-lab-backend/`.

Stop and remove containers (keep DB volume):

```bash
docker compose down
```

Remove DB data as well:

```bash
docker compose down -v
```

---

## Individual images

**API only**

```bash
docker build -t ai-community-lab-api ./ai-community-lab-backend
docker run --rm -p 5080:8080 \
  -e ConnectionStrings__DefaultConnection="Host=host.docker.internal;Port=5432;Database=ai_community_lab;Username=postgres;Password=postgres" \
  ai-community-lab-api
```

**Frontend only** (expects API at same origin `/api` or configure a different nginx)

```bash
docker build -t ai-community-lab-web ./ai-community-lab-frontend
docker run --rm -p 8080:80 ai-community-lab-web
```

---

## Netlify setup

### 1. Deploy the API (not on Netlify)

Build and run the **API** (and Postgres) where long-lived containers are supported, for example:

- Same `docker compose` on a VPS
- **Fly.io**, **Railway**, **Render**, **Azure Container Apps**, **Google Cloud Run** (API + managed Postgres)

Expose a public HTTPS origin, e.g. `https://api.yourdomain.com`.

On that API, set CORS so it allows your Netlify site origin. This repo’s API reads **`Cors:AllowedOrigins`** (semicolon-separated), e.g.:

```text
Cors__AllowedOrigins=https://aicommunitylab.netlify.app;https://YOUR_PREVIEW--SITE.netlify.app
```

Default `appsettings.json` already includes `https://aicommunitylab.netlify.app`; add preview URLs or your custom domain as needed.

### 2. Netlify site (frontend only)

1. Connect the repo to Netlify.
2. **Base directory:** `ai-community-lab-frontend`
3. **Build command:** `npm run build:netlify` (already in `netlify.toml`)
4. **Publish directory:** `dist/ai-community-lab/browser`
5. **Environment variable (optional):** `NETLIFY_API_BASE_URL` = your public API origin **without** a trailing slash, e.g. `https://api.yourdomain.com`

   - If **set:** `scripts/netlify-env.cjs` patches `environment.ts` so the SPA calls that API (CORS must allow the Netlify origin).
   - If **unset:** the build keeps `apiBaseUrl: ''` and the site uses the **in-browser mock** (works for demos without a backend).

6. **Redirects:** `netlify.toml` already sends `/*` → `index.html` for the Angular router.

### 3. What you cannot do on Netlify

- Run **docker-compose** as the live Netlify “host” for the API or Postgres.
- Expect **server-side .NET** to run on Netlify’s default static hosting (use an external API host as above).

---

## Files added for Docker

| File | Role |
|------|------|
| `docker-compose.yml` | `db`, `api`, `web` services |
| `ai-community-lab-backend/Dockerfile` | Multi-stage .NET 8 publish |
| `ai-community-lab-backend/.dockerignore` | Faster builds |
| `ai-community-lab-frontend/Dockerfile` | `ng build` + nginx |
| `ai-community-lab-frontend/nginx.conf` | SPA + `/api/` → API |
| `ai-community-lab-frontend/scripts/netlify-env.cjs` | Optional API URL for Netlify builds |
