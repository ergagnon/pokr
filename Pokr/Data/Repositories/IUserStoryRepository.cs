using Pokr.Models;

namespace Pokr.Data.Repositories;

public interface IUserStoryRepository : IRepository<UserStory>
{
    Task<IEnumerable<UserStory>> GetBySessionCodeAsync(string sessionCode);
    Task<int> GetEstimatedStoriesCountBySessionAsync(string sessionCode);
}