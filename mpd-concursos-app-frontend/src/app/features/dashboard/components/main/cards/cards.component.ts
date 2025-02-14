import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Card } from '@shared/interfaces/concurso/card.interface';

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cards']) {
      console.log('Cards Component - Nuevas cards recibidas:', this.cards);
    }
  }
}
