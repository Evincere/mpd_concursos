import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomTabsComponent } from '@shared/components/custom-form/custom-tabs/custom-tabs.component';
import { CustomTabComponent } from '@shared/components/custom-form/custom-tabs/custom-tab.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomMenuComponent } from '@shared/components/custom-form/custom-menu/custom-menu.component';
import { CustomMenuItemComponent } from '@shared/components/custom-form/custom-menu/custom-menu-item.component';
import { CustomMenuTriggerDirective } from '@shared/components/custom-form/custom-menu/custom-menu-trigger.directive';
import { DialogService } from '@shared/services/dialog/dialog.service';
import { NotificationService } from '@shared/services/notification.service';

// Servicios
import { AdminConcursosService } from '@core/services/admin/admin-concursos.service';
import { AdminContestDatesService } from '@core/services/admin/admin-contest-dates.service';
import { AdminContestRequirementsService } from '@core/services/admin/admin-contest-requirements.service';

import { Concurso, ContestStatus } from '@shared/interfaces/concurso/concurso.interface';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { ContestRequirement } from '@core/services/admin/admin-contest-requirements.service';
import { ConcursoFormDialogComponent } from '../concurso-form-dialog/concurso-form-dialog.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ConcursoFechasComponent } from '../concurso-fechas/concurso-fechas.component';
import { ConcursoRequisitosComponent } from '../concurso-requisitos/concurso-requisitos.component';
import { ConcursoInscripcionesComponent } from '../concurso-inscripciones/concurso-inscripciones.component';

@Component({
  selector: 'app-concurso-detalle-admin',
  templateUrl: './concurso-detalle-admin.component.html',
  styleUrls: ['./concurso-detalle-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomTabsComponent,
    CustomTabComponent,
    CustomSpinnerComponent,
    CustomMenuComponent,
    CustomMenuItemComponent,
    CustomMenuTriggerDirective,
    ConcursoFechasComponent,
    ConcursoRequisitosComponent,
    ConcursoInscripcionesComponent
  ]
})
export class ConcursoDetalleAdminComponent implements OnInit, OnDestroy, AfterViewInit {
  concursoId!: number | string;
  concurso: Concurso | null = null;
  fechas: ContestDate[] = [];
  requisitos: ContestRequirement[] = [];

  isLoading = false;
  activeTab = 0;

