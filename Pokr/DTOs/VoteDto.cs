using System.ComponentModel.DataAnnotations;
using Pokr.Validation;

namespace Pokr.DTOs;

public class VoteDto
{
    public int Id { get; set; }
    public string ParticipantName { get; set; } = string.Empty;
    public int Estimate { get; set; }
    public DateTime SubmittedAt { get; set; }
}

public class SubmitVoteRequest
{
    [ValidEstimate(ErrorMessage = "Estimate must be a valid Fibonacci value (1,2,3,5,8,13,21) or special value (? = -1, ☕ = -2)")]
    public int Estimate { get; set; }
}

public class VoteResults
{
    public int StoryId { get; set; }
    public string StoryTitle { get; set; } = string.Empty;
    public List<VoteDto> Votes { get; set; } = new();
    public bool HasConsensus { get; set; }
    public int? SuggestedEstimate { get; set; }
    public Dictionary<int, int> EstimateDistribution { get; set; } = new();
}

public class FinalizeEstimateRequest
{
    [ValidFinalEstimate(ErrorMessage = "Final estimate must be a valid Fibonacci value (1,2,3,5,8,13,21)")]
    public int FinalPoints { get; set; }
}