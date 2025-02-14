import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';

@Component({
  selector: 'app-recent-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-section.component.html',
  styleUrl: './recent-section.component.scss'
})
export class RecentSectionComponent implements OnInit {
  @Input() recentConcursos: RecentConcurso[] = [];

  ngOnInit() {
    console.log('[RecentSectionComponent] Concursos recientes recibidos:', this.recentConcursos);
  }
}
