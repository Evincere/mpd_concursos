import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';

@Component({
  selector: 'app-recent-section',
  standalone: true,
  imports: [CommonModule, ContestStatusBadgeComponent],
  templateUrl: './recent-section.component.html',
  styleUrl: './recent-section.component.scss'
})
export class RecentSectionComponent implements OnInit {
  @Input() recentConcursos: RecentConcurso[] = [];

  ngOnInit(): void {
    // Logging implementado con LoggingService
  }
}