  statusOptions: { value: ContestStatus, label: string }[] = [
    { value: 'DRAFT', label: 'Borrador' },
    { value: 'INSCRIPTION_OPEN', label: 'Inscripciones Abiertas' },
    { value: 'IN_EVALUATION', label: 'En Evaluación' },
    { value: 'INSCRIPTION_CLOSED', label: 'Inscripciones Cerradas' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private concursosService: AdminConcursosService,
    private fechasService: AdminContestDatesService,
    private requisitosService: AdminContestRequirementsService,
    private dialogService: DialogService,
    private notificationService: NotificationService
  ) {}



  ngOnInit(): void {
    console.log('🔍 [ConcursoDetalleAdmin] Componente inicializado');

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      console.log('🔍 [ConcursoDetalleAdmin] Parámetro ID recibido:', id);
      if (id) {
        this.concursoId = id;
        // Asegurar scroll al inicio antes de cargar contenido
        this.scrollToTop();
        this.loadConcurso();
      } else {
        console.warn('🔍 [ConcursoDetalleAdmin] No se encontró ID, redirigiendo...');
        this.router.navigate(['/admin/concursos']);
      }
    });
  }

  ngAfterViewInit(): void {
    // Ejecutar scroll después de que la vista esté completamente renderizada
    setTimeout(() => {
      this.scrollToTop();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConcurso(): void {
    console.log(`[ConcursoDetalleAdmin] Iniciando carga de concurso con ID: ${this.concursoId}`);
    this.isLoading = true;

    this.concursosService.getConcursoById(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (concurso: Concurso) => {
          console.log('[ConcursoDetalleAdmin] Concurso cargado exitosamente:', concurso);
          this.concurso = concurso;
          this.loadAdditionalData();
        },
        error: (error: unknown) => {
          console.error(`[ConcursoDetalleAdmin] Error cargando concurso con ID ${this.concursoId}:`, error);
          this.notificationService.mostrarError('Error al cargar el concurso');
          this.isLoading = false;
          // No redirigir inmediatamente, permitir que los datos de respaldo se muestren
          // this.router.navigate(['/admin/concursos']);
        }
      });
  }

  private loadAdditionalData(): void {
    // Cargar fechas y requisitos en paralelo
    forkJoin({
      fechas: this.fechasService.getContestDates(this.concursoId).pipe(
        catchError((error) => {
          console.error(`Error cargando fechas del concurso con ID ${this.concursoId}:`, error);
          return of([]);
        })
      ),
      requisitos: this.requisitosService.getContestRequirements(this.concursoId).pipe(
        catchError((error) => {
          console.error(`Error cargando requisitos del concurso con ID ${this.concursoId}:`, error);
          return of([]);
        })
      )
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data) => {
        this.fechas = data.fechas;
        this.requisitos = data.requisitos;
      },
      error: (error) => {
        console.error('Error cargando datos adicionales:', error);
      }
    });
  }

  loadFechas(): void {
    this.fechasService.getContestDates(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (fechas: ContestDate[]) => {
          this.fechas = fechas;
        },
        error: (error: unknown) => {
          console.error(`Error cargando fechas del concurso con ID ${this.concursoId}:`, error);
        }
      });
  }

  loadRequisitos(): void {
    this.requisitosService.getContestRequirements(this.concursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requisitos: ContestRequirement[]) => {
          this.requisitos = requisitos;
          this.isLoading = false;
        },
        error: (error: unknown) => {
          console.error(`Error cargando requisitos del concurso con ID ${this.concursoId}:`, error);
          this.isLoading = false;
        }
      });
  }

  editConcurso(): void {
    if (!this.concurso) return;

    this.dialogService.open(ConcursoFormDialogComponent, {
      title: 'Editar Concurso',
      icon: 'edit',
      size: 'large',
      data: { mode: 'edit', concurso: this.concurso },
      panelClass: ['glassmorphism-dialog', 'concurso-form-dialog-container'],
      showCloseButton: true,
      showFooter: false,
      showCancelButton: false,
      showConfirmButton: false
    }).afterClosed$.subscribe((result: unknown) => {
      if (result) {
        this.loadConcurso();
        this.notificationService.mostrarExito('Concurso actualizado correctamente');
      }
    });
  }

  deleteConcurso(): void {
    if (!this.concurso) return;

    this.dialogService.confirm({
      title: 'Eliminar Concurso',
      message: `¿Está seguro que desea eliminar el concurso "${this.concurso.title}"?`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      size: 'small'
    }).afterClosed$.subscribe((result: boolean) => {
      if (result) {
        this.isLoading = true;
        this.concursosService.deleteConcurso(this.concursoId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.notificationService.mostrarExito('Concurso eliminado correctamente');
              this.router.navigate(['/admin/concursos']);
            },
            error: (error: unknown) => {
              console.error('Error eliminando concurso:', error);
              this.notificationService.mostrarError('Error al eliminar el concurso');
              this.isLoading = false;
            }
          });
      }
    });
  }

  changeStatus(newStatus: ContestStatus): void {
    if (!this.concurso) return;

    this.isLoading = true;
    this.concursosService.changeStatus(this.concursoId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadConcurso();
          this.notificationService.mostrarExito(`Estado del concurso cambiado a ${this.getStatusLabel(newStatus)}`);
        },
        error: (error: unknown) => {
          console.error('Error cambiando estado del concurso:', error);
          this.notificationService.mostrarError('Error al cambiar el estado del concurso');
          this.isLoading = false;
        }
      });
  }

  getStatusLabel(status: ContestStatus): string {
    const statusOption = this.statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  }

  getStatusClass(status: ContestStatus): string {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'INSCRIPTION_OPEN': return 'status-inscription-open';
      case 'IN_EVALUATION': return 'status-in-evaluation';
      case 'INSCRIPTION_CLOSED': return 'status-inscription-closed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.warn('Error formateando fecha:', date, error);
      return 'Fecha inválida';
    }
  }

  onFechasUpdated(_id?: string): void {
    this.loadFechas();
  }

  onRequisitosUpdated(_id?: string): void {
    this.loadRequisitos();
  }

  /**
   * Desplaza la vista al inicio de la página
   * Soluciona el problema de posición inicial del scroll en navegaciones
   */
  private scrollToTop(): void {
    console.log('🔍 [ConcursoDetalleAdmin] Ejecutando scrollToTop()');

    if (typeof window !== 'undefined') {
      // Método 1: Scroll inmediato múltiple
      const forceScrollToTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Resetear scroll de elementos específicos del layout admin
        const adminElements = document.querySelectorAll(
          '.admin-layout, .admin-content, .main-content, .router-outlet, ' +
          '.concurso-detalle-container, .content, .scrollable, ' +
          '[style*="overflow"], [style*="scroll"]'
        );

        adminElements.forEach((element: Element) => {
          if (element instanceof HTMLElement) {
            element.scrollTop = 0;
            element.scrollLeft = 0;
          }
        });
      };

      // Ejecutar inmediatamente
      forceScrollToTop();

      // Ejecutar después de un micro-delay para asegurar que el DOM esté listo
      setTimeout(forceScrollToTop, 0);

      // Ejecutar después de un delay más largo para casos de carga lenta
      setTimeout(forceScrollToTop, 50);

      // Verificación final después de que todo esté renderizado
      setTimeout(() => {
        forceScrollToTop();
        console.log('🔍 [ConcursoDetalleAdmin] Scroll forzado completado');

        // Log de verificación
        console.log('🔍 [ConcursoDetalleAdmin] Posición final:', {
          window: { x: window.scrollX, y: window.scrollY },
          documentElement: {
            scrollTop: document.documentElement.scrollTop,
            scrollLeft: document.documentElement.scrollLeft
          },
          body: {
            scrollTop: document.body.scrollTop,
            scrollLeft: document.body.scrollLeft
          }
        });
      }, 150);
    }
  }
}
