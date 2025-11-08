import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { VoteResults, VoteDto } from '../../../core/models/session.model';

@Component({
  selector: 'app-results-display',
  templateUrl: './results-display.component.html',
  styleUrls: ['./results-display.component.scss']
})
export class ResultsDisplayComponent implements OnChanges {
  @Input() voteResults: VoteResults | null = null;
  @Input() showFinalizeControls: boolean = true;
  @Input() fibonacciSequence: number[] = [1, 2, 3, 5, 8, 13, 21];
  @Input() isFinalizingEstimate: boolean = false;
  
  @Output() finalizeEstimate = new EventEmitter<number>();
  
  selectedFinalEstimate: number | null = null;
  sortedVotes: VoteDto[] = [];
  highestVotes: VoteDto[] = [];
  lowestVotes: VoteDto[] = [];
  distributionEntries: Array<{estimate: number, count: number, percentage: number}> = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['voteResults'] && this.voteResults) {
      this.processVoteResults();
    }
  }

  private processVoteResults(): void {
    if (!this.voteResults) return;

    // Sort votes by estimate value for better display
    this.sortedVotes = [...this.voteResults.votes].sort((a, b) => {
      // Handle special values (? = -1, ☕ = -2)
      const aValue = a.estimate < 0 ? 999 + Math.abs(a.estimate) : a.estimate;
      const bValue = b.estimate < 0 ? 999 + Math.abs(b.estimate) : b.estimate;
      return aValue - bValue;
    });

    // Find highest and lowest estimates (excluding special values)
    const numericVotes = this.voteResults.votes.filter(v => v.estimate > 0);
    if (numericVotes.length > 0) {
      const maxEstimate = Math.max(...numericVotes.map(v => v.estimate));
      const minEstimate = Math.min(...numericVotes.map(v => v.estimate));
      
      this.highestVotes = this.voteResults.votes.filter(v => v.estimate === maxEstimate);
      this.lowestVotes = this.voteResults.votes.filter(v => v.estimate === minEstimate);
    } else {
      this.highestVotes = [];
      this.lowestVotes = [];
    }

    // Process distribution data
    this.distributionEntries = Object.entries(this.voteResults.estimateDistribution)
      .map(([estimate, count]) => ({
        estimate: +estimate,
        count: count,
        percentage: (count / this.voteResults!.votes.length) * 100
      }))
      .sort((a, b) => {
        // Same sorting logic as votes
        const aValue = a.estimate < 0 ? 999 + Math.abs(a.estimate) : a.estimate;
        const bValue = b.estimate < 0 ? 999 + Math.abs(b.estimate) : b.estimate;
        return aValue - bValue;
      });

    // Set suggested estimate as default final estimate
    if (this.voteResults.suggestedEstimate !== undefined) {
      this.selectedFinalEstimate = this.voteResults.suggestedEstimate;
    }
  }

  getEstimateDisplayValue(estimate: number): string {
    switch (estimate) {
      case -1: return '?';
      case -2: return '☕';
      default: return estimate.toString();
    }
  }

  getEstimateClass(estimate: number): string {
    if (estimate < 0) {
      return `estimate-special estimate-${Math.abs(estimate)}`;
    }
    return `estimate-${estimate}`;
  }

  isHighestVote(vote: VoteDto): boolean {
    return this.highestVotes.some(hv => hv.id === vote.id);
  }

  isLowestVote(vote: VoteDto): boolean {
    return this.lowestVotes.some(lv => lv.id === vote.id);
  }

  getConsensusMessage(): string {
    if (!this.voteResults) return '';
    
    if (this.voteResults.hasConsensus) {
      return `Consensus reached! Suggested estimate: ${this.getEstimateDisplayValue(this.voteResults.suggestedEstimate || 0)}`;
    } else {
      return 'No consensus reached. Discussion recommended.';
    }
  }

  getConsensusIcon(): string {
    return this.voteResults?.hasConsensus ? 'check_circle' : 'warning';
  }

  onFinalizeEstimate(): void {
    if (this.selectedFinalEstimate !== null) {
      this.finalizeEstimate.emit(this.selectedFinalEstimate);
    }
  }

  canFinalize(): boolean {
    return this.selectedFinalEstimate !== null && !this.isFinalizingEstimate;
  }

  getHighestVoteParticipants(): string {
    return this.highestVotes.map(v => v.participantName).join(', ');
  }

  getLowestVoteParticipants(): string {
    return this.lowestVotes.map(v => v.participantName).join(', ');
  }

  // Helper method to get vote statistics
  getVoteStatistics(): {min: number, max: number, avg: number, median: number} | null {
    if (!this.voteResults) return null;

    const numericVotes = this.voteResults.votes
      .map(v => v.estimate)
      .filter(e => e > 0)
      .sort((a, b) => a - b);

    if (numericVotes.length === 0) return null;

    const min = numericVotes[0];
    const max = numericVotes[numericVotes.length - 1];
    const avg = numericVotes.reduce((sum, val) => sum + val, 0) / numericVotes.length;
    
    let median: number;
    const mid = Math.floor(numericVotes.length / 2);
    if (numericVotes.length % 2 === 0) {
      median = (numericVotes[mid - 1] + numericVotes[mid]) / 2;
    } else {
      median = numericVotes[mid];
    }

    return { min, max, avg: Math.round(avg * 10) / 10, median };
  }
}