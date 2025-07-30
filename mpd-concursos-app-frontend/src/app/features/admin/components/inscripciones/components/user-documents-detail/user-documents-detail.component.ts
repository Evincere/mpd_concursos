import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Servicios
import { AdminDocumentosService, DocumentoAdminView } from '../../../../../../core/services/admin/admin-documentos.service';
import { DocumentosService } from '../../../../../../core/services/documentos/documentos.service';
import { NotificationService } from '../../../../../../core/services/notification/notification.service';
import { UnifiedDialogService, UnifiedDialogRef, DIALOG_DATA } from '../../../../../../shared/services/dialog/unified-dialog.service';

// Modelos
import { TipoDocumento } from '../../../../../../core/models/documento.model';

// Componentes compartidos
import { CustomButtonComponent } from '../../../../../../shared/components/custom-form/custom-button/custom-button.component';
import { ContestStatusBadgeComponent } from '../../../../../../shared/components/contest-status-badge/contest-status-badge.component';

export interface UsuarioDocumentacion {
  usuario: {
    id: string;
    nombre: string;
    dni: string;
    email: string;
    telefono?: string;
  };
  documentacionObligatoria: DocumentacionCategoria;
  documentacionCV: DocumentacionCV;
  documentacionOpcional: DocumentacionCategoria;
  estadoGeneral: 'COMPLETA' | 'INCOMPLETA' | 'PENDIENTE_REVISION';
  progreso: {
    obligatorios: { completados: number; total: number; porcentaje: number };
    cv: { completados: number; total: number; porcentaje: number };
    opcionales: { completados: number; total: number; porcentaje: number };
  };
}

export interface DocumentacionCategoria {
  documentos: DocumentoAdminView[];
  requeridos: TipoDocumento[];
  completados: number;
  pendientes: number;
  aprobados: number;
  rechazados: number;
}

export interface DocumentacionCV {
  experiencias: ExperienciaConDocumento[];
  educacion: EducacionConDocumento[];
  documentos: DocumentoAdminView[];
}

export interface ExperienciaConDocumento {
  id: string;
  empresa: string;
  cargo: string;
  fechaInicio: Date;
  fechaFin?: Date;
  documento?: DocumentoAdminView;
  requiereDocumento: boolean;
}

export interface EducacionConDocumento {
  id: string;
  tipo: string;
  titulo: string;
  institucion: string;
  fechaEmision?: Date;
  documento?: DocumentoAdminView;
  requiereDocumento: boolean;
}

export interface DocumentoHistorial {
  id: string;
  documentoId: string;
  accion: 'SUBIDO' | 'APROBADO' | 'RECHAZADO' | 'REEMPLAZADO' | 'ELIMINADO';
  fecha: Date;
  usuario: string;
  comentarios?: string;
  estadoAnterior?: string;
  estadoNuevo?: string;
}

@Component({
  selector: 'app-user-documents-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    ContestStatusBadgeComponent
  ],
  templateUrl: './user-documents-detail.component.html',
  styleUrls: ['./user-documents-detail.component.scss']
})
export class UserDocumentsDetailComponent implements OnInit, OnDestroy {

  usuarioDocumentacion: UsuarioDocumentacion | null = null;
  historialDocumentos: DocumentoHistorial[] = [];
  isLoading = false;
  activeTab = 0; // 0: Obligatorios, 1: CV, 2: Opcionales, 3: Historial

  private destroy$ = new Subject<void>();

  constructor(
    private adminDocumentosService: AdminDocumentosService,
    private documentosService: DocumentosService,
    private notificationService: NotificationService,
    private dialogRef: UnifiedDialogRef<UserDocumentsDetailComponent>,
    @Inject(DIALOG_DATA) public data: { userId: string; userName?: string }
  ) {}

  ngOnInit(): void {
    if (this.data?.userId) {
      this.loadUserDocumentation();
      this.loadDocumentHistory();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga toda la documentación del usuario
   */
  loadUserDocumentation(): void {
    this.isLoading = true;

    this.adminDocumentosService.getUserDocumentation(this.data.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documentacion) => {
          this.usuarioDocumentacion = documentacion;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar documentación del usuario:', error);
          this.notificationService.showError('Error al cargar la documentación del usuario');
          this.isLoading = false;
          // Fallback con datos mock para desarrollo
          this.loadMockUserDocumentation();
        }
      });
  }

