using Pokr.DTOs;

namespace Pokr.Services;

public interface ISessionService
{
    Task<SessionDto> CreateSessionAsync(string facilitatorName, string sessionName);
    Task<ParticipantInfo> JoinSessionAsync(string sessionCode, string participantName);
    Task<UserStoryDto> AddStoryAsync(string sessionCode, string title);
    Task SetActiveStoryAsync(string sessionCode, int storyId);
    Task<VoteDto> SubmitVoteAsync(string sessionCode, string participantName, int estimate);
    Task<VoteResults> RevealVotesAsync(string sessionCode, int storyId);
    Task FinalizeEstimateAsync(string sessionCode, int storyId, int finalPoints);
    Task<SessionStatusDto> GetSessionStatusAsync(string sessionCode);
    Task<bool> ValidateSessionCodeAsync(string sessionCode);
    Task<bool> ValidateParticipantNameAsync(string sessionCode, string participantName);
}