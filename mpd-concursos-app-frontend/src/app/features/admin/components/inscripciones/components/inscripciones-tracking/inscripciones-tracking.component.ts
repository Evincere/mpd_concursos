import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject, interval } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminInscriptionsService, AdminInscription } from '../../../../../../core/services/admin/admin-inscriptions.service';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscripcionDetalleAdminComponent } from '../inscripcion-detalle/inscripcion-detalle-admin.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

interface InscriptionAlert {
  id: string;
  inscriptionId: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  createdAt: Date;
  isRead: boolean;
  priority: number;
}

@Component({
  selector: 'app-inscripciones-tracking',
  templateUrl: './inscripciones-tracking.component.html',
  styleUrls: ['./inscripciones-tracking.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatCheckboxModule,
    CustomButtonComponent
  ]
})
export class InscripcionesTrackingComponent implements OnInit, OnDestroy {
  // Tabla de inscripciones recientes
  recentInscriptionsColumns: string[] = ['userInfo', 'contestInfo', 'status', 'waitTime', 'actions'];
  recentInscriptions: AdminInscription[] = [];

  // Tabla de alertas
  alertsColumns: string[] = ['priority', 'type', 'message', 'createdAt', 'actions'];
  alerts: InscriptionAlert[] = [];

  // Filtros
  filterForm: FormGroup;

