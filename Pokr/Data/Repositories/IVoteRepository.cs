using Pokr.Models;

namespace Pokr.Data.Repositories;

public interface IVoteRepository : IRepository<Vote>
{
    Task<IEnumerable<Vote>> GetByStoryIdAsync(int storyId);
    Task<Vote?> GetByParticipantAndStoryAsync(int participantId, int storyId);
    Task<int> GetVoteCountByStoryAsync(int storyId);
    Task<bool> HasParticipantVotedForStoryAsync(int participantId, int storyId);
}