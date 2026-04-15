# AICommunityLab (Next.js)

Dark, three-column UI: feed in the center, navigation on the left, trending and CTAs on the right. **Supabase** provides Postgres, RLS, and Google OAuth.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server ([http://localhost:3000](http://localhost:3000)) |
| `npm run build` | Production build |
| `npm start` | Run production server (after `build`) |
| `npm run lint` | ESLint |

## Configuration

Copy `.env.example` to `.env.local` and set Supabase URL and anon key. Required for auth and data.

## Docker

Multi-stage `Dockerfile` produces a **standalone** Node server. Build with the same `NEXT_PUBLIC_*` args as documented in the repo root `README.md` and `DOCKER.md`.
