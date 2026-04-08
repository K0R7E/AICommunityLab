using AiCommunityLab.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AiCommunityLab.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tool> Tools => Set<Tool>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tool>(e =>
        {
            e.HasOne(t => t.Category)
                .WithMany(c => c.Tools)
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            e.Property(t => t.UseCases)
                .HasColumnType("text[]");
        });

        modelBuilder.Entity<Rating>(e =>
        {
            e.HasOne(r => r.Tool)
                .WithMany(t => t.Ratings)
                .HasForeignKey(r => r.ToolId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Review>(e =>
        {
            e.HasOne(r => r.Tool)
                .WithMany(t => t.Reviews)
                .HasForeignKey(r => r.ToolId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
