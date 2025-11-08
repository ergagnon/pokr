using Microsoft.EntityFrameworkCore;
using Pokr.Models;

namespace Pokr.Data.Repositories;

public class SessionRepository : Repository<Session>, ISessionRepository
{
    public SessionRepository(PokrDbContext context) : base(context)
    {
    }

    public async Task<Session?> GetByCodeAsync(string sessionCode)
    {
        return await _dbSet.FirstOrDefaultAsync(s => s.Code == sessionCode);
    }

    public async Task<bool> IsCodeUniqueAsync(string sessionCode)
    {
        return !await _dbSet.AnyAsync(s => s.Code == sessionCode);
    }

    // Additional methods for SessionService that are not in the interface
    public async Task<Session?> GetByCodeWithParticipantsAsync(string sessionCode)
    {
        return await _dbSet
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Code == sessionCode);
    }

    public async Task<Session?> GetByCodeWithStoriesAsync(string sessionCode)
    {
        return await _dbSet
            .Include(s => s.Stories)
            .Include(s => s.CurrentStory)
            .FirstOrDefaultAsync(s => s.Code == sessionCode);
    }

    public async Task<Session?> GetByCodeWithAllDataAsync(string sessionCode)
    {
        return await _dbSet
            .Include(s => s.Participants)
            .Include(s => s.Stories)
                .ThenInclude(story => story.Votes)
                    .ThenInclude(vote => vote.Participant)
            .Include(s => s.CurrentStory)
            .FirstOrDefaultAsync(s => s.Code == sessionCode);
    }
}