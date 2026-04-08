using System.ComponentModel.DataAnnotations;

namespace AiCommunityLab.Api.DTOs;

public record RatingAverageDto(double Average, int Count);

public record CreateRatingDto
{
    [Range(1, 5)]
    public int Stars { get; init; }
}
