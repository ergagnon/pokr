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

export interface CreateSessionRequest {
  facilitatorName: string;
  sessionName: string;
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
}

export interface ParticipantDto {
  id: number;
  name: string;
  joinedAt: Date;
  lastActivity?: Date;
  hasVotedForCurrentStory: boolean;
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

export interface UserStoryDto {
  id: number;
  title: string;
  finalEstimate?: number;
  status: string;
  createdAt: Date;
  votes: VoteDto[];
}

export interface AddStoryRequest {
  title: string;
}

export interface VoteDto {
  id: number;
  participantName: string;
  estimate: number;
  submittedAt: Date;
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

export interface ApiErrorResponse {
  message: string;
  errorCode: string;
  validationErrors?: { [key: string]: string[] };
  timestamp: Date;
}

// Enums for status values
export enum SessionStatus {
  Active = 'Active',
  Completed = 'Completed',
  Archived = 'Archived'
}

export enum StoryStatus {
  Pending = 'Pending',
  Voting = 'Voting',
  Estimated = 'Estimated'
}

// Fibonacci sequence values for voting
export const FIBONACCI_VALUES = [1, 2, 3, 5, 8, 13, 21, -1, -2]; // -1 = ?, -2 = ☕