import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router'; // Import Router
import { Observable, Subject, takeUntil } from 'rxjs';

import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';

import { ExamenesService } from '@core/services/examenes/examenes.service'; // Import ExamenesService
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service'; // Import ExamenSecurityService
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service'; // Import ExamenesStateService
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

@Component({
  selector: 'app-examenes',
  templateUrl: './examenes.component.html',
  styleUrls: ['./examenes.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SearchHeaderComponent,
    LoaderComponent,
    ContestStatusBadgeComponent,
    RouterModule
  ]
})
export class ExamenesComponent implements OnInit, OnDestroy {
  examenes: Examen[] = [];
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  readonly ESTADO_EXAMEN = ESTADO_EXAMEN;

  constructor(
    private router: Router, // Inyectar Router
    private examenesService: ExamenesService, // Inyectar ExamenesService
    private examenSecurity: ExamenSecurityService, // Inyectar ExamenSecurityService
    private unifiedNotificationService: UnifiedNotificationService, // Inyectar UnifiedNotificationService
    private examenesState: ExamenesStateService, // Inyectar ExamenesStateService
    private loggingService: LoggingService // Inyectar LoggingService
  ) {}

  ngOnInit(): void {
    // Nos aseguramos de que todas las estrategias de seguridad estén desactivadas
    // al entrar al listado de exámenes
    this.examenSecurity.deactivateSecureMode();
    this.examenSecurity.reset();

    // Limpiamos todas las notificaciones y diálogos abiertos
    this.unifiedNotificationService.dismissAll();

    this.loggingService.debug('Initializing ExamenesComponent', undefined, 'Examenes');

    // Suscribirse a los cambios de estado de carga
    this.examenesState.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => this.loading = loading);

    // Suscribirse a los cambios de error
    this.examenesState.getError()
      .pipe(takeUntil(this.destroy$))
      .subscribe((error: string | null) => this.error = error);

    // Suscribirse a los cambios en la lista de exámenes
    this.examenesState.getExamenes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((examenes: Examen[]) => this.examenes = examenes);

    // Cargar exámenes iniciales
    this.examenesState.loadExamenes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: any): void {
    // Extraer el término de búsqueda del evento
    const termino = typeof event === 'string' ? event :
      (event && event.target && event.target.value ? event.target.value : '');

    this.examenesState.filterExamenes(termino);
  }

  onFilter(): void {
    // Implementar filtros
    this.loggingService.debug('Filter action triggered', undefined, 'Examenes');
  }

  async iniciarExamen(examenId: string): Promise<void> {
    this.loading = true;
    this.loggingService.debug(`Attempting to start exam: ${examenId}`, undefined, 'Examenes');

    try {
      // Verificar si el examen ya ha sido realizado
      const yaRealizado = await new Promise<boolean>((resolve, reject) => {
        this.examenesService.verificarExamenRealizado(examenId).subscribe({
          next: (resultado: boolean) => resolve(resultado),
          error: (error: unknown) => reject(error)
        });
      });

      if (yaRealizado) {
        this.unifiedNotificationService.warning('Este examen ya ha sido realizado anteriormente.');
        this.loading = false;
        return;
      }

      // Preguntar al usuario si desea iniciar el examen
      const confirmacion = await this.mostrarDialogoConfirmacion(
        'Confirmar inicio de examen',
        'Una vez que inicie el examen, el tiempo comenzará a correr y no podrá pausarlo. ¿Está seguro de que desea comenzar?'
      );

      if (!confirmacion) {
        this.loading = false;
        return;
      }

      // Navegar a la página de rendición
      this.router.navigate(['/dashboard/examenes', examenId, 'rendir']);
    } catch (error) {
      console.error('Error al verificar o iniciar el examen:', error);
      this.unifiedNotificationService.error('Error al iniciar el examen. Intente nuevamente.');
      this.loading = false;
    }
  }

  getMensajeDisponibilidad(examen: Examen): string {
    const _ahora = new Date(); // Using _ahora for consistency, though not used in all cases here
    const fechaInicio = new Date(examen.fechaInicio);

    // Mensajes según el estado del examen
    switch (examen.estado) {
      case ESTADO_EXAMEN.DISPONIBLE:
        return `Examen disponible para rendir ahora`;
      case ESTADO_EXAMEN.EN_CURSO:
        return `Examen en curso`;
      case ESTADO_EXAMEN.FINALIZADO:
        return `Examen finalizado el ${this.formatearFecha(fechaInicio)}`;
      case ESTADO_EXAMEN.ANULADO:
        return `Examen anulado`;
      case ESTADO_EXAMEN.BORRADOR:
        return `Examen en borrador`;
      default:
        return `Estado: ${this.getEstadoLabel(examen.estado)}`;
    }
  }

  getEstadoLabel(estado: ESTADO_EXAMEN): string {
    const estados: Record<ESTADO_EXAMEN, string> = {
      [ESTADO_EXAMEN.BORRADOR]: 'Borrador',
      [ESTADO_EXAMEN.ACTIVO]: 'Activo',
      [ESTADO_EXAMEN.ANULADO]: 'Anulado',
      [ESTADO_EXAMEN.FINALIZADO]: 'Finalizado',
      [ESTADO_EXAMEN.DISPONIBLE]: 'Disponible',
      [ESTADO_EXAMEN.EN_CURSO]: 'En Curso'
    };
    return estados[estado] || estado;
  }

  getEstadoClass(estado: ESTADO_EXAMEN): string {
    const clases: Record<ESTADO_EXAMEN, string> = {
      [ESTADO_EXAMEN.BORRADOR]: 'pendiente',
      [ESTADO_EXAMEN.ACTIVO]: 'en_curso', // Typically active would mean available or in progress
      [ESTADO_EXAMEN.ANULADO]: 'vencido',
      [ESTADO_EXAMEN.FINALIZADO]: 'completado',
      [ESTADO_EXAMEN.DISPONIBLE]: 'en_curso',
      [ESTADO_EXAMEN.EN_CURSO]: 'en_curso'
    };
    return clases[estado] || 'pendiente';
  }

  /**
   * Maps exam status to contest status for the badge component
   */
  mapExamToContestStatus(estado: ESTADO_EXAMEN): string {
    const statusMap: Record<ESTADO_EXAMEN, string> = {
      [ESTADO_EXAMEN.BORRADOR]: 'DRAFT',
      [ESTADO_EXAMEN.ACTIVO]: 'ACTIVE',
      [ESTADO_EXAMEN.ANULADO]: 'CANCELLED',
      [ESTADO_EXAMEN.FINALIZADO]: 'CLOSED',
      [ESTADO_EXAMEN.DISPONIBLE]: 'ACTIVE',
      [ESTADO_EXAMEN.EN_CURSO]: 'IN_PROGRESS'
    };
    return statusMap[estado] || 'DRAFT';
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTipoExamenLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'technical_legal': 'Técnico-Jurídico',
      'technical_administrative': 'Técnico-Administrativo',
      'psychological': 'Psicológico'
    };
    return tipos[tipo.toLowerCase()] || tipo;
  }

  async mostrarDialogoConfirmacion(titulo: string, mensaje: string): Promise<boolean> {
    // Implementa la lógica para mostrar un diálogo de confirmación y devolver el resultado.
    // Esto es una simulación. En una aplicación real, usarías un servicio de diálogo (ej. MatDialog)
    // que retorna un Observable que se puede convertir a Promise.
    return new Promise((resolve) => {
      // Simular un diálogo con un confirm nativo (NO usar en producción)
      const resultado = confirm(`${titulo}\n\n${mensaje}`);
      resolve(resultado);
    });
  }
}
