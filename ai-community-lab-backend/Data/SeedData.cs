using AiCommunityLab.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AiCommunityLab.Api.Data;

/// <summary>Development-friendly seed when tables are empty (optional if you already ran seed_data.sql).</summary>
public static class SeedData
{
    private static readonly Guid[] ToolIds =
    {
        Guid.Parse("a1000001-0000-4000-8000-000000000001"),
        Guid.Parse("a1000001-0000-4000-8000-000000000002"),
        Guid.Parse("a1000001-0000-4000-8000-000000000003"),
        Guid.Parse("a1000001-0000-4000-8000-000000000004"),
        Guid.Parse("a1000001-0000-4000-8000-000000000005"),
        Guid.Parse("a1000001-0000-4000-8000-000000000006"),
        Guid.Parse("a1000001-0000-4000-8000-000000000007"),
        Guid.Parse("a1000001-0000-4000-8000-000000000008"),
    };

    public static async Task EnsureSeededAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Categories.AnyAsync(cancellationToken))
            return;

        var now = DateTimeOffset.UtcNow;
        var categories = new[]
        {
            new Category { Name = "Marketing" },
            new Category { Name = "Real Estate" },
            new Category { Name = "Development" },
            new Category { Name = "Productivity" },
            new Category { Name = "Creative" },
            new Category { Name = "Data" },
            new Category { Name = "Audio" },
        };

        db.Categories.AddRange(categories);
        await db.SaveChangesAsync(cancellationToken);

        var id = await db.Categories.AsNoTracking().ToDictionaryAsync(c => c.Name, c => c.Id, cancellationToken);

        var tools = new[]
        {
            new Tool
            {
                Id = ToolIds[0],
                Name = "ClarityWrite",
                Description = "Long-form drafting with tone control and source-aware suggestions.",
                UseCases = new List<string> { "Blog posts", "Reports", "Documentation" },
                Pricing = "Freemium",
                CategoryId = id["Productivity"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[1],
                Name = "VisionParse",
                Description = "Extract tables and text from PDFs and scans with high accuracy.",
                UseCases = new List<string> { "Invoices", "Research PDFs", "Archives" },
                Pricing = "Paid",
                CategoryId = id["Productivity"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[2],
                Name = "CodePilot",
                Description = "Context-aware coding help inside your editor with repo awareness.",
                UseCases = new List<string> { "Refactors", "Tests", "Onboarding" },
                Pricing = "Subscription",
                CategoryId = id["Development"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[3],
                Name = "VoiceFlow",
                Description = "Natural voices and SSML controls for narration and accessibility.",
                UseCases = new List<string> { "Audiobooks", "IVR", "Accessibility" },
                Pricing = "Usage-based",
                CategoryId = id["Audio"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[4],
                Name = "DataMind",
                Description = "Ask questions of spreadsheets and SQL without writing queries.",
                UseCases = new List<string> { "Analytics", "Ops reporting", "Ad-hoc questions" },
                Pricing = "Team plans",
                CategoryId = id["Data"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[5],
                Name = "ImageCraft",
                Description = "Generate and refine visuals with consistent brand-safe styles.",
                UseCases = new List<string> { "Social", "Ads", "Concept art" },
                Pricing = "Credits",
                CategoryId = id["Creative"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[6],
                Name = "CampaignPilot",
                Description = "Multi-channel copy variants with guardrails and brand voice checks.",
                UseCases = new List<string> { "Paid social", "Lifecycle email", "Landing pages" },
                Pricing = "Subscription",
                CategoryId = id["Marketing"],
                CreatedAt = now,
                UpdatedAt = now,
            },
            new Tool
            {
                Id = ToolIds[7],
                Name = "EstateLens",
                Description = "Property descriptions, comps summaries, and disclosure Q&A assistance.",
                UseCases = new List<string> { "Listings", "Buyer packets", "Brokerage ops" },
                Pricing = "Per seat",
                CategoryId = id["Real Estate"],
                CreatedAt = now,
                UpdatedAt = now,
            },
        };

        db.Tools.AddRange(tools);
        await db.SaveChangesAsync(cancellationToken);
    }
}
