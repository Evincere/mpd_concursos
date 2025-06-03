import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ESTADO_EXAMEN, TipoExamen } from '@shared/interfaces/examen/examen.interface';
import { ExamenFormComponent } from './examen-form/examen-form.component';

// Custom Data Source for table functionality
class CustomDataSource {
  private _data: any[] = [];
  private _filteredData: any[] = [];
  private _filter = '';

  get data(): any[] {
    return this._data;
  }

  set data(value: any[]) {
    this._data = value;
    this.applyFilter();
  }

  get filteredData(): any[] {
    return this._filteredData;
  }

  get filter(): string {
    return this._filter;
  }

  set filter(value: string) {
    this._filter = value.toLowerCase();
    this.applyFilter();
  }

  private applyFilter(): void {
    if (!this._filter) {
      this._filteredData = [...this._data];
    } else {
      this._filteredData = this._data.filter(item =>
        Object.values(item).some(val =>
          val?.toString().toLowerCase().includes(this._filter)
        )
      );
    }
  }
}

@Component({
  selector: 'app-examenes-admin',
  templateUrl: './examenes-admin.component.html',
  styleUrls: ['./examenes-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExamenFormComponent
  ]
})
export class ExamenesAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data management
  dataSource = new CustomDataSource();

  // Pagination
  currentPage = 0;
  pageSize = 10;

  // UI State
  cargando = false;
  activeMenuId: string | null = null;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Notification system
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Form modal management
  showExamenForm = false;
  formMode: 'create' | 'edit' = 'create';
  selectedExamen: any = null;

  // Datos hardcodeados para la demostración
  examenes = [
    {
      id: '1',
      titulo: 'Examen de Derecho Penal',
      descripcion: 'Evaluación sobre conceptos fundamentales de derecho penal',
      tipo: TipoExamen.TECNICO_JURIDICO,
      estado: ESTADO_EXAMEN.ACTIVO,
      duracion: 120,
      puntajeMaximo: 100,
      fechaInicio: '2023-04-01T10:00:00',
      intentosPermitidos: 1,
      intentosRealizados: 0,
      requisitos: ['Conocimientos básicos de derecho penal'],
      reglasExamen: ['No se permite consultar material', 'Tiempo límite de 2 horas'],
      materialesPermitidos: ['Ninguno']
    },
    {
      id: '2',
      titulo: 'Examen de Procedimientos Administrativos',
      descripcion: 'Evaluación sobre procedimientos administrativos en el ámbito público',
      tipo: TipoExamen.TECNICO_ADMINISTRATIVO,
      estado: ESTADO_EXAMEN.BORRADOR,
      duracion: 90,
      puntajeMaximo: 80,
      fechaInicio: '2023-04-15T14:00:00',
      intentosPermitidos: 2,
      intentosRealizados: 0,
      requisitos: ['Conocimientos de procedimientos administrativos'],
      reglasExamen: ['Se permite consultar normativa', 'Tiempo límite de 1.5 horas'],
      materialesPermitidos: ['Código de Procedimientos Administrativos']
    },
    {
      id: '3',
      titulo: 'Evaluación Psicológica',
      descripcion: 'Evaluación de aptitudes y competencias psicológicas',
      tipo: TipoExamen.PSICOLOGICO,
      estado: ESTADO_EXAMEN.FINALIZADO,
      duracion: 60,
      puntajeMaximo: 50,
      fechaInicio: '2023-03-10T09:00:00',
      intentosPermitidos: 1,
      intentosRealizados: 1,
      requisitos: ['Ninguno'],
      reglasExamen: ['Responder con sinceridad', 'Tiempo límite de 1 hora'],
      materialesPermitidos: ['Ninguno']
    },
    {
      id: '4',
      titulo: 'Examen de Derecho Constitucional',
      descripcion: 'Evaluación sobre principios constitucionales y derechos fundamentales',
      tipo: TipoExamen.TECNICO_JURIDICO,
      estado: ESTADO_EXAMEN.DISPONIBLE,
      duracion: 150,
      puntajeMaximo: 120,
      fechaInicio: '2023-04-20T11:00:00',
      intentosPermitidos: 1,
      intentosRealizados: 0,
      requisitos: ['Conocimientos de derecho constitucional'],
      reglasExamen: ['No se permite consultar material', 'Tiempo límite de 2.5 horas'],
      materialesPermitidos: ['Ninguno']
    },
    {
      id: '5',
      titulo: 'Examen de Gestión Documental',
      descripcion: 'Evaluación sobre procesos de gestión documental y archivo',
      tipo: TipoExamen.TECNICO_ADMINISTRATIVO,
      estado: ESTADO_EXAMEN.ANULADO,
      duracion: 75,
      puntajeMaximo: 60,
      fechaInicio: '2023-03-05T10:00:00',
      intentosPermitidos: 2,
      intentosRealizados: 0,
      requisitos: ['Conocimientos de gestión documental'],
      reglasExamen: ['Se permite consultar manuales', 'Tiempo límite de 1.25 horas'],
      materialesPermitidos: ['Manual de Gestión Documental'],
      motivoAnulacion: {
        fecha: '2023-03-04T15:30:00',
        infracciones: ['CONTENIDO_INCORRECTO'],
        motivo: 'Errores en el contenido de las preguntas'
      }
    }
  ];

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExamenes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
  loadExamenes(): void {
    this.cargando = true;
    // Simular carga de datos
    setTimeout(() => {
      this.dataSource.data = this.examenes;
      this.cargando = false;
    }, 1000);
  }

  // Filter functionality
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.currentPage = 0; // Reset to first page when filtering
  }

  // CRUD Operations
  crearExamen(): void {
    this.formMode = 'create';
    this.selectedExamen = null;
    this.showExamenForm = true;
  }

  editarExamen(examen: any): void {
    this.closeMenu();
    this.formMode = 'edit';
    this.selectedExamen = { ...examen }; // Crear una copia para editar
    this.showExamenForm = true;
  }

  verDetalles(examen: any): void {
    this.closeMenu();
    // Simular vista de detalles con notificación
    this.showNotificationMessage(`Viendo detalles de: ${examen.titulo}`, 'info');

    // TODO: Implementar modal o página de detalles
    // this.router.navigate(['/admin/examenes/detalle', examen.id]);
  }

  exportarExamenes(): void {
    // Simular exportación
    this.showNotificationMessage('Exportando exámenes...', 'info');
    setTimeout(() => {
      this.showNotificationMessage('Exámenes exportados correctamente', 'success');
    }, 2000);
  }

  cambiarEstadoExamen(examen: any, nuevoEstado: string): void {
    this.closeMenu();
    // Simular cambio de estado
    const index = this.examenes.findIndex(e => e.id === examen.id);
    if (index !== -1) {
      this.examenes[index].estado = nuevoEstado as ESTADO_EXAMEN;
      this.dataSource.data = this.examenes;
      this.showNotificationMessage(`Estado del examen cambiado a ${this.getEstadoText(nuevoEstado as ESTADO_EXAMEN)}`, 'success');
    }
  }

  eliminarExamen(examen: any): void {
    this.closeMenu();
    if (confirm(`¿Está seguro de eliminar el examen "${examen.titulo}"?`)) {
      // Simular eliminación
      this.examenes = this.examenes.filter(e => e.id !== examen.id);
      this.dataSource.data = this.examenes;
      this.showNotificationMessage('Examen eliminado correctamente', 'success');
    }
  }

  // Form event handlers
  onFormSubmit(formData: any): void {
    if (this.formMode === 'create') {
      // Crear nuevo examen
      const newExamen = {
        ...formData,
        id: (this.examenes.length + 1).toString(),
        estado: ESTADO_EXAMEN.BORRADOR,
        intentosRealizados: 0,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      };

      this.examenes.push(newExamen);
      this.dataSource.data = this.examenes;
      this.showNotificationMessage('Examen creado correctamente', 'success');
    } else if (this.formMode === 'edit') {
      // Actualizar examen existente
      const index = this.examenes.findIndex(e => e.id === this.selectedExamen.id);
      if (index !== -1) {
        this.examenes[index] = {
          ...this.examenes[index],
          ...formData,
          fechaModificacion: new Date().toISOString()
        };
        this.dataSource.data = this.examenes;
        this.showNotificationMessage('Examen actualizado correctamente', 'success');
      }
    }

    this.closeForm();
  }

  onFormCancel(): void {
    this.closeForm();
  }

  private closeForm(): void {
    this.showExamenForm = false;
    this.selectedExamen = null;
    this.formMode = 'create';
  }

  // Stats methods
  getExamenesPorEstado(estado: string): any[] {
    return this.examenes.filter(examen => examen.estado === estado);
  }

  // UI Helper methods
  getTipoExamenText(tipo: TipoExamen): string {
    switch (tipo) {
      case TipoExamen.TECNICO_JURIDICO:
        return 'Técnico Jurídico';
      case TipoExamen.TECNICO_ADMINISTRATIVO:
        return 'Técnico Administrativo';
      case TipoExamen.PSICOLOGICO:
        return 'Psicológico';
      default:
        return 'Desconocido';
    }
  }

  getTipoClass(tipo: TipoExamen): string {
    switch (tipo) {
      case TipoExamen.TECNICO_JURIDICO:
        return 'type-juridico';
      case TipoExamen.TECNICO_ADMINISTRATIVO:
        return 'type-administrativo';
      case TipoExamen.PSICOLOGICO:
        return 'type-psicologico';
      default:
        return 'type-default';
    }
  }

  getTipoIcon(tipo: TipoExamen): string {
    switch (tipo) {
      case TipoExamen.TECNICO_JURIDICO:
        return 'fas fa-balance-scale';
      case TipoExamen.TECNICO_ADMINISTRATIVO:
        return 'fas fa-cogs';
      case TipoExamen.PSICOLOGICO:
        return 'fas fa-brain';
      default:
        return 'fas fa-question';
    }
  }

  getEstadoText(estado: ESTADO_EXAMEN): string {
    switch (estado) {
      case ESTADO_EXAMEN.ACTIVO:
        return 'Activo';
      case ESTADO_EXAMEN.BORRADOR:
        return 'Borrador';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'Finalizado';
      case ESTADO_EXAMEN.ANULADO:
        return 'Anulado';
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'Disponible';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'En Curso';
      default:
        return 'Desconocido';
    }
  }

  getEstadoClass(estado: ESTADO_EXAMEN): string {
    switch (estado) {
      case ESTADO_EXAMEN.ACTIVO:
        return 'status-active';
      case ESTADO_EXAMEN.BORRADOR:
        return 'status-draft';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'status-completed';
      case ESTADO_EXAMEN.ANULADO:
        return 'status-cancelled';
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'status-available';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'status-in-progress';
      default:
        return 'status-default';
    }
  }

  getEstadoIcon(estado: ESTADO_EXAMEN): string {
    switch (estado) {
      case ESTADO_EXAMEN.ACTIVO:
        return 'fas fa-play-circle';
      case ESTADO_EXAMEN.BORRADOR:
        return 'fas fa-edit';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'fas fa-check-circle';
      case ESTADO_EXAMEN.ANULADO:
        return 'fas fa-ban';
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'fas fa-calendar-check';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'fas fa-clock';
      default:
        return 'fas fa-question-circle';
    }
  }

  // Date formatting
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Table functionality
  trackByExamenId(index: number, examen: any): string {
    return examen.id;
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.dataSource.filteredData.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Menu functionality
  toggleMenu(examenId: string): void {
    this.activeMenuId = this.activeMenuId === examenId ? null : examenId;
  }

  closeMenu(): void {
    this.activeMenuId = null;
  }

  // Pagination
  getStartIndex(): number {
    return this.currentPage * this.pageSize;
  }

  getEndIndex(): number {
    const endIndex = (this.currentPage + 1) * this.pageSize;
    return Math.min(endIndex, this.dataSource.filteredData.length);
  }

  getTotalPages(): number {
    return Math.ceil(this.dataSource.filteredData.length / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages() - 1) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
  }

  // Notification system
  showNotificationMessage(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    setTimeout(() => {
      this.closeNotification();
    }, 5000);
  }

  closeNotification(): void {
    this.showNotification = false;
  }

  getNotificationIcon(): string {
    switch (this.notificationType) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  }
}
