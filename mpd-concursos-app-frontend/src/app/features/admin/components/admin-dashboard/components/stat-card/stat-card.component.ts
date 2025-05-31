import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule
  ]
})
export class StatCardComponent {
  @Input() icon = 'info';
  @Input() iconColor = '#2196f3';
  @Input() title = '';
  @Input() value: number | string = 0;
  @Input() subtitle = '';
  @Input() trend: number | null = null;
  @Input() trendLabel = '';
  @Input() link: string | null = null;
  @Input() linkLabel = 'Ver detalles';
  @Input() tooltipText = '';
}
