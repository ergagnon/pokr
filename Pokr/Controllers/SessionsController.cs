using Microsoft.AspNetCore.Mvc;
using Pokr.DTOs;
using Pokr.Services;

namespace Pokr.Controllers;

[ApiController]
[Route("api/sessions")]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(ISessionService sessionService, ILogger<SessionsController> logger)
    {
        _sessionService = sessionService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new planning session
    /// </summary>
    /// <param name="request">Session creation request containing facilitator name and session name</param>
    /// <returns>Created session details</returns>
    [HttpPost]
    public async Task<ActionResult<SessionDto>> CreateSession([FromBody] CreateSessionRequest request)
    {
        _logger.LogInformation("Creating new session for facilitator: {FacilitatorName}", request.FacilitatorName);

        // Model validation is handled automatically by ASP.NET Core
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var session = await _sessionService.CreateSessionAsync(request.FacilitatorName, request.SessionName);
        
        _logger.LogInformation("Session created successfully with code: {SessionCode}", session.Code);
        
        return CreatedAtAction(
            nameof(GetSessionStatus), 
            new { code = session.Code }, 
            session);
    }

    /// <summary>
    /// Join an existing planning session
    /// </summary>
    /// <param name="code">Session code</param>
    /// <param name="request">Join request containing participant name</param>
    /// <returns>Participant information</returns>
    [HttpPost("{code}/join")]
    public async Task<ActionResult<ParticipantInfo>> JoinSession(string code, [FromBody] JoinSessionRequest request)
    {
        _logger.LogInformation("Participant {ParticipantName} attempting to join session: {SessionCode}", 
            request.ParticipantName, code);

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var participantInfo = await _sessionService.JoinSessionAsync(code, request.ParticipantName);
        
        _logger.LogInformation("Participant {ParticipantName} joined session {SessionCode} successfully", 
            request.ParticipantName, code);
        
        return Ok(participantInfo);
    }

    /// <summary>
    /// Get session status and details
    /// </summary>
    /// <param name="code">Session code</param>
    /// <returns>Session status information</returns>
    [HttpGet("{code}")]
    public async Task<ActionResult<SessionStatusDto>> GetSessionStatus(string code)
    {
        _logger.LogInformation("Getting status for session: {SessionCode}", code);

        var sessionStatus = await _sessionService.GetSessionStatusAsync(code);
        
        _logger.LogInformation("Retrieved status for session {SessionCode} with {ParticipantCount} participants", 
            code, sessionStatus.ParticipantCount);
        
        return Ok(sessionStatus);
    }

    /// <summary>
    /// Add a story to the session (optional feature)
    /// </summary>
    /// <param name="code">Session code</param>
    /// <param name="request">Add story request containing story title</param>
    /// <returns>Created story details</returns>
    [HttpPost("{code}/stories")]
    public async Task<ActionResult<UserStoryDto>> AddStory(string code, [FromBody] AddStoryRequest request)
    {
        _logger.LogInformation("Adding story to session {SessionCode}: {StoryTitle}", code, request.Title);

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var story = await _sessionService.AddStoryAsync(code, request.Title);
        
        _logger.LogInformation("Story added successfully to session {SessionCode} with ID: {StoryId}", 
            code, story.Id);
        
        return CreatedAtAction(
            nameof(GetSessionStatus), 
            new { code = code }, 
            story);
    }

    /// <summary>
    /// Submit a participant vote for the current story
    /// </summary>
    /// <param name="code">Session code</param>
    /// <param name="request">Vote submission request containing estimate</param>
    /// <returns>Vote details</returns>
    [HttpPost("{code}/votes")]
    public async Task<ActionResult<VoteDto>> SubmitVote(string code, [FromBody] SubmitVoteRequest request)
    {
        _logger.LogInformation("Submitting vote for session {SessionCode} with estimate: {Estimate}", 
            code, request.Estimate);

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Get participant name from request header
        if (!Request.Headers.TryGetValue("X-Participant-Name", out var participantNameHeader) || 
            string.IsNullOrWhiteSpace(participantNameHeader))
        {
            return BadRequest(new { Message = "Participant name is required in X-Participant-Name header" });
        }

        var participantName = participantNameHeader.ToString();
        var vote = await _sessionService.SubmitVoteAsync(code, participantName, request.Estimate);
        
        _logger.LogInformation("Vote submitted successfully for participant {ParticipantName} in session {SessionCode}", 
            participantName, code);
        
        return Ok(vote);
    }

    /// <summary>
    /// Reveal votes for a specific story
    /// </summary>
    /// <param name="code">Session code</param>
    /// <param name="id">Story ID</param>
    /// <returns>Vote results with all participant estimates</returns>
    [HttpPost("{code}/stories/{id}/reveal")]
    public async Task<ActionResult<VoteResults>> RevealVotes(string code, int id)
    {
        _logger.LogInformation("Revealing votes for story {StoryId} in session {SessionCode}", id, code);

        if (id <= 0)
        {
            return BadRequest(new { Message = "Valid story ID is required" });
        }

        var voteResults = await _sessionService.RevealVotesAsync(code, id);
        
        _logger.LogInformation("Votes revealed successfully for story {StoryId} in session {SessionCode} with {VoteCount} votes", 
            id, code, voteResults.Votes.Count);
        
        return Ok(voteResults);
    }

    /// <summary>
    /// Set the active story for a session
    /// </summary>
    /// <param name="code">Session code</param>
    /// <param name="id">Story ID</param>
    /// <returns>Success response</returns>
    [HttpPut("{code}/stories/{id}/activate")]
    public async Task<ActionResult> SetActiveStory(string code, int id)
    {
        _logger.LogInformation("Setting active story {StoryId} for session {SessionCode}", id, code);

        if (id <= 0)
        {
            return BadRequest(new { Message = "Valid story ID is required" });
        }

        await _sessionService.SetActiveStoryAsync(code, id);
        
        _logger.LogInformation("Active story set successfully for session {SessionCode} to story {StoryId}", code, id);
        
        return Ok(new { Message = "Active story set successfully", StoryId = id });
    }

    /// <summary>
    /// Finalize the estimate for a story
    /// </summary>
    /// <param name="code">Session code</param>
    /// <param name="id">Story ID</param>
    /// <param name="request">Finalize request containing the agreed estimate</param>
    /// <returns>Success response</returns>
    [HttpPut("{code}/stories/{id}/finalize")]
    public async Task<ActionResult> FinalizeEstimate(string code, int id, [FromBody] FinalizeEstimateRequest request)
    {
        _logger.LogInformation("Finalizing estimate for story {StoryId} in session {SessionCode} with final points: {FinalPoints}", 
            id, code, request.FinalPoints);

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (id <= 0)
        {
            return BadRequest(new { Message = "Valid story ID is required" });
        }

        await _sessionService.FinalizeEstimateAsync(code, id, request.FinalPoints);
        
        _logger.LogInformation("Estimate finalized successfully for story {StoryId} in session {SessionCode} with {FinalPoints} points", 
            id, code, request.FinalPoints);
        
        return Ok(new { Message = "Estimate finalized successfully", FinalPoints = request.FinalPoints });
    }
}