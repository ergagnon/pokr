import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval, switchMap, catchError, of } from 'rxjs';
import { SessionService } from '../../core/services/session.service';
import { SignalRService } from '../../shared/services/signalr.service';
import { ExportService } from '../../shared/services/export.service';
import { 
  SessionStatusDto, 
  UserStoryDto, 
  ParticipantDto, 
  VoteResults,
  AddStoryRequest 
} from '../../core/models/session.model';
import { SessionSummaryData } from '../../shared/components/session-summary/session-summary.component';

@Component({
  selector: 'app-facilitator-dashboard',
  templateUrl: './facilitator-dashboard.component.html',
  styleUrls: ['./facilitator-dashboard.component.scss']
})
export class FacilitatorDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  sessionCode: string = '';
  sessionStatus: SessionStatusDto | null = null;
  currentStory: UserStoryDto | null = null;
  participants: ParticipantDto[] = [];
  stories: UserStoryDto[] = [];
  voteResults: VoteResults | null = null;
  
  // UI State
  isLoading = true;
  isAddingStory = false;
  isRevealingVotes = false;
  isFinalizingEstimate = false;
  newStoryTitle = '';
  finalEstimate: number | null = null;
  showSessionSummary = false;
  sessionSummaryData: SessionSummaryData | null = null;
  
  // Voting status
  votingInProgress = false;
  allParticipantsVoted = false;
  
  // Fibonacci sequence for estimates
  fibonacciSequence = [1, 2, 3, 5, 8, 13, 21];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private signalRService: SignalRService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.sessionCode = this.route.snapshot.paramMap.get('code') || '';
    
    if (!this.sessionCode) {
      this.router.navigate(['/sessions']);
      return;
    }

    this.initializeSession();
    this.setupSignalRConnection();
    this.startPollingSessionStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.signalRService.leaveSessionGroup(this.sessionCode);
  }

  private initializeSession(): void {
    this.loadSessionStatus();
  }

  private setupSignalRConnection(): void {
    this.signalRService.startConnection()
      .then(() => {
        this.signalRService.joinSessionGroup(this.sessionCode);
        
        // Listen for real-time updates
        this.signalRService.onSessionUpdated()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.loadSessionStatus();
          });

        this.signalRService.onVoteSubmitted()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.loadSessionStatus();
            this.checkVotingStatus();
          });

        this.signalRService.onVotesRevealed()
          .pipe(takeUntil(this.destroy$))
          .subscribe((results: VoteResults) => {
            this.voteResults = results;
            this.votingInProgress = false;
          });
      })
      .catch(error => {
        console.error('SignalR connection failed:', error);
      });
  }

  private startPollingSessionStatus(): void {
    // Poll session status every 5 seconds as backup to SignalR
    interval(5000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.sessionService.getSessionStatus(this.sessionCode)),
        catchError(error => {
          console.error('Error polling session status:', error);
          return of(null);
        })
      )
      .subscribe(status => {
        if (status) {
          this.updateSessionData(status);
        }
      });
  }

  private loadSessionStatus(): void {
    this.sessionService.getSessionStatus(this.sessionCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.updateSessionData(status);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading session status:', error);
          this.isLoading = false;
          if (error.status === 404) {
            this.router.navigate(['/sessions']);
          }
        }
      });
  }

  private updateSessionData(status: SessionStatusDto): void {
    this.sessionStatus = status;
    this.participants = status.participants;
    this.currentStory = status.currentStory || null;
    this.stories = status.stories || [];
    this.checkVotingStatus();
  }

  private checkVotingStatus(): void {
    if (this.currentStory && this.participants.length > 0) {
      this.allParticipantsVoted = this.participants.every(p => p.hasVotedForCurrentStory);
      this.votingInProgress = this.participants.some(p => p.hasVotedForCurrentStory) && !this.allParticipantsVoted;
    } else {
      this.allParticipantsVoted = false;
      this.votingInProgress = false;
    }
  }

  // Story Management
  addStory(): void {
    if (!this.newStoryTitle.trim()) {
      return;
    }

    this.isAddingStory = true;
    const request: AddStoryRequest = {
      title: this.newStoryTitle.trim()
    };

    this.sessionService.addStory(this.sessionCode, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (story) => {
          this.newStoryTitle = '';
          this.isAddingStory = false;
          this.loadSessionStatus(); // Refresh to get updated stories list
        },
        error: (error) => {
          console.error('Error adding story:', error);
          this.isAddingStory = false;
        }
      });
  }

  setCurrentStory(story: UserStoryDto): void {
    if (story.id === this.currentStory?.id) {
      return; // Already current story
    }

    this.sessionService.setActiveStory(this.sessionCode, story.id.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.currentStory = story;
          this.voteResults = null; // Clear previous vote results
          this.votingInProgress = false;
          this.allParticipantsVoted = false;
          this.loadSessionStatus();
        },
        error: (error) => {
          console.error('Error setting current story:', error);
        }
      });
  }

  // Voting Controls
  revealVotes(): void {
    if (!this.currentStory) {
      return;
    }

    this.isRevealingVotes = true;
    
    this.sessionService.revealVotes(this.sessionCode, this.currentStory.id.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.voteResults = results;
          this.votingInProgress = false;
          this.isRevealingVotes = false;
        },
        error: (error) => {
          console.error('Error revealing votes:', error);
          this.isRevealingVotes = false;
        }
      });
  }

  finalizeStoryEstimate(): void {
    if (!this.currentStory || this.finalEstimate === null) {
      return;
    }

    this.isFinalizingEstimate = true;

    this.sessionService.finalizeEstimate(
      this.sessionCode, 
      this.currentStory.id.toString(), 
      this.finalEstimate
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isFinalizingEstimate = false;
          this.finalEstimate = null;
          this.voteResults = null;
          this.loadSessionStatus(); // Refresh to show updated story status
        },
        error: (error) => {
          console.error('Error finalizing estimate:', error);
          this.isFinalizingEstimate = false;
        }
      });
  }

  onFinalizeEstimate(finalPoints: number): void {
    if (!this.currentStory) {
      return;
    }

    this.isFinalizingEstimate = true;

    this.sessionService.finalizeEstimate(
      this.sessionCode, 
      this.currentStory.id.toString(), 
      finalPoints
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isFinalizingEstimate = false;
          this.voteResults = null;
          this.loadSessionStatus(); // Refresh to show updated story status
        },
        error: (error) => {
          console.error('Error finalizing estimate:', error);
          this.isFinalizingEstimate = false;
        }
      });
  }

  // Utility methods
  getParticipantVotingStatus(): string {
    const votedCount = this.participants.filter(p => p.hasVotedForCurrentStory).length;
    const totalCount = this.participants.length;
    return `${votedCount}/${totalCount} voted`;
  }

  getEstimateDisplayValue(estimate: number): string {
    switch (estimate) {
      case -1: return '?';
      case -2: return '☕';
      default: return estimate.toString();
    }
  }

  getConsensusMessage(): string {
    if (!this.voteResults) return '';
    
    if (this.voteResults.hasConsensus) {
      return `Consensus reached! Suggested estimate: ${this.getEstimateDisplayValue(this.voteResults.suggestedEstimate || 0)}`;
    } else {
      return 'No consensus. Discussion needed.';
    }
  }

  canRevealVotes(): boolean {
    return this.currentStory !== null && 
           this.allParticipantsVoted && 
           !this.voteResults && 
           !this.isRevealingVotes;
  }

  canFinalizeEstimate(): boolean {
    return this.voteResults !== null && 
           this.finalEstimate !== null && 
           !this.isFinalizingEstimate;
  }

  // Utility methods for template
  getVotingProgress(): number {
    if (this.participants.length === 0) return 0;
    const votedCount = this.participants.filter(p => p.hasVotedForCurrentStory).length;
    return (votedCount / this.participants.length) * 100;
  }

  getDistributionPercentage(count: number): number {
    if (!this.voteResults || this.voteResults.votes.length === 0) return 0;
    return (count / this.voteResults.votes.length) * 100;
  }

  // Session Completion and Export
  showSummary(): void {
    if (!this.sessionStatus) return;
    
    const estimatedStories = this.stories.filter(s => s.finalEstimate !== null && s.finalEstimate !== undefined);
    const totalStoryPoints = estimatedStories.reduce((sum, story) => sum + (story.finalEstimate || 0), 0);
    const averageStoryPoints = estimatedStories.length > 0 ? totalStoryPoints / estimatedStories.length : 0;
    
    this.sessionSummaryData = {
      session: this.sessionStatus,
      estimatedStories: estimatedStories,
      totalStoryPoints: totalStoryPoints,
      averageStoryPoints: averageStoryPoints,
      sessionDuration: this.calculateSessionDuration()
    };
    
    this.showSessionSummary = true;
  }

  onExportSession(format: 'json' | 'csv' | 'pdf'): void {
    if (!this.sessionSummaryData) return;
    
    switch (format) {
      case 'json':
        this.exportService.exportSessionAsJson(this.sessionSummaryData);
        break;
      case 'csv':
        this.exportService.exportSessionAsCsv(this.sessionSummaryData);
        break;
      case 'pdf':
        this.exportService.exportSessionAsPdf(this.sessionSummaryData);
        break;
    }
  }

  onArchiveSession(): void {
    // In a real application, this would call a backend API to archive the session
    // For now, we'll just show a confirmation and navigate away
    if (confirm('Are you sure you want to archive this session? This action cannot be undone.')) {
      console.log('Session archived:', this.sessionCode);
      this.router.navigate(['/sessions']);
    }
  }

  onCloseSummary(): void {
    this.showSessionSummary = false;
    this.sessionSummaryData = null;
  }

  private calculateSessionDuration(): string {
    // This is a simplified calculation. In a real app, you'd track session start time
    // For now, we'll use the earliest story creation time as a proxy
    if (!this.stories || this.stories.length === 0) return 'Unknown';
    
    const earliestStory = this.stories.reduce((earliest, story) => 
      new Date(story.createdAt) < new Date(earliest.createdAt) ? story : earliest
    );
    
    const startTime = new Date(earliestStory.createdAt);
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Utility methods for session completion
  getSessionCompletionPercentage(): number {
    if (!this.stories || this.stories.length === 0) return 100;
    
    const estimatedCount = this.stories.filter(s => s.finalEstimate !== null && s.finalEstimate !== undefined).length;
    return Math.round((estimatedCount / this.stories.length) * 100);
  }

  canCompleteSession(): boolean {
    return this.stories && this.stories.length > 0 && 
           this.stories.some(s => s.finalEstimate !== null && s.finalEstimate !== undefined);
  }

  // Navigation
  goToParticipantView(): void {
    this.router.navigate(['/session', this.sessionCode, 'participant']);
  }

  goBack(): void {
    this.router.navigate(['/sessions']);
  }
}