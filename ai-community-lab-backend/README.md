# AI Community Lab — ASP.NET Core API

.NET 8 Web API using **Entity Framework Core** and **PostgreSQL** (Npgsql). This phase is **fully anonymous**: no JWT, cookies, or user records.

## Setup

1. Install PostgreSQL and create a database.
2. Run `database_schema.sql` (in this folder or the repo root) against that database.
3. Set `ConnectionStrings:DefaultConnection` in `appsettings.json` (or user secrets / env vars). The placeholder uses `Username=postgres`; **on macOS (Homebrew / Postgres.app) the superuser is often your macOS login name**, not `postgres`. If you see **`role "postgres" does not exist`**, either:
   - set `Username` (and `Password`) to match a real role: `psql -d postgres -c '\du'`, or  
   - create that role: `createuser -s postgres`, or  
   - override without editing files:  
     `export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=ai_community_lab;Username=YOUR_MAC_LOGIN;Password="`
4. From this directory:

   ```bash
   dotnet restore
   dotnet run --launch-profile http
   ```

5. Open Swagger at `http://localhost:5080/swagger` (Development only).

## Optional SQL seed

`seed_data.sql` inserts categories, tools (with **stable UUIDs**), sample ratings, and reviews. Use it if you do not rely on C# `SeedData` (which runs only when `Categories` is empty).

## CORS

Configured in `Program.cs` for:

- `http://localhost:4200`
- `https://aicommunitylab.netlify.app`

Add more origins as needed.

## Project layout

| Path | Purpose |
|------|---------|
| `Models/` | EF entities (`Category`, `Tool`, `Rating`, `Review`) |
| `Data/` | `ApplicationDbContext`, `SeedData` |
| `DTOs/` | API contracts |
| `Services/` | Business logic |
| `Controllers/` | HTTP endpoints |

## NuGet packages

- `Npgsql.EntityFrameworkCore.PostgreSQL`
- `Microsoft.EntityFrameworkCore.Design` (design-time)
- `Swashbuckle.AspNetCore`

To add EF migrations later (optional):

```bash
dotnet tool install --global dotnet-ef
dotnet ef migrations add Initial -o Data/Migrations
dotnet ef database update
```

If you manage schema only with SQL scripts, skip migrations and keep the database in sync with the entities manually.
