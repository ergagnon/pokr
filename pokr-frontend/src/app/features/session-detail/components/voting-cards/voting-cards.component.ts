import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface VotingCard {
  value: string;
  displayValue: string;
  isSpecial: boolean;
}

@Component({
  selector: 'app-voting-cards',
  templateUrl: './voting-cards.component.html',
  styleUrls: ['./voting-cards.component.scss']
})
export class VotingCardsComponent {
  @Input() hasSubmitted: boolean = false;
  @Input() isSubmitting: boolean = false;
  @Input() errorMessage: string | null = null;
  
  @Output() voteSelected = new EventEmitter<string>();
  @Output() voteSubmitted = new EventEmitter<string>();
  @Output() selectionCleared = new EventEmitter<void>();

  selectedCard: VotingCard | null = null;

  // Fibonacci sequence with special cards as per requirements
  votingCards: VotingCard[] = [
    { value: '1', displayValue: '1', isSpecial: false },
    { value: '2', displayValue: '2', isSpecial: false },
    { value: '3', displayValue: '3', isSpecial: false },
    { value: '5', displayValue: '5', isSpecial: false },
    { value: '8', displayValue: '8', isSpecial: false },
    { value: '13', displayValue: '13', isSpecial: false },
    { value: '21', displayValue: '21', isSpecial: false },
    { value: '?', displayValue: '?', isSpecial: true },
    { value: 'coffee', displayValue: '☕', isSpecial: true }
  ];

  selectCard(card: VotingCard): void {
    if (this.hasSubmitted || this.isSubmitting) {
      return;
    }

    this.selectedCard = card;
    this.voteSelected.emit(card.value);
  }

  submitVote(): void {
    if (!this.selectedCard || this.hasSubmitted || this.isSubmitting) {
      return;
    }

    this.voteSubmitted.emit(this.selectedCard.value);
  }

  clearSelection(): void {
    if (this.hasSubmitted || this.isSubmitting) {
      return;
    }

    this.selectedCard = null;
    this.selectionCleared.emit();
  }

  // Helper method to get numeric value for API submission
  getNumericValue(cardValue: string): number {
    switch (cardValue) {
      case '?':
        return -1; // Unknown/uncertain
      case 'coffee':
        return -2; // Break/coffee
      default:
        return parseInt(cardValue, 10);
    }
  }
}