  /**
   * Carga el historial de cambios de documentos
   */
  loadDocumentHistory(): void {
    this.adminDocumentosService.getUserDocumentHistory(this.data.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historial) => {
          this.historialDocumentos = historial;
        },
        error: (error) => {
          console.error('Error al cargar historial de documentos:', error);
          // Fallback con datos mock
          this.historialDocumentos = this.getMockDocumentHistory();
        }
      });
  }

  /**
   * Datos mock para desarrollo
   */
  private loadMockUserDocumentation(): void {
    this.usuarioDocumentacion = {
      usuario: {
        id: this.data.userId,
        nombre: this.data.userName || 'Juan Pérez',
        dni: '12345678',
        email: 'juan.perez@email.com',
        telefono: '+54 261 123-4567'
      },
      documentacionObligatoria: {
        documentos: [],
        requeridos: [],
        completados: 4,
        pendientes: 2,
        aprobados: 3,
        rechazados: 1
      },
      documentacionCV: {
        experiencias: [],
        educacion: [],
        documentos: []
      },
      documentacionOpcional: {
        documentos: [],
        requeridos: [],
        completados: 1,
        pendientes: 0,
        aprobados: 1,
        rechazados: 0
      },
      estadoGeneral: 'PENDIENTE_REVISION',
      progreso: {
        obligatorios: { completados: 4, total: 6, porcentaje: 67 },
        cv: { completados: 3, total: 5, porcentaje: 60 },
        opcionales: { completados: 1, total: 1, porcentaje: 100 }
      }
    };
  }

  /**
   * Historial mock para desarrollo
   */
  private getMockDocumentHistory(): DocumentoHistorial[] {
    return [
      {
        id: '1',
        documentoId: 'doc1',
        accion: 'SUBIDO',
        fecha: new Date('2025-01-28T10:00:00'),
        usuario: 'Juan Pérez',
        comentarios: 'Documento DNI frontal subido'
      },
      {
        id: '2',
        documentoId: 'doc1',
        accion: 'APROBADO',
        fecha: new Date('2025-01-28T14:30:00'),
        usuario: 'Admin Sistema',
        comentarios: 'Documento aprobado - información clara y legible',
        estadoAnterior: 'PENDING',
        estadoNuevo: 'APPROVED'
      }
    ];
  }

  /**
   * Cambia el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }

  /**
   * Aprueba un documento específico
   */
  approveDocument(documento: DocumentoAdminView): void {
    if (!documento.id) return;

    this.adminDocumentosService.aprobarDocumento(documento.id, 'Documento aprobado desde vista detallada')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Documento aprobado exitosamente');
          this.loadUserDocumentation(); // Recargar datos
          this.loadDocumentHistory(); // Actualizar historial
        },
        error: (error) => {
          console.error('Error al aprobar documento:', error);
          this.notificationService.showError('Error al aprobar el documento');
        }
      });
  }

  /**
   * Rechaza un documento específico
   */
  rejectDocument(documento: DocumentoAdminView, motivo: string): void {
    if (!documento.id) return;

    this.adminDocumentosService.rechazarDocumento(documento.id, motivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Documento rechazado');
          this.loadUserDocumentation();
          this.loadDocumentHistory();
        },
        error: (error) => {
          console.error('Error al rechazar documento:', error);
          this.notificationService.showError('Error al rechazar el documento');
        }
      });
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Obtiene el color del progreso según el porcentaje
   */
  getProgressColor(porcentaje: number): string {
    if (porcentaje >= 80) return '#4caf50'; // Verde
    if (porcentaje >= 60) return '#ff9800'; // Naranja
    return '#f44336'; // Rojo
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el icono para el tipo de acción del historial
   */
  getHistoryActionIcon(accion: string): string {
    const iconMap: Record<string, string> = {
      'SUBIDO': 'fas fa-upload',
      'APROBADO': 'fas fa-check-circle',
      'RECHAZADO': 'fas fa-times-circle',
      'REEMPLAZADO': 'fas fa-sync-alt',
      'ELIMINADO': 'fas fa-trash'
    };
    return iconMap[accion] || 'fas fa-file';
  }

  /**
   * Obtiene la clase CSS para el tipo de acción del historial
   */
  getHistoryActionClass(accion: string): string {
    const classMap: Record<string, string> = {
      'SUBIDO': 'action-uploaded',
      'APROBADO': 'action-approved',
      'RECHAZADO': 'action-rejected',
      'REEMPLAZADO': 'action-replaced',
      'ELIMINADO': 'action-deleted'
    };
    return classMap[accion] || 'action-default';
  }
}
