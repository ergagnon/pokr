import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { 
  SessionDto, 
  SessionStatusDto,
  CreateSessionRequest, 
  JoinSessionRequest, 
  ParticipantInfo,
  UserStoryDto, 
  VoteDto,
  AddStoryRequest,
  SubmitVoteRequest,
  VoteResults,
  FinalizeEstimateRequest
} from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Session management
  createSession(request: CreateSessionRequest): Observable<SessionDto> {
    return this.http.post<SessionDto>(`${this.apiUrl}/sessions`, request).pipe(
      tap(() => this.notificationService.showSuccess('Session created successfully!'))
    );
  }

  joinSession(sessionCode: string, request: JoinSessionRequest): Observable<ParticipantInfo> {
    return this.http.post<ParticipantInfo>(`${this.apiUrl}/sessions/${sessionCode}/join`, {
      participantName: request.participantName
    }).pipe(
      tap(() => this.notificationService.showSuccess('Joined session successfully!'))
    );
  }

  getSessionStatus(sessionCode: string): Observable<SessionStatusDto> {
    return this.http.get<SessionStatusDto>(`${this.apiUrl}/sessions/${sessionCode}`);
  }

  // Story management
  addStory(sessionCode: string, request: AddStoryRequest): Observable<UserStoryDto> {
    return this.http.post<UserStoryDto>(`${this.apiUrl}/sessions/${sessionCode}/stories`, request).pipe(
      tap(() => this.notificationService.showSuccess('Story added successfully!'))
    );
  }

  setActiveStory(sessionCode: string, storyId: string): Observable<void> {
    // This endpoint doesn't exist in the backend yet, but we'll implement it later
    return this.http.put<void>(`${this.apiUrl}/sessions/${sessionCode}/stories/${storyId}/activate`, {});
  }

  // Voting
  submitVote(sessionCode: string, request: SubmitVoteRequest, participantName: string): Observable<VoteDto> {
    const headers = new HttpHeaders({
      'X-Participant-Name': participantName
    });
    
    return this.http.post<VoteDto>(`${this.apiUrl}/sessions/${sessionCode}/votes`, request, { headers }).pipe(
      tap(() => this.notificationService.showSuccess('Vote submitted!'))
    );
  }

  revealVotes(sessionCode: string, storyId: string): Observable<VoteResults> {
    return this.http.post<VoteResults>(`${this.apiUrl}/sessions/${sessionCode}/stories/${storyId}/reveal`, {}).pipe(
      tap(() => this.notificationService.showInfo('Votes revealed!'))
    );
  }

  finalizeEstimate(sessionCode: string, storyId: string, finalPoints: number): Observable<void> {
    const request: FinalizeEstimateRequest = { finalPoints };
    return this.http.put<void>(`${this.apiUrl}/sessions/${sessionCode}/stories/${storyId}/finalize`, request).pipe(
      tap(() => this.notificationService.showSuccess('Estimate finalized!'))
    );
  }

  // Validation methods (used by backend but useful for frontend too)
  validateSessionCode(sessionCode: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/sessions/${sessionCode}/validate`);
  }

  validateParticipantName(sessionCode: string, participantName: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/sessions/${sessionCode}/participants/${participantName}/validate`);
  }
}