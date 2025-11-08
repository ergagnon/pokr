using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Pokr.Controllers;
using Pokr.DTOs;
using Pokr.Services;
using Xunit;

namespace Pokr.Tests.Controllers;

public class SessionsControllerTests
{
    private readonly Mock<ISessionService> _mockSessionService;
    private readonly Mock<ILogger<SessionsController>> _mockLogger;
    private readonly SessionsController _controller;

    public SessionsControllerTests()
    {
        _mockSessionService = new Mock<ISessionService>();
        _mockLogger = new Mock<ILogger<SessionsController>>();
        _controller = new SessionsController(_mockSessionService.Object, _mockLogger.Object);
    }

    #region CreateSession Tests

    [Fact]
    public async Task CreateSession_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var request = new CreateSessionRequest
        {
            FacilitatorName = "John Doe",
            SessionName = "Sprint Planning"
        };

        var expectedSession = new SessionDto
        {
            Id = 1,
            Code = "ABC123",
            Name = "Sprint Planning",
            FacilitatorName = "John Doe",
            Status = "Active"
        };

        _mockSessionService
            .Setup(s => s.CreateSessionAsync(request.FacilitatorName, request.SessionName))
            .ReturnsAsync(expectedSession);

        // Act
        var result = await _controller.CreateSession(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returnedSession = Assert.IsType<SessionDto>(createdResult.Value);
        Assert.Equal(expectedSession.Code, returnedSession.Code);
        Assert.Equal(expectedSession.Name, returnedSession.Name);
        Assert.Equal(expectedSession.FacilitatorName, returnedSession.FacilitatorName);
    }

    [Fact]
    public async Task CreateSession_EmptyFacilitatorName_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateSessionRequest
        {
            FacilitatorName = "",
            SessionName = "Sprint Planning"
        };

        // Act
        var result = await _controller.CreateSession(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var response = badRequestResult.Value;
        Assert.NotNull(response);
    }

    [Fact]
    public async Task CreateSession_EmptySessionName_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateSessionRequest
        {
            FacilitatorName = "John Doe",
            SessionName = ""
        };

        // Act
        var result = await _controller.CreateSession(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        var response = badRequestResult.Value;
        Assert.NotNull(response);
    }

    [Fact]
    public async Task CreateSession_ServiceThrowsException_ReturnsInternalServerError()
    {
        // Arrange
        var request = new CreateSessionRequest
        {
            FacilitatorName = "John Doe",
            SessionName = "Sprint Planning"
        };

        _mockSessionService
            .Setup(s => s.CreateSessionAsync(It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _controller.CreateSession(request);

        // Assert
        var statusCodeResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, statusCodeResult.StatusCode);
    }

    #endregion

    #region JoinSession Tests

    [Fact]
    public async Task JoinSession_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new JoinSessionRequest
        {
            ParticipantName = "Jane Smith"
        };

        var expectedParticipant = new ParticipantInfo
        {
            Id = 1,
            Name = "Jane Smith",
            SessionCode = sessionCode,
            SessionName = "Sprint Planning",
            IsJoined = true
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.ValidateParticipantNameAsync(sessionCode, request.ParticipantName))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.JoinSessionAsync(sessionCode, request.ParticipantName))
            .ReturnsAsync(expectedParticipant);

        // Act
        var result = await _controller.JoinSession(sessionCode, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedParticipant = Assert.IsType<ParticipantInfo>(okResult.Value);
        Assert.Equal(expectedParticipant.Name, returnedParticipant.Name);
        Assert.Equal(expectedParticipant.SessionCode, returnedParticipant.SessionCode);
    }

