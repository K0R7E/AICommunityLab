using AiCommunityLab.Api.DTOs;

namespace AiCommunityLab.Api.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken cancellationToken = default);
}
