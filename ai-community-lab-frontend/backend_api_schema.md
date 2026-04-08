# AI Community Lab — Backend API notes (reference)

The **implemented** API lives in `../ai-community-lab-backend/` (ASP.NET Core 8 + PostgreSQL). SQL DDL is in `../database_schema.sql` and `../ai-community-lab-backend/database_schema.sql`.

The Angular app uses **`CategoryService`**, **`ToolService`**, **`RatingService`**, and **`ReviewService`** (with an **in-browser mock** when `apiBaseUrl` is empty).

---

Below is the earlier conceptual spec (partially superseded by the real implementation — e.g. reviews have no per-review stars; tools use integer `categoryId` and UUID ids).

This document describes a **proposed** backend for the AI Community Lab platform. The Angular frontend is designed against these contracts; it ships with an **in-browser mock** when `environment.apiBaseUrl` is empty.

---

## 1. REST API Endpoints

Unless noted, JSON request/response bodies use `application/json`. Authenticated routes expect:

`Authorization: Bearer <access_token>`

### 1.1 Tools

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tools` | List tools. Optional query: `category` (category **name**, e.g. `Development`). |
| `GET` | `/api/tools/:toolId` | Single tool detail (includes category name, use cases, pricing). |
| `GET` | `/api/tools/top-rated` | Top-rated tools. Query: `timeframe` (`week` \| `month` \| …), optional `limit` (default 5). |

**Example list response item** (aligned with frontend `AiToolListItem`):

```json
{
  "id": "code-pilot",
  "name": "CodePilot",
  "description": "…",
  "use_cases": ["Refactors", "Tests"],
  "pricing": "Subscription",
  "category_id": "development",
  "category_name": "Development",
  "rating": 4.8,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

### 1.2 Ratings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tools/:toolId/ratings/average` | Average star rating (1–5) and total count. |
| `POST` | `/api/tools/:toolId/ratings` | Body: `{ "stars": 1–5 }`. **Auth required.** Upsert per user per tool. |

**Average response:**

```json
{ "average": 4.6, "count": 128 }
```

### 1.3 Reviews

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tools/:toolId/reviews` | Paginated reviews. Query: `page` (1-based), `pageSize`. |
| `POST` | `/api/tools/:toolId/reviews` | Body: `{ "stars": 1–5, "text": "…" }`. **Auth required.** |
| `POST` | `/api/reviews/:reviewId/upvote` | **Auth required.** Increment helpful count (see integrity notes). |
| `POST` | `/api/reviews/:reviewId/downvote` | **Auth required.** |

**Paginated reviews response:**

```json
{
  "items": [
    {
      "id": "rev-1",
      "tool_id": "code-pilot",
      "reviewer_name": "Jordan M.",
      "stars": 5,
      "text": "…",
      "created_at": "2026-04-01T12:00:00.000Z",
      "upvotes": 12,
      "downvotes": 1
    }
  ],
  "page": 1,
  "pageSize": 5,
  "total": 42,
  "hasMore": true
}
```

**Vote response** (minimal shape used by the frontend):

```json
{ "id": "rev-1", "upvotes": 13, "downvotes": 1 }
```

**Integrity notes (production):**

- Enforce **one rating per user per tool** on `POST …/ratings`.
- For votes, prefer a `review_votes` table with unique `(user_id, review_id)` to prevent repeated clicks; the MVP mock increments naïvely.

### 1.4 Categories

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/categories` | List categories `{ "id", "name" }[]`. |

---

## 2. Relational Database Schema (Proposed)

### 2.1 `categories`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID or text PK | Slug, e.g. `development` |
| `name` | text | Display name, e.g. `Development` |

### 2.2 `tools`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID or text PK | Stable public id (slug) |
| `name` | text | |
| `description` | text | |
| `use_cases` | JSONB or text[] | List of strings |
| `pricing` | text | Free-form label |
| `category_id` | FK → `categories.id` | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 2.3 `users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `username` | text | Unique |
| `email` | text | Unique |
| `password_hash` | text | Or delegate auth to IdP |
| `created_at` | timestamptz | |

### 2.4 `ratings`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `tool_id` | FK → `tools.id` | |
| `user_id` | FK → `users.id` | |
| `stars` | smallint | 1–5, check constraint |
| `created_at` | timestamptz | |

Unique constraint: `(tool_id, user_id)`.

### 2.5 `reviews`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `tool_id` | FK → `tools.id` | |
| `user_id` | FK → `users.id` | |
| `rating_id` | FK → `ratings.id`, nullable | Optional link if review stars mirror a stored rating row |
| `text` | text | |
| `upvotes` | int | Denormalized counter, updated transactionally |
| `downvotes` | int | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 2.6 `review_votes` (recommended)

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID PK | |
| `review_id` | FK → `reviews.id` | |
| `user_id` | FK → `users.id` | |
| `value` | smallint | +1 up, −1 down |

Unique `(review_id, user_id)`; recompute or maintain counters on `reviews`.

---

## 3. CORS & Hosting

The production site is a **static SPA** (e.g. Netlify). The API must send appropriate **CORS** headers for the site origin and expose `Authorization` if preflighted.

---

## 4. Mapping to the Frontend

Configure `src/environments/environment.ts` → `apiBaseUrl` to the API origin (no trailing slash). The `ToolsApiService` will call the endpoints above and fall back to the mock store only when the base URL is empty or on transport/HTTP errors (when a base URL is set).
