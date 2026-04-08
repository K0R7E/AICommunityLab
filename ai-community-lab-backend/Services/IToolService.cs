using AiCommunityLab.Api.DTOs;

namespace AiCommunityLab.Api.Services;

public interface IToolService
{
    Task<IReadOnlyList<ToolListDto>> ListAsync(int? categoryId, CancellationToken cancellationToken = default);
    Task<ToolDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ToolListDto>> GetTopRatedThisWeekAsync(int limit, CancellationToken cancellationToken = default);
}
