using Microsoft.EntityFrameworkCore;
using Pokr.Models;

namespace Pokr.Data.Repositories;

public class UserStoryRepository : Repository<UserStory>, IUserStoryRepository
{
    public UserStoryRepository(PokrDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<UserStory>> GetBySessionCodeAsync(string sessionCode)
    {
        return await _dbSet
            .Include(s => s.Session)
            .Where(s => s.Session.Code == sessionCode)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetEstimatedStoriesCountBySessionAsync(string sessionCode)
    {
        return await _dbSet
            .Include(s => s.Session)
            .CountAsync(s => s.Session.Code == sessionCode && s.Status == StoryStatus.Estimated);
    }

    // Additional method for SessionService that is not in the interface
    public async Task<UserStory?> GetByIdWithVotesAsync(int storyId)
    {
        return await _dbSet
            .Include(s => s.Votes)
                .ThenInclude(v => v.Participant)
            .FirstOrDefaultAsync(s => s.Id == storyId);
    }
}