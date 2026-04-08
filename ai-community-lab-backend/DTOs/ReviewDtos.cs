using System.ComponentModel.DataAnnotations;

namespace AiCommunityLab.Api.DTOs;

public record ReviewDto(
    Guid Id,
    Guid ToolId,
    string AuthorName,
    string Text,
    int Upvotes,
    int Downvotes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public record ReviewsPageDto(
    IReadOnlyList<ReviewDto> Items,
    int Page,
    int PageSize,
    int Total,
    bool HasMore);

public record CreateReviewDto
{
    [MaxLength(255)]
    public string? AuthorName { get; init; }

    [Required]
    [MinLength(4)]
    public string Text { get; init; } = string.Empty;
}

public record VoteResultDto(Guid Id, int Upvotes, int Downvotes);
