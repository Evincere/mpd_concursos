import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-recent-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-section.component.html',
  styleUrl: './recent-section.component.scss'
})
export class RecentSectionComponent {
  @Input() recentConcursos!: any[];
}
