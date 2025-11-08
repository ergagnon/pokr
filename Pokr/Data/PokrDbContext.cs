using Microsoft.EntityFrameworkCore;
using Pokr.Models;

namespace Pokr.Data;

public class PokrDbContext : DbContext
{
    public PokrDbContext(DbContextOptions<PokrDbContext> options) : base(options)
    {
    }

    public DbSet<Session> Sessions { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<UserStory> UserStories { get; set; }
    public DbSet<Vote> Votes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure enum to string conversion for SessionStatus and StoryStatus
        modelBuilder.Entity<Session>()
            .Property(e => e.Status)
            .HasConversion<string>();
            
        modelBuilder.Entity<UserStory>()
            .Property(e => e.Status)
            .HasConversion<string>();
            
        // Configure the CurrentStory relationship to avoid circular reference
        modelBuilder.Entity<Session>()
            .HasOne(s => s.CurrentStory)
            .WithMany()
            .HasForeignKey(s => s.CurrentStoryId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}