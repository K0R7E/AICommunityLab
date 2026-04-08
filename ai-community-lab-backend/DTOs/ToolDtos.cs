namespace AiCommunityLab.Api.DTOs;

public record ToolListDto(
    Guid Id,
    string Name,
    string Description,
    IReadOnlyList<string> UseCases,
    string? Pricing,
    int CategoryId,
    string CategoryName,
    double AverageRating,
    int RatingCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record ToolDetailDto(
    Guid Id,
    string Name,
    string Description,
    IReadOnlyList<string> UseCases,
    string? Pricing,
    int CategoryId,
    string CategoryName,
    double AverageRating,
    int RatingCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<ReviewDto> AssociatedReviews);
