using System.ComponentModel.DataAnnotations;
using Pokr.Validation;

namespace Pokr.DTOs;

public class SessionDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FacilitatorName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? CurrentStoryId { get; set; }
    public UserStoryDto? CurrentStory { get; set; }
    public List<ParticipantDto> Participants { get; set; } = new();
    public List<UserStoryDto> Stories { get; set; } = new();
}

public class CreateSessionRequest
{
    [RequiredNotEmpty(ErrorMessage = "Facilitator name is required")]
    [MaxLengthTrimmed(100, ErrorMessage = "Facilitator name cannot exceed 100 characters")]
    public string FacilitatorName { get; set; } = string.Empty;

    [RequiredNotEmpty(ErrorMessage = "Session name is required")]
    [MaxLengthTrimmed(200, ErrorMessage = "Session name cannot exceed 200 characters")]
    public string SessionName { get; set; } = string.Empty;
}

public class SessionStatusDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string FacilitatorName { get; set; } = string.Empty;
    public int ParticipantCount { get; set; }
    public int StoriesCount { get; set; }
    public int EstimatedStoriesCount { get; set; }
    public UserStoryDto? CurrentStory { get; set; }
    public List<ParticipantDto> Participants { get; set; } = new();
    public List<UserStoryDto>? Stories { get; set; } = new();
}