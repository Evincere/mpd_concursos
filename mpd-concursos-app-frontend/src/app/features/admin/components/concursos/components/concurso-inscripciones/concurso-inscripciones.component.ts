import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminInscripcionesService, AdminInscription, InscriptionFilter } from '../../../../../../core/services/admin/admin-inscripciones.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { CustomTableComponent } from '@shared/components/custom-form/custom-table/custom-table.component';
import { CustomTableColumnComponent } from '@shared/components/custom-form/custom-table/custom-table-column.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomDialogComponent } from '@shared/components/custom-dialog/custom-dialog.component';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-concurso-inscripciones',
  templateUrl: './concurso-inscripciones.component.html',
  styleUrls: ['./concurso-inscripciones.component.scss'],
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    CustomTableComponent,
    CustomTableColumnComponent,
    CustomButtonComponent,
    CustomFormFieldComponent,
    CustomCardComponent
  ]
})
export class ConcursoInscripcionesComponent implements OnInit, OnDestroy {
  @Input() contestId!: number | string;

  // Hacer disponible el enum en la plantilla
  InscripcionState = InscripcionState;

  isLoading = false;
  inscripciones: AdminInscription[] = [];
  totalInscripciones = 0;
  pageSize = 10;
  currentPage = 0;
  totalPages = 0;
  private isInitialLoad = true;

  filterForm: FormGroup;

  // Estados de inscripción para el filtro
  inscripcionStates = [
    { value: 'ALL', label: 'Todos los estados' },
    { value: InscripcionState.NO_INSCRIPTO, label: 'No inscripto' },
    { value: InscripcionState.IN_PROCESS, label: 'En proceso' },
    { value: InscripcionState.PENDIENTE, label: 'Pendiente' },
    { value: InscripcionState.INSCRIPTO, label: 'Inscripto' },
    { value: InscripcionState.CANCELLED, label: 'Cancelado' },
    { value: InscripcionState.REJECTED, label: 'Rechazado' }
  ];

