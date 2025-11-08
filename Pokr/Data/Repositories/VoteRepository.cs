using Microsoft.EntityFrameworkCore;
using Pokr.Models;

namespace Pokr.Data.Repositories;

public class VoteRepository : Repository<Vote>, IVoteRepository
{
    public VoteRepository(PokrDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Vote>> GetByStoryIdAsync(int storyId)
    {
        return await _dbSet
            .Include(v => v.Participant)
            .Where(v => v.UserStoryId == storyId)
            .OrderBy(v => v.SubmittedAt)
            .ToListAsync();
    }

    public async Task<Vote?> GetByParticipantAndStoryAsync(int participantId, int storyId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(v => v.ParticipantId == participantId && v.UserStoryId == storyId);
    }

    public async Task<int> GetVoteCountByStoryAsync(int storyId)
    {
        return await _dbSet.CountAsync(v => v.UserStoryId == storyId);
    }

    public async Task<bool> HasParticipantVotedForStoryAsync(int participantId, int storyId)
    {
        return await _dbSet.AnyAsync(v => v.ParticipantId == participantId && v.UserStoryId == storyId);
    }
}