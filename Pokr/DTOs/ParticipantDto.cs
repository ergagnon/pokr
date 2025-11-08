using System.ComponentModel.DataAnnotations;
using Pokr.Validation;

namespace Pokr.DTOs;

public class ParticipantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public DateTime? LastActivity { get; set; }
    public bool HasVotedForCurrentStory { get; set; }
}

public class JoinSessionRequest
{
    [SessionCode(ErrorMessage = "Session code must be 6 alphanumeric characters")]
    public string SessionCode { get; set; } = string.Empty;

    [RequiredNotEmpty(ErrorMessage = "Participant name is required")]
    [MaxLengthTrimmed(100, ErrorMessage = "Participant name cannot exceed 100 characters")]
    public string ParticipantName { get; set; } = string.Empty;
}

public class ParticipantInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SessionCode { get; set; } = string.Empty;
    public string SessionName { get; set; } = string.Empty;
    public bool IsJoined { get; set; }
}