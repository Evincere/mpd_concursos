import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { Postulacion, AttachedDocument } from '@shared/interfaces/postulacion/postulacion.interface';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { translateContestStatus } from '@shared/utils/state-translations.util';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { DocumentoUsuario, EstadoDocumento } from '@core/models/documento.model';

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
export class PostulacionDetalleComponent implements OnInit {
  @Input() postulacion!: Postulacion;
  @Output() cerrarDetalle = new EventEmitter<void>();

  closing = false;
  documentosUsuario: DocumentoUsuario[] = [];
  cargandoDocumentos = false;

  constructor(
    private router: Router,
    private documentosService: DocumentosService
  ) {}

  ngOnInit(): void {
    this.cargarDocumentosUsuario();
  }

  private cargarDocumentosUsuario(): void {
    this.cargandoDocumentos = true;
    this.documentosService.getDocumentosUsuario().subscribe({
      next: (documentos) => {
        this.documentosUsuario = documentos;
        this.cargandoDocumentos = false;
      },
      error: (error) => {
        console.error('Error al cargar documentos del usuario:', error);
        this.cargandoDocumentos = false;
      }
    });
  }

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

  /**
   * Obtiene el icono de estado para un documento
   */
  getDocumentStatusIcon(documento: DocumentoUsuario): string {
    switch (documento.estado) {
      case EstadoDocumento.APROBADO:
        return 'check-circle';
      case EstadoDocumento.RECHAZADO:
        return 'times-circle';
      case EstadoDocumento.PENDIENTE:
      default:
        return 'clock';
    }
  }

  /**
   * Obtiene la clase CSS para el estado del documento
   */
  getDocumentStatusClass(documento: DocumentoUsuario): string {
    switch (documento.estado) {
      case EstadoDocumento.APROBADO:
        return 'status-approved';
      case EstadoDocumento.RECHAZADO:
        return 'status-rejected';
      case EstadoDocumento.PENDIENTE:
      default:
        return 'status-pending';
    }
  }

  /**
   * Obtiene el texto del estado del documento
   */
  getDocumentStatusText(documento: DocumentoUsuario): string {
    switch (documento.estado) {
      case EstadoDocumento.APROBADO:
        return 'Validado';
      case EstadoDocumento.RECHAZADO:
        return 'Rechazado';
      case EstadoDocumento.PENDIENTE:
      default:
        return 'Pendiente de validación';
    }
  }

  /**
   * Obtiene el nombre de visualización del documento con nomenclatura estandarizada
   */
  getDocumentDisplayName(documento: DocumentoUsuario): string {
    if (documento.tipoDocumento?.nombre) {
      return `${documento.tipoDocumento.nombre}.pdf`;
    }
    return documento.nombreArchivo;
  }
}
