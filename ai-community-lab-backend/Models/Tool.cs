using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AiCommunityLab.Api.Models;

[Table("Tools")]
public class Tool
{
    [Key]
    [Column("Id")]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("Name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Column("Description")]
    public string Description { get; set; } = string.Empty;

    [Column("UseCases", TypeName = "text[]")]
    public List<string> UseCases { get; set; } = new();

    [MaxLength(255)]
    [Column("Pricing")]
    public string? Pricing { get; set; }

    [Column("CategoryId")]
    public int CategoryId { get; set; }

    public Category? Category { get; set; }

    [Column("CreatedAt")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("UpdatedAt")]
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
