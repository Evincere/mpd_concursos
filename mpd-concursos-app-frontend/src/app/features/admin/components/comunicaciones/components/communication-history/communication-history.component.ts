import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';


import {
  NotificationType,
  AcknowledgementLevel
} from '@core/models/notification.model';
import { MassNotificationsService } from  '@core/services/admin/mass-notifications.service';

interface CommunicationHistoryItem {
  id: string;
  subject: string;
  content: string;
  type: NotificationType;
  acknowledgementLevel: AcknowledgementLevel;
  sentAt: Date;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  readCount: number;
  acknowledgedCount: number;
  status: string;
  scheduledTime?: Date;
}

@Component({
  selector: 'app-communication-history',
  templateUrl: './communication-history.component.html',
  styleUrls: ['./communication-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class CommunicationHistoryComponent implements OnInit, OnDestroy {
  // Datos
  communicationHistory: CommunicationHistoryItem[] = [];

  // Estado de la UI
  isLoading = false;

  // Paginación y ordenamiento
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  // Columnas para la tabla
  displayedColumns: string[] = [
    'sentAt',
    'subject',
    'type',
    'totalRecipients',
    'status',
    'actions'
  ];

  // Formulario de filtros
  filterForm: FormGroup;

  // Tipos de notificación y niveles de acuse para los filtros
  notificationTypes = Object.values(NotificationType);
  acknowledgementLevels = Object.values(AcknowledgementLevel);

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private massNotificationsService: MassNotificationsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: [''],
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      })
    });
  }

  ngOnInit(): void {
    this.loadCommunicationHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el historial de comunicaciones
   */
  loadCommunicationHistory(): void {
    this.isLoading = true;

    // En una implementación real, esto sería una llamada a la API
    // Aquí usamos datos mock para desarrollo
    setTimeout(() => {
      this.communicationHistory = this.getMockCommunicationHistory();
      this.totalItems = this.communicationHistory.length;
      this.isLoading = false;
    }, 500);
  }

  /**
   * Aplica los filtros de búsqueda
   */
  applyFilter(): void {
    this.pageIndex = 0;
    this.loadCommunicationHistory();
  }

  /**
   * Reinicia los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      type: '',
      status: '',
      dateRange: {
        start: null,
        end: null
      }
    });
    this.pageIndex = 0;
    this.loadCommunicationHistory();
  }

  /**
   * Maneja el cambio de página
   * @param event Evento de cambio de página
   */
  onPageChange(event: unknown): void {
    const eventObj = event as { pageIndex: number; pageSize: number };
    this.pageIndex = eventObj.pageIndex;
    this.pageSize = eventObj.pageSize;
    this.loadCommunicationHistory();
  }

  /**
   * Obtiene el nombre para el tipo de notificación
   * @param type Tipo de notificación
   * @returns Nombre del tipo de notificación
   */
  getNotificationTypeName(type: NotificationType): string {
    switch (type) {
      case NotificationType.INSCRIPTION:
        return 'Inscripción';
      case NotificationType.CONTEST:
        return 'Concurso';
      case NotificationType.DOCUMENT:
        return 'Documento';
      case NotificationType.EXAM:
        return 'Examen';
      case NotificationType.SYSTEM:
      default:
        return 'Sistema';
    }
  }

  /**
   * Obtiene la clase CSS para el estado de una comunicación
   * @param status Estado de la comunicación
   * @returns Clase CSS
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'SENT':
        return 'status-sent';
      case 'PROCESSING':
        return 'status-processing';
      case 'SCHEDULED':
        return 'status-scheduled';
      case 'FAILED':
        return 'status-failed';
      default:
        return '';
    }
  }

  /**
   * Obtiene el nombre para el estado de una comunicación
   * @param status Estado de la comunicación
   * @returns Nombre del estado
   */
  getStatusName(status: string): string {
    switch (status) {
      case 'SENT':
        return 'Enviada';
      case 'PROCESSING':
        return 'Procesando';
      case 'SCHEDULED':
        return 'Programada';
      case 'FAILED':
        return 'Fallida';
      default:
        return status;
    }
  }

  /**
   * Genera datos mock para el historial de comunicaciones
   * @returns Lista de comunicaciones
   */
  private getMockCommunicationHistory(): CommunicationHistoryItem[] {
    return [
      {
        id: '1',
        subject: 'Nuevo concurso disponible',
        content: 'Estimado/a usuario/a,\n\nNos complace informarle que se ha publicado un nuevo concurso en la plataforma. Le invitamos a revisar los detalles y considerar su participación.\n\nSaludos cordiales,\nEquipo MPD Concursos',
        type: NotificationType.CONTEST,
        acknowledgementLevel: AcknowledgementLevel.SIMPLE,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 días atrás
        totalRecipients: 150,
        successCount: 148,
        failureCount: 2,
        readCount: 120,
        acknowledgedCount: 95,
        status: 'SENT'
      },
      {
        id: '2',
        subject: 'Recordatorio de documentación pendiente',
        content: 'Estimado/a {{user.fullName}},\n\nLe recordamos que tiene documentación pendiente de presentar para su inscripción al concurso "{{contest.title}}".\n\nPor favor, complete la documentación antes del {{contest.endDate}}.\n\nSaludos cordiales,\nEquipo MPD Concursos',
        type: NotificationType.DOCUMENT,
        acknowledgementLevel: AcknowledgementLevel.SIGNATURE_BASIC,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 días atrás
        totalRecipients: 45,
        successCount: 45,
        failureCount: 0,
        readCount: 40,
        acknowledgedCount: 38,
        status: 'SENT'
      },
      {
        id: '3',
        subject: 'Actualización de plataforma',
        content: 'Estimados usuarios,\n\nLes informamos que la plataforma estará en mantenimiento el día 15/06/2023 de 22:00 a 02:00 hs.\n\nDisculpen las molestias.\n\nSaludos cordiales,\nEquipo MPD Concursos',
        type: NotificationType.SYSTEM,
        acknowledgementLevel: AcknowledgementLevel.NONE,
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 días atrás
        totalRecipients: 500,
        successCount: 495,
        failureCount: 5,
        readCount: 350,
        acknowledgedCount: 0,
        status: 'SENT'
      },
      {
        id: '4',
        subject: 'Examen próximo a realizarse',
        content: 'Estimado/a {{user.fullName}},\n\nLe recordamos que el examen para el concurso "{{contest.title}}" se realizará el día 20/06/2023 a las 10:00 hs.\n\nPor favor, asegúrese de contar con una conexión estable a internet y un ambiente tranquilo para realizar el examen.\n\nSaludos cordiales,\nEquipo MPD Concursos',
        type: NotificationType.EXAM,
        acknowledgementLevel: AcknowledgementLevel.SIGNATURE_ADVANCED,
        sentAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 días en el futuro
        totalRecipients: 75,
        successCount: 0,
        failureCount: 0,
        readCount: 0,
        acknowledgedCount: 0,
        status: 'SCHEDULED',
        scheduledTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
      },
      {
        id: '5',
        subject: 'Resultados de evaluación',
        content: 'Estimado/a {{user.fullName}},\n\nLe informamos que ya están disponibles los resultados de la evaluación del concurso "{{contest.title}}".\n\nPuede consultarlos ingresando a su perfil en la sección "Mis Postulaciones".\n\nSaludos cordiales,\nEquipo MPD Concursos',
        type: NotificationType.CONTEST,
        acknowledgementLevel: AcknowledgementLevel.SIMPLE,
        sentAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        totalRecipients: 80,
        successCount: 65,
        failureCount: 15,
        readCount: 40,
        acknowledgedCount: 25,
        status: 'PROCESSING'
      }
    ];
  }
}
