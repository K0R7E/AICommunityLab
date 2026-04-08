using AiCommunityLab.Api.DTOs;

namespace AiCommunityLab.Api.Services;

public interface IReviewService
{
    Task<ReviewsPageDto?> GetPageAsync(Guid toolId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<ReviewDto?> CreateAsync(Guid toolId, CreateReviewDto dto, CancellationToken cancellationToken = default);
    Task<VoteResultDto?> UpvoteAsync(Guid reviewId, CancellationToken cancellationToken = default);
    Task<VoteResultDto?> DownvoteAsync(Guid reviewId, CancellationToken cancellationToken = default);
}
