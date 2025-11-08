import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VoteResults } from '../../core/models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionState$ = new BehaviorSubject<string>('Disconnected');
  
  // Event subjects for real-time updates
  private sessionUpdated$ = new Subject<void>();
  private voteSubmitted$ = new Subject<string>();
  private votesRevealed$ = new Subject<VoteResults>();
  private participantJoined$ = new Subject<string>();
  private participantLeft$ = new Subject<string>();

  constructor() {}

  // Connection Management
  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.signalRUrl || `${environment.apiUrl.replace('/api', '')}/sessionHub`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // Set up event handlers
    this.setupEventHandlers();

    try {
      await this.hubConnection.start();
      this.connectionState$.next('Connected');
      console.log('SignalR connection established');
    } catch (error) {
      this.connectionState$.next('Failed');
      console.error('SignalR connection failed:', error);
      throw error;
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.connectionState$.next('Disconnected');
      console.log('SignalR connection stopped');
    }
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Handle connection state changes
    this.hubConnection.onreconnecting(() => {
      this.connectionState$.next('Reconnecting');
      console.log('SignalR reconnecting...');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionState$.next('Connected');
      console.log('SignalR reconnected');
    });

    this.hubConnection.onclose(() => {
      this.connectionState$.next('Disconnected');
      console.log('SignalR connection closed');
    });

    // Handle server events
    this.hubConnection.on('SessionUpdated', () => {
      console.log('Session updated event received');
      this.sessionUpdated$.next();
    });

    this.hubConnection.on('VoteSubmitted', (participantName: string) => {
      console.log('Vote submitted event received:', participantName);
      this.voteSubmitted$.next(participantName);
    });

    this.hubConnection.on('VotesRevealed', (results: VoteResults) => {
      console.log('Votes revealed event received:', results);
      this.votesRevealed$.next(results);
    });

    this.hubConnection.on('ParticipantJoined', (participantName: string) => {
      console.log('Participant joined event received:', participantName);
      this.participantJoined$.next(participantName);
    });

    this.hubConnection.on('ParticipantLeft', (participantName: string) => {
      console.log('Participant left event received:', participantName);
      this.participantLeft$.next(participantName);
    });
  }

  // Session Group Management
  async joinSessionGroup(sessionCode: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('JoinSessionGroup', sessionCode);
        console.log(`Joined session group: ${sessionCode}`);
      } catch (error) {
        console.error('Error joining session group:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }

  async leaveSessionGroup(sessionCode: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('LeaveSessionGroup', sessionCode);
        console.log(`Left session group: ${sessionCode}`);
      } catch (error) {
        console.error('Error leaving session group:', error);
        // Don't throw error on leave as it's not critical
      }
    }
  }

  // Client-to-Server Methods
  async notifyVoteSubmitted(sessionCode: string, participantName: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('NotifyVoteSubmitted', sessionCode, participantName);
      } catch (error) {
        console.error('Error notifying vote submitted:', error);
        throw error;
      }
    }
  }

  async notifyVotesRevealed(sessionCode: string, results: VoteResults): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('NotifyVotesRevealed', sessionCode, results);
      } catch (error) {
        console.error('Error notifying votes revealed:', error);
        throw error;
      }
    }
  }

  async notifySessionUpdated(sessionCode: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('NotifySessionUpdated', sessionCode);
      } catch (error) {
        console.error('Error notifying session updated:', error);
        throw error;
      }
    }
  }

  // Observable Event Streams
  getConnectionState(): Observable<string> {
    return this.connectionState$.asObservable();
  }

  onSessionUpdated(): Observable<void> {
    return this.sessionUpdated$.asObservable();
  }

  onVoteSubmitted(): Observable<string> {
    return this.voteSubmitted$.asObservable();
  }

  onVotesRevealed(): Observable<VoteResults> {
    return this.votesRevealed$.asObservable();
  }

  onParticipantJoined(): Observable<string> {
    return this.participantJoined$.asObservable();
  }

  onParticipantLeft(): Observable<string> {
    return this.participantLeft$.asObservable();
  }

  // Utility Methods
  isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  getConnectionId(): string | null {
    return this.hubConnection?.connectionId || null;
  }
}