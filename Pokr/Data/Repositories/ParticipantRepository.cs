using Microsoft.EntityFrameworkCore;
using Pokr.Models;

namespace Pokr.Data.Repositories;

public class ParticipantRepository : Repository<Participant>, IParticipantRepository
{
    public ParticipantRepository(PokrDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Participant>> GetBySessionCodeAsync(string sessionCode)
    {
        return await _dbSet
            .Include(p => p.Session)
            .Where(p => p.Session.Code == sessionCode)
            .OrderBy(p => p.JoinedAt)
            .ToListAsync();
    }

    public async Task<Participant?> GetBySessionAndNameAsync(string sessionCode, string participantName)
    {
        return await _dbSet
            .Include(p => p.Session)
            .FirstOrDefaultAsync(p => p.Session.Code == sessionCode && p.Name == participantName);
    }

    public async Task<bool> IsNameUniqueInSessionAsync(string sessionCode, string participantName)
    {
        return !await _dbSet
            .Include(p => p.Session)
            .AnyAsync(p => p.Session.Code == sessionCode && p.Name == participantName);
    }

    public async Task UpdateLastActivityAsync(int participantId)
    {
        var participant = await _dbSet.FindAsync(participantId);
        if (participant != null)
        {
            participant.LastActivity = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<int> GetParticipantCountBySessionAsync(string sessionCode)
    {
        return await _dbSet
            .Include(p => p.Session)
            .CountAsync(p => p.Session.Code == sessionCode);
    }
}