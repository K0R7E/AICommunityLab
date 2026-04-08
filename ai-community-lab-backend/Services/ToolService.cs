using AiCommunityLab.Api.Data;
using AiCommunityLab.Api.DTOs;
using AiCommunityLab.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AiCommunityLab.Api.Services;

public class ToolService : IToolService
{
    private readonly ApplicationDbContext _db;

    public ToolService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ToolListDto>> ListAsync(int? categoryId, CancellationToken cancellationToken = default)
    {
        var q = _db.Tools.AsNoTracking().Include(t => t.Category).AsQueryable();
        if (categoryId is { } cid)
            q = q.Where(t => t.CategoryId == cid);

        var tools = await q.OrderBy(t => t.Name).ToListAsync(cancellationToken);
        return await ProjectToListDtosAsync(tools, cancellationToken);
    }

    public async Task<ToolDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var tool = await _db.Tools
            .AsNoTracking()
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (tool is null)
            return null;

        var (avg, cnt) = await GetRatingStatsAsync(id, cancellationToken);

        var previewReviews = await _db.Reviews
            .AsNoTracking()
            .Where(r => r.ToolId == id)
            .OrderByDescending(r => r.CreatedAt)
            .Take(5)
            .Select(r => new ReviewDto(r.Id, r.ToolId, r.AuthorName, r.Text, r.Upvotes, r.Downvotes, r.CreatedAt, r.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new ToolDetailDto(
            tool.Id,
            tool.Name,
            tool.Description,
            tool.UseCases,
            tool.Pricing,
            tool.CategoryId,
            tool.Category?.Name ?? string.Empty,
            avg,
            cnt,
            tool.CreatedAt,
            tool.UpdatedAt,
            previewReviews);
    }

    public async Task<IReadOnlyList<ToolListDto>> GetTopRatedThisWeekAsync(int limit, CancellationToken cancellationToken = default)
    {
        var weekAgo = DateTimeOffset.UtcNow.AddDays(-7);

        var ranked = await _db.Ratings
            .AsNoTracking()
            .Where(r => r.CreatedAt >= weekAgo)
            .GroupBy(r => r.ToolId)
            .Select(g => new { ToolId = g.Key, Avg = g.Average(x => (double)x.Stars) })
            .OrderByDescending(x => x.Avg)
            .Take(limit)
            .ToListAsync(cancellationToken);

        if (ranked.Count == 0)
        {
            var fallback = await _db.Tools.AsNoTracking().Include(t => t.Category).OrderBy(t => t.Name).Take(limit).ToListAsync(cancellationToken);
            return await ProjectToListDtosAsync(fallback, cancellationToken);
        }

        var ids = ranked.Select(x => x.ToolId).ToList();
        var tools = await _db.Tools
            .AsNoTracking()
            .Include(t => t.Category)
            .Where(t => ids.Contains(t.Id))
            .ToListAsync(cancellationToken);

        var order = ranked.Select((x, i) => (x.ToolId, i)).ToDictionary(x => x.ToolId, x => x.i);
        tools.Sort((a, b) => order[a.Id].CompareTo(order[b.Id]));

        return await ProjectToListDtosAsync(tools, cancellationToken);
    }

    private async Task<IReadOnlyList<ToolListDto>> ProjectToListDtosAsync(List<Tool> tools, CancellationToken ct)
    {
        var result = new List<ToolListDto>(tools.Count);
        foreach (var t in tools)
        {
            var (avg, cnt) = await GetRatingStatsAsync(t.Id, ct);
            result.Add(new ToolListDto(
                t.Id,
                t.Name,
                t.Description,
                t.UseCases,
                t.Pricing,
                t.CategoryId,
                t.Category?.Name ?? string.Empty,
                avg,
                cnt,
                t.CreatedAt,
                t.UpdatedAt));
        }

        return result;
    }

    private async Task<(double Average, int Count)> GetRatingStatsAsync(Guid toolId, CancellationToken ct)
    {
        var agg = await _db.Ratings
            .AsNoTracking()
            .Where(r => r.ToolId == toolId)
            .GroupBy(_ => 1)
            .Select(g => new { Avg = g.Average(x => (double)x.Stars), Cnt = g.Count() })
            .FirstOrDefaultAsync(ct);

        return agg is null ? (0, 0) : (Math.Round(agg.Avg, 1), agg.Cnt);
    }
}
