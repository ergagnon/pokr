import { Injectable } from '@angular/core';
import { FIBONACCI_VALUES } from '../models/session.models';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Generate a random session code (for testing purposes)
   */
  generateSessionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Format estimate value for display
   */
  formatEstimate(estimate: number): string {
    switch (estimate) {
      case -1:
        return '?';
      case -2:
        return '☕';
      default:
        return estimate.toString();
    }
  }

  /**
   * Get estimate display value
   */
  getEstimateDisplay(estimate: number): { value: string; label: string } {
    switch (estimate) {
      case -1:
        return { value: '?', label: 'Unknown' };
      case -2:
        return { value: '☕', label: 'Break' };
      default:
        return { value: estimate.toString(), label: `${estimate} points` };
    }
  }

  /**
   * Get all available voting options
   */
  getVotingOptions(): Array<{ value: number; display: string; label: string }> {
    return FIBONACCI_VALUES.map(value => {
      const display = this.getEstimateDisplay(value);
      return {
        value,
        display: display.value,
        label: display.label
      };
    });
  }

  /**
   * Validate session code format
   */
  isValidSessionCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code);
  }

  /**
   * Validate participant name
   */
  isValidParticipantName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  /**
   * Calculate consensus from votes
   */
  calculateConsensus(votes: number[]): { hasConsensus: boolean; suggestedEstimate?: number } {
    if (votes.length === 0) {
      return { hasConsensus: false };
    }

    // Filter out special votes (? and ☕)
    const numericVotes = votes.filter(v => v > 0);
    
    if (numericVotes.length === 0) {
      return { hasConsensus: false };
    }

    const uniqueVotes = [...new Set(numericVotes)];
    
    // Perfect consensus - all votes are the same
    if (uniqueVotes.length === 1) {
      return { hasConsensus: true, suggestedEstimate: uniqueVotes[0] };
    }

    // Close consensus - votes are within 1 Fibonacci number
    const sortedVotes = uniqueVotes.sort((a, b) => a - b);
    const fibSequence = [1, 2, 3, 5, 8, 13, 21];
    
    const minIndex = fibSequence.indexOf(sortedVotes[0]);
    const maxIndex = fibSequence.indexOf(sortedVotes[sortedVotes.length - 1]);
    
    if (minIndex !== -1 && maxIndex !== -1 && maxIndex - minIndex <= 1) {
      // Suggest the higher value for close consensus
      return { hasConsensus: true, suggestedEstimate: sortedVotes[sortedVotes.length - 1] };
    }

    return { hasConsensus: false };
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  /**
   * Format relative time (e.g., "2 minutes ago")
   */
  formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      const days = Math.floor(diffMinutes / 1440);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  }
}