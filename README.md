# AICommunityLab — community AI tool discovery (MVP)

A **Next.js** app (App Router) with **Supabase** (PostgreSQL + Auth). Users discover tools in a feed, submit links, **upvote** (one per user per post), and **comment**. **Google sign-in** is required to post, vote, and comment.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Lucide React |
| Data + Auth | Supabase (Postgres, Row Level Security, Google OAuth) |
| Hosting (recommended) | [Vercel](https://vercel.com) for the app; Supabase Cloud for DB/auth |

## Prerequisites

- **Node.js 20+** and npm
- A **Supabase** project

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL:** run the migrations in order:
   - [`supabase/migrations/001_all_in_one.sql`](supabase/migrations/001_all_in_one.sql)
   - [`supabase/migrations/002_security_hardening.sql`](supabase/migrations/002_security_hardening.sql)
3. **Auth → Providers:** enable **Google** and configure the Google Cloud OAuth client (authorized redirect URIs must include your Supabase callback URL from the dashboard).
4. **Project Settings → API:** copy **Project URL** and **anon public** key.

## Local development

```bash
cd ai-community-lab-frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

See [`ai-community-lab-frontend/.env.example`](ai-community-lab-frontend/.env.example).

## Vercel

1. Import the repo; set **Root Directory** to `ai-community-lab-frontend` (or deploy from repo root with that subdirectory in Vercel project settings).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In Supabase **Authentication → URL configuration**, add your Vercel production URL (and preview URLs if needed) to **Redirect URLs** / **Site URL** as documented by Supabase.

## Optional Docker

See [DOCKER.md](./DOCKER.md). `docker compose up` builds only the Next.js app; Supabase stays external.

## Repository layout

- [`ai-community-lab-frontend/`](ai-community-lab-frontend/) — Next.js application
- [`supabase/migrations/`](supabase/migrations/) — SQL schema (posts, comments, votes, RLS, triggers)
- [`security/`](security/) — scan reports and infrastructure hardening runbook

## Security operations

- Application hardening details are documented in [`ai-community-lab-frontend/README.md`](ai-community-lab-frontend/README.md).
- Infrastructure/security operations checklist is in [`security/INFRA_HARDENING_RUNBOOK.md`](security/INFRA_HARDENING_RUNBOOK.md).
- After every major release, re-run website/API/network scans and compare findings with the previous baseline.

## Legacy

The previous Angular + ASP.NET + local Postgres stack has been **removed** in favor of this Supabase-backed MVP.
