using AiCommunityLab.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiCommunityLab.Api.Controllers;

[ApiController]
[Route("api/tools")]
public class ToolsController : ControllerBase
{
    private readonly IToolService _tools;
    private readonly ILogger<ToolsController> _logger;

    public ToolsController(IToolService tools, ILogger<ToolsController> logger)
    {
        _tools = tools;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<object>>> List([FromQuery] int? categoryId, CancellationToken cancellationToken)
    {
        try
        {
            var list = await _tools.ListAsync(categoryId, cancellationToken);
            return Ok(list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list tools");
            return StatusCode(500, new { message = "Unable to load tools." });
        }
    }

    [HttpGet("top-rated")]
    public async Task<ActionResult<IReadOnlyList<object>>> TopRated(
        [FromQuery] string? timeframe,
        [FromQuery] int limit = 5,
        CancellationToken cancellationToken = default)
    {
        _ = timeframe;
        limit = Math.Clamp(limit, 1, 20);
        try
        {
            var list = await _tools.GetTopRatedThisWeekAsync(limit, cancellationToken);
            return Ok(list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load top-rated tools");
            return StatusCode(500, new { message = "Unable to load top-rated tools." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var tool = await _tools.GetByIdAsync(id, cancellationToken);
            return tool is null ? NotFound() : Ok(tool);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get tool {ToolId}", id);
            return StatusCode(500, new { message = "Unable to load tool." });
        }
    }
}
