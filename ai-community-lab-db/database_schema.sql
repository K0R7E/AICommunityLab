-- AI Community Lab — PostgreSQL schema (copy of ai-community-lab-backend/database_schema.sql)
-- Anonymous ratings & reviews; no users table in this phase.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "Categories" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE "Tools" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(255) NOT NULL UNIQUE,
    "Description" TEXT NOT NULL,
    "UseCases" TEXT[] NULL,
    "Pricing" VARCHAR(255) NULL,
    "CategoryId" INT NOT NULL REFERENCES "Categories" ("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Ratings" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ToolId" UUID NOT NULL REFERENCES "Tools" ("Id") ON DELETE CASCADE,
    "Stars" INT NOT NULL CHECK ("Stars" >= 1 AND "Stars" <= 5),
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "IX_Ratings_ToolId" ON "Ratings" ("ToolId");
CREATE INDEX "IX_Ratings_CreatedAt" ON "Ratings" ("CreatedAt");

CREATE TABLE "Reviews" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ToolId" UUID NOT NULL REFERENCES "Tools" ("Id") ON DELETE CASCADE,
    "AuthorName" VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
    "Text" TEXT NOT NULL,
    "Upvotes" INT NOT NULL DEFAULT 0,
    "Downvotes" INT NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "IX_Reviews_ToolId" ON "Reviews" ("ToolId");
CREATE INDEX "IX_Reviews_CreatedAt" ON "Reviews" ("CreatedAt");
