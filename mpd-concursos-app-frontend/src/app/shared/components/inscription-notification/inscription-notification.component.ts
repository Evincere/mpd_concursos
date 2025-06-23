import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';


@Component({
  selector: 'app-inscription-notification',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './inscription-notification.component.html',
  styleUrls: ['./inscription-notification.component.scss']
})
export class InscriptionNotificationComponent implements OnInit {
  @Input() inscriptionId?: string;
  @Input() contestId?: number;
  @Input() contestTitle?: string;
  @Input() status?: InscripcionState;
  @Input() updatedAt?: string;
  @Input() showActions = true;

  statusInfo: { icon: string; color: string; text: string; description: string } = {
    icon: 'info',
    color: 'primary',
    text: 'Información',
    description: 'Estado de la inscripción'
  };

  

  ngOnInit(): void {
    this.updateStatusInfo();
  }

  private updateStatusInfo(): void {
    if (!this.status) {
      this.statusInfo = {
        icon: 'info',
        color: 'primary',
        text: 'Estado desconocido',
        description: 'No se pudo determinar el estado de la inscripción.'
      };
      return;
    }

    // REFACTORING: Solo estados estándar después de eliminar legacy
    switch (this.status) {
      case InscripcionState.PENDING:
        this.statusInfo = {
          icon: 'hourglass_top',
          color: 'warn',
          text: 'Pendiente de validación',
          description: 'Tu inscripción está siendo revisada por el equipo administrativo.'
        };
        break;
      case InscripcionState.COMPLETED_WITH_DOCS:
        this.statusInfo = {
          icon: 'check_circle',
          color: 'success',
          text: 'Completada con documentos',
          description: 'Tu inscripción está completa con toda la documentación requerida.'
        };
        break;
      case InscripcionState.COMPLETED_PENDING_DOCS:
        this.statusInfo = {
          icon: 'file_upload',
          color: 'warn',
          text: 'Documentos pendientes',
          description: 'Tu inscripción está completa pero faltan documentos. Tienes 3 días para completarlos.'
        };
        break;
      case InscripcionState.FROZEN:
        this.statusInfo = {
          icon: 'ac_unit',
          color: 'grey',
          text: 'Inscripción congelada',
          description: 'Tu inscripción ha sido congelada por vencimiento del plazo de documentación.'
        };
        break;
      case InscripcionState.APPROVED:
      case InscripcionState.INSCRIPTO:
        this.statusInfo = {
          icon: 'check_circle',
          color: 'success',
          text: 'Inscripción aprobada',
          description: 'Tu inscripción ha sido aprobada. ¡Felicitaciones!'
        };
        break;
      case InscripcionState.REJECTED:
        this.statusInfo = {
          icon: 'cancel',
          color: 'error',
          text: 'Inscripción rechazada',
          description: 'Tu inscripción ha sido rechazada. Contacta al equipo administrativo para más información.'
        };
        break;
      case InscripcionState.CANCELLED:
        this.statusInfo = {
          icon: 'block',
          color: 'grey',
          text: 'Inscripción cancelada',
          description: 'Has cancelado tu inscripción a este concurso.'
        };
        break;
      case InscripcionState.ACTIVE:
      case InscripcionState.IN_PROCESS:
        this.statusInfo = {
          icon: 'edit',
          color: 'info',
          text: 'Inscripción en proceso',
          description: 'Tu inscripción está en proceso. Completa todos los pasos para finalizar.'
        };
        break;
      default:
        this.statusInfo = {
          icon: 'info',
          color: 'primary',
          text: InscripcionStateUtils.getStateLabel(this.status),
          description: 'Estado de inscripción: ' + InscripcionStateUtils.getStateLabel(this.status)
        };
    }
  }

  viewInscription(): void {
    this.router.navigate(['/postulaciones']);
  }

  continueInscription(): void {
    if (!this.contestId || !this.inscriptionId) {
      console.warn('No se puede continuar la inscripción: falta el ID del concurso o de la inscripción');
      return;
    }

    // CRITICAL FIX: Usar la ruta correcta del dashboard y parámetros estándar
    this.router.navigate(['/dashboard/inscripcion'], {
      queryParams: {
        contestId: this.contestId,
        inscriptionId: this.inscriptionId,
        resume: 'true'
      }
    });
  }

  viewContest(): void {
    if (!this.contestId) {
      console.warn('No se puede ver el concurso: falta el ID del concurso');
      return;
    }

    this.router.navigate(['/concursos', this.contestId]);
  }
}
