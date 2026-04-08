using AiCommunityLab.Api.Data;
using AiCommunityLab.Api.DTOs;
using AiCommunityLab.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AiCommunityLab.Api.Services;

public class ReviewService : IReviewService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(ApplicationDbContext db, ILogger<ReviewService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ReviewsPageDto?> GetPageAsync(Guid toolId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var toolExists = await _db.Tools.AnyAsync(t => t.Id == toolId, cancellationToken);
        if (!toolExists)
            return null;

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var q = _db.Reviews.AsNoTracking().Where(r => r.ToolId == toolId).OrderByDescending(r => r.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReviewDto(r.Id, r.ToolId, r.AuthorName, r.Text, r.Upvotes, r.Downvotes, r.CreatedAt, r.UpdatedAt))
            .ToListAsync(cancellationToken);

        return new ReviewsPageDto(items, page, pageSize, total, page * pageSize < total);
    }

    public async Task<ReviewDto?> CreateAsync(Guid toolId, CreateReviewDto dto, CancellationToken cancellationToken = default)
    {
        var toolExists = await _db.Tools.AnyAsync(t => t.Id == toolId, cancellationToken);
        if (!toolExists)
            return null;

        var text = dto.Text.Trim();

        var author = string.IsNullOrWhiteSpace(dto.AuthorName) ? "Anonymous" : dto.AuthorName!.Trim();
        if (author.Length > 255)
            author = author[..255];

        var now = DateTimeOffset.UtcNow;
        var entity = new Review
        {
            Id = Guid.NewGuid(),
            ToolId = toolId,
            AuthorName = author,
            Text = text,
            Upvotes = 0,
            Downvotes = 0,
            CreatedAt = now,
            UpdatedAt = now,
        };

        try
        {
            _db.Reviews.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create review for tool {ToolId}", toolId);
            throw;
        }

        return new ReviewDto(entity.Id, entity.ToolId, entity.AuthorName, entity.Text, entity.Upvotes, entity.Downvotes, entity.CreatedAt, entity.UpdatedAt);
    }

    public async Task<VoteResultDto?> UpvoteAsync(Guid reviewId, CancellationToken cancellationToken = default)
    {
        return await AdjustVoteAsync(reviewId, +1, 0, cancellationToken);
    }

    public async Task<VoteResultDto?> DownvoteAsync(Guid reviewId, CancellationToken cancellationToken = default)
    {
        return await AdjustVoteAsync(reviewId, 0, +1, cancellationToken);
    }

    private async Task<VoteResultDto?> AdjustVoteAsync(Guid reviewId, int upDelta, int downDelta, CancellationToken cancellationToken)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);
        if (review is null)
            return null;

        review.Upvotes += upDelta;
        review.Downvotes += downDelta;
        review.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to vote review {ReviewId}", reviewId);
            throw;
        }

        return new VoteResultDto(review.Id, review.Upvotes, review.Downvotes);
    }
}