    [Fact]
    public async Task JoinSession_EmptySessionCode_ReturnsBadRequest()
    {
        // Arrange
        var request = new JoinSessionRequest
        {
            ParticipantName = "Jane Smith"
        };

        // Act
        var result = await _controller.JoinSession("", request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task JoinSession_EmptyParticipantName_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new JoinSessionRequest
        {
            ParticipantName = ""
        };

        // Act
        var result = await _controller.JoinSession(sessionCode, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task JoinSession_InvalidSessionCode_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "INVALID";
        var request = new JoinSessionRequest
        {
            ParticipantName = "Jane Smith"
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.JoinSession(sessionCode, request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.NotNull(notFoundResult.Value);
    }

    [Fact]
    public async Task JoinSession_ParticipantNameTaken_ReturnsConflict()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new JoinSessionRequest
        {
            ParticipantName = "Jane Smith"
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.ValidateParticipantNameAsync(sessionCode, request.ParticipantName))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.JoinSession(sessionCode, request);

        // Assert
        var conflictResult = Assert.IsType<ConflictObjectResult>(result.Result);
        Assert.NotNull(conflictResult.Value);
    }

    #endregion

    #region GetSessionStatus Tests

    [Fact]
    public async Task GetSessionStatus_ValidSessionCode_ReturnsOkResult()
    {
        // Arrange
        var sessionCode = "ABC123";
        var expectedStatus = new SessionStatusDto
        {
            Code = sessionCode,
            Name = "Sprint Planning",
            FacilitatorName = "John Doe",
            ParticipantCount = 3,
            StoriesCount = 5,
            EstimatedStoriesCount = 2
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.GetSessionStatusAsync(sessionCode))
            .ReturnsAsync(expectedStatus);

        // Act
        var result = await _controller.GetSessionStatus(sessionCode);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedStatus = Assert.IsType<SessionStatusDto>(okResult.Value);
        Assert.Equal(expectedStatus.Code, returnedStatus.Code);
        Assert.Equal(expectedStatus.ParticipantCount, returnedStatus.ParticipantCount);
    }

    [Fact]
    public async Task GetSessionStatus_EmptySessionCode_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.GetSessionStatus("");

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task GetSessionStatus_InvalidSessionCode_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "INVALID";

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.GetSessionStatus(sessionCode);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.NotNull(notFoundResult.Value);
    }

    #endregion

    #region AddStory Tests

    [Fact]
    public async Task AddStory_ValidRequest_ReturnsCreatedResult()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new AddStoryRequest
        {
            Title = "As a user, I want to login"
        };

        var expectedStory = new UserStoryDto
        {
            Id = 1,
            Title = request.Title,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.AddStoryAsync(sessionCode, request.Title))
            .ReturnsAsync(expectedStory);

        // Act
        var result = await _controller.AddStory(sessionCode, request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returnedStory = Assert.IsType<UserStoryDto>(createdResult.Value);
        Assert.Equal(expectedStory.Title, returnedStory.Title);
        Assert.Equal(expectedStory.Id, returnedStory.Id);
    }

    [Fact]
    public async Task AddStory_EmptySessionCode_ReturnsBadRequest()
    {
        // Arrange
        var request = new AddStoryRequest
        {
            Title = "As a user, I want to login"
        };

        // Act
        var result = await _controller.AddStory("", request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task AddStory_EmptyTitle_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new AddStoryRequest
        {
            Title = ""
        };

        // Act
        var result = await _controller.AddStory(sessionCode, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task AddStory_InvalidSessionCode_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "INVALID";
        var request = new AddStoryRequest
        {
            Title = "As a user, I want to login"
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.AddStory(sessionCode, request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.NotNull(notFoundResult.Value);
    }

    #endregion

    #region SubmitVote Tests

    [Fact]
    public async Task SubmitVote_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var sessionCode = "ABC123";
        var participantName = "Jane Smith";
        var request = new SubmitVoteRequest
        {
            Estimate = 5
        };

        var expectedVote = new VoteDto
        {
            Id = 1,
            ParticipantName = participantName,
            Estimate = request.Estimate,
            SubmittedAt = DateTime.UtcNow
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.SubmitVoteAsync(sessionCode, participantName, request.Estimate))
            .ReturnsAsync(expectedVote);

        // Add participant name header
        _controller.ControllerContext.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        _controller.Request.Headers["X-Participant-Name"] = participantName;

        // Act
        var result = await _controller.SubmitVote(sessionCode, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedVote = Assert.IsType<VoteDto>(okResult.Value);
        Assert.Equal(expectedVote.Estimate, returnedVote.Estimate);
        Assert.Equal(expectedVote.ParticipantName, returnedVote.ParticipantName);
    }

    [Fact]
    public async Task SubmitVote_EmptySessionCode_ReturnsBadRequest()
    {
        // Arrange
        var request = new SubmitVoteRequest
        {
            Estimate = 5
        };

        // Act
        var result = await _controller.SubmitVote("", request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task SubmitVote_InvalidEstimate_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new SubmitVoteRequest
        {
            Estimate = 99 // Invalid estimate
        };

        // Act
        var result = await _controller.SubmitVote(sessionCode, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task SubmitVote_MissingParticipantHeader_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new SubmitVoteRequest
        {
            Estimate = 5
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _controller.ControllerContext.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();

        // Act
        var result = await _controller.SubmitVote(sessionCode, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(5)]
    [InlineData(8)]
    [InlineData(13)]
    [InlineData(21)]
    [InlineData(-1)] // "?" special value
    [InlineData(-2)] // "☕" special value
    public async Task SubmitVote_ValidEstimates_ReturnsOkResult(int estimate)
    {
        // Arrange
        var sessionCode = "ABC123";
        var participantName = "Jane Smith";
        var request = new SubmitVoteRequest
        {
            Estimate = estimate
        };

        var expectedVote = new VoteDto
        {
            Id = 1,
            ParticipantName = participantName,
            Estimate = estimate,
            SubmittedAt = DateTime.UtcNow
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.SubmitVoteAsync(sessionCode, participantName, estimate))
            .ReturnsAsync(expectedVote);

        _controller.ControllerContext.HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        _controller.Request.Headers["X-Participant-Name"] = participantName;

        // Act
        var result = await _controller.SubmitVote(sessionCode, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedVote = Assert.IsType<VoteDto>(okResult.Value);
        Assert.Equal(estimate, returnedVote.Estimate);
    }

    #endregion

    #region RevealVotes Tests

    [Fact]
    public async Task RevealVotes_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var sessionCode = "ABC123";
        var storyId = 1;

        var expectedResults = new VoteResults
        {
            StoryId = storyId,
            StoryTitle = "As a user, I want to login",
            Votes = new List<VoteDto>
            {
                new VoteDto { Id = 1, ParticipantName = "John", Estimate = 5 },
                new VoteDto { Id = 2, ParticipantName = "Jane", Estimate = 8 }
            },
            HasConsensus = false,
            SuggestedEstimate = 8,
            EstimateDistribution = new Dictionary<int, int> { { 5, 1 }, { 8, 1 } }
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.RevealVotesAsync(sessionCode, storyId))
            .ReturnsAsync(expectedResults);

        // Act
        var result = await _controller.RevealVotes(sessionCode, storyId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedResults = Assert.IsType<VoteResults>(okResult.Value);
        Assert.Equal(expectedResults.StoryId, returnedResults.StoryId);
        Assert.Equal(expectedResults.Votes.Count, returnedResults.Votes.Count);
    }

    [Fact]
    public async Task RevealVotes_EmptySessionCode_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.RevealVotes("", 1);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task RevealVotes_InvalidStoryId_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";

        // Act
        var result = await _controller.RevealVotes(sessionCode, 0);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task RevealVotes_InvalidSessionCode_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "INVALID";
        var storyId = 1;

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.RevealVotes(sessionCode, storyId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.NotNull(notFoundResult.Value);
    }

    [Fact]
    public async Task RevealVotes_ServiceThrowsArgumentException_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "ABC123";
        var storyId = 999;

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.RevealVotesAsync(sessionCode, storyId))
            .ThrowsAsync(new ArgumentException("Story not found"));

        // Act
        var result = await _controller.RevealVotes(sessionCode, storyId);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.NotNull(notFoundResult.Value);
    }

    #endregion

    #region FinalizeEstimate Tests

    [Fact]
    public async Task FinalizeEstimate_ValidRequest_ReturnsOkResult()
    {
        // Arrange
        var sessionCode = "ABC123";
        var storyId = 1;
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = 8
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.FinalizeEstimateAsync(sessionCode, storyId, request.FinalPoints))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.FinalizeEstimate(sessionCode, storyId, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task FinalizeEstimate_EmptySessionCode_ReturnsBadRequest()
    {
        // Arrange
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = 8
        };

        // Act
        var result = await _controller.FinalizeEstimate("", 1, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task FinalizeEstimate_InvalidStoryId_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = 8
        };

        // Act
        var result = await _controller.FinalizeEstimate(sessionCode, 0, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task FinalizeEstimate_InvalidFinalPoints_ReturnsBadRequest()
    {
        // Arrange
        var sessionCode = "ABC123";
        var storyId = 1;
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = 99 // Invalid points
        };

        // Act
        var result = await _controller.FinalizeEstimate(sessionCode, storyId, request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(5)]
    [InlineData(8)]
    [InlineData(13)]
    [InlineData(21)]
    public async Task FinalizeEstimate_ValidFinalPoints_ReturnsOkResult(int finalPoints)
    {
        // Arrange
        var sessionCode = "ABC123";
        var storyId = 1;
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = finalPoints
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.FinalizeEstimateAsync(sessionCode, storyId, finalPoints))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.FinalizeEstimate(sessionCode, storyId, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task FinalizeEstimate_InvalidSessionCode_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "INVALID";
        var storyId = 1;
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = 8
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(false);

        // Act
        var result = await _controller.FinalizeEstimate(sessionCode, storyId, request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFoundResult.Value);
    }

    [Fact]
    public async Task FinalizeEstimate_ServiceThrowsArgumentException_ReturnsNotFound()
    {
        // Arrange
        var sessionCode = "ABC123";
        var storyId = 999;
        var request = new FinalizeEstimateRequest
        {
            FinalPoints = 8
        };

        _mockSessionService
            .Setup(s => s.ValidateSessionCodeAsync(sessionCode))
            .ReturnsAsync(true);

        _mockSessionService
            .Setup(s => s.FinalizeEstimateAsync(sessionCode, storyId, request.FinalPoints))
            .ThrowsAsync(new ArgumentException("Story not found"));

        // Act
        var result = await _controller.FinalizeEstimate(sessionCode, storyId, request);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFoundResult.Value);
    }

    #endregion
}
