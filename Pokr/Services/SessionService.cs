using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Pokr.Data.Repositories;
using Pokr.DTOs;
using Pokr.Exceptions;
using Pokr.Hubs;
using Pokr.Models;

namespace Pokr.Services;

public class SessionService : ISessionService
{
    private readonly SessionRepository _sessionRepository;
    private readonly IParticipantRepository _participantRepository;
    private readonly UserStoryRepository _userStoryRepository;
    private readonly IVoteRepository _voteRepository;
    private readonly IHubContext<PlanningHub> _hubContext;
    private readonly ILogger<SessionService> _logger;

    private static readonly char[] CodeCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();
    private const int CodeLength = 6;

    public SessionService(
        SessionRepository sessionRepository,
        IParticipantRepository participantRepository,
        UserStoryRepository userStoryRepository,
        IVoteRepository voteRepository,
        IHubContext<PlanningHub> hubContext,
        ILogger<SessionService> logger)
    {
        _sessionRepository = sessionRepository;
        _participantRepository = participantRepository;
        _userStoryRepository = userStoryRepository;
        _voteRepository = voteRepository;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<SessionDto> CreateSessionAsync(string facilitatorName, string sessionName)
    {
        if (string.IsNullOrWhiteSpace(facilitatorName))
            throw new ValidationException(nameof(facilitatorName), "Facilitator name is required");
        
        if (string.IsNullOrWhiteSpace(sessionName))
            throw new ValidationException(nameof(sessionName), "Session name is required");

        var sessionCode = await GenerateUniqueSessionCodeAsync();
        
        var session = new Session
        {
            Code = sessionCode,
            Name = sessionName.Trim(),
            FacilitatorName = facilitatorName.Trim(),
            Status = SessionStatus.Active,
            CreatedAt = DateTime.UtcNow
        };

        var createdSession = await _sessionRepository.AddAsync(session);
        
        _logger.LogInformation("Created new session with code {SessionCode} for facilitator {FacilitatorName}", 
            sessionCode, facilitatorName);

        return MapToSessionDto(createdSession);
    }

    public async Task<ParticipantInfo> JoinSessionAsync(string sessionCode, string participantName)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");
        
        if (string.IsNullOrWhiteSpace(participantName))
            throw new ValidationException(nameof(participantName), "Participant name is required");

        var session = await _sessionRepository.GetByCodeAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        if (session.Status != SessionStatus.Active)
            throw new BusinessRuleException($"Session {sessionCode} is not active");

        // Check if participant name is unique in this session
        var isNameUnique = await _participantRepository.IsNameUniqueInSessionAsync(sessionCode, participantName.Trim());
        if (!isNameUnique)
            throw new ConflictException($"Participant name '{participantName}' is already taken in this session");

        var participant = new Participant
        {
            Name = participantName.Trim(),
            SessionId = session.Id,
            JoinedAt = DateTime.UtcNow,
            LastActivity = DateTime.UtcNow
        };

        var createdParticipant = await _participantRepository.AddAsync(participant);
        
        _logger.LogInformation("Participant {ParticipantName} joined session {SessionCode}", 
            participantName, sessionCode);

        var participantInfo = new ParticipantInfo
        {
            Id = createdParticipant.Id,
            Name = createdParticipant.Name,
            SessionCode = sessionCode,
            SessionName = session.Name,
            IsJoined = true
        };

        // Notify all participants in the session about the new participant
        await NotifyParticipantJoined(sessionCode, participantInfo);

        // Send updated session status to all participants
        await NotifySessionStatusUpdate(sessionCode);

        return participantInfo;
    }

    public async Task<UserStoryDto> AddStoryAsync(string sessionCode, string title)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");
        
        if (string.IsNullOrWhiteSpace(title))
            throw new ValidationException(nameof(title), "Story title is required");

        var session = await _sessionRepository.GetByCodeAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        var story = new UserStory
        {
            Title = title.Trim(),
            SessionId = session.Id,
            Status = StoryStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        var createdStory = await _userStoryRepository.AddAsync(story);
        
        _logger.LogInformation("Added story '{StoryTitle}' to session {SessionCode}", title, sessionCode);

        var storyDto = MapToUserStoryDto(createdStory);

        // Notify all participants in the session about the new story
        await NotifyStoryAdded(sessionCode, storyDto);

        // Send updated session status to all participants
        await NotifySessionStatusUpdate(sessionCode);

        return storyDto;
    }

