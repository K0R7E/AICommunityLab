using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AiCommunityLab.Api.Models;

[Table("Categories")]
public class Category
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("Name")]
    public string Name { get; set; } = string.Empty;

    public ICollection<Tool> Tools { get; set; } = new List<Tool>();
}
