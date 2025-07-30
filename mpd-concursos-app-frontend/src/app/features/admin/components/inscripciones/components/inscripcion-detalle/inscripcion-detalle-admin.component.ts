import { Component, OnInit, OnDestroy, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminInscriptionsService, InscriptionDetail, InscriptionDocument, DocumentStatusUpdateRequest } from '../../../../../../core/services/admin/admin-inscriptions.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

interface DialogData {
  inscriptionId: string;
}

@Component({
  selector: 'app-inscripcion-detalle-admin',
  templateUrl: './inscripcion-detalle-admin.component.html',
  styleUrls: ['./inscripcion-detalle-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatListModule
  ]
})
export class InscripcionDetalleAdminComponent implements OnInit, OnDestroy {
  inscriptionDetail!: InscriptionDetail;
  isLoading = true;
  activeTab = 0;

  statusOptions: { value: InscripcionState, label: string }[] = [
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.APPROVED, label: 'Aprobada' },
    { value: InscripcionState.REJECTED, label: 'Rechazada' },
    { value: InscripcionState.CANCELLED, label: 'Cancelada' },
    { value: InscripcionState.ACTIVE, label: 'Activa' }  // REFACTORING: Estado estándar
  ];

  documentStatusOptions: { value: string, label: string }[] = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'APPROVED', label: 'Aprobado' },
    { value: 'REJECTED', label: 'Rechazado' }
  ];

  statusForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscriptionsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Optional() public dialogRef: MatDialogRef<InscripcionDetalleAdminComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.statusForm = this.fb.group({
      status: ['', [Validators.required]],
      observations: ['']
    });
  }

  ngOnInit(): void {
    this.loadInscriptionDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInscriptionDetail(): void {
    if (!this.data?.inscriptionId) {
      console.error('No inscription ID provided');
      return;
    }

    this.isLoading = true;

    this.inscripcionesService.getInscriptionById(this.data.inscriptionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detail) => {
          console.log('Detalle de inscripción recibido:', detail);

          // Validar que la respuesta tenga la estructura esperada
          if (!detail) {
            console.error('Respuesta vacía del servidor');
            this.snackBar.open('Error: Respuesta vacía del servidor', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
            this.dialogRef?.close();
            return;
          }

          // Si la respuesta es directamente la inscripción (sin wrapper)
          if ((detail as any).id && (detail as any).state && !(detail as any).inscription) {
            console.log('Respuesta directa de inscripción, adaptando estructura...');
            console.log('Datos completos recibidos:', JSON.stringify(detail, null, 2));

            const rawData = detail as any;

            this.inscriptionDetail = {
              inscription: {
                id: rawData.id,
                contestId: rawData.contestId,
                userId: rawData.userId,
                state: rawData.state,
                createdAt: rawData.createdAt || rawData.inscriptionDate,
                updatedAt: rawData.updatedAt || rawData.lastUpdated,
                reviewDate: rawData.reviewDate,
                observations: rawData.observations,
                // Usar contestInfo si existe, sino valores por defecto
                contestTitle: rawData.contestInfo?.title || rawData.contestTitle || 'No disponible',
                contestCategory: rawData.contestInfo?.category || rawData.contestCategory || 'No disponible',
                contestDepartment: rawData.contestInfo?.department || rawData.contestDepartment || 'No disponible',
                // Usar userInfo si existe, sino valores por defecto
                userFullName: rawData.userInfo?.fullName || rawData.userFullName || 'No disponible',
                userEmail: rawData.userInfo?.email || rawData.userEmail || 'No disponible',
                userDni: rawData.userInfo?.dni || rawData.userDni || 'No disponible',
                // Propiedades adicionales requeridas por AdminInscription
                documentsCount: rawData.documentsCount || 0,
                pendingDocuments: rawData.pendingDocuments || 0,
                approvedDocuments: rawData.approvedDocuments || 0,
                rejectedDocuments: rawData.rejectedDocuments || 0,
                inscriptionDate: rawData.inscriptionDate || rawData.createdAt,
                lastUpdated: rawData.lastUpdated || rawData.updatedAt,
                lastUpdate: new Date(rawData.lastUpdated || rawData.updatedAt || Date.now()),
                reviewedBy: rawData.reviewedBy
              },
              user: {
                id: rawData.userId,
                firstName: rawData.userInfo?.firstName || rawData.userInfo?.fullName?.split(' ')[0] || 'No disponible',
                lastName: rawData.userInfo?.lastName || rawData.userInfo?.fullName?.split(' ').slice(1).join(' ') || 'No disponible',
                dni: rawData.userInfo?.dni || rawData.userDni || 'No disponible',
                email: rawData.userInfo?.email || rawData.userEmail || 'No disponible',
                telefono: rawData.userInfo?.telefono || rawData.userTelefono || null,
                direccion: rawData.userInfo?.direccion || rawData.userDireccion || null,
                // Propiedades adicionales requeridas por UserProfile
                username: rawData.userInfo?.username || rawData.userInfo?.email || rawData.username || 'No disponible',
                cuit: rawData.userInfo?.cuit || rawData.userCuit || null
              },
              documents: rawData.documents || [],
              history: rawData.history || []
            };

            console.log('Estructura adaptada:', JSON.stringify(this.inscriptionDetail, null, 2));

            this.statusForm.patchValue({
              status: rawData.state,
              observations: rawData.observations || ''
            });
          }
          // Si la respuesta tiene la estructura esperada
          else if (detail.inscription) {
            this.inscriptionDetail = detail;
            this.statusForm.patchValue({
              status: detail.inscription.state,
              observations: detail.inscription.observations || ''
            });
          }
          // Estructura inesperada
          else {
            console.error('Estructura de respuesta inesperada:', detail);
            this.snackBar.open('Error: Estructura de datos inesperada', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
            this.dialogRef?.close();
            return;
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error obteniendo detalle de inscripción con ID ${this.data.inscriptionId}:`, error);
          this.snackBar.open('Error al cargar el detalle de la inscripción', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
          this.dialogRef?.close();
        }
      });
  }

  updateStatus(): void {
    if (this.statusForm.invalid) {
      return;
    }

    const formValue = this.statusForm.value;

    this.isLoading = true;
    this.inscripcionesService.updateInscriptionStatus(this.data.inscriptionId, {
      status: formValue.status,
      observations: formValue.observations
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadInscriptionDetail();
          this.snackBar.open(`Estado de inscripción actualizado a ${this.getStatusLabel(formValue.status)}`, 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error actualizando estado de inscripción:', error);
          this.snackBar.open('Error al actualizar el estado de la inscripción', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  updateDocumentStatus(document: InscriptionDocument, newStatus: 'APPROVED' | 'REJECTED'): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: `${newStatus === 'APPROVED' ? 'Aprobar' : 'Rechazar'} Documento`,
        mensaje: `¿Está seguro que desea ${newStatus === 'APPROVED' ? 'aprobar' : 'rechazar'} el documento "${document.fileName}"?`,
        confirmButtonText: newStatus === 'APPROVED' ? 'Aprobar' : 'Rechazar',
        cancelButtonText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe((result: { textareaValue?: string } | undefined) => {
      if (result) {
        this.isLoading = true;

        const request: DocumentStatusUpdateRequest = {
          status: newStatus,
          observations: result.textareaValue || ''
        };

        this.inscripcionesService.updateDocumentStatus(this.data.inscriptionId, document.id, request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadInscriptionDetail();
              this.snackBar.open(`Documento ${newStatus === 'APPROVED' ? 'aprobado' : 'rechazado'} correctamente`, 'Cerrar', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error actualizando estado del documento:', error);
              this.snackBar.open('Error al actualizar el estado del documento', 'Cerrar', { duration: 3000 });
              this.isLoading = false;
            }
          });
      }
    });
  }

  downloadDocument(docItem: InscriptionDocument): void {
    this.isLoading = true;

    this.inscripcionesService.downloadDocument(this.data.inscriptionId, docItem.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = docItem.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error descargando documento:', error);
          this.snackBar.open('Error al descargar el documento', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  getStatusLabel(status: InscripcionState): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  getStatusClass(status: InscripcionState): string {
    switch (status) {
      case InscripcionState.PENDING: return 'status-pending';
      case InscripcionState.APPROVED: return 'status-approved';
      case InscripcionState.REJECTED: return 'status-rejected';
      case InscripcionState.CANCELLED: return 'status-cancelled';
      case InscripcionState.ACTIVE: return 'status-in-process';  // REFACTORING: Estado estándar
      default: return '';
    }
  }

  getDocumentStatusLabel(status: string): string {
    const statusOption = this.documentStatusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  getDocumentStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }

  onClose(): void {
    this.dialogRef?.close(true);
  }
}
