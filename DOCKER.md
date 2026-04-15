# Docker

## What runs where

| Piece | Docker Compose | Vercel |
|-------|----------------|--------|
| Next.js app | `web` service (optional) | **Yes** — serverless Next.js |
| Supabase (Postgres + Auth) | **No** — use [Supabase Cloud](https://supabase.com) | N/A |

The database and authentication live on **Supabase**. Docker only runs the **frontend** container if you want a self-hosted Node process instead of Vercel.

---

## Optional: Next.js only

From the **repository root**:

```bash
cp .env.example .env
# set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase → Project Settings → API
docker compose up --build
```

- **App:** open **[http://localhost:3000](http://localhost:3000)** in the browser — **not** `http://0.0.0.0:3000` (Safari blocks that URL, and Google OAuth would try to send you back there).

In **Supabase → Authentication → URL Configuration**, add **`http://localhost:3000/auth/callback`** (or `http://localhost:3000/**`) to **Redirect URLs** so OAuth can return to the app after sign-in.

`NEXT_PUBLIC_*` values are baked in at **image build time** (see `ai-community-lab-frontend/Dockerfile`).

---

## Production hosting

- **Recommended:** deploy the Next app to **Vercel** and set the same `NEXT_PUBLIC_*` environment variables in the Vercel project.
- Configure **Google OAuth** in the Supabase dashboard (Authentication → Providers) and add your production site URL / redirect URLs as required by Supabase and Google Cloud Console.

---

## Files

| File | Role |
|------|------|
| `docker-compose.yml` | Builds and runs `web` |
| `ai-community-lab-frontend/Dockerfile` | Multi-stage Next.js `standalone` image |
| `ai-community-lab-frontend/.dockerignore` | Smaller build context |
