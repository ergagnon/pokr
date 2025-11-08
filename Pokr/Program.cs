using Microsoft.EntityFrameworkCore;
using Pokr.Data;
using Pokr.Data.Repositories;
using Pokr.Middleware;
using Pokr.Models;
using Pokr.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure Entity Framework Core with SQLite
builder.Services.AddDbContext<PokrDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register repository services
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<SessionRepository>();
builder.Services.AddScoped<IParticipantRepository, ParticipantRepository>();
builder.Services.AddScoped<IUserStoryRepository, UserStoryRepository>();
builder.Services.AddScoped<UserStoryRepository>();
builder.Services.AddScoped<IVoteRepository, VoteRepository>();

// Register application services
builder.Services.AddScoped<ISessionService, SessionService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add global exception handler middleware (must be early in the pipeline)
app.UseGlobalExceptionHandler();

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAngularApp");

app.UseAuthorization();

app.MapControllers();

// Map SignalR hubs
app.MapHub<Pokr.Hubs.PlanningHub>("/sessionHub");

// Initialize database with migrations and seeding (skip in testing environment)
if (!app.Environment.IsEnvironment("Testing"))
{
    await InitializeDatabaseAsync(app.Services);
}

static async Task InitializeDatabaseAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<PokrDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Applying database migrations...");
        
        // Apply any pending migrations
        await context.Database.MigrateAsync();
        
        logger.LogInformation("Database migrations applied successfully");
        
        // Seed initial data if needed
        await SeedDatabaseAsync(context, logger);
        
        logger.LogInformation("Database initialization completed");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database");
        throw;
    }
}

static async Task SeedDatabaseAsync(PokrDbContext context, ILogger logger)
{
    // Check if database already has data
    if (await context.Sessions.AnyAsync())
    {
        logger.LogInformation("Database already contains data, skipping seeding");
        return;
    }
    
    logger.LogInformation("Seeding database with initial data...");
    
    // Create a sample session for development/testing purposes
    var sampleSession = new Session
    {
        Code = "DEMO01",
        Name = "Sample Planning Session",
        FacilitatorName = "Demo Facilitator",
        Status = SessionStatus.Active,
        CreatedAt = DateTime.UtcNow
    };
    
    context.Sessions.Add(sampleSession);
    await context.SaveChangesAsync();
    
    // Add a sample participant
    var sampleParticipant = new Participant
    {
        Name = "Demo Participant",
        SessionId = sampleSession.Id,
        JoinedAt = DateTime.UtcNow,
        LastActivity = DateTime.UtcNow
    };
    
    context.Participants.Add(sampleParticipant);
    
    // Add a sample user story
    var sampleStory = new UserStory
    {
        Title = "As a user, I want to see the demo functionality",
        SessionId = sampleSession.Id,
        Status = StoryStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };
    
    context.UserStories.Add(sampleStory);
    await context.SaveChangesAsync();
    
    // Update session to reference the current story
    sampleSession.CurrentStoryId = sampleStory.Id;
    context.Sessions.Update(sampleSession);
    
    await context.SaveChangesAsync();
    
    logger.LogInformation("Database seeding completed successfully");
}

app.Run();

// Make Program class accessible for integration testing
public partial class Program { }
