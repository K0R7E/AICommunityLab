using System.ComponentModel.DataAnnotations;
using AiCommunityLab.Api.DTOs;
using AiCommunityLab.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiCommunityLab.Api.Controllers;

[ApiController]
[Route("api/tools/{toolId:guid}/ratings")]
public class RatingsController : ControllerBase
{
    private readonly IRatingService _ratings;
    private readonly ILogger<RatingsController> _logger;

    public RatingsController(IRatingService ratings, ILogger<RatingsController> logger)
    {
        _ratings = ratings;
        _logger = logger;
    }

    /// <summary>Matches the Angular client: GET …/ratings/average</summary>
    [HttpGet("average")]
    public async Task<IActionResult> GetAverage(Guid toolId, CancellationToken cancellationToken)
    {
        try
        {
            var avg = await _ratings.GetAverageAsync(toolId, cancellationToken);
            return avg is null ? NotFound() : Ok(avg);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get average rating for {ToolId}", toolId);
            return StatusCode(500, new { message = "Unable to load ratings." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Post(Guid toolId, [FromBody] CreateRatingDto? body, CancellationToken cancellationToken)
    {
        if (body is null)
            return BadRequest(new { message = "Request body is required." });

        var ctx = new ValidationContext(body);
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(body, ctx, results, validateAllProperties: true))
            return BadRequest(new { message = string.Join(" ", results.Select(r => r.ErrorMessage)) });

        try
        {
            var updated = await _ratings.SubmitAsync(toolId, body.Stars, cancellationToken);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit rating for {ToolId}", toolId);
            return StatusCode(500, new { message = "Unable to save rating." });
        }
    }
}
