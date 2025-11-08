using Pokr.Models;

namespace Pokr.Data.Repositories;

public interface ISessionRepository : IRepository<Session>
{
    Task<Session?> GetByCodeAsync(string sessionCode);
    Task<bool> IsCodeUniqueAsync(string sessionCode);
}