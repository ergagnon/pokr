using System.ComponentModel.DataAnnotations;
using Pokr.Validation;

namespace Pokr.DTOs;

public class UserStoryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? FinalEstimate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<VoteDto> Votes { get; set; } = new();
}

public class AddStoryRequest
{
    [RequiredNotEmpty(ErrorMessage = "Story title is required")]
    [MaxLengthTrimmed(500, ErrorMessage = "Story title cannot exceed 500 characters")]
    public string Title { get; set; } = string.Empty;
}