import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Subject, takeUntil, combineLatest, timer } from 'rxjs';
import { SessionService } from '../../../../core/services/session.service';
import { SignalRService } from '../../../../shared/services/signalr.service';
import { 
  SessionStatusDto, 
  ParticipantDto, 
  UserStoryDto, 
  VoteResults,
  SubmitVoteRequest 
} from '../../../../core/models/session.model';

@Component({
  selector: 'app-participant-view',
  templateUrl: './participant-view.component.html',
  styleUrls: ['./participant-view.component.scss']
})
export class ParticipantViewComponent implements OnInit, OnDestroy {
  @Input() sessionCode!: string;
  @Input() participantName!: string;

  private destroy$ = new Subject<void>();

  // Session state
  sessionStatus: SessionStatusDto | null = null;
  currentStory: UserStoryDto | null = null;
  participants: ParticipantDto[] = [];
  
  // Voting state
  hasVoted: boolean = false;
  isSubmittingVote: boolean = false;
  voteError: string | null = null;
  selectedVote: string | null = null;
  
  // Real-time state
  isConnected: boolean = false;
  connectionError: string | null = null;
  lastUpdated: Date | null = null;
  
  // Vote results (when revealed)
  voteResults: VoteResults | null = null;
  showResults: boolean = false;

  constructor(
    private sessionService: SessionService,
    private signalRService: SignalRService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.sessionCode || !this.participantName) {
      this.connectionError = 'Missing session code or participant name';
      return;
    }

    await this.initializeConnection();
    this.setupRealTimeUpdates();
    await this.loadSessionStatus();
    
    // Set up periodic refresh as fallback
    this.setupPeriodicRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.sessionCode) {
      this.signalRService.leaveSessionGroup(this.sessionCode);
    }
  }

  private async initializeConnection(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      await this.signalRService.joinSessionGroup(this.sessionCode);
      this.isConnected = true;
      this.connectionError = null;
    } catch (error) {
      console.error('Failed to establish SignalR connection:', error);
      this.isConnected = false;
      this.connectionError = 'Failed to connect to real-time updates';
    }
  }

  private setupRealTimeUpdates(): void {
    // Listen for session updates
    this.signalRService.onSessionUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSessionStatus();
      });

    // Listen for vote submissions
    this.signalRService.onVoteSubmitted()
      .pipe(takeUntil(this.destroy$))
      .subscribe((participantName: string) => {
        this.updateParticipantVoteStatus(participantName, true);
      });

    // Listen for vote reveals
    this.signalRService.onVotesRevealed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((results: VoteResults) => {
        this.voteResults = results;
        this.showResults = true;
        this.loadSessionStatus(); // Refresh to get updated story status
      });

    // Listen for participant changes
    combineLatest([
      this.signalRService.onParticipantJoined(),
      this.signalRService.onParticipantLeft()
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSessionStatus();
      });

    // Monitor connection state
    this.signalRService.getConnectionState()
      .pipe(takeUntil(this.destroy$))
      .subscribe((state: string) => {
        this.isConnected = state === 'Connected';
        if (state === 'Failed') {
          this.connectionError = 'Real-time connection failed';
        } else if (state === 'Connected') {
          this.connectionError = null;
        }
      });
  }

  private setupPeriodicRefresh(): void {
    // Refresh session status every 30 seconds as fallback
    timer(0, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isConnected) {
          this.loadSessionStatus();
        }
      });
  }

  private async loadSessionStatus(): Promise<void> {
    try {
      const status = await this.sessionService.getSessionStatus(this.sessionCode).toPromise();
      this.sessionStatus = status || null;
      
      if (this.sessionStatus) {
        this.currentStory = this.sessionStatus.currentStory || null;
        this.participants = this.sessionStatus.participants || [];
        this.updateVotingState();
        this.lastUpdated = new Date();
      }
    } catch (error) {
      console.error('Failed to load session status:', error);
      this.connectionError = 'Failed to load session data';
    }
  }

  private updateVotingState(): void {
    if (!this.currentStory || !this.participantName) {
      this.hasVoted = false;
      return;
    }

    // Check if current participant has voted for the current story
    const currentParticipant = this.participants.find(p => p.name === this.participantName);
    this.hasVoted = currentParticipant?.hasVotedForCurrentStory || false;
    
    // Reset vote results if story changed
    if (this.voteResults && this.voteResults.storyId !== this.currentStory.id) {
      this.voteResults = null;
      this.showResults = false;
    }
  }

  private updateParticipantVoteStatus(participantName: string, hasVoted: boolean): void {
    const participant = this.participants.find(p => p.name === participantName);
    if (participant) {
      participant.hasVotedForCurrentStory = hasVoted;
    }
  }

  // Voting handlers
  onVoteSelected(cardValue: string): void {
    this.selectedVote = cardValue;
    this.voteError = null;
  }

  async onVoteSubmitted(cardValue: string): Promise<void> {
    if (!this.currentStory || this.hasVoted || this.isSubmittingVote) {
      return;
    }

    this.isSubmittingVote = true;
    this.voteError = null;

    try {
      // Convert card value to numeric estimate
      const numericEstimate = this.getNumericEstimate(cardValue);
      const request: SubmitVoteRequest = { estimate: numericEstimate };
      
      await this.sessionService.submitVote(this.sessionCode, request, this.participantName).toPromise();
      
      this.hasVoted = true;
      this.selectedVote = cardValue;
      
      // Notify other participants via SignalR
      if (this.isConnected) {
        await this.signalRService.notifyVoteSubmitted(this.sessionCode, this.participantName);
      }
      
      // Update local participant status
      this.updateParticipantVoteStatus(this.participantName, true);
      
    } catch (error) {
      console.error('Failed to submit vote:', error);
      this.voteError = 'Failed to submit vote. Please try again.';
    } finally {
      this.isSubmittingVote = false;
    }
  }

  onSelectionCleared(): void {
    this.selectedVote = null;
    this.voteError = null;
  }

  private getNumericEstimate(cardValue: string): number {
    switch (cardValue) {
      case '?':
        return -1; // Unknown/uncertain
      case 'coffee':
        return -2; // Break/coffee
      default:
        return parseInt(cardValue, 10) || 0;
    }
  }

  // Helper methods for template
  getVotedParticipantsCount(): number {
    return this.participants.filter(p => p.hasVotedForCurrentStory).length;
  }

  getTotalParticipantsCount(): number {
    return this.participants.length;
  }

  getAllParticipantsVoted(): boolean {
    return this.participants.length > 0 && 
           this.participants.every(p => p.hasVotedForCurrentStory);
  }

  getParticipantVoteStatus(participant: ParticipantDto): string {
    if (participant.hasVotedForCurrentStory) {
      return 'Voted';
    }
    return 'Waiting...';
  }

  getParticipantStatusIcon(participant: ParticipantDto): string {
    if (participant.hasVotedForCurrentStory) {
      return 'check_circle';
    }
    return 'schedule';
  }

  getConnectionStatusText(): string {
    if (this.isConnected) {
      return 'Connected';
    } else if (this.connectionError) {
      return 'Connection Error';
    } else {
      return 'Connecting...';
    }
  }

  getConnectionStatusColor(): string {
    if (this.isConnected) {
      return 'primary';
    } else if (this.connectionError) {
      return 'warn';
    } else {
      return 'accent';
    }
  }
}