import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of, throwError, forkJoin, Observable } from 'rxjs'; // Import forkJoin
import { takeUntil, finalize, map, catchError, switchMap, tap } from 'rxjs/operators'; // Import tap
import { HttpClient } from '@angular/common/http';

import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { ProfileService, UserProfile } from '@core/services/profile/profile.service';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { DocumentosService } from '@core/services/documentos/documentos.service';

import { AuthService } from '@core/services/auth/auth.service';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { DocumentosEmbebidosComponent } from '../../documentos-embebidos/documentos-embebidos.component';
import { CustomAddressAutocompleteComponent } from '@shared/components/custom-address-autocomplete/custom-address-autocomplete.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { IInscriptionUpdateRequest } from '@shared/interfaces/inscripcion/inscription.interface';
import { InscriptionDocumentationService, InscriptionDocumentationState } from '@core/services/inscripcion/inscription-documentation.service';
import { RequiredDocument } from '@core/services/documentos/documento-validation.service';
import { DocumentoUsuario, TipoDocumento } from '@core/models/documento.model'; // Import TipoDocumento
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Componente para el proceso de inscripción a concursos
 *
 * Características principales:
 * - Navegación por pasos con validación
 * - Scroll automático suave al cambiar de paso
 * - Compatibilidad con dispositivos móviles y diferentes navegadores
 * - Persistencia del estado del formulario
 * - Animaciones de transición entre pasos
 */
