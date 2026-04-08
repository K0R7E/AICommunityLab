using System.ComponentModel.DataAnnotations;
using AiCommunityLab.Api.DTOs;
using AiCommunityLab.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiCommunityLab.Api.Controllers;

[ApiController]
[Route("api")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(IReviewService reviews, ILogger<ReviewsController> logger)
    {
        _reviews = reviews;
        _logger = logger;
    }

    [HttpGet("tools/{toolId:guid}/reviews")]
    public async Task<IActionResult> GetForTool(
        Guid toolId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _reviews.GetPageAsync(toolId, page, pageSize, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list reviews for {ToolId}", toolId);
            return StatusCode(500, new { message = "Unable to load reviews." });
        }
    }

    [HttpPost("tools/{toolId:guid}/reviews")]
    public async Task<IActionResult> CreateForTool(Guid toolId, [FromBody] CreateReviewDto? body, CancellationToken cancellationToken)
    {
        if (body is null)
            return BadRequest(new { message = "Request body is required." });

        var ctx = new ValidationContext(body);
        var results = new List<ValidationResult>();
        if (!Validator.TryValidateObject(body, ctx, results, validateAllProperties: true))
            return BadRequest(new { message = string.Join(" ", results.Select(r => r.ErrorMessage)) });

        try
        {
            var created = await _reviews.CreateAsync(toolId, body, cancellationToken);
            if (created is null)
                return NotFound();

            return Ok(created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create review for {ToolId}", toolId);
            return StatusCode(500, new { message = "Unable to save review." });
        }
    }

    [HttpPost("reviews/{reviewId:guid}/upvote")]
    public async Task<IActionResult> Upvote(Guid reviewId, CancellationToken cancellationToken)
    {
        try
        {
            var r = await _reviews.UpvoteAsync(reviewId, cancellationToken);
            return r is null ? NotFound() : Ok(r);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upvote {ReviewId}", reviewId);
            return StatusCode(500, new { message = "Unable to record vote." });
        }
    }

    [HttpPost("reviews/{reviewId:guid}/downvote")]
    public async Task<IActionResult> Downvote(Guid reviewId, CancellationToken cancellationToken)
    {
        try
        {
            var r = await _reviews.DownvoteAsync(reviewId, cancellationToken);
            return r is null ? NotFound() : Ok(r);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to downvote {ReviewId}", reviewId);
            return StatusCode(500, new { message = "Unable to record vote." });
        }
    }
}
