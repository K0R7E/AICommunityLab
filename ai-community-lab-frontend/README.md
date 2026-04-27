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

## Security hardening notes

### Scan findings -> mitigation mapping

- Missing/weak CSP: tightened in `next.config.ts` by removing broad `script-src` allowances (`unsafe-eval`, wildcard https scripts) and reducing `connect-src` to only app + Supabase origins. Default rollout is `Content-Security-Policy-Report-Only` (`CSP_REPORT_ONLY=true`).
- Software/version disclosure: `next.config.ts` disables framework branding (`poweredByHeader: false`) and adds best-effort blanking of `Server`/`X-Powered-By` response headers.
- Missing security disclosure channel: `/.well-known/security.txt` is now generated from production-ready defaults in `src/app/.well-known/security.txt/route.ts`, with optional env overrides.
- Password submitted in URL (scanner false positive risk): login form in `src/components/auth/email-auth-form.tsx` now explicitly uses `method="post"` and still submits via Supabase SDK.
- Brute-force and enumeration surface: auth errors are now intentionally generic in the email auth form; short lockout remains for UX throttling.
- CSRF-style logout abuse: `/auth/sign-out` now rejects cross-site POST requests using `Origin` and `Sec-Fetch-Site` checks.
- Robots hygiene: `src/app/robots.ts` now disallows crawler indexing for `/admin`, `/settings`, and `/notifications`.

### Configurable security.txt fields

Set these in production if you need custom values:

- `SECURITY_TXT_CONTACT`
- `SECURITY_TXT_POLICY_URL`
- `SECURITY_TXT_ACKNOWLEDGMENTS_URL`
- `SECURITY_TXT_HIRING_URL`
- `SECURITY_TXT_LANGUAGES`

### Security validation checklist

Run after deployment:

```bash
# 1) Header checks (CSP + hardening headers)
curl -I https://aicommunitylab.com/
curl -I https://aicommunitylab.com/login
curl -I https://aicommunitylab.com/notifications

# 2) security.txt checks
curl https://aicommunitylab.com/.well-known/security.txt

# 3) robots hygiene
curl https://aicommunitylab.com/robots.txt
```

Expected outcomes:

- `Content-Security-Policy-Report-Only` (or `Content-Security-Policy` when `CSP_REPORT_ONLY=false`) is present and does not include `unsafe-eval`.
- `X-Frame-Options`, HSTS, and cross-origin hardening headers are present.
- `Server`/`X-Powered-By` are minimized at the app layer; any remaining values are controlled by hosting edge/proxy.
- `.well-known/security.txt` returns valid RFC 9116 style fields.
- `robots.txt` does not expose sensitive internals and disallows crawler indexing of protected app surfaces.

### Operational notes

- Client-side throttling is only one layer. Keep Supabase Auth rate limits and bot protections enabled.
- Some fingerprinting findings are platform-inherent on managed hosting; prioritize patching and minimizing optional metadata.

## Docker

Multi-stage `Dockerfile` produces a **standalone** Node server. Build with the same `NEXT_PUBLIC_*` args as documented in the repo root `README.md` and `DOCKER.md`.
