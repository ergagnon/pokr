import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SessionDto,
  CreateSessionRequest,
  SessionStatusDto,
  JoinSessionRequest,
  ParticipantInfo,
  AddStoryRequest,
  SubmitVoteRequest,
  VoteResults,
  FinalizeEstimateRequest
} from '../models/session.models';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a new planning session
   */
  createSession(facilitatorName: string, sessionName: string): Observable<SessionDto> {
    const request: CreateSessionRequest = {
      facilitatorName,
      sessionName
    };
    return this.http.post<SessionDto>(`${this.apiUrl}/sessions`, request);
  }

  /**
   * Join an existing session
   */
  joinSession(sessionCode: string, participantName: string): Observable<ParticipantInfo> {
    const request: JoinSessionRequest = {
      sessionCode,
      participantName
    };
    return this.http.post<ParticipantInfo>(`${this.apiUrl}/sessions/${sessionCode}/join`, request);
  }

  /**
   * Get session status and details
   */
  getSessionStatus(sessionCode: string): Observable<SessionStatusDto> {
    return this.http.get<SessionStatusDto>(`${this.apiUrl}/sessions/${sessionCode}`);
  }

  /**
   * Add a story to the session (optional feature)
   */
  addStory(sessionCode: string, title: string): Observable<void> {
    const request: AddStoryRequest = { title };
    return this.http.post<void>(`${this.apiUrl}/sessions/${sessionCode}/stories`, request);
  }

  /**
   * Submit a vote for the current story
   */
  submitVote(sessionCode: string, estimate: number): Observable<void> {
    const request: SubmitVoteRequest = { estimate };
    return this.http.post<void>(`${this.apiUrl}/sessions/${sessionCode}/votes`, request);
  }

  /**
   * Reveal votes for a specific story (facilitator only)
   */
  revealVotes(sessionCode: string, storyId: number): Observable<VoteResults> {
    return this.http.post<VoteResults>(`${this.apiUrl}/sessions/${sessionCode}/stories/${storyId}/reveal`, {});
  }

  /**
   * Finalize the estimate for a story (facilitator only)
   */
  finalizeEstimate(sessionCode: string, storyId: number, finalPoints: number): Observable<void> {
    const request: FinalizeEstimateRequest = { finalPoints };
    return this.http.put<void>(`${this.apiUrl}/sessions/${sessionCode}/stories/${storyId}/finalize`, request);
  }

  /**
   * Get session details (full session object)
   */
  getSession(sessionCode: string): Observable<SessionDto> {
    return this.http.get<SessionDto>(`${this.apiUrl}/sessions/${sessionCode}/details`);
  }
}