    public async Task SetActiveStoryAsync(string sessionCode, int storyId)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");

        var session = await _sessionRepository.GetByCodeAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        var story = await _userStoryRepository.GetByIdAsync(storyId);
        if (story == null)
            throw new NotFoundException("Story", storyId.ToString());

        if (story.SessionId != session.Id)
            throw new BusinessRuleException("Story does not belong to the specified session");

        // Update the session's current story
        session.CurrentStoryId = storyId;
        await _sessionRepository.UpdateAsync(session);

        // Update story status to voting if it's pending
        if (story.Status == StoryStatus.Pending)
        {
            story.Status = StoryStatus.Voting;
            await _userStoryRepository.UpdateAsync(story);
        }

        _logger.LogInformation("Set active story {StoryId} for session {SessionCode}", storyId, sessionCode);

        // Notify all participants in the session about the active story change
        await NotifyActiveStoryChanged(sessionCode, storyId);

        // Send updated session status to all participants
        await NotifySessionStatusUpdate(sessionCode);
    }

    public async Task<VoteDto> SubmitVoteAsync(string sessionCode, string participantName, int estimate)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");
        
        if (string.IsNullOrWhiteSpace(participantName))
            throw new ValidationException(nameof(participantName), "Participant name is required");

        var session = await _sessionRepository.GetByCodeWithStoriesAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        if (session.CurrentStory == null)
            throw new BusinessRuleException("No current story to vote on");

        var participant = await _participantRepository.GetBySessionAndNameAsync(sessionCode, participantName);
        if (participant == null)
            throw new NotFoundException($"Participant '{participantName}' not found in session {sessionCode}");

        // Check if participant has already voted for this story
        var existingVote = await _voteRepository.GetByParticipantAndStoryAsync(participant.Id, session.CurrentStory.Id);
        
        VoteDto voteDto;

        if (existingVote != null)
        {
            // Update existing vote
            existingVote.Estimate = estimate;
            existingVote.SubmittedAt = DateTime.UtcNow;
            await _voteRepository.UpdateAsync(existingVote);
            
            _logger.LogInformation("Updated vote for participant {ParticipantName} in session {SessionCode} to {Estimate}", 
                participantName, sessionCode, estimate);

            voteDto = MapToVoteDto(existingVote, participantName);
        }
        else
        {
            // Create new vote
            var vote = new Vote
            {
                ParticipantId = participant.Id,
                UserStoryId = session.CurrentStory.Id,
                Estimate = estimate,
                SubmittedAt = DateTime.UtcNow
            };

            var createdVote = await _voteRepository.AddAsync(vote);
            
            _logger.LogInformation("Submitted vote for participant {ParticipantName} in session {SessionCode} with estimate {Estimate}", 
                participantName, sessionCode, estimate);

            voteDto = MapToVoteDto(createdVote, participantName);
        }

        // Notify all participants in the session that a vote was submitted
        await NotifyVoteSubmitted(sessionCode, participantName);

        // Send updated session status to all participants (to update voting indicators)
        await NotifySessionStatusUpdate(sessionCode);

        return voteDto;
    }

    public async Task<VoteResults> RevealVotesAsync(string sessionCode, int storyId)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");

        var session = await _sessionRepository.GetByCodeAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        var story = await _userStoryRepository.GetByIdWithVotesAsync(storyId);
        if (story == null)
            throw new NotFoundException("Story", storyId.ToString());

        if (story.SessionId != session.Id)
            throw new BusinessRuleException("Story does not belong to the specified session");

        var votes = story.Votes.ToList();
        var voteDistribution = votes.GroupBy(v => v.Estimate)
                                   .ToDictionary(g => g.Key, g => g.Count());

        var hasConsensus = CalculateConsensus(votes.Select(v => v.Estimate).ToList());
        var suggestedEstimate = CalculateSuggestedEstimate(votes.Select(v => v.Estimate).ToList());

        _logger.LogInformation("Revealed votes for story {StoryId} in session {SessionCode}", storyId, sessionCode);

        var voteResults = new VoteResults
        {
            StoryId = storyId,
            StoryTitle = story.Title,
            Votes = votes.Select(v => MapToVoteDto(v, v.Participant.Name)).ToList(),
            HasConsensus = hasConsensus,
            SuggestedEstimate = suggestedEstimate,
            EstimateDistribution = voteDistribution
        };

        // Notify all participants in the session that votes have been revealed
        await NotifyVotesRevealed(sessionCode, voteResults);

        return voteResults;
    }

    public async Task FinalizeEstimateAsync(string sessionCode, int storyId, int finalPoints)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");

        var session = await _sessionRepository.GetByCodeAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        var story = await _userStoryRepository.GetByIdAsync(storyId);
        if (story == null)
            throw new NotFoundException("Story", storyId.ToString());

        if (story.SessionId != session.Id)
            throw new BusinessRuleException("Story does not belong to the specified session");

        story.FinalEstimate = finalPoints;
        story.Status = StoryStatus.Estimated;

        await _userStoryRepository.UpdateAsync(story);
        
        _logger.LogInformation("Finalized estimate for story {StoryId} in session {SessionCode} with {FinalPoints} points", 
            storyId, sessionCode, finalPoints);

        // Notify all participants in the session that the estimate has been finalized
        await NotifyEstimateFinalized(sessionCode, storyId, finalPoints);

        // Send updated session status to all participants
        await NotifySessionStatusUpdate(sessionCode);
    }

    public async Task<SessionStatusDto> GetSessionStatusAsync(string sessionCode)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            throw new ValidationException(nameof(sessionCode), "Session code is required");

        var session = await _sessionRepository.GetByCodeWithAllDataAsync(sessionCode);
        if (session == null)
            throw new NotFoundException("Session", sessionCode);

        var estimatedStoriesCount = await _userStoryRepository.GetEstimatedStoriesCountBySessionAsync(sessionCode);

        var participants = new List<ParticipantDto>();
        foreach (var participant in session.Participants)
        {
            var hasVoted = session.CurrentStory != null && 
                          await _voteRepository.HasParticipantVotedForStoryAsync(participant.Id, session.CurrentStory.Id);
            
            participants.Add(new ParticipantDto
            {
                Id = participant.Id,
                Name = participant.Name,
                JoinedAt = participant.JoinedAt,
                LastActivity = participant.LastActivity,
                HasVotedForCurrentStory = hasVoted
            });
        }

        return new SessionStatusDto
        {
            Code = session.Code,
            Name = session.Name,
            FacilitatorName = session.FacilitatorName,
            ParticipantCount = session.Participants.Count,
            StoriesCount = session.Stories.Count,
            EstimatedStoriesCount = estimatedStoriesCount,
            CurrentStory = session.CurrentStory != null ? MapToUserStoryDto(session.CurrentStory) : null,
            Participants = participants,
            Stories = session.Stories?.Select(MapToUserStoryDto).ToList()
        };
    }

    public async Task<bool> ValidateSessionCodeAsync(string sessionCode)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
            return false;

        var session = await _sessionRepository.GetByCodeAsync(sessionCode);
        return session != null && session.Status == SessionStatus.Active;
    }

    public async Task<bool> ValidateParticipantNameAsync(string sessionCode, string participantName)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || string.IsNullOrWhiteSpace(participantName))
            return false;

        return await _participantRepository.IsNameUniqueInSessionAsync(sessionCode, participantName.Trim());
    }

    private async Task<string> GenerateUniqueSessionCodeAsync()
    {
        string code;
        bool isUnique;
        
        do
        {
            code = GenerateSecureRandomCode();
            isUnique = await _sessionRepository.IsCodeUniqueAsync(code);
        } 
        while (!isUnique);

        return code;
    }

    private static string GenerateSecureRandomCode()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[CodeLength];
        rng.GetBytes(bytes);

        var result = new StringBuilder(CodeLength);
        for (int i = 0; i < CodeLength; i++)
        {
            result.Append(CodeCharacters[bytes[i] % CodeCharacters.Length]);
        }

        return result.ToString();
    }

    private static bool CalculateConsensus(List<int> estimates)
    {
        if (estimates.Count == 0) return false;
        if (estimates.Count == 1) return true;

        // Simple consensus: all estimates are the same or within 1 point of each other
        var min = estimates.Min();
        var max = estimates.Max();
        return max - min <= 1;
    }

    private static int? CalculateSuggestedEstimate(List<int> estimates)
    {
        if (estimates.Count == 0) return null;

        // Return the most common estimate, or the median if there's a tie
        var groups = estimates.GroupBy(e => e).OrderByDescending(g => g.Count()).ToList();
        
        if (groups.Count == 1 || groups[0].Count() > groups[1].Count())
        {
            return groups[0].Key;
        }

        // If there's a tie, return the median
        var sortedEstimates = estimates.OrderBy(e => e).ToList();
        var middle = sortedEstimates.Count / 2;
        
        return sortedEstimates.Count % 2 == 0
            ? (sortedEstimates[middle - 1] + sortedEstimates[middle]) / 2
            : sortedEstimates[middle];
    }

    private static SessionDto MapToSessionDto(Session session)
    {
        return new SessionDto
        {
            Id = session.Id,
            Code = session.Code,
            Name = session.Name,
            FacilitatorName = session.FacilitatorName,
            Status = session.Status.ToString(),
            CreatedAt = session.CreatedAt,
            CurrentStoryId = session.CurrentStoryId,
            CurrentStory = session.CurrentStory != null ? MapToUserStoryDto(session.CurrentStory) : null,
            Participants = session.Participants?.Select(MapToParticipantDto).ToList() ?? new List<ParticipantDto>(),
            Stories = session.Stories?.Select(MapToUserStoryDto).ToList() ?? new List<UserStoryDto>()
        };
    }

    private static ParticipantDto MapToParticipantDto(Participant participant)
    {
        return new ParticipantDto
        {
            Id = participant.Id,
            Name = participant.Name,
            JoinedAt = participant.JoinedAt,
            LastActivity = participant.LastActivity
        };
    }

    private static UserStoryDto MapToUserStoryDto(UserStory story)
    {
        return new UserStoryDto
        {
            Id = story.Id,
            Title = story.Title,
            FinalEstimate = story.FinalEstimate,
            Status = story.Status.ToString(),
            CreatedAt = story.CreatedAt,
            Votes = story.Votes?.Select(v => MapToVoteDto(v, v.Participant?.Name ?? "Unknown")).ToList() ?? new List<VoteDto>()
        };
    }

    private static VoteDto MapToVoteDto(Vote vote, string participantName)
    {
        return new VoteDto
        {
            Id = vote.Id,
            ParticipantName = participantName,
            Estimate = vote.Estimate,
            SubmittedAt = vote.SubmittedAt
        };
    }

    #region SignalR Notification Methods

    /// <summary>
    /// Notify all participants in a session that a new participant has joined
    /// </summary>
    private async Task NotifyParticipantJoined(string sessionCode, ParticipantInfo participantInfo)
    {
        try
        {
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("ParticipantJoined", participantInfo);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ParticipantJoined notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Notify all participants in a session that a story has been added
    /// </summary>
    private async Task NotifyStoryAdded(string sessionCode, UserStoryDto story)
    {
        try
        {
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("StoryAdded", story);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send StoryAdded notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Notify all participants in a session that a vote has been submitted
    /// </summary>
    private async Task NotifyVoteSubmitted(string sessionCode, string participantName)
    {
        try
        {
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("VoteSubmitted", new
            {
                SessionCode = sessionCode,
                ParticipantName = participantName,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send VoteSubmitted notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Notify all participants in a session that votes have been revealed
    /// </summary>
    private async Task NotifyVotesRevealed(string sessionCode, VoteResults voteResults)
    {
        try
        {
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("VotesRevealed", voteResults);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send VotesRevealed notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Notify all participants in a session that an estimate has been finalized
    /// </summary>
    private async Task NotifyEstimateFinalized(string sessionCode, int storyId, int finalEstimate)
    {
        try
        {
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("EstimateFinalized", new
            {
                SessionCode = sessionCode,
                StoryId = storyId,
                FinalEstimate = finalEstimate,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send EstimateFinalized notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Notify all participants in a session that the active story has changed
    /// </summary>
    private async Task NotifyActiveStoryChanged(string sessionCode, int storyId)
    {
        try
        {
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("ActiveStoryChanged", new
            {
                SessionCode = sessionCode,
                StoryId = storyId,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send ActiveStoryChanged notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Send updated session status to all participants in a session
    /// </summary>
    private async Task NotifySessionStatusUpdate(string sessionCode)
    {
        try
        {
            var sessionStatus = await GetSessionStatusAsync(sessionCode);
            var groupName = GetSessionGroupName(sessionCode);
            await _hubContext.Clients.Group(groupName).SendAsync("SessionUpdated", sessionStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SessionUpdated notification for session {SessionCode}", sessionCode);
        }
    }

    /// <summary>
    /// Generate a consistent group name for a session
    /// </summary>
    private static string GetSessionGroupName(string sessionCode)
    {
        return $"session_{sessionCode}";
    }

    #endregion
}