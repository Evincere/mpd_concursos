import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-inscripcion-container',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="inscripcion-container">
      <div class="loading-message" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Iniciando proceso de inscripción...</p>
      </div>
    </div>
  `,
  styles: [`
    .inscripcion-container {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
    }

    .loading-message {
      color: white;
      font-size: 16px;
    }
  `]
})
export class InscripcionContainerComponent implements OnInit {
  @Input() contest!: Contest;
  @Output() inscriptionCompleted = new EventEmitter<void>();

  loading = false;

  constructor(
    private router: Router,
    private inscriptionService: InscriptionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Iniciar el proceso de inscripción después de un breve retraso
    setTimeout(() => {
      this.startInscriptionProcess();
    }, 300);
  }

  startInscriptionProcess(): void {
    this.loading = true;

    // Crear nueva inscripción
    this.inscriptionService.createInscription(this.contest.id)
      .subscribe({
        next: (response: { id: string }) => {
          console.log('[InscripcionContainer] Inscripción inicial creada:', response);

          // Navegar a la página de inscripción
          this.router.navigate(['/dashboard/inscripcion'], {
            queryParams: {
              contestId: this.contest.id,
              inscriptionId: response.id
            }
          });

          this.loading = false;
        },
        error: (error) => {
          console.error('[InscripcionContainer] Error al crear inscripción:', error);
          this.notificationService.error('Error al iniciar el proceso de inscripción');
          this.loading = false;
        }
      });
  }
}