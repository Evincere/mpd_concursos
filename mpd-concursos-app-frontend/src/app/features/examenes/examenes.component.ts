import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { Subject, takeUntil, Observable } from 'rxjs';

import { ExamenesService } from '@core/services/examenes/examenes.service';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service';


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
  private injector: { get: <T>(service: any) => T };
  private router: { navigate: (commands: string[]) => void };
  private examenSecurity: { deactivateSecureMode: () => void; reset: () => void };
  private notificationService: UnifiedNotificationService;
  private examenesState: {
    getExamenes: () => Observable<Examen[]>;
    getLoading: () => Observable<boolean>;
    getError: () => Observable<string | null>;
    loadExamenes: () => void;
    filterExamenes: (termino: string) => void;
  };

  constructor(
    private unifiedNotificationService: UnifiedNotificationService
  ) {
    // En una implementación real, se inyectarían los servicios necesarios
    this.injector = {
      get: <T>(service: any): T => {
        if (service === ExamenesService) {
          return {
            verificarExamenRealizado: (id: string) => {
              return new Observable<boolean>(observer => {
                observer.next(false);
                observer.complete();
              });
            }
          } as unknown as T;
        }
        return {} as T;
      }
    };

    this.router = {
      navigate: (commands: string[]) => {
        console.log(`Navegando a: ${commands.join('/')}`);
      }
    };

    this.examenSecurity = {
      deactivateSecureMode: () => console.log('Modo seguro desactivado'),
      reset: () => console.log('Seguridad reiniciada')
    };

    this.notificationService = this.unifiedNotificationService;

    this.examenesState = {
      getExamenes: () => new Observable<Examen[]>(observer => {
        observer.next([]);
        observer.complete();
      }),
      getLoading: () => new Observable<boolean>(observer => {
        observer.next(false);
        observer.complete();
      }),
      getError: () => new Observable<string | null>(observer => {
        observer.next(null);
        observer.complete();
      }),
      loadExamenes: () => console.log('Cargando exámenes'),
      filterExamenes: (termino: string) => console.log(`Filtrando exámenes por: ${termino}`)
    };
  }


  ngOnInit(): void {
    // Nos aseguramos de que todas las estrategias de seguridad estén desactivadas
    // al entrar al listado de exámenes
    this.examenSecurity.deactivateSecureMode();
    this.examenSecurity.reset();

    // Limpiamos todas las notificaciones y diálogos abiertos
    this.notificationService.dismissAll();

    console.log('Estrategias de seguridad y notificaciones desactivadas en el listado de exámenes');

    // Suscribirse a los cambios de estado
    this.examenesState.getExamenes()
      .pipe(takeUntil(this.destroy$))
      .subscribe((examenes: Examen[]) => this.examenes = examenes);

    this.examenesState.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => this.loading = loading);

    this.examenesState.getError()
      .pipe(takeUntil(this.destroy$))
      .subscribe((error: string | null) => this.error = error);

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
  }

  async iniciarExamen(examenId: string): Promise<void> {
    console.log('Verificando si el examen ya fue realizado...');

    // Verificar si el examen ya fue realizado por el usuario actual
    this.loading = true;

    try {
      const examenesService = this.injector.get(ExamenesService);
      // Convertir el Observable a Promise de forma segura
      const yaRealizado = await new Promise<boolean>((resolve, reject) => {
        (examenesService as unknown as { verificarExamenRealizado: (id: string) => Observable<boolean> })
          .verificarExamenRealizado(examenId).subscribe({
            next: (result: boolean) => resolve(result),
            error: (error: unknown) => reject(error)
          });
      });

      if (yaRealizado) {
        this.notificationService.warning('Este examen ya ha sido realizado anteriormente.');
        this.loading = false;
        return;
      }

      // Si no fue realizado, continuar con la inicialización
      console.log('Iniciando examen:', examenId);

      // Verificar si el navegador está en modo pantalla completa
      if (!document.fullscreenElement) {
        const confirmacion = await this.mostrarDialogoConfirmacion(
          'Iniciar examen',
          'El examen se abrirá en modo pantalla completa. ¿Desea continuar?'
        );

        if (!confirmacion) {
          this.loading = false;
          return;
        }
      }

      // Navegar a la página de rendición
      this.router.navigate(['/dashboard/examenes', examenId, 'rendir']);
    } catch (error) {
      console.error('Error al verificar o iniciar el examen:', error);
      this.notificationService.error('Error al iniciar el examen. Intente nuevamente.');
      this.loading = false;
    }
  }

  getMensajeDisponibilidad(examen: Examen): string {
    const _ahora = new Date();
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
      [ESTADO_EXAMEN.ACTIVO]: 'en_curso',
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

  async mostrarDialogoConfirmacion(_titulo: string, _mensaje: string): Promise<boolean> {
    // Implementa la lógica para mostrar un diálogo de confirmación y devolver el resultado
    // Esto puede ser una promesa que espera la respuesta del usuario
    return true; // Simulación, deberías implementar la lógica real
  }
}
