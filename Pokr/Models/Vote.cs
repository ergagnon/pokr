using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Pokr.Models;

[Index(nameof(ParticipantId), nameof(UserStoryId), IsUnique = true)]
public class Vote
{
    [Key]
    public int Id { get; set; }
    
    [ForeignKey(nameof(Participant))]
    public int ParticipantId { get; set; }
    
    [ForeignKey(nameof(UserStory))]
    public int UserStoryId { get; set; }
    
    public int Estimate { get; set; }
    
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Participant Participant { get; set; } = null!;
    public virtual UserStory UserStory { get; set; } = null!;
}