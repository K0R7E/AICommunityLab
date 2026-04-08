-- Optional seed data for local development (run after database_schema.sql)
-- Tool UUIDs are fixed so you can bookmark /tools/{id} during testing.

INSERT INTO "Categories" ("Name") VALUES
    ('Marketing'),
    ('Real Estate'),
    ('Development'),
    ('Productivity'),
    ('Creative'),
    ('Data'),
    ('Audio')
ON CONFLICT ("Name") DO NOTHING;

INSERT INTO "Tools" ("Id", "Name", "Description", "UseCases", "Pricing", "CategoryId")
VALUES
(
    'a1000001-0000-4000-8000-000000000001'::uuid,
    'ClarityWrite',
    'Long-form drafting with tone control and source-aware suggestions.',
    ARRAY['Blog posts', 'Reports', 'Documentation'],
    'Freemium',
    4
),
(
    'a1000001-0000-4000-8000-000000000002'::uuid,
    'VisionParse',
    'Extract tables and text from PDFs and scans with high accuracy.',
    ARRAY['Invoices', 'Research PDFs', 'Archives'],
    'Paid',
    4
),
(
    'a1000001-0000-4000-8000-000000000003'::uuid,
    'CodePilot',
    'Context-aware coding help inside your editor with repo awareness.',
    ARRAY['Refactors', 'Tests', 'Onboarding'],
    'Subscription',
    3
),
(
    'a1000001-0000-4000-8000-000000000004'::uuid,
    'VoiceFlow',
    'Natural voices and SSML controls for narration and accessibility.',
    ARRAY['Audiobooks', 'IVR', 'Accessibility'],
    'Usage-based',
    7
),
(
    'a1000001-0000-4000-8000-000000000005'::uuid,
    'DataMind',
    'Ask questions of spreadsheets and SQL without writing queries.',
    ARRAY['Analytics', 'Ops reporting', 'Ad-hoc questions'],
    'Team plans',
    6
),
(
    'a1000001-0000-4000-8000-000000000006'::uuid,
    'ImageCraft',
    'Generate and refine visuals with consistent brand-safe styles.',
    ARRAY['Social', 'Ads', 'Concept art'],
    'Credits',
    5
),
(
    'a1000001-0000-4000-8000-000000000007'::uuid,
    'CampaignPilot',
    'Multi-channel copy variants with guardrails and brand voice checks.',
    ARRAY['Paid social', 'Lifecycle email', 'Landing pages'],
    'Subscription',
    1
),
(
    'a1000001-0000-4000-8000-000000000008'::uuid,
    'EstateLens',
    'Property descriptions, comps summaries, and disclosure Q&A assistance.',
    ARRAY['Listings', 'Buyer packets', 'Brokerage ops'],
    'Per seat',
    2
)
ON CONFLICT ("Id") DO NOTHING;

-- Sample ratings (some within the last 7 days for top-rated endpoint)
-- Idempotent-ish: only add sample ratings if none exist yet
INSERT INTO "Ratings" ("ToolId", "Stars", "CreatedAt")
SELECT * FROM (VALUES
    ('a1000001-0000-4000-8000-000000000003'::uuid, 5, NOW() - INTERVAL '2 days'),
    ('a1000001-0000-4000-8000-000000000003'::uuid, 5, NOW() - INTERVAL '3 days'),
    ('a1000001-0000-4000-8000-000000000003'::uuid, 4, NOW() - INTERVAL '5 days'),
    ('a1000001-0000-4000-8000-000000000006'::uuid, 5, NOW() - INTERVAL '1 day'),
    ('a1000001-0000-4000-8000-000000000005'::uuid, 4, NOW() - INTERVAL '4 days')
) AS v("ToolId", "Stars", "CreatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "Ratings" LIMIT 1);

INSERT INTO "Reviews" ("ToolId", "AuthorName", "Text", "Upvotes", "Downvotes")
SELECT * FROM (VALUES
    (
        'a1000001-0000-4000-8000-000000000003'::uuid,
        'Jordan M.',
        'Repo-aware suggestions actually match our stack. Saved hours on refactors.',
        12,
        1
    ),
    (
        'a1000001-0000-4000-8000-000000000003'::uuid,
        'Anonymous',
        'Strong for TypeScript; occasional misses on very large files.',
        5,
        0
    )
) AS v("ToolId", "AuthorName", "Text", "Upvotes", "Downvotes")
WHERE NOT EXISTS (SELECT 1 FROM "Reviews" LIMIT 1);
