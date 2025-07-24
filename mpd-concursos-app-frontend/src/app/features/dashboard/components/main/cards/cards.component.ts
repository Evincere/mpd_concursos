import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { LoggingService } from '@core/services/logging/logging.service';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss'
})
export class CardsComponent implements OnChanges {
  @Input() cards!: Card[];

  constructor(private loggingService: LoggingService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.loggingService.debug('[CardsComponent] Cards input changed', this.cards, 'CardsComponent');

      // CRITICAL DEBUG: Log each card individually to see exact values
      this.cards?.forEach((card, index) => {
        this.loggingService.debug(`[CardsComponent] Card ${index}: ${card.title} = ${card.count}`, card, 'CardsComponent');
      });
    }
  }

  trackByCard(index: number, card: Card): string {
    return card.title;
  }
}