  statusOptions: { value: InscripcionState | 'ALL', label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: InscripcionState.PENDING, label: 'Pendiente' },
    { value: InscripcionState.ACTIVE, label: 'Activa' }
  ];

  // Estadísticas
  stats = {
    avgResponseTime: 0,
    pendingCount: 0,
    oldestPending: 0,
    alertsCount: 0
  };

  // Estado de la UI
  isLoading = false;
  activeTab = 0;
  refreshInterval = 60; // segundos
  timeLeft = this.refreshInterval;
  autoRefresh = true;
  isDropdownOpen = false;

  private destroy$ = new Subject<void>();
  private refreshTimer$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private inscripcionesService: AdminInscriptionsService,
    private dialog: MatDialog,
    private notificationService: UnifiedNotificationService,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      status: ['PENDING'],
      minWaitTime: [24], // horas
      maxAlerts: [10]
    });
  }

  ngOnInit(): void {
    this.setupFilterListeners();
    this.loadData();
    this.startRefreshTimer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.refreshTimer$.next();
    this.refreshTimer$.complete();
  }

  setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loadData();
      });
  }

  loadData(): void {
    this.isLoading = true;

    // Cargar inscripciones recientes según filtros
    const status = this.filterForm.get('status')?.value;
    const minWaitTime = this.filterForm.get('minWaitTime')?.value;

    // Simulamos la carga de datos
    setTimeout(() => {
      this.recentInscriptions = this.getMockInscriptions(status, minWaitTime);
      this.alerts = this.getMockAlerts();
      this.calculateStats();
      this.isLoading = false;
      this.resetRefreshTimer();
    }, 800);
  }

  calculateStats(): void {
    // Calcular estadísticas basadas en los datos cargados
    this.stats.pendingCount = this.recentInscriptions.filter(i =>
      i.state === InscripcionState.PENDING).length;

    // Calcular tiempo promedio de respuesta (simulado)
    this.stats.avgResponseTime = Math.floor(Math.random() * 48) + 24; // Entre 24 y 72 horas

    // Calcular tiempo de la inscripción pendiente más antigua (simulado)
    const waitTimes = this.recentInscriptions
      .filter(i => i.state === InscripcionState.PENDING)
      .map(i => this.calculateWaitTime(i.createdAt));

    this.stats.oldestPending = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    // Contar alertas no leídas
    this.stats.alertsCount = this.alerts.filter(a => !a.isRead).length;
  }

  getMockInscriptions(status: InscripcionState | 'ALL', minWaitHours: number): AdminInscription[] {
    const result: AdminInscription[] = [];
    const now = new Date();

    // Generar inscripciones de ejemplo
    for (let i = 1; i <= 20; i++) {
      const waitHours = Math.floor(Math.random() * 120) + 1; // Entre 1 y 120 horas
      const createdAt = new Date(now.getTime() - (waitHours * 60 * 60 * 1000));

      const inscriptionState = i % 3 === 0 ? InscripcionState.ACTIVE : InscripcionState.PENDING;

      if (status !== 'ALL' && inscriptionState !== status) {
        continue;
      }

      if (waitHours < minWaitHours) {
        continue;
      }

      const updatedAt = new Date(createdAt.getTime() + (Math.random() * 10 * 60 * 60 * 1000));

      const inscription: AdminInscription = {
        id: `insc-${i}`,
        contestId: i % 5 + 1,
        userId: `user-${i}`,
        state: inscriptionState,
        createdAt: createdAt,
        updatedAt: updatedAt,
        inscriptionDate: createdAt.toISOString(),
        lastUpdated: updatedAt.toISOString(),
        contestTitle: `Concurso para ${i % 2 === 0 ? 'Defensor' : 'Fiscal'} ${i % 3 === 0 ? 'Penal' : 'Civil'}`,
        contestCategory: i % 2 === 0 ? 'Defensor' : 'Fiscal',
        contestDepartment: ['Capital', 'San Rafael', 'General Alvear', 'Malargüe'][i % 4],
        userFullName: `Usuario Ejemplo ${i}`,
        userEmail: `usuario${i}@example.com`,
        userDni: `${30000000 + i}`,
        documentsCount: Math.floor(Math.random() * 5) + 3,
        pendingDocuments: Math.floor(Math.random() * 3),
        approvedDocuments: Math.floor(Math.random() * 3),
        rejectedDocuments: Math.floor(Math.random() * 2),
        lastUpdate: updatedAt
      };

      result.push(inscription);
    }

    // Ordenar por tiempo de espera (más antiguas primero)
    return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  getMockAlerts(): InscriptionAlert[] {
    const result: InscriptionAlert[] = [];
    const now = new Date();

    // Generar alertas de ejemplo
    const alertTypes: { type: 'warning' | 'danger' | 'info', message: string }[] = [
      { type: 'danger', message: 'Inscripción pendiente por más de 7 días' },
      { type: 'warning', message: 'Documentos pendientes de revisión por más de 3 días' },
      { type: 'warning', message: 'Usuario ha enviado múltiples consultas sin respuesta' },
      { type: 'info', message: 'Concurso próximo a cerrar con inscripciones pendientes' },
      { type: 'danger', message: 'Inscripción rechazada automáticamente por tiempo de espera' }
    ];

    for (let i = 1; i <= 15; i++) {
      const alertIndex = i % alertTypes.length;
      const createdAt = new Date(now.getTime() - (Math.random() * 72 * 60 * 60 * 1000));
      const isRead = i % 3 === 0;

      const alert: InscriptionAlert = {
        id: `alert-${i}`,
        inscriptionId: `insc-${i % 10 + 1}`,
        type: alertTypes[alertIndex].type,
        message: alertTypes[alertIndex].message,
        createdAt: createdAt,
        isRead: isRead,
        priority: alertTypes[alertIndex].type === 'danger' ? 1 : (alertTypes[alertIndex].type === 'warning' ? 2 : 3)
      };

      result.push(alert);
    }

    // Filtrar por máximo de alertas y ordenar por prioridad y fecha
    return result
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, this.filterForm.get('maxAlerts')?.value || 10);
  }

  calculateWaitTime(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60)); // Convertir a horas
  }

  formatWaitTime(hours: number): string {
    if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
  }

  getWaitTimeClass(hours: number): string {
    if (hours < 24) {
      return 'wait-normal';
    } else if (hours < 72) {
      return 'wait-warning';
    } else {
      return 'wait-danger';
    }
  }

  getStatusClass(status: InscripcionState): string {
    switch (status) {
      case InscripcionState.PENDING: return 'status-pending';
      case InscripcionState.APPROVED: return 'status-approved';
      case InscripcionState.REJECTED: return 'status-rejected';
      case InscripcionState.CANCELLED: return 'status-cancelled';
      case InscripcionState.ACTIVE: return 'status-in-process';
      default: return '';
    }
  }

  getStatusLabel(status: InscripcionState): string {
    switch (status) {
      case InscripcionState.PENDING: return 'Pendiente';
      case InscripcionState.APPROVED: return 'Aprobada';
      case InscripcionState.REJECTED: return 'Rechazada';
      case InscripcionState.CANCELLED: return 'Cancelada';
      case InscripcionState.ACTIVE: return 'Activa';
      default: return status;
    }
  }

  getAlertTypeClass(type: string): string {
    switch (type) {
      case 'danger': return 'alert-danger';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return '';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'danger': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'help';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  viewInscription(inscription: AdminInscription): void {
    const dialogRef = this.dialog.open(InscripcionDetalleAdminComponent, {
      width: '90%',
      maxWidth: '1200px',
      height: '90%',
      data: { inscriptionId: inscription.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  markAlertAsRead(alert: InscriptionAlert): void {
    alert.isRead = true;
    this.calculateStats();
    this.notificationService.success('Alerta marcada como leída');
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;

    if (this.autoRefresh) {
      this.startRefreshTimer();
    } else {
      this.refreshTimer$.next();
    }
  }

  startRefreshTimer(): void {
    if (!this.autoRefresh) return;

    this.timeLeft = this.refreshInterval;

    interval(1000)
      .pipe(takeUntil(this.refreshTimer$))
      .subscribe(() => {
        this.timeLeft--;

        if (this.timeLeft <= 0) {
          this.loadData();
        }
      });
  }

  resetRefreshTimer(): void {
    this.refreshTimer$.next();
    this.startRefreshTimer();
  }

  manualRefresh(): void {
    this.loadData();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/admin/inscripciones/dashboard']);
  }

  // Métodos para el dropdown personalizado
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectStatus(value: string, label: string): void {
    this.filterForm.patchValue({ status: value });
    this.isDropdownOpen = false;
  }

  getSelectedStatusLabel(): string {
    const selectedValue = this.filterForm.get('status')?.value;
    const selectedOption = this.statusOptions.find(option => option.value === selectedValue);
    return selectedOption ? selectedOption.label : 'Seleccionar...';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.custom-select-wrapper');

    if (!dropdown) {
      this.isDropdownOpen = false;
    }
  }
}
