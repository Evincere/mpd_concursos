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
// Servicios para datos reales de documentos
import { AdminDocumentosService, DocumentoAdminView, DocumentoFiltros } from '../../../../../../core/services/admin/admin-documentos.service';
import { DocumentosService } from '../../../../../../core/services/documentos/documentos.service';
import { TipoDocumento } from '../../../../../../core/models/documento.model';
import { UnifiedDialogService } from '../../../../../../shared/services/dialog/unified-dialog.service';
import { UserDocumentsDetailComponent } from '../user-documents-detail/user-documents-detail.component';
import { DocumentViewerComponent } from '../document-viewer/document-viewer.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CustomPageEvent, CustomPaginatorComponent } from '@shared/components/custom-paginator/custom-paginator.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';

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
    DocumentViewerComponent,
    CustomPaginatorComponent,
    CustomButtonComponent,
    ContestStatusBadgeComponent
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

  // Categorías de documentos
  documentCategories = [
    { value: '', label: 'Todas las categorías' },
    { value: 'OBLIGATORY', label: 'Documentación Obligatoria' },
    { value: 'CV_PROOF', label: 'Probanza de CV' },
    { value: 'OPTIONAL', label: 'Documentación Opcional' }
  ];

  // Tipos de documentos obligatorios (según reglas de negocio)
  obligatoryDocumentTypes = [
    'DNI-FRONTAL', 'DNI-DORSO', 'CUIL', 'ANTECEDENTES',
    'ANTIGÜEDAD_PROFESIONAL', 'SIN_SANCIONES', 'LEY_MICAELA'
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
    private adminDocumentosService: AdminDocumentosService,
    private documentosService: DocumentosService,
    private dialogService: UnifiedDialogService
  ) {
    this.filterForm = this.fb.group({
      status: ['PENDING'],
      documentType: [''],
      documentCategory: [''],
      userSearch: [''],
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
    this.documentosService.getTiposDocumento()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tipos: TipoDocumento[]) => {
          this.documentTypes = tipos.map(tipo => ({
            id: tipo.id,
            name: tipo.nombre
          }));
        },
        error: (error) => {
          console.error('Error al cargar tipos de documento:', error);
          // Fallback a datos de ejemplo en caso de error
          this.documentTypes = [
            { id: '1', name: 'DNI' },
            { id: '2', name: 'Título Universitario' },
            { id: '3', name: 'Certificado de Antecedentes Penales' },
            { id: '4', name: 'Curriculum Vitae' },
            { id: '5', name: 'Certificado de Domicilio' }
          ];
        }
      });
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

    const filters: DocumentoFiltros = {
      estado: this.mapStatusToBackend(this.filterForm.get('status')?.value),
      tipoDocumentoId: this.filterForm.get('documentType')?.value || undefined,
      // Agregar filtros adicionales
      userSearch: this.filterForm.get('userSearch')?.value || undefined,
      documentCategory: this.filterForm.get('documentCategory')?.value || undefined,
      search: this.filterForm.get('search')?.value || undefined,
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'fechaCarga',
      direction: 'desc' as 'desc'
    };

    this.adminDocumentosService.getDocumentos(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Convertir DocumentoAdminView a InscriptionDocument para compatibilidad
          this.dataSource = response.documentos.map(doc => this.convertToInscriptionDocument(doc));
          this.totalItems = response.total;
          this.isLoading = false;
          this.resetSelection();
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
          // Fallback a datos mock en caso de error
          this.dataSource = this.getMockDocuments({
            status: this.filterForm.get('status')?.value,
            documentType: this.filterForm.get('documentType')?.value,
            search: this.filterForm.get('search')?.value
          });
          this.totalItems = this.dataSource.length;
          this.isLoading = false;
          this.resetSelection();
        }
      });
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
      // Logging implementado con LoggingService;
    }

    this.isLoading = true;

    // Simulamos la aprobación masiva
    setTimeout(() => {
      selectedDocs.forEach(doc => {
        const index = this.dataSource.findIndex(d => d.id === doc.id);
        if (index !== -1) {
          this.dataSource[index] = {
            ...doc,
            status: 'APPROVED',
            reviewedBy: 'Admin Usuario',
            reviewDate: new Date()
          };
        }
      });

      this.resetSelection();
      this.isLoading = false;
      // Logging implementado con LoggingService;
    }, 1000);
  }

  rejectSelectedDocuments(): void {
    const selectedDocs = this.getSelectedDocuments();

    if (selectedDocs.length === 0) {
      // Logging implementado con LoggingService;
    }

    this.isLoading = true;

    // Simulamos el rechazo masivo
    setTimeout(() => {
      selectedDocs.forEach(doc => {
        const index = this.dataSource.findIndex(d => d.id === doc.id);
        if (index !== -1) {
          this.dataSource[index] = {
            ...doc,
            status: 'REJECTED',
            observations: 'Documento rechazado',
            reviewedBy: 'Admin Usuario',
            reviewDate: new Date()
          };
        }
      });

      this.resetSelection();
      this.isLoading = false;
      // Logging implementado con LoggingService;
    }, 1000);
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

  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }

  /**
   * Obtiene el nombre del usuario del documento
   */
  getUserName(document: InscriptionDocument): string {
    // Aquí deberíamos tener información del usuario en el documento
    // Por ahora retornamos un placeholder
    return 'Usuario ' + (document.id?.substring(0, 8) || 'Desconocido');
  }

  /**
   * Obtiene el DNI del usuario del documento
   */
  getUserDni(document: InscriptionDocument): string {
    // Aquí deberíamos tener información del usuario en el documento
    // Por ahora retornamos un placeholder
    return '12345678';
  }

  /**
   * Abre la vista detallada de documentación del usuario
   */
  openUserDocumentsDetail(document: InscriptionDocument): void {
    const userId = this.getUserIdFromDocument(document);
    const userName = this.getUserName(document);

    this.dialogService.open(UserDocumentsDetailComponent, {
      data: { userId, userName },
      size: 'large',
      title: `Documentación de ${userName}`,
      showCloseButton: true
    });
  }

  /**
   * Obtiene el ID del usuario desde el documento
   */
  private getUserIdFromDocument(document: InscriptionDocument): string {
    // Por ahora usamos el ID del documento como placeholder
    // En la implementación real, esto vendría del backend
    return document.id || 'user-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Determina la categoría del documento
   */
  getDocumentCategory(document: InscriptionDocument): 'OBLIGATORY' | 'CV_PROOF' | 'OPTIONAL' {
    const documentTypeCode = this.getDocumentTypeCode(document.documentType);

    if (this.obligatoryDocumentTypes.includes(documentTypeCode)) {
      return 'OBLIGATORY';
    }

    // Si el documento está asociado a experiencia o educación, es probanza de CV
    if (this.isCvProofDocument(document)) {
      return 'CV_PROOF';
    }

    return 'OPTIONAL';
  }

  /**
   * Obtiene la etiqueta de la categoría del documento
   */
  getDocumentCategoryLabel(document: InscriptionDocument): string {
    const category = this.getDocumentCategory(document);
    const categoryMap = {
      'OBLIGATORY': 'Obligatorio',
      'CV_PROOF': 'Probanza CV',
      'OPTIONAL': 'Opcional'
    };
    return categoryMap[category];
  }

  /**
   * Obtiene la clase CSS para la categoría del documento
   */
  getDocumentCategoryClass(document: InscriptionDocument): string {
    const category = this.getDocumentCategory(document);
    return `category-${category.toLowerCase()}`;
  }

  /**
   * Obtiene el código del tipo de documento
   */
  private getDocumentTypeCode(documentTypeName: string): string {
    // Mapear nombres a códigos
    const nameToCodeMap: Record<string, string> = {
      'DNI (Frontal)': 'DNI-FRONTAL',
      'DNI (Dorso)': 'DNI-DORSO',
      'Constancia de CUIL': 'CUIL',
      'Certificado de Antecedentes Penales': 'ANTECEDENTES',
      'Certificado de Antigüedad Profesional': 'ANTIGÜEDAD_PROFESIONAL',
      'Certificado Sin Sanciones Disciplinarias': 'SIN_SANCIONES',
      'Certificado Ley Micaela': 'LEY_MICAELA'
    };

    return nameToCodeMap[documentTypeName] || documentTypeName.toUpperCase();
  }

  /**
   * Determina si un documento es probanza de CV
   */
  private isCvProofDocument(document: InscriptionDocument): boolean {
    // Aquí deberíamos verificar si el documento está asociado a experiencia o educación
    // Por ahora usamos una heurística simple
    const cvProofKeywords = ['certificado', 'titulo', 'diploma', 'experiencia', 'laboral'];
    const fileName = document.fileName.toLowerCase();
    return cvProofKeywords.some(keyword => fileName.includes(keyword));
  }

  /**
   * Mapea el estado del frontend al formato del backend
   */
  private mapStatusToBackend(status: string): string | undefined {
    if (!status) return undefined;

    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'PENDING';
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return undefined;
    }
  }

  /**
   * Convierte DocumentoAdminView a InscriptionDocument para compatibilidad con el template
   */
  private convertToInscriptionDocument(doc: DocumentoAdminView): InscriptionDocument {
    return {
      id: doc.id || '',
      inscriptionId: doc.id || '',
      documentType: doc.tipoDocumento?.nombre || 'Documento',
      documentTypeId: doc.tipoDocumentoId || '',
      fileName: doc.nombreArchivo || 'documento.pdf',
      fileSize: 0,
      uploadDate: doc.fechaCarga || new Date(),
      status: this.mapBackendStatusToFrontend(doc.estado),
      observations: '',
      reviewedBy: '',
      reviewDate: undefined,
      downloadUrl: ''
    };
  }

  /**
   * Mapea el estado del backend al formato del frontend
   */
  private mapBackendStatusToFrontend(estado: any): 'PENDING' | 'APPROVED' | 'REJECTED' {
    const estadoStr = estado?.toString()?.toUpperCase() || 'PENDING';

    switch (estadoStr) {
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'PENDING';
    }
  }
}
