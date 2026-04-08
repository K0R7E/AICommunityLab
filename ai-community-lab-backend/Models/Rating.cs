using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AiCommunityLab.Api.Models;

[Table("Ratings")]
public class Rating
{
    [Key]
    [Column("Id")]
    public Guid Id { get; set; }

    [Column("ToolId")]
    public Guid ToolId { get; set; }

    public Tool? Tool { get; set; }

    [Range(1, 5)]
    [Column("Stars")]
    public int Stars { get; set; }

    [Column("CreatedAt")]
    public DateTimeOffset CreatedAt { get; set; }
}
