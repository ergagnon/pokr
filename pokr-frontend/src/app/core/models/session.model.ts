export interface SessionDto {
  id: number;
  code: string;
  name: string;
  facilitatorName: string;
  status: string;
  createdAt: Date;
  currentStoryId?: number;
  currentStory?: UserStoryDto;
  participants: ParticipantDto[];
  stories: UserStoryDto[];
}

export interface SessionStatusDto {
  code: string;
  name: string;
  facilitatorName: string;
  participantCount: number;
  storiesCount: number;
  estimatedStoriesCount: number;
  currentStory?: UserStoryDto;
  participants: ParticipantDto[];
  stories?: UserStoryDto[]; // Add stories array for facilitator dashboard
}

export interface ParticipantDto {
  id: number;
  name: string;
  joinedAt: Date;
  lastActivity?: Date;
  hasVotedForCurrentStory: boolean;
}

export interface UserStoryDto {
  id: number;
  title: string;
  finalEstimate?: number;
  status: string;
  createdAt: Date;
  votes: VoteDto[];
}

export interface VoteDto {
  id: number;
  participantName: string;
  estimate: number;
  submittedAt: Date;
}

export interface CreateSessionRequest {
  facilitatorName: string;
  sessionName: string;
}

export interface JoinSessionRequest {
  sessionCode: string;
  participantName: string;
}

export interface ParticipantInfo {
  id: number;
  name: string;
  sessionCode: string;
  sessionName: string;
  isJoined: boolean;
}

export interface AddStoryRequest {
  title: string;
}

export interface SubmitVoteRequest {
  estimate: number;
}

export interface VoteResults {
  storyId: number;
  storyTitle: string;
  votes: VoteDto[];
  hasConsensus: boolean;
  suggestedEstimate?: number;
  estimateDistribution: { [key: number]: number };
}

export interface FinalizeEstimateRequest {
  finalPoints: number;
}

// Legacy interfaces for backward compatibility
export interface Session extends SessionDto {}
export interface Participant extends ParticipantDto {}
export interface UserStory extends UserStoryDto {}
export interface Vote extends VoteDto {}