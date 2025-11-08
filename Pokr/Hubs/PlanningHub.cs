using Microsoft.AspNetCore.SignalR;
using Pokr.DTOs;
using Pokr.Services;

namespace Pokr.Hubs;

public class PlanningHub : Hub
{
    private readonly ISessionService _sessionService;
    private readonly ILogger<PlanningHub> _logger;

    public PlanningHub(ISessionService sessionService, ILogger<PlanningHub> logger)
    {
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Join a session group for real-time updates
    /// </summary>
    /// <param name="sessionCode">The session code to join</param>
    public async Task JoinSessionGroup(string sessionCode)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
        {
            _logger.LogWarning("Attempt to join session group with empty session code from connection {ConnectionId}", Context.ConnectionId);
            return;
        }

        // Validate that the session exists and is active
        var isValidSession = await _sessionService.ValidateSessionCodeAsync(sessionCode);
        if (!isValidSession)
        {
            _logger.LogWarning("Attempt to join invalid session {SessionCode} from connection {ConnectionId}", sessionCode, Context.ConnectionId);
            await Clients.Caller.SendAsync("SessionError", $"Session {sessionCode} not found or inactive");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GetSessionGroupName(sessionCode));
        _logger.LogInformation("Connection {ConnectionId} joined session group {SessionCode}", Context.ConnectionId, sessionCode);
        
        // Notify the caller that they successfully joined
        await Clients.Caller.SendAsync("JoinedSessionGroup", sessionCode);
    }

    /// <summary>
    /// Leave a session group
    /// </summary>
    /// <param name="sessionCode">The session code to leave</param>
    public async Task LeaveSessionGroup(string sessionCode)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetSessionGroupName(sessionCode));
        _logger.LogInformation("Connection {ConnectionId} left session group {SessionCode}", Context.ConnectionId, sessionCode);
        
        // Notify the caller that they successfully left
        await Clients.Caller.SendAsync("LeftSessionGroup", sessionCode);
    }

    /// <summary>
    /// Notify all participants in a session that a vote has been submitted
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="participantName">The name of the participant who voted</param>
    public async Task NotifyVoteSubmitted(string sessionCode, string participantName)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || string.IsNullOrWhiteSpace(participantName))
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("VoteSubmitted", new
        {
            SessionCode = sessionCode,
            ParticipantName = participantName,
            Timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("Notified session {SessionCode} that participant {ParticipantName} submitted a vote", sessionCode, participantName);
    }

    /// <summary>
    /// Notify all participants in a session that votes have been revealed
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="voteResults">The vote results to broadcast</param>
    public async Task NotifyVotesRevealed(string sessionCode, VoteResults voteResults)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || voteResults == null)
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("VotesRevealed", voteResults);

        _logger.LogInformation("Notified session {SessionCode} that votes were revealed for story {StoryId}", sessionCode, voteResults.StoryId);
    }

    /// <summary>
    /// Notify all participants in a session about session state updates
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="sessionStatus">The updated session status</param>
    public async Task NotifySessionUpdated(string sessionCode, SessionStatusDto sessionStatus)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || sessionStatus == null)
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("SessionUpdated", sessionStatus);

        _logger.LogInformation("Notified session {SessionCode} of session state update", sessionCode);
    }

    /// <summary>
    /// Notify all participants in a session that a new participant has joined
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="participantInfo">Information about the participant who joined</param>
    public async Task NotifyParticipantJoined(string sessionCode, ParticipantInfo participantInfo)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || participantInfo == null)
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("ParticipantJoined", participantInfo);

        _logger.LogInformation("Notified session {SessionCode} that participant {ParticipantName} joined", sessionCode, participantInfo.Name);
    }

    /// <summary>
    /// Notify all participants in a session that a participant has left
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="participantName">The name of the participant who left</param>
    public async Task NotifyParticipantLeft(string sessionCode, string participantName)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || string.IsNullOrWhiteSpace(participantName))
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("ParticipantLeft", new
        {
            SessionCode = sessionCode,
            ParticipantName = participantName,
            Timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("Notified session {SessionCode} that participant {ParticipantName} left", sessionCode, participantName);
    }

    /// <summary>
    /// Notify all participants in a session that a story has been added
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="story">The story that was added</param>
    public async Task NotifyStoryAdded(string sessionCode, UserStoryDto story)
    {
        if (string.IsNullOrWhiteSpace(sessionCode) || story == null)
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("StoryAdded", story);

        _logger.LogInformation("Notified session {SessionCode} that story '{StoryTitle}' was added", sessionCode, story.Title);
    }

    /// <summary>
    /// Notify all participants in a session that a story estimate has been finalized
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <param name="storyId">The ID of the story that was finalized</param>
    /// <param name="finalEstimate">The final estimate points</param>
    public async Task NotifyEstimateFinalized(string sessionCode, int storyId, int finalEstimate)
    {
        if (string.IsNullOrWhiteSpace(sessionCode))
        {
            return;
        }

        var groupName = GetSessionGroupName(sessionCode);
        await Clients.Group(groupName).SendAsync("EstimateFinalized", new
        {
            SessionCode = sessionCode,
            StoryId = storyId,
            FinalEstimate = finalEstimate,
            Timestamp = DateTime.UtcNow
        });

        _logger.LogInformation("Notified session {SessionCode} that story {StoryId} was finalized with {FinalEstimate} points", sessionCode, storyId, finalEstimate);
    }

    /// <summary>
    /// Handle client disconnection
    /// </summary>
    /// <param name="exception">Exception that caused the disconnection, if any</param>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Connection {ConnectionId} disconnected. Exception: {Exception}", Context.ConnectionId, exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Handle client connection
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Connection {ConnectionId} connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Generate a consistent group name for a session
    /// </summary>
    /// <param name="sessionCode">The session code</param>
    /// <returns>The group name for the session</returns>
    private static string GetSessionGroupName(string sessionCode)
    {
        return $"session_{sessionCode}";
    }
}