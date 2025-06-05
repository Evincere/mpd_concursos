import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { CustomDialogComponent } from '@shared/components/custom-dialog/custom-dialog.component';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmationService } from '@shared/services/confirmation.service';

import { BehaviorSubject, Subject, EMPTY } from 'rxjs';
import { finalize, takeUntil, take } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';

import { IInscriptionFormState, InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscripcionState, InscripcionStateUtils } from '@core/models/inscripcion/inscripcion-state.enum';
import { ContinueInscriptionDialogComponent } from '../continue-inscription-dialog/continue-inscription-dialog.component';
// Importación eliminada porque no se usa: import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomDialogComponent,
    ContinueInscriptionDialogComponent
  ],
  templateUrl: './inscripcion-button.component.html',
  styleUrl: './inscripcion-button.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class InscripcionButtonComponent implements OnInit, OnDestroy {
  @Input() contest!: Contest;
  @Output() inscriptionComplete = new EventEmitter<Contest>();

  loading = false;
  inscripcionState$ = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  InscripcionState = InscripcionState;
  private destroy$ = new Subject<void>();

  constructor(
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  /**
   * Obtiene la variante del botón según el estado de la inscripción
   * @param estado Estado actual de la inscripción
   * @returns Variante del botón
   */
  getButtonVariant(estado: InscripcionState): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' {
    if (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED) {
      return 'success';
    }

    if (estado === InscripcionState.REJECTED) {
      return 'danger';
    }

    if (estado === InscripcionState.CANCELLED) {
      return 'ghost';
    }

    if (estado === InscripcionState.PENDING || estado === InscripcionState.PENDIENTE) {
      return 'warning';
    }

    if (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE) {
      return 'secondary';
    }

    return 'primary';
  }

  /**
   * Obtiene el label del botón según el estado de la inscripción
   * @param estado Estado actual de la inscripción
   * @returns Label del botón
   */
  getButtonLabel(estado: InscripcionState): string {
    if (this.loading) {
      return 'Inscribiendo...';
    }

    if (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED) {
      return 'Inscripto';
    }

    if (estado === InscripcionState.REJECTED) {
      return 'Rechazada';
    }

    if (estado === InscripcionState.CANCELLED) {
      return 'Cancelada';
    }

    if (estado === InscripcionState.PENDING || estado === InscripcionState.PENDIENTE) {
      return 'Pendiente';
    }

    if (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE) {
      return 'Continuar';
    }

    return 'Inscribirse';
  }

  /**
   * Obtiene el icono del botón según el estado de la inscripción
   * @param estado Estado actual de la inscripción
   * @returns Icono del botón
   */
  getButtonIcon(estado: InscripcionState): string {
    if (this.loading) {
      return 'spinner';
    }

    if (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED) {
      return 'check';
    }

    if (estado === InscripcionState.REJECTED) {
      return 'times';
    }

    if (estado === InscripcionState.CANCELLED) {
      return 'ban';
    }

    if (estado === InscripcionState.PENDING || estado === InscripcionState.PENDIENTE) {
      return 'clock';
    }

    if (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE) {
      return 'play';
    }

    return 'user-plus';
  }

  /**
   * Obtiene el tooltip del botón según el estado de la inscripción
   * @param estado Estado actual de la inscripción
   * @returns Tooltip del botón
   */
  getButtonTooltip(estado: InscripcionState): string {
    if (this.loading) {
      return 'Procesando inscripción...';
    }

    if (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED) {
      return 'Ya estás inscripto en este concurso';
    }

    if (estado === InscripcionState.REJECTED) {
      return 'Tu inscripción fue rechazada';
    }

    if (estado === InscripcionState.CANCELLED) {
      return 'Tu inscripción fue cancelada';
    }

    if (estado === InscripcionState.PENDING || estado === InscripcionState.PENDIENTE) {
      return 'Tu inscripción está pendiente de validación';
    }

    if (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE) {
      return 'Continuar con el proceso de inscripción';
    }

    return 'Iniciar proceso de inscripción';
  }

  /**
   * Obtiene el texto para el atributo aria-label según el estado de la inscripción
   * @param estado Estado actual de la inscripción
   * @returns Texto descriptivo para el atributo aria-label
   */
  getAriaLabel(estado: InscripcionState): string {
    if (this.loading) {
      return 'Procesando inscripción, por favor espere';
    }

    if (estado === InscripcionState.NO_INSCRIPTO || this.isCancelledProcess(estado)) {
      return 'Inscribirse en este concurso';
    }

    if (this.isCancelledFinal(estado)) {
      return 'Inscripción cancelada para este concurso';
    }

    if (estado === InscripcionState.REJECTED) {
      return 'Inscripción rechazada para este concurso';
    }

    if (estado === InscripcionState.IN_PROCESS || estado === InscripcionState.ACTIVE) {
      return 'Continuar con el proceso de inscripción para este concurso';
    }

    if (estado === InscripcionState.CONFIRMADA || estado === InscripcionState.PENDIENTE || estado === InscripcionState.PENDING) {
      return 'Inscripción pendiente de validación para este concurso';
    }

    if (estado === InscripcionState.INSCRIPTO || estado === InscripcionState.APPROVED) {
      return 'Ya estás inscripto en este concurso';
    }

    return 'Inscribirse en este concurso';
  }

  ngOnInit(): void {
    // OPTIMIZACIÓN: Primero verificar en cache local antes de hacer peticiones HTTP
    this.verificarEstadoEnCache();

    // Suscribirse al estado de la inscripción para detectar cambios
    this.inscripcionState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(estado => {
      // Si el estado es final, limpiar los estados locales
      if (this.isFinalState(estado)) {
        // Buscar inscripciones incompletas para este concurso y limpiarlas
        const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
        const incompleteInscription = incompleteInscriptions.find((ins: IInscriptionFormState) =>
          ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id)
        );

        if (incompleteInscription) {
          console.log('[InscripcionButton] Limpiando inscripción incompleta para concurso con estado final:', estado);
          this.inscriptionStateService.clearInscriptionState(incompleteInscription.inscriptionId);
        }

        // Limpiar también el método antiguo
        const savedInscription = this.inscriptionStateService.getInProgressInscription();
        if (savedInscription && savedInscription.contestId === this.contest.id) {
          console.log('[InscripcionButton] Limpiando inscripción en progreso (método antiguo) para concurso con estado final:', estado);
          this.inscriptionStateService.clearInProgressInscription();
        }

        return; // No continuar con la verificación de inscripciones incompletas
      }

      // Solo verificar inscripciones incompletas si el estado permite reanudación
      if (this.canResumeState(estado) || estado === InscripcionState.NO_INSCRIPTO) {
        this.verificarInscripcionesIncompletas();
      }
    });
  }

  /**
   * OPTIMIZACIÓN: Verifica el estado en cache antes de hacer peticiones HTTP
   */
  private verificarEstadoEnCache(): void {
    const contestId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;

    // Primero verificar en las inscripciones ya cargadas
    this.inscriptionService.inscriptions.pipe(take(1)).subscribe(inscripciones => {
      const inscripcionExistente = inscripciones.find(ins => ins.contestId === contestId);

      if (inscripcionExistente) {
        console.log('[InscripcionButton] Estado encontrado en cache:', inscripcionExistente.state);
        this.inscripcionState$.next(inscripcionExistente.state);
        return;
      }

      // Si no está en cache, verificar con el backend pero con throttling
      console.log('[InscripcionButton] No encontrado en cache, verificando con backend...');
      this.verificarEstadoInscripcionOptimizado();
    });
  }

  /**
   * Versión optimizada que evita peticiones redundantes
   */
  private verificarEstadoInscripcionOptimizado(): void {
    if (!this.contest) return;

    // Usar el método optimizado del servicio que incluye cache y throttling
    this.loading = true;
    this.inscriptionService.getInscriptionStatus(this.contest.id)
      .pipe(
        finalize(() => this.loading = false),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (estado: InscripcionState) => {
          this.inscripcionState$.next(estado);
        },
        error: (error: any) => {
          // Los errores 404 son esperados cuando el usuario no está inscrito
          if (error?.status === 404) {
            this.inscripcionState$.next(InscripcionState.NO_INSCRIPTO);
          } else {
            console.error('[InscripcionButton] Error al verificar estado:', error);
            this.inscripcionState$.next(InscripcionState.NO_INSCRIPTO);
          }
        }
      });
  }

  /**
   * Verifica si hay inscripciones incompletas para este concurso
   * @returns void
   */
  private verificarInscripcionesIncompletas(): void {
    // Verificar si hay una inscripción en progreso para este concurso
    // Primero verificamos con el nuevo método
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    const incompleteInscription = incompleteInscriptions.find((ins: IInscriptionFormState) =>
      ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id)
    );

    if (incompleteInscription) {
      console.log('[InscripcionButton] Encontrada inscripción incompleta para este concurso:', incompleteInscription);

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === incompleteInscription.inscriptionId) {
        console.log('[InscripcionButton] Detectada redirección desde documentación, abriendo diálogo automáticamente');

        // Redirigir a la página de inscripción
        setTimeout(() => {
          this.abrirDialogoInscripcion(incompleteInscription.inscriptionId, true);
          // Limpiar la redirección para evitar que se abra nuevamente
          this.inscriptionStateService.clearRedirectFromInscription();
        }, 500); // Pequeño retraso para asegurar que la UI esté lista
      } else {
        // Si no venimos de documentación pero hay una inscripción incompleta, mostrar diálogo para continuar
        setTimeout(() => {
          this.mostrarDialogoContinuarInscripcion(incompleteInscription);
        }, 1000);
      }
      return;
    }

    // Método antiguo como fallback
    const savedInscription = this.inscriptionStateService.getInProgressInscription();
    if (savedInscription && savedInscription.contestId === this.contest.id) {
      console.log('[InscripcionButton] Encontrada inscripción en progreso para este concurso (método antiguo):', savedInscription);

      // Verificar si venimos de la pestaña de documentación
      const redirectId = this.inscriptionStateService.getRedirectFromInscription();
      if (redirectId && redirectId === savedInscription.id) {
        console.log('[InscripcionButton] Detectada redirección desde documentación, abriendo diálogo automáticamente');

        // Redirigir a la página de inscripción
        setTimeout(() => {
          this.abrirDialogoInscripcion(savedInscription.id);
          // Limpiar la redirección para evitar que se abra nuevamente
          this.inscriptionStateService.clearRedirectFromInscription();
        }, 500); // Pequeño retraso para asegurar que la UI esté lista
      }
    }
  }

  /**
   * Muestra un diálogo para continuar una inscripción incompleta
   * @param inscription Estado de la inscripción incompleta
   * @returns void
   */
  private mostrarDialogoContinuarInscripcion(inscription: IInscriptionFormState): void {
    // Verificar el estado actual de la inscripción en el backend antes de mostrar el diálogo
    this.inscriptionService.getInscriptionStatus(inscription.contestId).subscribe({
      next: (estado) => {
        // Si el estado es final, no permitir continuar con la inscripción
        // Nota: CANCELLED no se considera un estado final para permitir reiniciar el proceso
        if (estado === InscripcionState.PENDIENTE ||
            estado === InscripcionState.INSCRIPTO ||
            estado === InscripcionState.APPROVED ||
            estado === InscripcionState.REJECTED) {

          console.log('[InscripcionButton] No se puede continuar la inscripción porque ya tiene un estado final:', estado);

          // Actualizar el estado local
          this.inscripcionState$.next(estado);

          // Limpiar los estados locales
          this.inscriptionService.clearFormState(inscription.inscriptionId);
          this.inscriptionStateService.clearInscriptionState(inscription.inscriptionId);

          // Limpiar también el método antiguo
          this.inscriptionStateService.clearInProgressInscription();

          // Mostrar mensaje al usuario
          let mensaje = '';
          switch (estado) {
            case InscripcionState.PENDIENTE:
              mensaje = 'Ya tienes una inscripción pendiente de validación para este concurso';
              break;
            case InscripcionState.INSCRIPTO:
            case InscripcionState.APPROVED:
              mensaje = 'Ya estás inscripto en este concurso';
              break;
            case InscripcionState.REJECTED:
              mensaje = 'Tu inscripción para este concurso fue rechazada';
              break;
            default:
              mensaje = 'No puedes continuar con esta inscripción';
              break;
          }

          // Manejo especial para CANCELLED (no está en el switch porque causa error de tipos)
          if (estado.toString() === InscripcionState.CANCELLED.toString()) {
            mensaje = 'Tu inscripción para este concurso fue cancelada';
          }

          this.notificationService.warning(mensaje);
          return;
        }

        // Continuar con la apertura del diálogo si el estado no es final
        this.mostrarDialogoContinuarInscripcionConfirmado(inscription);
      },
      error: (error) => {
        console.error('[InscripcionButton] Error al verificar estado de inscripción:', error);
        // En caso de error, continuar con la apertura del diálogo
        this.mostrarDialogoContinuarInscripcionConfirmado(inscription);
      }
    });
  }

  /**
   * Muestra el diálogo de confirmación para continuar una inscripción incompleta
   * @param inscription Estado de la inscripción incompleta
   * @returns void
   */
  private mostrarDialogoContinuarInscripcionConfirmado(inscription: IInscriptionFormState): void {
    const contestTitle = inscription.contestTitle || this.contest.title || this.contest.position;

    this.confirmationService.info(
      'Continuar inscripción',
      `Tienes una inscripción en proceso para el concurso "${contestTitle}".`,
      '¿Deseas continuar donde lo dejaste?',
      'Sí, continuar',
      'No, empezar de nuevo'
    ).subscribe((result: boolean) => {
      if (result) {
        // Si el usuario quiere continuar, redirigir a la página de inscripción
        this.abrirDialogoInscripcion(inscription.inscriptionId, true);
      } else {
        // Si no quiere continuar, limpiar el estado guardado
        this.inscriptionStateService.clearInscriptionState(inscription.inscriptionId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Legacy method compatibility - now uses unified logic
   * @deprecated Use canResumeState instead
   */
  isCancelledProcess(estado: InscripcionState): boolean {
    return estado === InscripcionState.CANCELLED && this.canResumeState(estado);
  }

  /**
   * Legacy method compatibility - now uses unified logic
   * @deprecated Use isFinalState instead
   */
  isCancelledFinal(estado: InscripcionState): boolean {
    return estado === InscripcionState.CANCELLED && this.isFinalState(estado);
  }

  /**
   * Legacy method compatibility
   * @deprecated Use shouldShowFallback instead
   */
  hasVisibleContent(estado: InscripcionState): boolean {
    return !this.shouldShowFallback(estado);
  }

  private verificarEstadoInscripcion(): void {
    if (!this.contest) return;

    this.loading = true;
    this.inscriptionService.getInscriptionStatus(this.contest.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (estado: InscripcionState) => {
          this.inscripcionState$.next(estado);
          if (estado === InscripcionState.CONFIRMADA) {
            this.notificationService.info('Ya estás inscrito en este concurso');
          }
        },
        error: (error: any) => {
          // Ahora siempre recibimos HttpErrorResponse para inscripciones gracias al ErrorInterceptor optimizado
          // Los errores 404 son esperados cuando el usuario no está inscrito
          if (error?.status === 404) {
            // Para errores 404, simplemente establecer el estado como no inscrito
            console.log(`[InscripcionButton] Usuario no inscrito en concurso ${this.contest.id} (404 esperado)`);
            this.inscripcionState$.next(InscripcionState.NO_INSCRIPTO);
          } else {
            // Para otros errores, el ErrorInterceptor ya mostró la notificación apropiada
            console.error('Error al verificar estado de inscripción:', error);
            this.inscripcionState$.next(InscripcionState.NO_INSCRIPTO);
          }
        }
      });
  }

  onInscribirse(): void {
    if (!this.contest) {
      console.warn('No hay concurso seleccionado para inscribirse');
      return;
    }

    // Obtener el estado actual
    const estadoActual = this.inscripcionState$.value;

    // Si el estado es IN_PROCESS o ACTIVE, continuar con la inscripción existente
    if (estadoActual === InscripcionState.IN_PROCESS || estadoActual === InscripcionState.ACTIVE) {
      console.log('[InscripcionButton] Continuando con inscripción existente');
      this.continuarInscripcionExistente();
      return;
    }

    // Para otros estados, crear nueva inscripción
    this.loading = true;
    this.inscriptionService.createInscription(this.contest.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { id: string }) => {
          console.log('Inscripción inicial creada:', response);
          // Pasar el ID de inscripción al método de redirección
          this.abrirDialogoInscripcion(response.id);
        },
        error: (error: { status?: number; message?: string }) => {
          console.error('Error al crear inscripción:', error);

          // Verificar si es un error de inscripción duplicada (409 Conflict)
          const httpError = error;
          if (httpError.status === 409 ||
              (httpError.message && httpError.message.includes('Ya existe una inscripción'))) {

            this.notificationService.info('Ya tienes una inscripción para este concurso. Verificando estado...');

            // Forzar actualización del estado
            setTimeout(() => {
              this.verificarEstadoInscripcion();

              // Intentar obtener la inscripción existente
              this.inscriptionService.refreshInscriptions().subscribe({
                next: (response) => {
                  console.log('[InscripcionButton] Inscripciones actualizadas:', response);

                  // Buscar la inscripción para este concurso
                  const contestId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;

                  this.inscriptionService.inscriptions.subscribe(inscripciones => {
                    const inscripcionExistente = inscripciones.find(ins => ins.contestId === contestId);

                    if (inscripcionExistente) {
                      console.log('[InscripcionButton] Encontrada inscripción existente:', inscripcionExistente);

                      // Actualizar el estado local
                      this.inscripcionState$.next(inscripcionExistente.state);

                      // Si la inscripción está en proceso, permitir continuar
                      if (inscripcionExistente.state === InscripcionState.IN_PROCESS ||
                          inscripcionExistente.state === InscripcionState.ACTIVE) {

                        // Mostrar mensaje más claro
                        this.notificationService.info('Puedes continuar con tu inscripción en proceso.');
                      } else {
                        // Para otros estados, mostrar mensaje apropiado
                        let mensaje = '';
                        switch (inscripcionExistente.state) {
                          case InscripcionState.PENDIENTE:
                            mensaje = 'Tu inscripción está pendiente de validación.';
                            break;
                          case InscripcionState.INSCRIPTO:
                          case InscripcionState.APPROVED:
                            mensaje = 'Ya estás inscripto en este concurso.';
                            break;
                          case InscripcionState.REJECTED:
                            mensaje = 'Tu inscripción fue rechazada.';
                            break;
                          default:
                            mensaje = 'Ya tienes una inscripción para este concurso.';
                            break;
                        }
                        this.notificationService.info(mensaje);
                      }
                    }
                  }).unsubscribe();
                },
                error: (refreshError: Error) => {
                  console.error('[InscripcionButton] Error al refrescar inscripciones:', refreshError);
                },
                complete: () => {
                  console.log('[InscripcionButton] Actualización de inscripciones completada');
                }
              });
            }, 500);
          } else if (httpError.status === 500) {
            // Para errores 500, mostrar un mensaje más genérico
            this.notificationService.error('Error en el servidor. Por favor, inténtelo de nuevo más tarde.');

            // Intentar actualizar el estado de todas formas
            setTimeout(() => {
              this.verificarEstadoInscripcion();
            }, 1000);
          } else {
            // Para otros errores, mostrar el mensaje específico
            this.notificationService.error('Error al iniciar el proceso de inscripción: ' + (httpError.message || 'Error desconocido'));
          }
        }
      });
  }

  /**
   * Continúa con una inscripción existente en lugar de crear una nueva
   */
  private continuarInscripcionExistente(): void {
    console.log('[InscripcionButton] Buscando inscripción existente para continuar');

    this.loading = true;

    // Timeout de seguridad para evitar loading infinito
    const timeoutId = setTimeout(() => {
      console.warn('[InscripcionButton] Timeout al buscar inscripción existente');
      this.loading = false;
      this.notificationService.error('Error al buscar la inscripción existente. Inténtelo de nuevo.');
    }, 10000); // 10 segundos de timeout

    const contestId = typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id;

    // Primero intentar con las inscripciones ya cargadas
    this.inscriptionService.inscriptions.pipe(take(1)).subscribe({
      next: (inscripciones) => {
        console.log('[InscripcionButton] Verificando inscripciones ya cargadas:', inscripciones);

        const inscripcionExistente = inscripciones.find(ins =>
          ins.contestId === contestId &&
          (ins.state === InscripcionState.IN_PROCESS || ins.state === InscripcionState.ACTIVE)
        );

        if (inscripcionExistente) {
          console.log('[InscripcionButton] Encontrada inscripción existente en cache:', inscripcionExistente);
          clearTimeout(timeoutId);
          this.loading = false;
          this.abrirDialogoInscripcion(inscripcionExistente.id, true);
          return;
        }

        // Si no se encuentra en cache, intentar refrescar
        console.log('[InscripcionButton] No encontrada en cache, intentando refrescar...');

        // Intentar refrescar las inscripciones
        const refreshObservable = this.inscriptionService.refreshInscriptions();

        // Si refreshInscriptions devuelve EMPTY (por throttling), usar las inscripciones actuales
        if (refreshObservable === EMPTY) {
          console.log('[InscripcionButton] RefreshInscriptions devolvió EMPTY, usando datos actuales');
          this.procesarInscripcionesExistentes(inscripciones, contestId, timeoutId);
          return;
        }

        // Si no es EMPTY, proceder con el refresh
        refreshObservable.pipe(
          finalize(() => {
            clearTimeout(timeoutId);
            this.loading = false;
          })
        ).subscribe({
          next: (response) => {
            console.log('[InscripcionButton] Inscripciones actualizadas:', response);

            // Obtener las inscripciones actualizadas
            this.inscriptionService.inscriptions.pipe(take(1)).subscribe({
              next: (inscripcionesActualizadas) => {
                this.procesarInscripcionesExistentes(inscripcionesActualizadas, contestId, timeoutId);
              },
              error: (error) => {
                console.error('[InscripcionButton] Error al obtener inscripciones actualizadas:', error);
                this.procesarInscripcionesExistentes(inscripciones, contestId, timeoutId);
              }
            });
          },
          error: (error) => {
            console.error('[InscripcionButton] Error al refrescar inscripciones:', error);
            // Usar las inscripciones que ya tenemos
            this.procesarInscripcionesExistentes(inscripciones, contestId, timeoutId);
          }
        });
      },
      error: (error) => {
        console.error('[InscripcionButton] Error al obtener inscripciones:', error);
        clearTimeout(timeoutId);
        this.loading = false;
        this.notificationService.error('Error al obtener las inscripciones. Inténtelo de nuevo.');
      }
    });
  }

  /**
   * Procesa las inscripciones existentes para encontrar una que se pueda continuar
   */
  private procesarInscripcionesExistentes(inscripciones: any[], contestId: number, timeoutId: any): void {
    console.log('[InscripcionButton] Procesando inscripciones existentes:', inscripciones);

    const inscripcionExistente = inscripciones.find(ins =>
      ins.contestId === contestId &&
      (ins.state === InscripcionState.IN_PROCESS || ins.state === InscripcionState.ACTIVE)
    );

    if (inscripcionExistente) {
      console.log('[InscripcionButton] Encontrada inscripción existente para continuar:', inscripcionExistente);
      this.abrirDialogoInscripcion(inscripcionExistente.id, true);
    } else {
      console.warn('[InscripcionButton] No se encontró inscripción existente en estado IN_PROCESS/ACTIVE');

      // Buscar cualquier inscripción para este concurso
      const cualquierInscripcion = inscripciones.find(ins => ins.contestId === contestId);

      if (cualquierInscripcion) {
        console.log('[InscripcionButton] Encontrada inscripción con estado:', cualquierInscripcion.state);

        // Actualizar el estado local
        this.inscripcionState$.next(cualquierInscripcion.state);

        // Mostrar mensaje apropiado
        this.notificationService.info(`Tu inscripción está en estado: ${cualquierInscripcion.state}`);
      } else {
        console.warn('[InscripcionButton] No se encontró ninguna inscripción, creando nueva');
        this.crearNuevaInscripcion();
      }
    }
  }

  /**
   * Crea una nueva inscripción
   */
  private crearNuevaInscripcion(): void {
    console.log('[InscripcionButton] Creando nueva inscripción');

    this.loading = true;
    this.inscriptionService.createInscription(this.contest.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response: { id: string }) => {
          console.log('Nueva inscripción creada:', response);
          this.abrirDialogoInscripcion(response.id);
        },
        error: (error: { status?: number; message?: string }) => {
          console.error('Error al crear nueva inscripción:', error);
          this.notificationService.error('Error al crear la inscripción. Por favor, inténtelo de nuevo.');
        }
      });
  }

  private abrirDialogoInscripcion(inscriptionId?: string, continueInscription = false): void {
    console.log('[InscripcionButton] Redirigiendo a la página de inscripción:', { inscriptionId, continueInscription });

    // Verificar el estado actual de la inscripción en el backend antes de redirigir
    this.inscriptionService.getInscriptionStatus(this.contest.id).subscribe({
      next: (estado) => {
        // Si el estado es final, no permitir continuar con la inscripción
        // Nota: CANCELLED no se considera un estado final para permitir reiniciar el proceso
        if (estado === InscripcionState.PENDIENTE ||
            estado === InscripcionState.INSCRIPTO ||
            estado === InscripcionState.APPROVED ||
            estado === InscripcionState.REJECTED) {

          console.log('[InscripcionButton] No se puede continuar la inscripción porque ya tiene un estado final:', estado);

          // Actualizar el estado local
          this.inscripcionState$.next(estado);

          // Limpiar los estados locales
          if (inscriptionId) {
            this.inscriptionService.clearFormState(inscriptionId);
            this.inscriptionStateService.clearInscriptionState(inscriptionId);
          }

          // Limpiar también el método antiguo
          this.inscriptionStateService.clearInProgressInscription();

          // Mostrar mensaje al usuario
          let mensaje = '';
          switch (estado) {
            case InscripcionState.PENDIENTE:
              mensaje = 'Ya tienes una inscripción pendiente de validación para este concurso';
              break;
            case InscripcionState.INSCRIPTO:
            case InscripcionState.APPROVED:
              mensaje = 'Ya estás inscripto en este concurso';
              break;
            case InscripcionState.REJECTED:
              mensaje = 'Tu inscripción para este concurso fue rechazada';
              break;
            default:
              mensaje = 'No puedes continuar con esta inscripción';
              break;
          }

          // Manejo especial para CANCELLED (no está en el switch porque causa error de tipos)
          if (estado.toString() === InscripcionState.CANCELLED.toString()) {
            mensaje = 'Tu inscripción para este concurso fue cancelada';
          }

          this.notificationService.warning(mensaje);
          return;
        }

        // Continuar con la redirección si el estado no es final
        this.redirigirAPaginaInscripcion(inscriptionId, continueInscription);
      },
      error: (error: Error) => {
        console.error('[InscripcionButton] Error al verificar estado de inscripción:', error);
        // En caso de error, continuar con la redirección
        this.redirigirAPaginaInscripcion(inscriptionId, continueInscription);
      }
    });
  }

  /**
   * Redirige a la página de inscripción
   */
  private redirigirAPaginaInscripcion(inscriptionId?: string, continueInscription = false): void {
    // Verificar si se debe realizar una continuación directa
    const directContinuation = this.inscriptionStateService.isDirectContinuation();
    if (directContinuation) {
      console.log('[InscripcionButton] Continuación directa detectada');
      // Limpiar el flag para evitar que se use en futuras aperturas
      this.inscriptionStateService.clearDirectContinuation();
      // Forzar continuación
      continueInscription = true;
    }

    // Obtener la inscripción guardada si no se proporcionó un ID
    if (!inscriptionId) {
      // Intentar obtener desde el servicio de inscripción
      let inscripcionId: string | null = null;

      // Obtener las inscripciones actuales
      this.inscriptionService.inscriptions.subscribe(inscripciones => {
        const foundInscription = inscripciones.find((ins: { contestId: number; state: InscripcionState; id: string }) =>
          ins.contestId === (typeof this.contest.id === 'string' ? parseInt(this.contest.id, 10) : this.contest.id) &&
          ins.state === InscripcionState.PENDING
        );
        if (foundInscription && foundInscription.id) {
          inscripcionId = foundInscription.id;
        }
      }).unsubscribe(); // Desuscribirse inmediatamente

      if (inscripcionId) {
        console.log('[InscripcionButton] Encontrada inscripción pendiente en el servicio:', inscripcionId);
        inscriptionId = inscripcionId;
        continueInscription = true;
      } else {
        // Intentar obtener desde el localStorage (método antiguo)
        const savedInscription = this.inscriptionStateService.getInProgressInscription();
        if (savedInscription && savedInscription.contestId === this.contest.id) {
          console.log('[InscripcionButton] Encontrada inscripción pendiente en localStorage:', savedInscription);
          inscriptionId = savedInscription.id;
          continueInscription = true;
        }
      }
    }

    // Construir los parámetros de consulta para la ruta
    const queryParams = {
      contestId: this.contest.id,
      inscriptionId: inscriptionId,
      continueInscription: continueInscription
    };

    // Navegar a la página de inscripción
    this.router.navigate(['/dashboard/inscripcion'], { queryParams });
  }

  /**
   * Helper methods using the new unified state logic
   */

  /**
   * Check if the state allows resuming the inscription process
   */
  canResumeState(state: InscripcionState): boolean {
    return InscripcionStateUtils.canResume(state);
  }

  /**
   * Check if the state is final (no modifications allowed)
   */
  isFinalState(state: InscripcionState): boolean {
    return InscripcionStateUtils.isFinal(state);
  }

  /**
   * Check if the state is approved
   */
  isApprovedState(state: InscripcionState): boolean {
    return state === InscripcionState.APPROVED || state === InscripcionState.INSCRIPTO;
  }

  /**
   * Check if the state is pending validation
   */
  isPendingValidationState(state: InscripcionState): boolean {
    return InscripcionStateUtils.isPendingValidation(state);
  }

  /**
   * Get display text for state
   */
  getStateDisplayText(state: InscripcionState): string {
    return InscripcionStateUtils.getStateLabel(state);
  }

  /**
   * Check if fallback content should be shown
   */
  shouldShowFallback(state: InscripcionState): boolean {
    // Show fallback only for unknown states or NO_INSCRIPTO when no other condition matches
    return state === InscripcionState.NO_INSCRIPTO ||
           (!this.canResumeState(state) &&
            !this.isPendingValidationState(state) &&
            !this.isApprovedState(state) &&
            state !== InscripcionState.REJECTED &&
            state !== InscripcionState.CANCELLED &&
            state !== InscripcionState.FROZEN &&
            state !== InscripcionState.COMPLETED_PENDING_DOCS);
  }


}
