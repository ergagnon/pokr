import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SessionStatusDto, UserStoryDto } from '../../../core/models/session.model';

export interface SessionSummaryData {
  session: SessionStatusDto;
  estimatedStories: UserStoryDto[];
  totalStoryPoints: number;
  averageStoryPoints: number;
  sessionDuration?: string;
}

@Component({
  selector: 'app-session-summary',
  templateUrl: './session-summary.component.html',
  styleUrls: ['./session-summary.component.scss']
})
export class SessionSummaryComponent {
  @Input() sessionData: SessionSummaryData | null = null;
  @Input() showExportOptions: boolean = true;
  @Input() showArchiveOptions: boolean = true;
  
  @Output() exportSession = new EventEmitter<'json' | 'csv' | 'pdf'>();
  @Output() archiveSession = new EventEmitter<void>();
  @Output() closeSession = new EventEmitter<void>();

  getEstimateDisplayValue(estimate: number | null | undefined): string {
    if (estimate === null || estimate === undefined) return 'Not estimated';
    
    switch (estimate) {
      case -1: return '? (Unknown)';
      case -2: return '☕ (Break needed)';
      default: return `${estimate} points`;
    }
  }

  getStoryStatusClass(story: UserStoryDto): string {
    if (story.finalEstimate !== null && story.finalEstimate !== undefined) {
      return 'estimated';
    }
    return 'not-estimated';
  }

  onExport(format: 'json' | 'csv' | 'pdf'): void {
    this.exportSession.emit(format);
  }

  onArchive(): void {
    this.archiveSession.emit();
  }

  onClose(): void {
    this.closeSession.emit();
  }

  getCompletionPercentage(): number {
    if (!this.sessionData || !this.sessionData.session.stories) return 0;
    
    const totalStories = this.sessionData.session.stories.length;
    if (totalStories === 0) return 100;
    
    const estimatedStories = this.sessionData.estimatedStories.length;
    return Math.round((estimatedStories / totalStories) * 100);
  }

  getSessionStats(): {
    totalStories: number;
    estimatedStories: number;
    pendingStories: number;
    totalParticipants: number;
  } {
    if (!this.sessionData) {
      return { totalStories: 0, estimatedStories: 0, pendingStories: 0, totalParticipants: 0 };
    }

    const totalStories = this.sessionData.session.stories?.length || 0;
    const estimatedStories = this.sessionData.estimatedStories.length;
    const pendingStories = totalStories - estimatedStories;
    const totalParticipants = this.sessionData.session.participantCount;

    return { totalStories, estimatedStories, pendingStories, totalParticipants };
  }

  hasPendingStories(): boolean {
    if (!this.sessionData?.session?.stories) return false;
    const totalStories = this.sessionData.session.stories.length;
    const estimatedStories = this.sessionData.estimatedStories?.length || 0;
    return totalStories > estimatedStories;
  }
}