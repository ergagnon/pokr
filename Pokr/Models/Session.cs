using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Pokr.Models;

[Index(nameof(Code), IsUnique = true)]
public class Session
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [StringLength(6)]
    public string Code { get; set; } = string.Empty;
    
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [StringLength(50)]
    public string FacilitatorName { get; set; } = string.Empty;
    
    [Column(TypeName = "TEXT")]
    public SessionStatus Status { get; set; } = SessionStatus.Active;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public int? CurrentStoryId { get; set; }
    
    // Navigation properties
    public virtual ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public virtual ICollection<UserStory> Stories { get; set; } = new List<UserStory>();
    
    [ForeignKey(nameof(CurrentStoryId))]
    public virtual UserStory? CurrentStory { get; set; }
}

public enum SessionStatus
{
    Active,
    Completed,
    Archived
}