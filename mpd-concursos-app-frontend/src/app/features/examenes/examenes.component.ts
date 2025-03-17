import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { Subject, takeUntil } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';
import { ExamenesService } from '@core/services/examenes/examenes.service';
import { Injector } from '@angular/core';

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
    private examenesState: ExamenesStateService,
    private router: Router,
    private examenSecurity: ExamenSecurityService,
    private cdr: ChangeDetectorRef,
    private notificationService: ExamenNotificationService,
    private examenesService: ExamenesService,
    private injector: Injector
  ) {}

  ngOnInit(): void {
    // Nos aseguramos de que todas las estrategias de seguridad estén desactivadas
    // al entrar al listado de exámenes
    this.examenSecurity.deactivateSecureMode();
    this.examenSecurity.reset();

    // Limpiamos todas las notificaciones y diálogos abiertos
    this.notificationService.cleanup();

    // Deshabilitamos explícitamente las notificaciones de seguridad
    this.notificationService.disableNotifications();

    console.log('Estrategias de seguridad y notificaciones desactivadas en el listado de exámenes');

    // Suscribirse a los cambios de estado
    this.examenesState.getExamenes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(examenes => this.examenes = examenes);

    this.examenesState.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.examenesState.getError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    // Cargar exámenes iniciales
    this.examenesState.loadExamenes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(termino: string): void {
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
      const yaRealizado = await examenesService.verificarExamenRealizado(examenId).toPromise();

      if (yaRealizado) {
        this.notificationService.mostrarAdvertencia('Este examen ya ha sido realizado anteriormente.');
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
      this.notificationService.mostrarError('Error al iniciar el examen. Intente nuevamente.');
      this.loading = false;
    }
  }

  getMensajeDisponibilidad(examen: Examen): string {
    const ahora = new Date();
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
      [ESTADO_EXAMEN.BORRADOR]: 'estado-borrador',
      [ESTADO_EXAMEN.ACTIVO]: 'estado-activo',
      [ESTADO_EXAMEN.ANULADO]: 'estado-anulado',
      [ESTADO_EXAMEN.FINALIZADO]: 'estado-finalizado',
      [ESTADO_EXAMEN.DISPONIBLE]: 'estado-disponible',
      [ESTADO_EXAMEN.EN_CURSO]: 'estado-en-curso'
    };
    return clases[estado] || '';
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
    const tipos: { [key: string]: string } = {
      'technical_legal': 'Técnico-Jurídico',
      'technical_administrative': 'Técnico-Administrativo',
      'psychological': 'Psicológico'
    };
    return tipos[tipo.toLowerCase()] || tipo;
  }

  async mostrarDialogoConfirmacion(titulo: string, mensaje: string): Promise<boolean> {
    // Implementa la lógica para mostrar un diálogo de confirmación y devolver el resultado
    // Esto puede ser una promesa que espera la respuesta del usuario
    return true; // Simulación, deberías implementar la lógica real
  }
}
