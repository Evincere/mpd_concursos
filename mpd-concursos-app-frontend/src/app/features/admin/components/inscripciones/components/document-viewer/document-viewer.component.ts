import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { InscriptionDocument, AdminInscriptionsService, DocumentStatusUpdateRequest } from '../../../../../../core/services/admin/admin-inscriptions.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-document-viewer',
  templateUrl: './document-viewer.component.html',
  styleUrls: ['./document-viewer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ]
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  @Input() document!: InscriptionDocument;
  @Input() inscriptionId!: string;
  @Output() documentUpdated = new EventEmitter<InscriptionDocument>();

  @ViewChild('pdfViewer') pdfViewer!: ElementRef;

  isLoading = false;
  pdfSrc: string | ArrayBuffer | null = null;
  currentPage = 1;
  totalPages = 0;
  zoom = 1;
  rotation = 0;

  commentForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscriptionsService: AdminInscriptionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.commentForm = this.fb.group({
      observations: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadDocument();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocument(): void {
    this.isLoading = true;

    this.inscriptionsService.downloadDocument(this.inscriptionId, this.document.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.createPdfPreview(blob);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error descargando documento:', error);
          this.snackBar.open('Error al cargar el documento', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  createPdfPreview(blob: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target && e.target.result) {
      this.pdfSrc = e.target.result;

      // Si estamos usando pdf.js, podríamos inicializar aquí
      // Por ahora, simulamos que tenemos 5 páginas
      this.totalPages = 5;
      }
    };
    reader.readAsDataURL(blob);
  }

  downloadDocument(): void {
    this.isLoading = true;

    this.inscriptionsService.downloadDocument(this.inscriptionId, this.document.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.document.fileName;
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

  approveDocument(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Aprobar Documento',
        message: `¿Está seguro que desea aprobar el documento "${this.document.fileName}"?\n\nEsta acción no se puede deshacer.`,
        confirmText: 'Aprobar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;

        const request: DocumentStatusUpdateRequest = {
          status: 'APPROVED',
          observations: this.commentForm.get('observations')?.value
        };

        this.inscriptionsService.updateDocumentStatus(this.inscriptionId, this.document.id, request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedDocument) => {
              this.document = updatedDocument;
              this.documentUpdated.emit(updatedDocument);
              this.snackBar.open('Documento aprobado correctamente', 'Cerrar', { duration: 3000 });
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error aprobando documento:', error);
              this.snackBar.open('Error al aprobar el documento', 'Cerrar', { duration: 3000 });
              this.isLoading = false;
            }
          });
      }
    });
  }

  rejectDocument(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Rechazar Documento',
        message: `¿Está seguro que desea rechazar el documento "${this.document.fileName}"?\n\nPor favor, ingrese el motivo del rechazo en las observaciones antes de confirmar.\n\nEsta acción no se puede deshacer.`,
        confirmText: 'Rechazar',
        cancelText: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.textareaValue) {
        this.isLoading = true;

        const request: DocumentStatusUpdateRequest = {
          status: 'REJECTED',
          observations: result.textareaValue
        };

        this.inscriptionsService.updateDocumentStatus(this.inscriptionId, this.document.id, request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedDocument) => {
              this.document = updatedDocument;
              this.documentUpdated.emit(updatedDocument);
              this.snackBar.open('Documento rechazado correctamente', 'Cerrar', { duration: 3000 });
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error rechazando documento:', error);
              this.snackBar.open('Error al rechazar el documento', 'Cerrar', { duration: 3000 });
              this.isLoading = false;
            }
          });
      }
    });
  }

  // Controles de navegación del PDF
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  zoomIn(): void {
    this.zoom = Math.min(this.zoom + 0.25, 3);
  }

  zoomOut(): void {
    this.zoom = Math.max(this.zoom - 0.25, 0.5);
  }

  rotate(): void {
    this.rotation = (this.rotation + 90) % 360;
  }

  resetView(): void {
    this.zoom = 1;
    this.rotation = 0;
    this.currentPage = 1;
  }

  getStatusClass(): string {
    switch (this.document.status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(): string {
    switch (this.document.status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return this.document.status;
    }
  }

  formatDate(date: Date | string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}
