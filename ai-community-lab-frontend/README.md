# AI Community Lab — Angular frontend

Angular **21** app for browsing AI tools, **anonymous** star ratings, **anonymous** text reviews (optional display name), category filtering, and a top-rated section.

## Run

```bash
npm install
npm start
```

- **Development** (`ng serve`): uses `src/environments/environment.development.ts` → API base `http://localhost:5080` (see `angular.json` → `configurations.development.fileReplacements`).
- **Production** (`ng build`): uses `environment.ts` with **`apiBaseUrl: ''`**, which enables the **in-browser mock** (`MockToolsStore`) so static hosting works without a backend.

## Services (HTTP + mock)

| Service | Role |
|---------|------|
| `CategoryService` | `GET /api/categories` |
| `ToolService` | Tools list (`?categoryId=`), detail, top-rated |
| `RatingService` | Average + submit star rating |
| `ReviewService` | Paginated reviews, submit review, upvote/downvote |

When `apiBaseUrl` is empty, these services short-circuit to `MockToolsStore` (no HTTP).

## Netlify

Set the site **Base directory** to `ai-community-lab-frontend`. See `netlify.toml`.

To point production at a real API, replace `environment.ts` at build time (e.g. CI env → `sed` or a small script) so `apiBaseUrl` is your API origin (no trailing slash).

## UI refinements (landing + shared components)

Recent polish focused on **visual consistency with Angular Material system tokens** (`--mat-sys-*`) instead of ad hoc Tailwind slate colors in the top-rated and category-filter blocks, **clearer hover/focus states** in the header and hero CTAs, **single-level card hover** on featured tools (removed duplicate motion on the grid wrapper), and **accessible** star ratings (`aria-hidden` on decorative icons) plus removal of spurious `tabindex` on non-interactive “How it works” steps.

The **early-access form** uses template validation with `mat-error` for empty/invalid email; successful submit clears the field. The **header logo** asset was resized (large PNG replaced with a ~640px max-edge version) to cut transfer size while keeping the same CSS display size.

## UX notes (anonymous phase)

- **No login** — header has navigation only.
- **Reviews** have **no star field** in the database; only **tool-level** anonymous ratings are stored in `Ratings`.
- Tool URLs use **UUIDs** from the API (e.g. `/tools/a1000001-0000-4000-8000-000000000003` for seeded CodePilot).

## Tests

```bash
npm test
```
