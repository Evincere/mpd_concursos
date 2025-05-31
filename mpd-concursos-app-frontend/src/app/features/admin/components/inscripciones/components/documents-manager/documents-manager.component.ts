import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminInscriptionsService, InscriptionDocument } from '../../../../../../core/services/admin/admin-inscriptions.service';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CustomPageEvent, CustomPaginatorComponent } from '@shared/components/custom-paginator/custom-paginator.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

interface DocumentFilter {
  status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
  documentType: string;
  search: string;
  inscriptionId?: string;
}

@Component({
  selector: 'app-documents-manager',
  templateUrl: './documents-manager.component.html',
  styleUrls: ['./documents-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    DocumentViewerComponent,
    CustomPaginatorComponent,
    CustomButtonComponent
  ]
})
export class DocumentsManagerComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['select', 'fileName', 'documentType', 'uploadDate', 'status', 'actions'];
  dataSource: InscriptionDocument[] = [];

  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  filterForm: FormGroup;
  documentTypes: { id: string, name: string }[] = [];

  statusOptions: { value: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED', label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobados' },
    { value: 'REJECTED', label: 'Rechazados' }
  ];

  selectedDocuments: Record<string, boolean> = {};
  allSelected = false;

  activeTab = 0;
  selectedDocument: InscriptionDocument | null = null;
  selectedInscriptionId = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscriptionsService: AdminInscriptionsService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      status: ['PENDING'],
      documentType: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadDocumentTypes();
    this.setupFilterListeners();
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocumentTypes(): void {
    // Aquí cargaríamos los tipos de documentos desde el backend
    // Por ahora, usamos datos de ejemplo
    this.documentTypes = [
      { id: '1', name: 'DNI' },
      { id: '2', name: 'Título Universitario' },
      { id: '3', name: 'Certificado de Antecedentes Penales' },
      { id: '4', name: 'Curriculum Vitae' },
      { id: '5', name: 'Certificado de Domicilio' }
    ];
  }

  setupFilterListeners(): void {
    // Aplicar debounce al campo de búsqueda
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });

    // Escuchar cambios en los demás filtros
    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });

    this.filterForm.get('documentType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDocuments();
      });
  }

  loadDocuments(): void {
    this.isLoading = true;

    const filters: DocumentFilter = {
      status: this.filterForm.get('status')?.value,
      documentType: this.filterForm.get('documentType')?.value,
      search: this.filterForm.get('search')?.value
    };

    // Aquí llamaríamos al servicio para obtener los documentos filtrados
    // Por ahora, simulamos una respuesta
    setTimeout(() => {
      this.dataSource = this.getMockDocuments(filters);
      this.totalItems = this.dataSource.length;
      this.isLoading = false;
      this.resetSelection();
    }, 500);
  }

  getMockDocuments(filters: DocumentFilter): InscriptionDocument[] {
    // Simulamos documentos para pruebas
    const mockDocuments: InscriptionDocument[] = [];

    for (let i = 1; i <= 50; i++) {
      const status = i % 3 === 0 ? 'APPROVED' : (i % 5 === 0 ? 'REJECTED' : 'PENDING');
      const typeIndex = i % this.documentTypes.length;

      const document: InscriptionDocument = {
        id: `doc-${i}`,
        inscriptionId: `insc-${Math.floor(i / 3) + 1}`,
        documentType: this.documentTypes[typeIndex].name,
        documentTypeId: this.documentTypes[typeIndex].id,
        fileName: `documento_${i}.pdf`,
        fileSize: Math.floor(Math.random() * 5000000) + 100000, // Entre 100KB y 5MB
        uploadDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
        downloadUrl: '#',
        observations: status === 'REJECTED' ? 'Documento ilegible o incompleto' : undefined,
        reviewedBy: status !== 'PENDING' ? 'Admin Usuario' : undefined,
        reviewDate: status !== 'PENDING' ? new Date() : undefined
      };

      mockDocuments.push(document);
    }

    // Aplicar filtros
    return mockDocuments.filter(doc => {
      if (filters.status !== 'ALL' && doc.status !== filters.status) {
        return false;
      }

      if (filters.documentType && doc.documentTypeId !== filters.documentType) {
        return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return doc.fileName.toLowerCase().includes(searchLower) ||
               doc.documentType.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }

  onPageChange(event: CustomPageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDocuments();
  }

  resetFilters(): void {
    this.filterForm.reset({
      status: 'PENDING',
      documentType: '',
      search: ''
    });
    this.pageIndex = 0;
    this.loadDocuments();
  }

  viewDocument(document: InscriptionDocument): void {
    this.selectedDocument = document;
    this.selectedInscriptionId = document.inscriptionId;
    this.activeTab = 1;
  }

  onDocumentUpdated(updatedDocument: InscriptionDocument): void {
    // Actualizar el documento en la lista
    const index = this.dataSource.findIndex(doc => doc.id === updatedDocument.id);
    if (index !== -1) {
      this.dataSource[index] = updatedDocument;
    }

    // Actualizar la selección si es necesario
    if (this.selectedDocuments[updatedDocument.id]) {
      this.selectedDocuments[updatedDocument.id] = false;
      this.updateAllSelected();
    }
  }

  // Gestión de selección
  toggleSelection(document: InscriptionDocument): void {
    this.selectedDocuments[document.id] = !this.selectedDocuments[document.id];
    this.updateAllSelected();
  }

  toggleAllSelection(): void {
    this.allSelected = !this.allSelected;

    this.dataSource.forEach(document => {
      this.selectedDocuments[document.id] = this.allSelected;
    });
  }

  updateAllSelected(): void {
    this.allSelected = this.dataSource.every(document => this.selectedDocuments[document.id]);
  }

  resetSelection(): void {
    this.selectedDocuments = {};
    this.allSelected = false;
  }

  getSelectedDocuments(): InscriptionDocument[] {
    return this.dataSource.filter(document => this.selectedDocuments[document.id]);
  }

  getSelectedCount(): number {
    return Object.values(this.selectedDocuments).filter(selected => selected).length;
  }

  // Acciones masivas
  approveSelectedDocuments(): void {
    const selectedDocs = this.getSelectedDocuments();

    if (selectedDocs.length === 0) {
      this.snackBar.open('No hay documentos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Aprobar Documentos',
        message: `¿Está seguro que desea aprobar ${selectedDocs.length} documento(s) seleccionado(s)?`,
        confirmText: 'Aprobar',
        cancelText: 'Cancelar',
        showTextarea: true,
        textareaLabel: 'Observaciones (opcional)'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;

        // Aquí procesaríamos la aprobación masiva
        // Por ahora, simulamos el proceso
        setTimeout(() => {
          selectedDocs.forEach(doc => {
            const index = this.dataSource.findIndex(d => d.id === doc.id);
            if (index !== -1) {
              this.dataSource[index] = {
                ...doc,
                status: 'APPROVED',
                observations: result.textareaValue || undefined,
                reviewedBy: 'Admin Usuario',
                reviewDate: new Date()
              };
            }
          });

          this.resetSelection();
          this.isLoading = false;
          this.snackBar.open(`${selectedDocs.length} documento(s) aprobado(s) correctamente`, 'Cerrar', { duration: 3000 });
        }, 1000);
      }
    });
  }

  rejectSelectedDocuments(): void {
    const selectedDocs = this.getSelectedDocuments();

    if (selectedDocs.length === 0) {
      this.snackBar.open('No hay documentos seleccionados', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Rechazar Documentos',
        message: `¿Está seguro que desea rechazar ${selectedDocs.length} documento(s) seleccionado(s)?`,
        confirmText: 'Rechazar',
        cancelText: 'Cancelar',
        showTextarea: true,
        textareaLabel: 'Motivo del rechazo (obligatorio)',
        textareaRequired: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.textareaValue) {
        this.isLoading = true;

        // Aquí procesaríamos el rechazo masivo
        // Por ahora, simulamos el proceso
        setTimeout(() => {
          selectedDocs.forEach(doc => {
            const index = this.dataSource.findIndex(d => d.id === doc.id);
            if (index !== -1) {
              this.dataSource[index] = {
                ...doc,
                status: 'REJECTED',
                observations: result.textareaValue,
                reviewedBy: 'Admin Usuario',
                reviewDate: new Date()
              };
            }
          });

          this.resetSelection();
          this.isLoading = false;
          this.snackBar.open(`${selectedDocs.length} documento(s) rechazado(s) correctamente`, 'Cerrar', { duration: 3000 });
        }, 1000);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return status;
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  approveDocument(document: any): void {
    // Si ya tienes approveSelectedDocuments, reutiliza la lógica para uno solo
    this.selectedDocuments = { [document.id]: true };
    this.approveSelectedDocuments();
  }

  rejectDocument(document: any): void {
    // Si ya tienes rejectSelectedDocuments, reutiliza la lógica para uno solo
    this.selectedDocuments = { [document.id]: true };
    this.rejectSelectedDocuments();
  }
}