@Component({
  selector: 'app-inscripcion-process-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCheckboxComponent,
    DocumentosEmbebidosComponent,
    CustomAddressAutocompleteComponent
  ],
  templateUrl: './inscripcion-process-page.component.html',
  styleUrls: ['./inscripcion-process-page.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class InscripcionProcessPageComponent implements OnInit, OnDestroy {
  // Pasos de inscripción
  steps = [
    { label: 'Términos' },
    { label: 'Circunscripción' },
    { label: 'Documentación' },
    { label: 'Confirmación' }
  ];

  // Estado actual
  currentStep = 1;
  progressPercentage = 25;
  loading = false;
  inscriptionId: string | null = null;
  contestId: number | null = null;
  contest: Contest | null = null;
  showValidationErrors = false;

  // Formulario reactivo
  inscriptionForm: FormGroup;

  // Datos de la dirección seleccionada (no se usa directamente en el formulario reactivo, pero se mantiene para claridad)
  addressData: {
    formattedAddress: string;
    placeId: string;
    coordinates: { lat: number; lng: number };
    components: Record<string, unknown>;
  } | null = null;

  // Estado de documentación centralizado
  documentationState: InscriptionDocumentationState | null = null;

  // Contenido de términos y condiciones
  termsAndConditionsContent: string = '';

  // Referencia al contenedor principal para scroll
  @ViewChild('processContainer', { static: false }) processContainer?: ElementRef;

  // Controles individuales para acceso directo en la plantilla
  get termsAcceptedControl(): FormControl {
    return this.inscriptionForm.get('termsAccepted') as FormControl;
  }

  get centroDeVidaControl(): FormControl {
    return this.inscriptionForm.get('centroDeVida') as FormControl;
  }

  get selectedCircunscripcionesControl(): FormControl {
    return this.inscriptionForm.get('selectedCircunscripciones') as FormControl;
  }

  get documentosCompletosControl(): FormControl {
    return this.inscriptionForm.get('documentosCompletos') as FormControl;
  }

  get confirmedPersonalDataControl(): FormControl {
    return this.inscriptionForm.get('confirmedPersonalData') as FormControl;
  }

  private destroy$ = new Subject<void>();
  private inscriptionCompleted = false; // Flag to track if inscription was successfully completed

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private inscriptionService: InscriptionService,
    private inscriptionStateService: InscriptionStateService,
    private profileService: ProfileService,
    private concursosService: ConcursosService,
    private documentosService: DocumentosService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private http: HttpClient, // Assuming HttpClient is directly used for T&C content
    private cdr: ChangeDetectorRef,
    private loggingService: LoggingService,
    private inscriptionDocumentationService: InscriptionDocumentationService
  ) {
    // Inicializar formulario reactivo
    this.inscriptionForm = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue],
      centroDeVida: ['', Validators.required],
      selectedCircunscripciones: [[], Validators.required],
      documentosCompletos: [false], // CRITICAL FIX: No required by default - user can choose provisional inscription
      confirmedPersonalData: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    // Obtener parámetros de la ruta
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.contestId = params['contestId'] ? Number(params['contestId']) : null;
      this.inscriptionId = params['inscriptionId'] || null;
      const isResume = params['resume'] === 'true';

      this.loggingService.debug('[InscripcionProcess] Parámetros recibidos:', {
        contestId: this.contestId,
        inscriptionId: this.inscriptionId,
        isResume: isResume
      }, 'InscripcionProcessPage');

      if (!this.contestId) {
        this.notificationService.error('No se ha especificado un concurso válido');
        this.router.navigate(['/dashboard/concursos']);
        return;
      }

      // CRITICAL FIX: Verificar si ya existe una inscripción cancelada para este concurso
      // Si existe, mostrar mensaje y no permitir continuar
      this.inscriptionService.getInscriptionStatus(this.contestId).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('[InscripcionProcess] Error al verificar estado de inscripción:', error);
          return of(InscripcionState.ACTIVE); // Continuar si hay error
        })
      ).subscribe(status => {
        if (status === InscripcionState.CANCELLED) {
          this.notificationService.error('No puede volver a inscribirse a un concurso donde canceló su inscripción');
          this.router.navigate(['/dashboard/concursos']);
          return;
        }

        // Solo continuar si no hay inscripción cancelada
        this.initializeInscriptionProcess(isResume);
      });
    });

    // Suscribirse al estado de documentación centralizado
    this.inscriptionDocumentationService.documentationState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.documentationState = state;
      this.cdr.detectChanges();
    });

    // Suscribirse a cambios en el checkbox de inscripción provisional
    this.documentosCompletosControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.onProvisionalAcceptanceChange(value);
    });
  }

  /**
   * CRITICAL FIX: Inicializa el proceso de inscripción solo después de verificar que no hay restricciones
   * @param isResume Indica si es una recuperación de proceso interrumpido
   */
  private initializeInscriptionProcess(isResume: boolean = false): void {
    // Cargar datos del concurso
    this.cargarDatosConcurso();

    // Cargar estado guardado si existe (solo si hay inscriptionId)
    if (this.inscriptionId) {
      this.cargarEstadoGuardado();
    } else if (isResume) {
      // CRITICAL FIX: Si es una recuperación pero no hay inscriptionId, buscar en localStorage
      this.recuperarProcesoInterrumpido();
    }

    // Cargar centro de vida desde el perfil si existe
    this.cargarCentroDeVidaDesdePerfilUsuario();

    // Cargar términos y condiciones
    this.loadTermsAndConditions();

    // Actualizar el estado de los documentos en el resumen (solo si hay inscriptionId)
    if (this.inscriptionId) {
      this.actualizarEstadoDocumentos();
    }

    // Suscribirse al estado de documentación centralizado
    this.inscriptionDocumentationService.documentationState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.documentationState = state;
      this.cdr.detectChanges();
    });

    // Suscribirse a cambios en el checkbox de inscripción provisional
    this.documentosCompletosControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.onProvisionalAcceptanceChange(value);
    });
  }

  ngOnDestroy(): void {
    // Solo cancelar la inscripción si NO se completó exitosamente y el paso es menor a 5
    if (this.inscriptionId && this.currentStep < 5 && !this.inscriptionCompleted) {
      // Guardar el estado actual antes de destruir el componente
      this.guardarEstadoActual();

      this.loggingService.debug('[InscripcionProcess] Inscripción interrumpida - marcando como cancelada', {
        inscriptionId: this.inscriptionId,
        currentStep: this.currentStep,
        completed: this.inscriptionCompleted
      }, 'InscripcionProcessPage');

      // Marcar la inscripción como cancelada
      this.inscriptionService.markAsCancelled(this.inscriptionId).pipe(
        takeUntil(this.destroy$), // Ensure this subscription is also cleaned up
        catchError(error => {
          console.error('[InscripcionProcess] Error al marcar inscripción como interrumpida:', error);
          return of(null); // Continue gracefully
        })
      ).subscribe({
        next: () => {
          this.loggingService.debug('[InscripcionProcess] Inscripción marcada como INTERRUMPIDA:', this.inscriptionId, 'InscripcionProcessPage');
        }
      });
    } else if (this.inscriptionCompleted) {
      this.loggingService.debug('[InscripcionProcess] Inscripción completada exitosamente - NO se cancela', {
        inscriptionId: this.inscriptionId,
        currentStep: this.currentStep
      }, 'InscripcionProcessPage');
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // Métodos para navegación entre pasos
  goToStep(step: number): void {
    // Allow going back to previous steps, but only if they are valid
    if (step >= 1 && step <= this.currentStep) {
      // Validate current step before going back if it's not the final step
      // No validation when going back, as currentStep will be decreased
      this.currentStep = step;
      this.updateProgressPercentage();

      // Esperar un momento adicional para que el DOM se actualice completamente
      setTimeout(() => {
        // Scroll inmediato para asegurar que se mueva
        this.performImmediateScroll();

        // Scroll suave después de la animación
        this.scrollToTopAfterAnimation();
      }, 50);
    }
  }

  nextStep(): void {
    if (this.currentStep < 5) {
      if (!this.canProceed()) {
        this.showValidationErrorMessages();
        return;
      }

      // CRITICAL FIX: Crear inscripción solo cuando se avanza del paso 1 al paso 2
      if (this.currentStep === 1 && !this.inscriptionId && this.contestId) {
        this.createInscriptionWhenAdvancingToStep2();
        return; // Salir aquí, la creación de inscripción manejará el avance al paso 2
      }

      this.currentStep++;
      this.updateProgressPercentage();
      this.guardarEstadoActual();

      // Si avanzamos al paso de confirmación, actualizar el estado de los documentos
      if (this.currentStep === 4) { // Step 4 is 'Confirmación'
        this.actualizarEstadoDocumentos();
      }

      // Forzar detección de cambios para asegurar que el nuevo contenido se renderice
      this.cdr.detectChanges();

      // Esperar un momento adicional para que el DOM se actualice completamente
      setTimeout(() => {
        // Scroll inmediato para asegurar que se mueva
        this.performImmediateScroll();

        // Scroll suave después de la animación con más delay
        this.scrollToTopAfterAnimation();
      }, 50);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressPercentage();

      // Forzar detección de cambios para asegurar que el nuevo contenido se renderice
      this.cdr.detectChanges();

      // Esperar un momento adicional para que el DOM se actualice completamente
      setTimeout(() => {
        // Scroll inmediato para asegurar que se mueva
        this.performImmediateScroll();

        // Scroll suave después de la animación
        this.scrollToTopAfterAnimation();
      }, 50);
    }
  }

  // Actualizar porcentaje de progreso
  updateProgressPercentage(): void {
    // Assuming 4 steps for actual content + 1 for completion, total 5 states
    this.progressPercentage = (this.currentStep / 4) * 100;
    if (this.currentStep === 4) { // Max out at 100% when all steps are validated
      this.progressPercentage = 100;
    }
  }

  /**
   * Ejecuta scroll suave hacia la parte superior de la página
   * después de que se complete la animación de transición entre pasos
   */
  private scrollToTopAfterAnimation(): void {
    // Detectar si es dispositivo móvil para ajustar el timing
    const isMobile = this.isMobileDevice();
    const animationDelay = isMobile ? 450 : 400; // Aumentar tiempo para asegurar que la animación termine

    this.loggingService.debug('[InscripcionProcess] Iniciando scroll automático después de animación', {
      isMobile,
      animationDelay
    }, 'InscripcionProcessPage');

    // Esperar a que se complete la animación @fadeInOut (300ms) más un buffer
    setTimeout(() => {
      this.performSmoothScrollToTop();
    }, animationDelay);
  }

  /**
   * Detecta si el usuario está en un dispositivo móvil
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Detecta automáticamente el contenedor de scroll principal
   * Busca en orden de prioridad los contenedores que realmente controlan el scroll
   */
  private findScrollContainer(): Element | null {
    // Lista de selectores en orden de prioridad
    const scrollContainerSelectors = [
      '.dashboard-content',    // Layout principal de usuarios
      '.admin-content',        // Layout de administración
      'main',                  // Elemento main genérico
      '.content-wrapper',      // Wrapper de contenido
      'body'                   // Fallback final
    ];

    for (const selector of scrollContainerSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        // Verificar si el elemento realmente tiene scroll
        const hasVerticalScroll = element.scrollHeight > element.clientHeight;
        const hasOverflowY = window.getComputedStyle(element).overflowY !== 'visible';

        if (hasVerticalScroll || hasOverflowY) {
          this.loggingService.debug(`[InscripcionProcess] Contenedor de scroll detectado: ${selector}`, {
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            overflowY: window.getComputedStyle(element).overflowY
          }, 'InscripcionProcessPage');
          return element;
        }
      }
    }

    this.loggingService.warn('[InscripcionProcess] No se pudo detectar un contenedor de scroll válido', undefined, 'InscripcionProcessPage');
    return null;
  }

  /**
   * Realiza el scroll suave hacia la parte superior con múltiples fallbacks
   * para asegurar compatibilidad con todos los navegadores y dispositivos
   */
  private performSmoothScrollToTop(): void {
    this.loggingService.debug('[InscripcionProcess] Ejecutando scroll hacia la parte superior', undefined, 'InscripcionProcessPage');

    // Método 1: Usar detección automática del contenedor de scroll
    const scrollContainer = this.findScrollContainer();
    if (scrollContainer && scrollContainer !== document.body) {
      try {
        // Scroll inmediato primero
        scrollContainer.scrollTop = 0;

        // Luego scroll suave si el elemento lo soporta
        if ('scrollTo' in scrollContainer) {
          (scrollContainer as Element).scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }

        this.loggingService.debug('[InscripcionProcess] Scroll en contenedor detectado ejecutado', {
          containerClass: scrollContainer.className,
          tagName: scrollContainer.tagName
        }, 'InscripcionProcessPage');

        // Verificar que el scroll funcionó en el contenedor principal
        setTimeout(() => {
          if (scrollContainer.scrollTop <= 10) {
            this.loggingService.debug('[InscripcionProcess] Scroll en contenedor detectado completado exitosamente', undefined, 'InscripcionProcessPage');
            return; // Salir si el scroll funcionó correctamente
          }
        }, 300);
      } catch (error) {
        console.warn('[InscripcionProcess] Error con contenedor detectado:', error);
      }
    }

    // Método 3: Scroll inmediato sin smooth para asegurar que funcione
    try {
      // Primero hacer scroll inmediato para asegurar que se mueva
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      this.loggingService.debug('[InscripcionProcess] Scroll inmediato en window ejecutado', undefined, 'InscripcionProcessPage');
    } catch (error) {
      console.warn('[InscripcionProcess] Error con scroll inmediato:', error);
    }

    // Método 4: Scroll suave en window como fallback
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
      this.loggingService.debug('[InscripcionProcess] Scroll suave en window ejecutado', undefined, 'InscripcionProcessPage');
    } catch (error) {
      console.warn('[InscripcionProcess] Error con window.scrollTo suave:', error);
    }

    // Fallback especial para iOS: Forzar scroll después de un pequeño delay
    if (this.isIOSDevice()) {
      setTimeout(() => {
        try {
          const scrollContainer = this.findScrollContainer();
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          }
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
          this.loggingService.debug('[InscripcionProcess] Fallback iOS ejecutado', undefined, 'InscripcionProcessPage');
        } catch (error) {
          console.warn('[InscripcionProcess] Error con fallback iOS:', error);
        }
      }, 100);
    }

    // Verificar que el scroll se ejecutó correctamente después de un breve delay
    setTimeout(() => {
      const scrollContainer = this.findScrollContainer();
      const containerScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

      if (containerScrollTop > 50 && windowScrollTop > 50) {
        this.loggingService.warn('[InscripcionProcess] El scroll automático no funcionó correctamente', {
          containerScrollTop,
          windowScrollTop
        }, 'InscripcionProcessPage');

        // Intentar scroll forzado una vez más
        try {
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          }
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        } catch (error) {
          console.warn('[InscripcionProcess] Error en scroll forzado final:', error);
        }
      } else {
        this.loggingService.debug('[InscripcionProcess] Scroll automático completado exitosamente', undefined, 'InscripcionProcessPage');
      }
    }, 400);
  }

  /**
   * Detecta si el usuario está en un dispositivo iOS
   */
  private isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Realiza un scroll inmediato hacia la parte superior
   * Este método se ejecuta antes de las animaciones para asegurar el movimiento
   */
  private performImmediateScroll(): void {
    try {
      // Usar detección automática del contenedor de scroll
      const scrollContainer = this.findScrollContainer();
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
        this.loggingService.debug('[InscripcionProcess] Scroll inmediato en contenedor detectado ejecutado', {
          containerClass: scrollContainer.className,
          tagName: scrollContainer.tagName
        }, 'InscripcionProcessPage');
      }

      // Fallbacks adicionales para asegurar compatibilidad
      window.scrollTo(0, 0);

      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }

      if (document.body) {
        document.body.scrollTop = 0;
      }

      // También intentar en el contenedor del componente
      if (this.processContainer?.nativeElement) {
        this.processContainer.nativeElement.scrollTop = 0;
      }

      this.loggingService.debug('[InscripcionProcess] Scroll inmediato ejecutado en todos los contenedores', undefined, 'InscripcionProcessPage');
    } catch (error) {
      console.warn('[InscripcionProcess] Error en scroll inmediato:', error);
    }
  }

  // Verificar si se puede avanzar al siguiente paso
  canProceed(): boolean {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    if (!this.showValidationErrors) {
      setTimeout(() => {
        this.showValidationErrors = true;
        this.cdr.detectChanges(); // Manually trigger change detection
      });
    }

    switch (this.currentStep) {
      case 1:
        return this.termsAcceptedControl.value === true;
      case 2:
        return this.centroDeVidaControl.valid && this.selectedCircunscripcionesControl.valid && this.selectedCircunscripcionesControl.value.length > 0;
      case 3:
        // UNIFICADO: Usar servicio centralizado para validación de documentación
        return this.canProceedWithDocumentation();
      case 4:
        // Step 4 validation is for the final confirmation before finishing the inscription
        return this.confirmedPersonalDataControl.valid && this.canProceedWithDocumentation();
      default:
        return false;
    }
  }

  // Verificar si se puede finalizar la inscripción
  canFinish(): boolean {
    // Ensure all controls for the final step are valid and documentation check passes
    const formValid = this.inscriptionForm.valid; // This checks all controls
    const personalDataConfirmed = this.confirmedPersonalDataControl.value === true;
    const documentationValid = this.canProceedWithDocumentation();

    // The inscription can be finalized if all form controls are valid and the documentation
    // is either fully complete OR the user has accepted provisional inscription terms.
    return formValid && personalDataConfirmed && documentationValid;
  }

  /**
   * MÉTODO UNIFICADO: Verifica si se puede proceder con la documentación actual
   * Usa el servicio centralizado para validación consistente
   */
  canProceedWithDocumentation(): boolean {
    return this.inscriptionDocumentationService.canProceedWithCurrentState();
  }

  /**
   * MÉTODOS UNIFICADOS: Para la vista mejorada del resumen usando servicio centralizado
   */
  getDocumentosCompletados(): number {
    if (!this.documentationState) return 0;
    return this.documentationState.completenessResult.completedCount;
  }

  getDocumentationProgress(): number {
    if (!this.documentationState) return 0;
    const { completedCount, totalCount } = this.documentationState.completenessResult;
    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  }

  /**
   * Obtiene la lista de documentos requeridos desde el estado centralizado
   */
  get documentacionRequerida(): RequiredDocument[] {
    return this.documentationState?.requiredDocuments || [];
  }

  /**
   * MÉTODO UNIFICADO: Verifica si todos los documentos requeridos están subidos (sin provisional)
   * Usa el servicio centralizado para consistencia
   */
  allRequiredDocumentsUploaded(): boolean {
    if (!this.documentationState) {
      return false;
    }
    return this.documentationState.completenessResult.allDocumentsComplete;
  }

  /**
   * MÉTODO RESTAURADO: Verifica si la documentación es válida para finalizar
   * Permite finalizar con documentación completa O con inscripción provisional aceptada
   */
  isDocumentationValidForFinish(): boolean {
    return this.canProceedWithDocumentation();
  }

  /**
   * CRITICAL FIX: Shows specific validation error messages based on the current step.
   */
  showValidationErrorMessages(): void {
    switch (this.currentStep) {
      case 1:
        this.notificationService.warning('Debe leer y aceptar las bases y condiciones del concurso para continuar.');
        break;
      case 2:
        if (!this.centroDeVidaControl.valid) {
          this.notificationService.warning('Debe especificar su centro de vida para continuar.');
        }
        if (!this.selectedCircunscripcionesControl.valid || this.selectedCircunscripcionesControl.value.length === 0) {
          this.notificationService.warning('Debe seleccionar al menos una circunscripción para continuar.');
        }
        break;
      case 3:
        if (!this.canProceedWithDocumentation()) {
          const missingDocs = this.inscriptionDocumentationService.getMissingDocuments();
          if (missingDocs.length > 0) {
            const pendientes = missingDocs.map(doc => doc.title);
            this.notificationService.warning(`Debe cargar todos los documentos requeridos para continuar o marcar la opción de "inscripción provisional". Documentos pendientes: ${pendientes.join(', ')}`);
          } else {
            this.notificationService.error('Error de configuración: No hay documentos requeridos definidos para este concurso. Contacte al administrador.');
          }
        }
        break;
      case 4:
        if (!this.confirmedPersonalDataControl.valid) {
          this.notificationService.warning('Debe confirmar que sus datos personales son correctos para finalizar.');
        }
        if (!this.isDocumentationValidForFinish()) {
          this.notificationService.warning('La documentación no está completa o no ha aceptado la inscripción provisional.');
        }
        break;
      default:
        this.notificationService.warning('Complete todos los campos requeridos para continuar.');
    }
  }

  // Cargar datos del concurso
  cargarDatosConcurso(): void {
    if (!this.contestId) return;

    // Obtenemos todos los concursos y filtramos por ID ya que no hay un método específico para obtener por ID
    this.concursosService.getConcursos().pipe(
      map((concursos: Contest[]) => concursos.find(c => c.id === this.contestId)),
      tap(contest => {
        if (contest) {
          this.contest = contest;
        } else {
          this.notificationService.error('Concurso no encontrado.');
          this.router.navigate(['/dashboard/concursos']);
        }
      }),
      catchError((error: Error) => {
        console.error('[InscripcionProcess] Error al cargar datos del concurso:', error);
        this.notificationService.error('Error al cargar datos del concurso.');
        this.router.navigate(['/dashboard/concursos']);
        return of(null); // Return observable of null to continue stream
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  /**
   * CRITICAL FIX: Recupera un proceso de inscripción interrumpido desde localStorage
   * y sincroniza con el backend para obtener el inscriptionId
   */
  private recuperarProcesoInterrumpido(): void {
    if (!this.contestId) {
      this.loggingService.error('[InscripcionProcess] No contest ID available for recovery', undefined, 'InscripcionProcessPage');
      return;
    }

    // Buscar proceso interrumpido en localStorage
    const incompleteInscriptions = this.inscriptionStateService.getAllIncompleteInscriptions();
    const interruptedProcess = incompleteInscriptions.find(ins => ins.contestId === this.contestId);

    if (interruptedProcess) {
      this.loggingService.debug('[InscripcionProcess] Found interrupted process in localStorage:', interruptedProcess, 'InscripcionProcessPage');

      // Buscar la inscripción en el backend para obtener el ID real
      this.inscriptionService.getUserInscriptions(0, 100).pipe(
        takeUntil(this.destroy$),
        map(page => page.content.find(ins => ins.contestId === this.contestId)),
        catchError(error => {
          this.loggingService.error('[InscripcionProcess] Error retrieving inscription from backend:', error, 'InscripcionProcessPage');
          // Si no se puede obtener del backend, usar solo el estado local
          this.cargarEstadoDesdeLocalStorage(interruptedProcess);
          return of(null);
        })
      ).subscribe((inscription: any) => {
        if (inscription) {
          this.inscriptionId = inscription.id;
          this.loggingService.debug('[InscripcionProcess] Retrieved inscription ID from backend:', this.inscriptionId, 'InscripcionProcessPage');

          // Cargar estado combinando backend y localStorage
          this.cargarEstadoGuardado();
        } else {
          // Usar solo el estado local si no hay respuesta del backend
          this.cargarEstadoDesdeLocalStorage(interruptedProcess);
        }

        this.notificationService.info('Proceso de inscripción recuperado. Continuando donde lo dejaste.');
      });
    } else {
      this.loggingService.debug('[InscripcionProcess] No interrupted process found in localStorage for contest:', this.contestId, 'InscripcionProcessPage');
    }
  }

  /**
   * Carga el estado desde localStorage cuando no hay conexión con backend
   */
  private cargarEstadoDesdeLocalStorage(savedState: any): void {
    if (savedState) {
      this.currentStep = Number(savedState.currentStep) || 1;

      if (savedState.formData) {
        this.inscriptionForm.patchValue({
          termsAccepted: savedState.formData.termsAccepted || false,
          centroDeVida: savedState.formData.centroDeVida || '',
          selectedCircunscripciones: savedState.formData.selectedCircunscripciones || [],
          documentosCompletos: savedState.formData.documentosCompletos || false,
          confirmedPersonalData: savedState.formData.confirmedPersonalData || false
        });
      }

      this.updateProgressPercentage();
      this.loggingService.debug('[InscripcionProcess] Estado cargado desde localStorage:', savedState, 'InscripcionProcessPage');
    }
  }

  // Cargar estado guardado
  cargarEstadoGuardado(): void {
    // CRITICAL FIX: Only load saved state if inscriptionId exists
    if (!this.inscriptionId) {
      this.loggingService.debug('[InscripcionProcess] No inscription ID available - starting fresh', undefined, 'InscripcionProcessPage');
      return;
    }

    const savedState = this.inscriptionStateService.getInscriptionState(this.inscriptionId);
    if (savedState) {
      this.currentStep = Number(savedState.currentStep) || 1;

      if (savedState.formData) {
        this.inscriptionForm.patchValue({
          termsAccepted: savedState.formData.termsAccepted || false,
          centroDeVida: savedState.formData.centroDeVida || '',
          selectedCircunscripciones: savedState.formData.selectedCircunscripciones || [],
          documentosCompletos: savedState.formData.documentosCompletos || false,
          confirmedPersonalData: savedState.formData.confirmedPersonalData || false
        });
      }

      this.updateProgressPercentage();

      // CRITICAL FIX: Solo mostrar notificación si realmente hay datos significativos recuperados
      // No mostrar para procesos nuevos donde solo se recupera el paso 1 con términos no aceptados
      const hasSignificantData = savedState.formData && (
        savedState.formData.termsAccepted ||
        savedState.formData.centroDeVida ||
        (savedState.formData.selectedCircunscripciones && savedState.formData.selectedCircunscripciones.length > 0) ||
        savedState.formData.documentosCompletos ||
        savedState.formData.confirmedPersonalData ||
        (savedState.currentStep && Number(savedState.currentStep) > 1)
      );

      if (hasSignificantData) {
        this.notificationService.info('Estado de inscripción anterior recuperado.');
        this.loggingService.debug('[InscripcionProcess] Estado significativo recuperado - mostrando notificación', savedState, 'InscripcionProcessPage');
      } else {
        this.loggingService.debug('[InscripcionProcess] Estado mínimo recuperado - no se muestra notificación', savedState, 'InscripcionProcessPage');
      }
    }
  }

  // Cargar centro de vida desde el perfil del usuario
  cargarCentroDeVidaDesdePerfilUsuario(): void {
    this.profileService.getUserProfile().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (profile) => {
        if (profile && profile.direccion && !this.centroDeVidaControl.value) {
          this.centroDeVidaControl.setValue(profile.direccion);
        }
      },
      error: (error) => {
        console.error('[InscripcionProcess] Error al cargar perfil del usuario:', error);
        // Do not interrupt flow if profile cannot be loaded.
      }
    });
  }

  // Guardar estado actual
  guardarEstadoActual(): void {
    // CRITICAL FIX: Only save state if inscriptionId exists (after terms acceptance)
    if (!this.inscriptionId || !this.contestId) {
      this.loggingService.debug('[InscripcionProcess] Cannot save state - missing inscription ID or contest ID', {
        inscriptionId: this.inscriptionId,
        contestId: this.contestId
      }, 'InscripcionProcessPage');
      return;
    }

    const formData = this.inscriptionForm.value;

    // Convertir el paso actual a InscriptionStep
    let currentStepEnum: InscriptionStep;
    switch (this.currentStep) {
      case 1:
        currentStepEnum = InscriptionStep.TERMS_ACCEPTANCE;
        break;
      case 2:
        currentStepEnum = InscriptionStep.LOCATION_SELECTION;
        break;
      case 3:
        currentStepEnum = InscriptionStep.DOCUMENTATION;
        break;
      case 4:
        currentStepEnum = InscriptionStep.DATA_CONFIRMATION;
        break;
      case 5:
        currentStepEnum = InscriptionStep.COMPLETED;
        break;
      default:
        currentStepEnum = InscriptionStep.TERMS_ACCEPTANCE;
    }

    // Guardar el estado de la inscripción
    this.inscriptionStateService.saveInscriptionState(
      this.inscriptionId,
      this.contestId,
      currentStepEnum,
      formData,
      this.contest?.title
    );
  }

  // Manejar el evento de dirección seleccionada
  onAddressSelected(addressData: {
    formattedAddress: string;
    placeId: string;
    coordinates: { lat: number; lng: number; };
    components: Record<string, unknown>;
  }): void {
    this.loggingService.debug('[InscripcionProcess] Dirección seleccionada:', addressData, 'InscripcionProcessPage');
    this.centroDeVidaControl.setValue(addressData.formattedAddress);
    this.addressData = addressData; // Store full address data if needed
  }

  // Manejar el cambio de respuesta en los términos
  onTermsResponseChange(accepted: boolean): void {
    this.loggingService.debug(`[InscripcionProcess] Términos aceptados: ${accepted}`, undefined, 'InscripcionProcessPage');

    // CRITICAL FIX: Update the form control value
    this.termsAcceptedControl.setValue(accepted);

    // If the user selects "No", show message and return to contests (no inscription created)
    if (!accepted) {
      this.notificationService.warning('Para continuar con la inscripción debe leer y aceptar las bases y condiciones del concurso.');

      // CRITICAL FIX: Clear any potential cached inscription state for this contest
      if (this.contestId) {
        this.inscriptionService.clearCacheAndRefresh().subscribe({
          next: () => {
            this.loggingService.debug('[InscripcionProcess] Cache limpiado después de rechazar términos', undefined, 'InscripcionProcessPage');
          },
          error: (error) => {
            console.error('[InscripcionProcess] Error al limpiar cache después de rechazar términos:', error);
          }
        });
      }

      setTimeout(() => {
        // CRITICAL FIX: Simply navigate back without creating/cancelling inscription
        this.router.navigate(['/dashboard/concursos']);
      }, 1500);
    } else {
      // CRITICAL FIX: Solo limpiar errores de validación cuando acepta términos
      // La inscripción se creará cuando avance al paso 2, no aquí
      this.showValidationErrors = false; // Clear validation errors when accepted
      this.cdr.detectChanges();
    }
  }

  // Método para cancelar la inscripción y regresar
  private cancelarInscripcionYRegresar(): void {
    this.loggingService.debug('[InscripcionProcess] Iniciando cancelación y regreso a concursos.', undefined, 'InscripcionProcessPage');
    if (this.inscriptionId) {
      this.cancelInscriptionWrapper(this.inscriptionId).pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // Clear local state and navigate back regardless of backend success
          this.inscriptionStateService.clearInscriptionState(this.inscriptionId!);
          this.router.navigate(['/dashboard/concursos']);
        }),
        catchError(error => {
          console.error('[InscripcionProcess] Error al cancelar inscripción en el backend:', error);
          this.notificationService.error('Error al cancelar la inscripción. Por favor, intente nuevamente.');
          return of(null); // Continue gracefully
        })
      ).subscribe({
        next: () => {
          this.notificationService.info('Inscripción cancelada.');
        }
      });
    } else {
      // If no inscription ID, simply navigate back
      this.router.navigate(['/dashboard/concursos']);
    }
  }

  // Actualizar el perfil del usuario con el centro de vida
  actualizarPerfilConCentroDeVida(): void {
    const centroDeVida = this.centroDeVidaControl.value;
    if (!centroDeVida) {
      this.loggingService.warn('[InscripcionProcess] Centro de vida no proporcionado para actualizar el perfil.', undefined, 'InscripcionProcessPage');
      return;
    }

    try {
      let direccionFormateada = centroDeVida.trim();

      if (direccionFormateada.length > 255) {
        direccionFormateada = direccionFormateada.substring(0, 255);
      }

      // Remove problematic characters (keeping common address components like spaces, commas, periods, degrees, hyphens)
      direccionFormateada = direccionFormateada.replace(/[^\w\s.,°º-]/g, '');

      this.loggingService.debug(`[InscripcionProcess] Actualizando perfil con centro de vida: ${direccionFormateada}`, undefined, 'InscripcionProcessPage');

      this.profileService.getUserProfile().pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('[InscripcionProcess] Error al obtener el perfil para actualizar centro de vida:', error);
          // Continue with the flow despite the error, only sending the address
          return of(null);
        }),
        switchMap(profile => {
          const dataToUpdate: Partial<UserProfile> = {
            direccion: direccionFormateada
          };

          // If we have the profile, keep existing data. Otherwise, only update address.
          if (profile) {
            dataToUpdate.firstName = profile.firstName;
            dataToUpdate.lastName = profile.lastName;
            dataToUpdate.dni = profile.dni;
            dataToUpdate.cuit = profile.cuit;
            dataToUpdate.telefono = profile.telefono;
            dataToUpdate.experiencias = profile.experiencias || [];
            dataToUpdate.educacion = profile.educacion || [];
            dataToUpdate.habilidades = profile.habilidades || [];
            // Add other profile fields if necessary to avoid accidental overwrites
          }

          return this.profileService.updateUserProfile(dataToUpdate);
        }),
        catchError(error => {
          console.error('[InscripcionProcess] Error al actualizar centro de vida en el perfil:', error);
          this.notificationService.error('Error al guardar su centro de vida. Por favor, intente nuevamente.');
          return of(null); // Continue with the flow despite the error
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            this.notificationService.success('Centro de vida actualizado en su perfil.');
          }
        }
      });
    } catch (error) {
      console.error('[InscripcionProcess] Error inesperado al actualizar centro de vida:', error);
      // Do not interrupt the main flow for an unexpected error in profile update
    }
  }

  // Manejar el evento de documentos completados desde el componente de documentos embebidos
  onDocumentosCompletados(completados: boolean): void {
    this.loggingService.debug(`[InscripcionProcess] Evento 'documentosCompletados' recibido: ${completados}`, undefined, 'InscripcionProcessPage');
    // Actualizar el estado de documentación usando el servicio centralizado
    this.actualizarEstadoDocumentos();
  }

  /**
   * NUEVO MÉTODO: Maneja el cambio en la aceptación de inscripción provisional
   * Actualiza el servicio centralizado cuando el usuario cambia el checkbox
   */
  onProvisionalAcceptanceChange(accepted: boolean): void {
    this.loggingService.debug(`[InscripcionProcess] Aceptación provisional cambiada: ${accepted}`, undefined, 'InscripcionProcessPage');

    // Actualizar el servicio centralizado
    this.inscriptionDocumentationService.updateProvisionalAcceptance(accepted);

    // Forzar detección de cambios para actualizar la UI
    this.cdr.detectChanges();
  }

  // Actualizar el estado de los documentos en el resumen
  actualizarEstadoDocumentos(): void {
    this.loggingService.debug('[InscripcionProcess] Actualizando estado de documentos requeridos y subidos.', undefined, 'InscripcionProcessPage');

    forkJoin([
      this.documentosService.getTiposDocumento(),
      this.documentosService.getDocumentosUsuario()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([tiposDocumento, documentosUsuario]) => {
        this.loggingService.debug('[InscripcionProcess] Tipos de documento:', tiposDocumento, 'InscripcionProcessPage');
        this.loggingService.debug('[InscripcionProcess] Documentos de usuario:', documentosUsuario, 'InscripcionProcessPage');

        // ✅ CRITICAL FIX: Usar la propiedad 'requerido' del backend para determinar si es obligatorio
        let docsRequeridos: { title: string, required: boolean, completed: boolean, tipoDocumentoId: string }[] =
          tiposDocumento.map(tipo => ({
            title: tipo.nombre,
            required: tipo.requerido, // ✅ USAR LA PROPIEDAD DEL BACKEND
            completed: false, // Will update based on user uploads
            tipoDocumentoId: tipo.id
          }));

        // --- DNI Consolidation Logic ---
        const dniFrente = docsRequeridos.find(doc =>
          doc.tipoDocumentoId.toLowerCase().includes('dni-frente') || doc.title.toLowerCase().includes('frente dni')
        );
        const dniDorso = docsRequeridos.find(doc =>
          doc.tipoDocumentoId.toLowerCase().includes('dni-dorso') || doc.title.toLowerCase().includes('dorso dni')
        );
        const dniGeneral = docsRequeridos.find(doc =>
          doc.tipoDocumentoId.toLowerCase() === 'dni' || doc.title.toLowerCase() === 'dni' || doc.title.toLowerCase().includes('documento nacional de identidad')
        );

        const consolidatedDocs: { title: string, required: boolean, completed: boolean, tipoDocumentoId: string }[] = [];
        const processedIds = new Set<string>();

        if (dniFrente && dniDorso) {
          // ✅ NUEVA IMPLEMENTACIÓN: Cards separadas para DNI Frente y Dorso respetando propiedad 'required'
          consolidatedDocs.push({
            title: 'DNI (Frente)',
            required: dniFrente.required, // ✅ Usar la propiedad del backend
            completed: false,
            tipoDocumentoId: dniFrente.tipoDocumentoId
          });
          consolidatedDocs.push({
            title: 'DNI (Dorso)',
            required: dniDorso.required, // ✅ Usar la propiedad del backend
            completed: false,
            tipoDocumentoId: dniDorso.tipoDocumentoId
          });
          processedIds.add(dniFrente.tipoDocumentoId);
          processedIds.add(dniDorso.tipoDocumentoId);
        } else if (dniGeneral) {
          // If only general DNI exists, use it as is
          consolidatedDocs.push({
            title: dniGeneral.title,
            required: dniGeneral.required, // ✅ Usar la propiedad del backend
            completed: false,
            tipoDocumentoId: dniGeneral.tipoDocumentoId
          });
          processedIds.add(dniGeneral.tipoDocumentoId);
        }

        // Add other documents that haven't been processed (e.g., non-DNI related)
        docsRequeridos.forEach(doc => {
          if (!processedIds.has(doc.tipoDocumentoId)) {
            consolidatedDocs.push(doc);
          }
        });

        // Actualizar el servicio centralizado con los documentos consolidados
        this.inscriptionDocumentationService.updateDocumentationState(
          consolidatedDocs,
          documentosUsuario,
          this.documentosCompletosControl.value || false
        );

        // --- Update `completed` status based on `documentosUsuario` ---
        consolidatedDocs.forEach(requiredDoc => {
          // SIMPLIFICADO: Verificación directa para cada documento individual
          // Ya no necesitamos lógica especial para DNI consolidado porque ahora son cards separadas
          requiredDoc.completed = documentosUsuario.some(userDoc =>
            userDoc.tipoDocumento?.id === requiredDoc.tipoDocumentoId && userDoc.estado !== 'pendiente'
          );
        });

        // ✅ CRITICAL FIX: Solo verificar documentos OBLIGATORIOS para auto-completar
        const obligatoryDocs = consolidatedDocs.filter(doc => doc.required === true);
        const allObligatoryDocsCompleted = obligatoryDocs.every(doc => doc.completed);

        // CRITICAL FIX: Only auto-set to true when all OBLIGATORY docs are completed
        // Do NOT auto-set to false when docs are incomplete - let user decide about provisional inscription
        setTimeout(() => {
          if (allObligatoryDocsCompleted && !this.documentosCompletosControl.value) {
            this.documentosCompletosControl.setValue(true, { emitEvent: false }); // Auto-check when all obligatory docs complete
            this.cdr.detectChanges();
          }
          // Do NOT auto-uncheck when docs are incomplete - preserve user's provisional choice
        }, 0);

        this.loggingService.debug('[InscripcionProcess] Documentación requerida final (con estado):', consolidatedDocs, 'InscripcionProcessPage');
        this.loggingService.debug(`[InscripcionProcess] Todos los documentos OBLIGATORIOS completos: ${allObligatoryDocsCompleted} (${obligatoryDocs.length} obligatorios de ${consolidatedDocs.length} totales)`, undefined, 'InscripcionProcessPage');
      }),
      catchError(error => {
        console.error('[InscripcionProcess] Error al actualizar estado de documentos:', error);
        this.notificationService.error('Error al verificar el estado de su documentación.');
        return of([]); // Return an empty observable to gracefully handle errors
      })
    ).subscribe();
  }

  // Load terms and conditions content (assuming from a static file or API)
  loadTermsAndConditions(): void {
    // Example: Fetch from a static file in assets or an API endpoint
    this.http.get('assets/terms-and-conditions.html', { responseType: 'text' }).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('[InscripcionProcess] Error loading terms and conditions:', error);
        this.termsAndConditionsContent = '<p>Error al cargar los términos y condiciones. Por favor, intente nuevamente.</p>';
        this.notificationService.error('No se pudieron cargar los términos y condiciones.');
        return of('');
      })
    ).subscribe((content: string) => {
      this.termsAndConditionsContent = content;
    });
  }

  /**
   * Finaliza el proceso de inscripción.
   */
  finalizarInscripcion(): void {
    if (!this.canFinish()) {
      this.showValidationErrorMessages();
      this.notificationService.error('No puede finalizar la inscripción. Revise los campos.');
      return;
    }

    this.loading = true;
    this.actualizarPerfilConCentroDeVida();

    // UNIFICADO: Determinar estado basado en documentación usando servicio centralizado
    const allRequiredDocsUploaded = this.allRequiredDocumentsUploaded();
    const state = allRequiredDocsUploaded
      ? InscripcionState.COMPLETED_WITH_DOCS    // Inscripción completa con todos los documentos
      : InscripcionState.COMPLETED_PENDING_DOCS; // Inscripción completa pero con documentos pendientes

    // Logging implementado con LoggingService;

    const updateRequest: IInscriptionUpdateRequest = {
      state: state
    };

    this.updateInscriptionStatusWrapper(this.inscriptionId!, updateRequest).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loading = false;
        this.guardarEstadoActual(); // Save final state
      }),
      catchError(error => {
        console.error('[InscripcionProcess] Error al finalizar inscripción:', error);
        this.notificationService.error('Error al finalizar la inscripción. Por favor, intente nuevamente.');
        return throwError(() => new Error('Failed to finalize inscription')); // Re-throw for higher-level handling if needed
      })
    ).subscribe({
      next: () => {
        // CRÍTICO: Marcar como completada ANTES de cualquier otra acción
        this.inscriptionCompleted = true;

        this.notificationService.success('¡Inscripción finalizada con éxito!');
        this.inscriptionStateService.clearInscriptionState(this.inscriptionId!); // Clear local state after successful completion

        // CORRECCIÓN CRÍTICA: Forzar actualización de servicios antes de navegar
        this.loggingService.debug('[InscripcionProcess] Inscripción finalizada exitosamente - marcada como completada', {
          inscriptionId: this.inscriptionId,
          state: state
        }, 'InscripcionProcessPage');

        // Forzar refresh de inscripciones para sincronizar estado
        this.inscriptionService.refreshInscriptions();

        // Delay antes de navegar para permitir sincronización
        setTimeout(() => {
          this.router.navigate(['/dashboard/concursos']);
        }, 1000); // 1 segundo de delay para permitir sincronización
      },
      error: () => {
        // Error already handled by catchError, but if needed, can add more logic here.
      }
    });
  }

  // Método para manejar la selección de circunscripciones
  onCircunscripcionesSelected(circunscripciones: string[]): void {
    this.selectedCircunscripcionesControl.setValue(circunscripciones);
    this.loggingService.debug(`[InscripcionProcess] Circunscripciones seleccionadas: ${circunscripciones.join(', ')}`, undefined, 'InscripcionProcessPage');
  }

  // Métodos wrapper temporales para resolver problemas de TypeScript
  private cancelInscriptionWrapper(inscriptionId: string): Observable<void> {
    // TODO: Usar this.inscriptionService.cancelInscription cuando TypeScript lo reconozca
    return (this.inscriptionService as any).cancelInscription(inscriptionId);
  }

  private updateInscriptionStatusWrapper(inscriptionId: string, request: IInscriptionUpdateRequest): Observable<any> {
    // TODO: Usar this.inscriptionService.updateInscriptionStatus cuando TypeScript lo reconozca
    return (this.inscriptionService as any).updateInscriptionStatus(inscriptionId, request);
  }

  // Método finish() para el template
  finish(): void {
    this.finalizarInscripcion();
  }

  /**
   * Vuelve a la página de concursos
   */
  volverAConcursos(): void {
    this.loggingService.debug('[InscripcionProcess] Navegando de vuelta a concursos', undefined, 'InscripcionProcessPage');
    this.router.navigate(['/dashboard/concursos']);
  }

  /**
   * Verifica si una circunscripción está seleccionada
   */
  isCircunscripcionSelected(circunscripcion: any): boolean {
    const selectedCircunscripciones = this.selectedCircunscripcionesControl.value || [];
    return selectedCircunscripciones.includes(circunscripcion.id || circunscripcion);
  }

  /**
   * Maneja el cambio de selección de circunscripción
   */
  onCircunscripcionChange(event: Event, circunscripcion: any): void {
    const checkbox = event.target as HTMLInputElement;
    const selectedCircunscripciones = [...(this.selectedCircunscripcionesControl.value || [])];
    const circunscripcionId = circunscripcion.id || circunscripcion;

    if (checkbox.checked) {
      // Agregar circunscripción si no está ya seleccionada
      if (!selectedCircunscripciones.includes(circunscripcionId)) {
        selectedCircunscripciones.push(circunscripcionId);
      }
    } else {
      // Remover circunscripción
      const index = selectedCircunscripciones.indexOf(circunscripcionId);
      if (index > -1) {
        selectedCircunscripciones.splice(index, 1);
      }
    }

    this.selectedCircunscripcionesControl.setValue(selectedCircunscripciones);
    this.loggingService.debug(`[InscripcionProcess] Circunscripción ${checkbox.checked ? 'seleccionada' : 'deseleccionada'}: ${circunscripcionId}`, undefined, 'InscripcionProcessPage');
  }

  /**
   * CRITICAL FIX: Creates inscription when advancing from step 1 to step 2
   * This ensures inscription is only created when user actually progresses beyond terms acceptance
   */
  private createInscriptionWhenAdvancingToStep2(): void {
    if (!this.contestId) {
      this.notificationService.error('Error: No se ha especificado un concurso válido');
      this.router.navigate(['/dashboard/concursos']);
      return;
    }

    this.loggingService.debug('[InscripcionProcess] Creating inscription when advancing to step 2 for contest:', this.contestId, 'InscripcionProcessPage');

    this.inscriptionService.createInscription(this.contestId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('[InscripcionProcess] Error creating inscription when advancing to step 2:', error);

        // Check if error is due to existing inscription (409 Conflict)
        if (error.message && error.message.includes('Ya existe una inscripción')) {
          this.loggingService.debug('[InscripcionProcess] Inscription already exists, attempting to load existing inscription', undefined, 'InscripcionProcessPage');

          // Try to load existing inscriptions to get the ID
          return this.inscriptionService.getUserInscriptions().pipe(
            map(response => {
              const existingInscription = response.content.find((insc: any) => insc.contestId === this.contestId);
              if (existingInscription) {
                this.loggingService.debug('[InscripcionProcess] Found existing inscription with ID:', existingInscription.id, 'InscripcionProcessPage');
                return existingInscription;
              } else {
                throw new Error('No se pudo encontrar la inscripción existente');
              }
            }),
            catchError(loadError => {
              console.error('[InscripcionProcess] Error loading existing inscriptions:', loadError);
              this.notificationService.error('Error al acceder a la inscripción existente. Por favor, intente nuevamente.');
              this.router.navigate(['/dashboard/concursos']);
              return of(null);
            })
          );
        } else {
          this.notificationService.error('Error al crear la inscripción. Por favor, intente nuevamente.');
          this.router.navigate(['/dashboard/concursos']);
          return of(null);
        }
      })
    ).subscribe({
      next: (response: any) => {
        if (response && response.id) {
          this.inscriptionId = response.id;
          this.loggingService.debug('[InscripcionProcess] Using inscription with ID:', this.inscriptionId, 'InscripcionProcessPage');

          // Update URL with inscription ID
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              contestId: this.contestId,
              inscriptionId: this.inscriptionId
            },
            queryParamsHandling: 'merge'
          });

          this.showValidationErrors = false;

          // CRITICAL FIX: Avanzar al paso 2 después de crear la inscripción
          this.currentStep = 2;
          this.updateProgressPercentage();
          this.guardarEstadoActual();
          this.cdr.detectChanges();

          // Scroll automático al nuevo paso
          setTimeout(() => {
            this.performImmediateScroll();
            this.scrollToTopAfterAnimation();
          }, 50);
        } else {
          this.notificationService.error('Error: No se recibió un ID de inscripción válido');
          this.router.navigate(['/dashboard/concursos']);
        }
      }
    });
  }

  /**
   * Obtiene el ID del concurso
   */
  getContestId(): number {
    return this.contestId || 0;
  }
}
