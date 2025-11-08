using Pokr.Models;

namespace Pokr.Data.Repositories;

public interface IParticipantRepository : IRepository<Participant>
{
    Task<IEnumerable<Participant>> GetBySessionCodeAsync(string sessionCode);
    Task<Participant?> GetBySessionAndNameAsync(string sessionCode, string participantName);
    Task<bool> IsNameUniqueInSessionAsync(string sessionCode, string participantName);
    Task UpdateLastActivityAsync(int participantId);
    Task<int> GetParticipantCountBySessionAsync(string sessionCode);
}