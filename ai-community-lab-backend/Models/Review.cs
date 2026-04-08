using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AiCommunityLab.Api.Models;

[Table("Reviews")]
public class Review
{
    [Key]
    [Column("Id")]
    public Guid Id { get; set; }

    [Column("ToolId")]
    public Guid ToolId { get; set; }

    public Tool? Tool { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("AuthorName")]
    public string AuthorName { get; set; } = "Anonymous";

    [Required]
    [Column("Text")]
    public string Text { get; set; } = string.Empty;

    [Column("Upvotes")]
    public int Upvotes { get; set; }

    [Column("Downvotes")]
    public int Downvotes { get; set; }

    [Column("CreatedAt")]
    public DateTimeOffset CreatedAt { get; set; }

    [Column("UpdatedAt")]
    public DateTimeOffset UpdatedAt { get; set; }
}
