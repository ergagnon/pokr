using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Pokr.Models;

[Index(nameof(SessionId), nameof(Name), IsUnique = true)]
public class Participant
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [ForeignKey(nameof(Session))]
    public int SessionId { get; set; }
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastActivity { get; set; }
    
    // Navigation properties
    public virtual Session Session { get; set; } = null!;
    public virtual ICollection<Vote> Votes { get; set; } = new List<Vote>();
}