  // Columnas para la tabla
  columns = [
    { property: 'userInfo.fullName', header: 'Nombre', sortable: true },
    { property: 'userInfo.dni', header: 'DNI', sortable: true },
    { property: 'state', header: 'Estado', sortable: true },
    { property: 'inscriptionDate', header: 'Fecha de inscripción', sortable: true },
    { property: 'actions', header: 'Acciones', sortable: false }
  ];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscripcionesService,
    private dialogService: CustomDialogService,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      state: ['ALL'],
      search: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.setupFilterListeners();
    // Cargar inscripciones después de un pequeño delay para evitar conflictos con los listeners
    setTimeout(() => {
      this.loadInscripciones();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Evitar cargar en la inicialización
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
          return;
        }
        this.currentPage = 0;
        this.loadInscripciones();
      });
  }

  loadInscripciones(): void {
    if (!this.contestId) {
      this.snackBar.open('ID de concurso no válido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const filter: InscriptionFilter = {
      contestId: this.contestId,
      state: this.filterForm.get('state')?.value,
      search: this.filterForm.get('search')?.value,
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      page: this.currentPage,
      size: this.pageSize,
      sort: 'inscriptionDate',
      direction: 'desc'
    };

    this.inscripcionesService.getInscripcionesByConcurso(this.contestId, filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.inscripciones = response.content;
          this.totalInscripciones = response.totalElements;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando inscripciones:', error);
          this.snackBar.open('Error al cargar las inscripciones', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInscripciones();
  }

  onSortChange(event: any): void {
    const filter: InscriptionFilter = {
      contestId: this.contestId,
      state: this.filterForm.get('state')?.value,
      search: this.filterForm.get('search')?.value,
      startDate: this.filterForm.get('startDate')?.value,
      endDate: this.filterForm.get('endDate')?.value,
      page: this.currentPage,
      size: this.pageSize,
      sort: event.property,
      direction: event.direction
    };

    this.isLoading = true;

    this.inscripcionesService.getInscripcionesByConcurso(this.contestId, filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.inscripciones = response.content;
          this.totalInscripciones = response.totalElements;
          this.totalPages = response.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando inscripciones:', error);
          this.snackBar.open('Error al cargar las inscripciones', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  viewInscripcion(inscripcion: AdminInscription): void {
    this.dialogService.confirm(
      `Detalles de inscripción - ${inscripcion.userInfo?.fullName || 'Usuario'}`,
      this.getInscripcionDetailsContent(inscripcion),
      {
        width: '600px'
      }
    );
  }



  getStateLabel(state: InscripcionState): string {
    const stateObj = this.inscripcionStates.find(s => s.value === state);
    return stateObj ? stateObj.label : state;
  }

  getStateClass(state: InscripcionState): string {
    switch (state) {
      case 'INSCRIPTO': return 'state-approved';
      case 'PENDIENTE': return 'state-pending';
      case 'IN_PROCESS': return 'state-in-process';
      case 'REJECTED': return 'state-rejected';
      case 'CANCELLED': return 'state-cancelled';
      default: return 'state-default';
    }
  }

  // Nuevas funciones para la interfaz mejorada
  getInscripcionesByState(state: InscripcionState): AdminInscription[] {
    return this.inscripciones.filter(inscripcion => inscripcion.state === state);
  }

  resetFilters(): void {
    this.filterForm.reset({ state: 'ALL' });
    this.loadInscripciones();
  }

  formatDate(date: string | Date): string {
    if (!date) return 'No disponible';
    try {
      return new Date(date).toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  formatTime(date: string | Date): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  }

  getDocumentsStatus(documents: any[]): string {
    if (!documents || documents.length === 0) return 'Sin docs';

    const approved = documents.filter(doc => doc.status === 'APPROVED').length;
    const pending = documents.filter(doc => doc.status === 'PENDING').length;
    const rejected = documents.filter(doc => doc.status === 'REJECTED').length;

    if (rejected > 0) return 'Rechazados';
    if (pending > 0) return 'Pendientes';
    if (approved === documents.length) return 'Completos';
    return 'Parciales';
  }

  getDocumentsStatusClass(documents: any[]): string {
    const status = this.getDocumentsStatus(documents);
    switch (status) {
      case 'Completos': return 'docs-complete';
      case 'Pendientes': return 'docs-pending';
      case 'Rechazados': return 'docs-rejected';
      case 'Parciales': return 'docs-partial';
      default: return 'docs-none';
    }
  }

  openChangeStateDialog(inscripcion: AdminInscription): void {
    const availableStates = this.inscripcionStates.filter(state =>
      state.value !== inscripcion.state && state.value !== 'ALL'
    );

    const stateOptions = availableStates.map(state =>
      `<option value="${state.value}">${state.label}</option>`
    ).join('');

    const message = `
      <div class="change-state-form">
        <p>Cambiar estado de la inscripción de <strong>${inscripcion.userInfo?.fullName || 'Usuario'}</strong></p>

        <div class="form-field">
          <label for="newState">Nuevo estado:</label>
          <select id="newState" class="form-control">
            ${stateOptions}
          </select>
        </div>

        <div class="form-field">
          <label for="note">Nota (opcional):</label>
          <textarea id="note" class="form-control" rows="3" placeholder="Ingrese una nota sobre este cambio de estado"></textarea>
        </div>
      </div>
    `;

    const dialogRef = this.dialogService.confirm(
      'Cambiar Estado de Inscripción',
      message,
      {
        width: '500px'
      }
    );

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newStateElement = document.getElementById('newState') as HTMLSelectElement;
        const noteElement = document.getElementById('note') as HTMLTextAreaElement;

        const newState = newStateElement?.value as InscripcionState;
        const note = noteElement?.value || '';

        if (newState) {
          this.changeState(inscripcion, newState, note);
        }
      }
    });
  }

  changeState(inscripcion: AdminInscription, newState: InscripcionState, note?: string): void {
    this.isLoading = true;

    this.inscripcionesService.changeState({
      inscriptionId: inscripcion.id,
      newState,
      note: note || ''
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success(`Estado de inscripción actualizado a ${this.getStateLabel(newState)}`);
          this.loadInscripciones();
        },
        error: (error) => {
          console.error('Error cambiando estado de inscripción:', error);
          this.notificationService.error('Error al cambiar el estado de la inscripción');
          this.isLoading = false;
        }
      });
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadInscripciones();
    }
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.totalInscripciones) {
      this.currentPage++;
      this.loadInscripciones();
    }
  }

  // Función Math para el template
  Math = Math;

  getInscripcionDetailsContent(inscripcion: AdminInscription): string {
    return `
      <div class="inscription-details">
        <h3>Información del usuario</h3>
        <div class="details-row">
          <div class="details-label">Nombre completo:</div>
          <div class="details-value">${inscripcion.userInfo?.fullName || 'No disponible'}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Email:</div>
          <div class="details-value">${inscripcion.userInfo?.email || 'No disponible'}</div>
        </div>
        <div class="details-row">
          <div class="details-label">DNI:</div>
          <div class="details-value">${inscripcion.userInfo?.dni || 'No disponible'}</div>
        </div>

        <h3>Información de la inscripción</h3>
        <div class="details-row">
          <div class="details-label">Estado:</div>
          <div class="details-value">
            <span class="${this.getStateClass(inscripcion.state)}">${this.getStateLabel(inscripcion.state)}</span>
          </div>
        </div>
        <div class="details-row">
          <div class="details-label">Fecha de inscripción:</div>
          <div class="details-value">${this.formatDate(inscripcion.inscriptionDate)}</div>
        </div>
        <div class="details-row">
          <div class="details-label">Última actualización:</div>
          <div class="details-value">${this.formatDate(inscripcion.lastUpdated)}</div>
        </div>

        ${inscripcion.documents && inscripcion.documents.length > 0 ? `
          <h3>Documentos</h3>
          <div class="documents-list">
            ${inscripcion.documents.map(doc => `
              <div class="document-item">
                <div class="document-name">${doc.name}</div>
                <div class="document-status ${doc.status.toLowerCase()}">${doc.status}</div>
                <div class="document-date">Subido el ${this.formatDate(doc.uploadDate)}</div>
              </div>
            `).join('')}
          </div>
        ` : '<p>No hay documentos adjuntos</p>'}

        ${inscripcion.notes && inscripcion.notes.length > 0 ? `
          <h3>Notas administrativas</h3>
          <div class="notes-list">
            ${inscripcion.notes.map(note => `
              <div class="note-item">
                <div class="note-text">${note.text}</div>
                <div class="note-meta">Por ${note.createdBy} el ${this.formatDate(note.createdAt)}</div>
              </div>
            `).join('')}
          </div>
        ` : '<p>No hay notas administrativas</p>'}
      </div>
    `;
  }
}
