using AiCommunityLab.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AiCommunityLab.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categories;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(ICategoryService categories, ILogger<CategoriesController> logger)
    {
        _categories = categories;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<object>>> GetAll(CancellationToken cancellationToken)
    {
        try
        {
            var list = await _categories.GetAllAsync(cancellationToken);
            return Ok(list);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list categories");
            return StatusCode(500, new { message = "Unable to load categories." });
        }
    }
}
