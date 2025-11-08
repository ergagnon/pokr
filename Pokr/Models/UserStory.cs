using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Pokr.Models;

public class UserStory
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    [ForeignKey(nameof(Session))]
    public int SessionId { get; set; }
    
    public int? FinalEstimate { get; set; }
    
    [Column(TypeName = "TEXT")]
    public StoryStatus Status { get; set; } = StoryStatus.Pending;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Session Session { get; set; } = null!;
    public virtual ICollection<Vote> Votes { get; set; } = new List<Vote>();
}

public enum StoryStatus
{
    Pending,
    Voting,
    Estimated
}