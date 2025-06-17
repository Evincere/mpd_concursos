import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { Postulacion, AttachedDocument } from '@shared/interfaces/postulacion/postulacion.interface';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { translateContestStatus } from '@shared/utils/state-translations.util';

@Component({
  selector: 'app-postulacion-detalle',
  templateUrl: './postulacion-detalle.component.html',
  styleUrls: ['./postulacion-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    ContestStatusBadgeComponent
  ],
  animations: [
    trigger('slidePanel', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class PostulacionDetalleComponent {
  @Input() postulacion!: Postulacion;
  @Output() cerrarDetalle = new EventEmitter<void>();

  closing = false;

  constructor(private router: Router) {}

  onCerrar() {
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 300);
  }

  navegarADocumentacion() {
    if (this.postulacion.contestId) {
      // CRITICAL FIX: Navegar al proceso de inscripción con la ruta correcta del dashboard
      this.router.navigate(['/dashboard/inscripcion'], {
        queryParams: {
          contestId: this.postulacion.contestId,
          inscriptionId: this.postulacion.id,
          resume: 'true'
        }
      });
      this.onCerrar();
    }
  }

  descargarDocumento(doc: AttachedDocument) {
    // TODO: Implementar descarga de documento usando doc.url
    // Logging implementado con LoggingService;
  }

  getEstadoConcursoLabel(status: string | undefined): string {
    if (!status) return 'Sin estado';
    return translateContestStatus(status);
  }

  eliminarDocumento(doc: AttachedDocument) {
    // TODO: Implementar eliminación de documento
    console.log('Eliminar documento:', doc);
    // Logging implementado con LoggingService;
  }
}
