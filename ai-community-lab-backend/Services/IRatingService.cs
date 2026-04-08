using AiCommunityLab.Api.DTOs;

namespace AiCommunityLab.Api.Services;

public interface IRatingService
{
    Task<RatingAverageDto?> GetAverageAsync(Guid toolId, CancellationToken cancellationToken = default);
    Task<RatingAverageDto?> SubmitAsync(Guid toolId, int stars, CancellationToken cancellationToken = default);
}
