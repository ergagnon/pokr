using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using Xunit;

namespace Pokr.Tests.Integration;

/// <summary>
/// Basic integration tests to verify API endpoints are accessible and return expected status codes
/// </summary>
public class ApiEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ApiEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", content);
    }

    [Fact]
    public async Task CreateSession_WithoutBody_ReturnsUnsupportedMediaType()
    {
        // Act
        var response = await _client.PostAsync("/api/sessions", null);

        // Assert - Without proper JSON content, it returns UnsupportedMediaType
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
    }

    [Fact]
    public async Task GetSession_WithInvalidCode_ReturnsNotFound()
    {
        // Act
        var response = await _client.GetAsync("/api/sessions/INVALID");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task JoinSession_WithInvalidCode_ReturnsUnsupportedMediaType()
    {
        // Act - Without proper JSON content, it returns UnsupportedMediaType before validation
        var response = await _client.PostAsync("/api/sessions/INVALID/join", null);

        // Assert
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
    }

    [Fact]
    public async Task SubmitVote_WithInvalidCode_ReturnsUnsupportedMediaType()
    {
        // Act - Without proper JSON content, it returns UnsupportedMediaType before validation
        var response = await _client.PostAsync("/api/sessions/INVALID/votes", null);

        // Assert
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
    }

    [Fact]
    public async Task RevealVotes_WithInvalidCode_ReturnsNotFound()
    {
        // Act - This endpoint doesn't require a body, so it should reach validation
        var response = await _client.PostAsync("/api/sessions/INVALID/stories/1/reveal", null);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task FinalizeEstimate_WithInvalidCode_ReturnsUnsupportedMediaType()
    {
        // Act - Without proper JSON content, it returns UnsupportedMediaType before validation
        var response = await _client.PutAsync("/api/sessions/INVALID/stories/1/finalize", null);

        // Assert
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
    }
}