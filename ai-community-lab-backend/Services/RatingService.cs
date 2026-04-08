using AiCommunityLab.Api.Data;
using AiCommunityLab.Api.DTOs;
using AiCommunityLab.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AiCommunityLab.Api.Services;

public class RatingService : IRatingService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<RatingService> _logger;

    public RatingService(ApplicationDbContext db, ILogger<RatingService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<RatingAverageDto?> GetAverageAsync(Guid toolId, CancellationToken cancellationToken = default)
    {
        var exists = await _db.Tools.AnyAsync(t => t.Id == toolId, cancellationToken);
        if (!exists)
            return null;

        return await ComputeAverageAsync(toolId, cancellationToken);
    }

    public async Task<RatingAverageDto?> SubmitAsync(Guid toolId, int stars, CancellationToken cancellationToken = default)
    {
        var toolExists = await _db.Tools.AnyAsync(t => t.Id == toolId, cancellationToken);
        if (!toolExists)
            return null;

        stars = Math.Clamp(stars, 1, 5);
        _db.Ratings.Add(new Rating
        {
            Id = Guid.NewGuid(),
            ToolId = toolId,
            Stars = stars,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save rating for tool {ToolId}", toolId);
            throw;
        }

        return await ComputeAverageAsync(toolId, cancellationToken);
    }

    private async Task<RatingAverageDto> ComputeAverageAsync(Guid toolId, CancellationToken cancellationToken)
    {
        var agg = await _db.Ratings
            .AsNoTracking()
            .Where(r => r.ToolId == toolId)
            .GroupBy(_ => 1)
            .Select(g => new { Avg = g.Average(x => (double)x.Stars), Cnt = g.Count() })
            .FirstOrDefaultAsync(cancellationToken);

        return agg is null
            ? new RatingAverageDto(0, 0)
            : new RatingAverageDto(Math.Round(agg.Avg, 1), agg.Cnt);
    }
}
