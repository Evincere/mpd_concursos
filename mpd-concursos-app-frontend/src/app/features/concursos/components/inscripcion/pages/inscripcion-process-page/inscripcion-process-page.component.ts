import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';

/**
 * ✅ SOLUCIÓN PROBLEMA 10: Enum para tipos de navegación
 * Permite distinguir claramente la intención de navegación
 */
enum NavigationType {
  INTERNAL_STEP = 'internal_step',           // Navegación entre pasos del proceso
  EXTERNAL_INTENTIONAL = 'external_intentional', // Navegación externa confirmada por usuario
  EXTERNAL_ACCIDENTAL = 'external_accidental',   // Navegación externa no confirmada
  BROWSER_NAVIGATION = 'browser_navigation',      // Botones atrás/adelante del navegador
  WINDOW_CLOSE = 'window_close',                  // Cierre de ventana/pestaña
  GUARD_CONFIRMATION = 'guard_confirmation'       // Navegación confirmada por guard
}
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of, throwError, forkJoin, Observable } from 'rxjs'; // Import forkJoin
import { takeUntil, finalize, map, catchError, switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators'; // Import tap
import { HttpClient } from '@angular/common/http';

import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { ProfileService, UserProfile } from '@core/services/profile/profile.service';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { ContestDocumentService } from '@core/services/contest-document/contest-document.service';
import { ContestDocumentAvailability, ContestDocumentType } from '@shared/interfaces/concurso/contest-document.interface';

import { AuthService } from '@core/services/auth/auth.service';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { DocumentosEmbebidosComponent } from '../../documentos-embebidos/documentos-embebidos.component';
import { CustomAddressAutocompleteComponent } from '@shared/components/custom-address-autocomplete/custom-address-autocomplete.component';
    FinalStepValidationComponent
import { FinalStepValidationComponent } from '../../final-step-validation/final-step-validation.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { IInscriptionUpdateRequest, IInscriptionStepRequest } from '@shared/interfaces/inscripcion/inscription.interface';
import { InscriptionDocumentationService, InscriptionDocumentationState } from '@core/services/inscripcion/inscription-documentation.service';
import { RequiredDocument } from '@core/services/documentos/documento-validation.service';
import { DocumentoUsuario, TipoDocumento } from '@core/models/documento.model'; // Import TipoDocumento
import { LoggingService } from '@core/services/logging/logging.service';
import { PostulacionesService } from '@core/services/postulaciones/postulaciones.service';
import { CanComponentDeactivate } from '../../guards/inscription-deactivate.guard';
import {
  DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION,
  CIRCUNSCRIPCIONES_JUDICIALES,
  DepartamentoCircunscripcion,
  SeleccionCircunscripcion,
  convertirSeleccionAFormato,
  convertirFormatoASeleccion,
  validarSeleccionCircunscripciones
} from '@shared/constants/circunscripciones.constants';

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
    CustomAddressAutocompleteComponent,
    FinalStepValidationComponent,
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
export class InscripcionProcessPageComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  // Pasos de inscripción
  steps = [
    { label: 'Términos' },
    { label: 'Circunscripción' },
    { label: 'Documentación' },
    { label: 'Confirmación' }
  ];

  // Estado actual
  currentStep: number = 1;
  progressPercentage = 25;
  loading = false;
  inscriptionId: string | null = null;
  contestId: number | null = null;
  contest: Contest | null = null;
  showValidationErrors = false;

  // CONCURRENCY FIX: Flag para prevenir múltiples creaciones de inscripción simultáneas
  private isCreatingInscription = false;

  // ✅ SOLUCIÓN PROBLEMA 10: Sistema de contexto de navegación mejorado

  /**
   * Contexto de navegación con información detallada
   */
  private navigationContext: {
    type: NavigationType;
    timestamp: number;
    source?: string;
    metadata?: Record<string, any>;
  } | null = null;

  // ✅ PÚBLICO para acceso desde guard - simplificado
  public get isInternalNavigation(): boolean {
    return this.navigationContext?.type === NavigationType.INTERNAL_STEP &&
      (Date.now() - this.navigationContext.timestamp) < 2000; // 2 segundos de ventana
  }

  // CRITICAL FIX: Guardar el paso solicitado desde la URL para navegación directa
  private requestedStepFromUrl: number | null = null;

  // NUEVO: Variable para trackear el estado actual de inscripción
  private currentInscriptionState: InscripcionState = InscripcionState.NO_INSCRIPTION;

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

  // ✅ CORRECCIÓN: Agregar propiedad para documentos del usuario
  documentosUsuario: DocumentoUsuario[] = [];

  // Disponibilidad de documentos del concurso
  contestDocumentAvailability: ContestDocumentAvailability | null = null;
  loadingDocumentAvailability = false;

  // Propiedades para manejo de circunscripciones con departamentos
  departamentosSegundaCircunscripcion = DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION;
  seleccionesCircunscripciones: SeleccionCircunscripcion[] = [];
  circunscripcionesDisponibles = CIRCUNSCRIPCIONES_JUDICIALES;

  // ✅ CRITICAL FIX: Propiedades computadas para evitar loops infinitos
  private _canProceedWithDocumentation = false;
  private _canFinishInscription = false;
  private _canProceedToNextStep = false;

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

  // ✅ CRITICAL FIX: Getters públicos para propiedades computadas (evitan loops infinitos)
  get canProceedWithDocumentationComputed(): boolean {
    return this._canProceedWithDocumentation;
  }

  get canFinishInscriptionComputed(): boolean {
    return this._canFinishInscription;
  }

  get canProceedToNextStepComputed(): boolean {
    return this._canProceedToNextStep;
  }

  // Helper method to check if we're on step 4
  isStep4(): boolean {
    return this.currentStep === 4;
  }

  private destroy$ = new Subject<void>();
  // ✅ PÚBLICO para acceso desde guard
  public inscriptionCompleted = false; // Flag to track if inscription was successfully completed

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
    private inscriptionDocumentationService: InscriptionDocumentationService,
    private postulacionesService: PostulacionesService, // Inyectar servicio de postulaciones para refrescar cache
    private contestDocumentService: ContestDocumentService // Servicio para documentos de concurso
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
      // ✅ SOLUCIÓN PROBLEMA 10: Verificar contexto de navegación mejorado
      if (this.isRecentNavigationType(NavigationType.INTERNAL_STEP)) {
        this.loggingService.debug('[InscripcionProcess] Navegación interna reciente detectada - omitiendo reinicialización', {
          navigationContext: this.navigationContext
        }, 'InscripcionProcessPage');

        this.clearNavigationContext(); // Limpiar contexto después de usar
        return;
      }

      this.contestId = params['contestId'] ? Number(params['contestId']) : null;
      this.inscriptionId = params['inscriptionId'] || null;
      const isResume = params['resume'] === 'true';
      const stepParam = params['step'] ? Number(params['step']) : null;

      this.loggingService.debug('[InscripcionProcess] Parámetros recibidos:', {
        contestId: this.contestId,
        inscriptionId: this.inscriptionId,
        isResume: isResume,
        step: stepParam
      }, 'InscripcionProcessPage');

      if (!this.contestId) {
        this.notificationService.error('No se ha especificado un concurso válido');
        this.router.navigate(['/dashboard/concursos']);
        return;
      }

      // CRITICAL FIX: Guardar el paso solicitado desde la URL para navegación directa
      this.requestedStepFromUrl = stepParam;

      // Si hay un paso específico en la URL, validarlo y aplicarlo
      if (stepParam && stepParam >= 1 && stepParam <= 4) {
        // Validar que el usuario pueda acceder a este paso
        this.validateAndSetStep(stepParam);
      }

      // CRITICAL FIX: Verificar si ya existe una inscripción cancelada para este concurso
      // Si existe, mostrar mensaje y no permitir continuar
      this.inscriptionService.getInscriptionStatus(this.contestId).pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('[InscripcionProcess] Error al verificar estado de inscripción:', error);
          return of(InscripcionState.NO_INSCRIPTION); // Continuar si hay error
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
      // ✅ CRITICAL FIX: Actualizar propiedades computadas cuando cambia el estado
      this.updateComputedProperties();
    });

    // Suscribirse a cambios en el checkbox de inscripción provisional
    this.documentosCompletosControl.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.onProvisionalAcceptanceChange(value);
    });

    // ✅ CORRECCIÓN: Restaurar suscripción a actualizaciones de documentos para actualizar UI
    // Esta suscripción es necesaria para que la card se actualice después de cargar un documento
    this.documentosService.documentoActualizado$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300), // Evitar actualizaciones muy frecuentes
      distinctUntilChanged() // Solo procesar cambios reales
    ).subscribe(() => {
      this.loggingService.debug('[InscripcionProcess] Documento actualizado detectado - actualizando estado de UI', undefined, 'InscripcionProcessPage');
      // Actualizar estado de documentos para reflejar cambios en la UI
      setTimeout(() => {
        this.actualizarEstadoDocumentos();
        // Forzar detección de cambios para actualizar la UI inmediatamente
        this.cdr.detectChanges();
      }, 100);
    });
  }

  /**
   * ✅ CRITICAL FIX: Actualiza las propiedades computadas para evitar loops infinitos
   */
  private updateComputedProperties(): void {
    this._canProceedWithDocumentation = this.canProceedWithDocumentation();
    this._canFinishInscription = this.canFinish();
    this._canProceedToNextStep = this.canProceed();
  }

  /**
   * CRITICAL FIX: Inicializa el proceso de inscripción solo después de verificar que no hay restricciones
   * @param isResume Indica si es una recuperación de proceso interrumpido
   */
  private initializeInscriptionProcess(isResume: boolean = false): void {
    console.log('[InscripcionProcess] 🚀 INICIANDO initializeInscriptionProcess:', {
      isResume,
      inscriptionId: this.inscriptionId,
      requestedStepFromUrl: this.requestedStepFromUrl,
      currentStep: this.currentStep,
      contestId: this.contestId
    });

    this.loggingService.debug('[InscripcionProcess] initializeInscriptionProcess llamado:', {
      isResume,
      inscriptionId: this.inscriptionId,
      requestedStepFromUrl: this.requestedStepFromUrl,
      currentStep: this.currentStep
    }, 'InscripcionProcessPage');

    // Cargar datos del concurso
    this.cargarDatosConcurso();

    // ✅ SOLUCIÓN DIRECTA: Cargar datos desde backend cuando hay inscriptionId
    console.log('[InscripcionProcess] 🔍 VERIFICANDO CONDICIONES:', {
      inscriptionId: this.inscriptionId,
      isResume: isResume,
      contestId: this.contestId
    });

    if (this.inscriptionId) {
      console.log('[InscripcionProcess] ✅ CARGANDO DATOS DIRECTAMENTE DESDE BACKEND');
      // Cargar datos directamente desde el backend
      this.inscriptionService.getInscriptionDetails(this.inscriptionId).pipe(
        takeUntil(this.destroy$),
        tap(inscriptionDetails => {
          console.log('[InscripcionProcess] 🎯 DATOS RECIBIDOS DEL BACKEND:', inscriptionDetails);

          // ✅ NUEVO: Actualizar el estado de inscripción para detectar período de regularización
          if (inscriptionDetails.estado) {
            this.currentInscriptionState = inscriptionDetails.estado;
            console.log('[InscripcionProcess] 📊 Estado de inscripción actualizado:', this.currentInscriptionState);
          }

          // Aplicar centro de vida si existe
          if (inscriptionDetails.centroDeVida) {
            this.centroDeVidaControl.setValue(inscriptionDetails.centroDeVida);
            this.centroDeVidaControl.markAsTouched();
            this.centroDeVidaControl.updateValueAndValidity();
            console.log('[InscripcionProcess] ✅ Centro de vida aplicado:', inscriptionDetails.centroDeVida);
          }

          // Aplicar circunscripciones si existen
          if (inscriptionDetails.circunscripciones && Array.isArray(inscriptionDetails.circunscripciones)) {
            this.selectedCircunscripcionesControl.setValue(inscriptionDetails.circunscripciones);
            this.selectedCircunscripcionesControl.markAsTouched();
            this.selectedCircunscripcionesControl.updateValueAndValidity();
            console.log('[InscripcionProcess] ✅ Circunscripciones aplicadas:', inscriptionDetails.circunscripciones);
          }

          // Marcar términos como aceptados
          this.termsAcceptedControl.setValue(true);
          this.termsAcceptedControl.markAsTouched();
          this.termsAcceptedControl.updateValueAndValidity();

          // Forzar validación después de cargar datos
          setTimeout(() => {
            this.forceValidationUpdate();
            console.log('[InscripcionProcess] 🔄 Validación forzada completada');
          }, 200);
        }),
        catchError(error => {
          console.error('[InscripcionProcess] ❌ Error cargando datos desde backend:', error);
          // Continuar con el flujo normal si hay error
          return of(null);
        })
      ).subscribe();
    } else if (isResume) {
      console.log('[InscripcionProcess] 🔄 LLAMANDO recuperarProcesoInterrumpido');
      // CRITICAL FIX: Si es una recuperación pero no hay inscriptionId, buscar en localStorage
      this.recuperarProcesoInterrumpido();
    } else {
      console.log('[InscripcionProcess] ⚠️ NO SE EJECUTA NINGÚN MÉTODO DE CARGA DE DATOS');
    }

    // Cargar centro de vida desde el perfil si existe
    this.cargarCentroDeVidaDesdePerfilUsuario();

    // Cargar términos y condiciones
    this.loadTermsAndConditions();

    // Actualizar el estado de los documentos en el resumen (solo si hay inscriptionId)
    if (this.inscriptionId) {
      this.actualizarEstadoDocumentos();
    }

    // CRITICAL FIX: Evitar suscripciones duplicadas - ya se configuran en ngOnInit
    // Las suscripciones al estado de documentación y checkbox ya están configuradas en ngOnInit

    // Inicializar selecciones de circunscripciones
    this.inicializarSeleccionesCircunscripciones();

    // ✅ SOLUCIÓN: Configurar suscripciones para actualización automática
    this.configurarSuscripcionesFormulario();

    // ✅ CORRECCIÓN: Forzar validación después de inicializar todo
    setTimeout(() => {
      this.forceValidationUpdate();
      // ✅ NUEVO: Inicializar checkbox de conformidad según el contexto
      this.initializeProvisionalCheckbox();
    }, 500);
  }

  /**
   * ✅ NUEVO: Fuerza la actualización de validación de todos los controles
   */
  private forceValidationUpdate(): void {
    // Forzar validación de todos los controles
    Object.keys(this.inscriptionForm.controls).forEach(key => {
      const control = this.inscriptionForm.get(key);
      if (control && control.value) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
    });

    // Forzar detección de cambios
    this.cdr.detectChanges();

    this.loggingService.debug('[InscripcionProcess] Validación forzada completada:', {
      centroDeVidaValid: this.centroDeVidaControl.valid,
      circunscripcionesValid: this.selectedCircunscripcionesControl.valid,
      canProceed: this.canProceed()
    }, 'InscripcionProcessPage');
  }



  ngOnDestroy(): void {
    // ✅ SOLUCIÓN PROBLEMA 9: Solo guardar estado, NO cancelar automáticamente
    // La cancelación debe ser una decisión explícita del usuario, no automática por navegación
    if (this.inscriptionId && this.currentStep < 5 && !this.inscriptionCompleted) {
      // ✅ GUARDAR estado para recuperación posterior
      this.guardarEstadoActual();

      this.loggingService.debug('[InscripcionProcess] Proceso interrumpido - estado guardado para recuperación', {
        inscriptionId: this.inscriptionId,
        currentStep: this.currentStep,
        completed: this.inscriptionCompleted,
        reason: 'component_destruction'
      }, 'InscripcionProcessPage');

      // ✅ NO CANCELAR - permitir recuperación posterior
      // Comentario: El comportamiento anterior cancelaba automáticamente cualquier navegación
      // Ahora solo guardamos el estado para que el usuario pueda recuperar su progreso

    } else if (this.inscriptionCompleted) {
      this.loggingService.debug('[InscripcionProcess] Inscripción completada exitosamente', {
        inscriptionId: this.inscriptionId,
        currentStep: this.currentStep
      }, 'InscripcionProcessPage');
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 19: Handler para beforeunload
   * Advierte al usuario antes de cerrar ventana/pestaña durante inscripción
   */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    // Solo mostrar advertencia si hay inscripción en progreso
    if (this.inscriptionId && this.currentStep > 1 && this.currentStep < 5 && !this.inscriptionCompleted) {
      // Guardar estado antes de que se cierre
      this.guardarEstadoActual();

      this.loggingService.debug('[InscripcionProcess] Advertencia beforeunload - guardando estado', {
        inscriptionId: this.inscriptionId,
        currentStep: this.currentStep,
        reason: 'window_beforeunload'
      }, 'InscripcionProcessPage');

      // Mostrar advertencia del navegador
      event.preventDefault();
      event.returnValue = 'Tiene una inscripción en progreso. ¿Está seguro que desea salir? Su progreso se guardará automáticamente.';
      return event.returnValue;
    }
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 19: Handler para visibilitychange (mobile)
   * Guarda estado cuando la página se oculta en dispositivos móviles
   */
  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(): void {
    if (document.hidden && this.inscriptionId && this.currentStep > 1 && this.currentStep < 5) {
      // Guardar estado cuando la página se oculta (mobile)
      this.guardarEstadoActual();

      this.loggingService.debug('[InscripcionProcess] Página oculta - guardando estado', {
        inscriptionId: this.inscriptionId,
        currentStep: this.currentStep,
        reason: 'visibility_hidden'
      }, 'InscripcionProcessPage');
    }
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 10: Métodos para manejo de contexto de navegación
   */

  /**
   * Marca el tipo de navegación con contexto detallado
   * @param type Tipo de navegación
   * @param source Fuente de la navegación (opcional)
   * @param metadata Metadatos adicionales (opcional)
   */
  private markNavigationType(type: NavigationType, source?: string, metadata?: Record<string, any>): void {
    this.navigationContext = {
      type,
      timestamp: Date.now(),
      source,
      metadata
    };

    this.loggingService.debug('[InscripcionProcess] Contexto de navegación establecido', {
      type,
      source,
      metadata,
      timestamp: this.navigationContext.timestamp
    }, 'InscripcionProcessPage');
  }

  /**
   * Verifica si la navegación es reciente y del tipo especificado
   * @param type Tipo de navegación a verificar
   * @param maxAgeMs Edad máxima en milisegundos (default: 2000ms)
   * @returns true si la navegación es del tipo especificado y reciente
   */
  private isRecentNavigationType(type: NavigationType, maxAgeMs: number = 2000): boolean {
    if (!this.navigationContext) return false;

    const isCorrectType = this.navigationContext.type === type;
    const isRecent = (Date.now() - this.navigationContext.timestamp) < maxAgeMs;

    return isCorrectType && isRecent;
  }

  /**
   * Limpia el contexto de navegación
   */
  private clearNavigationContext(): void {
    if (this.navigationContext) {
      this.loggingService.debug('[InscripcionProcess] Contexto de navegación limpiado', {
        previousContext: this.navigationContext
      }, 'InscripcionProcessPage');

      this.navigationContext = null;
    }
  }

  // Métodos para navegación entre pasos
  goToStep(step: number): void {
    // Allow going back to previous steps, but only if they are valid
    if (step >= 1 && step <= this.currentStep) {
      // Validate current step before going back if it's not the final step
      // No validation when going back, as currentStep will be decreased
      this.currentStep = step;
      this.updateProgressPercentage();
      this.updateUrlWithCurrentStep();

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

      // CRITICAL FIX: Crear inscripción cuando se avanza del paso 1 al paso 2 Y no existe ya una inscripción
      if (this.currentStep === 1 && !this.inscriptionId && this.contestId) {
        // Crear inscripción directamente - el backend maneja las validaciones
        this.createInscriptionWhenAdvancingToStep2();
        return; // Salir aquí, la creación manejará el avance
      }

      this.proceedToNextStep();
    }
  }

  /**
   * CRITICAL FIX: Método auxiliar para proceder al siguiente paso
   */
  private proceedToNextStep(): void {
    const previousStep = this.currentStep;
    this.currentStep++;

    this.loggingService.debug('[InscripcionProcess] Avanzando paso:', {
      previousStep,
      newStep: this.currentStep
    }, 'InscripcionProcessPage');

    this.updateProgressPercentage();
    this.updateUrlWithCurrentStep();
    this.guardarEstadoActual();

    // Si avanzamos al paso de confirmación, actualizar el estado de los documentos
    if (this.currentStep === 4) { // Step 4 is 'Confirmación'
      this.actualizarEstadoDocumentos();
    }

    // CRITICAL FIX: Eliminar cdr.detectChanges() para evitar bucles infinitos
    // Angular manejará automáticamente la detección de cambios

    this.loggingService.debug('[InscripcionProcess] Detección de cambios forzada, currentStep:', this.currentStep, 'InscripcionProcessPage');

    // Esperar un momento adicional para que el DOM se actualice completamente
    setTimeout(() => {
      // Scroll inmediato para asegurar que se mueva
      this.performImmediateScroll();

      // Scroll suave después de la animación con más delay
      this.scrollToTopAfterAnimation();
    }, 50);
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressPercentage();
      this.updateUrlWithCurrentStep();

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
   * Actualiza la URL con el paso actual para permitir navegación directa y bookmarking
   */
  private updateUrlWithCurrentStep(): void {
    const queryParams: any = {
      contestId: this.contestId,
      step: this.currentStep
    };

    // Solo agregar inscriptionId si existe
    if (this.inscriptionId) {
      queryParams.inscriptionId = this.inscriptionId;
    }

    // ✅ SOLUCIÓN PROBLEMA 10: Marcar como navegación interna con contexto detallado
    this.markNavigationType(NavigationType.INTERNAL_STEP, 'step_navigation', {
      fromStep: this.currentStep - 1,
      toStep: this.currentStep,
      contestId: this.contestId,
      inscriptionId: this.inscriptionId
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true // Usar replaceUrl para no crear entradas adicionales en el historial
    });

    this.loggingService.debug('[InscripcionProcess] URL actualizada con paso actual:', {
      step: this.currentStep,
      contestId: this.contestId,
      inscriptionId: this.inscriptionId
    }, 'InscripcionProcessPage');
  }

  /**
   * Valida si el usuario puede acceder al paso solicitado y lo establece
   * @param requestedStep Paso solicitado desde la URL
   */
  private validateAndSetStep(requestedStep: number): void {
    this.loggingService.debug('[InscripcionProcess] validateAndSetStep llamado:', {
      requestedStep,
      inscriptionId: this.inscriptionId,
      currentStep: this.currentStep
    }, 'InscripcionProcessPage');

    // Si hay una inscripción existente, verificar el estado para determinar el paso máximo permitido
    if (this.inscriptionId) {
      // Permitir navegación directa cuando hay inscriptionId (el backend determinará el estado correcto)
      this.currentStep = requestedStep;
      this.updateProgressPercentage();
      this.loggingService.debug('[InscripcionProcess] Paso establecido desde URL con inscriptionId:', {
        requestedStep,
        currentStep: this.currentStep
      }, 'InscripcionProcessPage');
      return;
    }

    // Si no hay inscripción, solo permitir el paso 1 (términos)
    if (requestedStep > 1) {
      this.loggingService.warn('[InscripcionProcess] Acceso denegado a paso avanzado sin inscripción:', {
        requestedStep
      }, 'InscripcionProcessPage');

      this.currentStep = 1;
      this.updateProgressPercentage();
      this.updateUrlWithCurrentStep(); // Corregir la URL
      this.notificationService.info('Debe comenzar el proceso de inscripción desde el primer paso.');
    } else {
      this.currentStep = requestedStep;
      this.updateProgressPercentage();
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
        // ✅ CORRECCIÓN: Validación mejorada para paso 2
        const centroDeVidaValid = this.centroDeVidaControl.valid &&
          this.centroDeVidaControl.value &&
          this.centroDeVidaControl.value.trim().length > 0;

        const circunscripcionesValid = this.selectedCircunscripcionesControl.valid &&
          this.selectedCircunscripcionesControl.value &&
          this.selectedCircunscripcionesControl.value.length > 0;

        const canProceedStep2 = centroDeVidaValid && circunscripcionesValid;

        // ✅ DEBUG: Log detallado para troubleshooting
        this.loggingService.debug('[InscripcionProcess] Validación paso 2:', {
          centroDeVidaValue: this.centroDeVidaControl.value,
          centroDeVidaValid: this.centroDeVidaControl.valid,
          centroDeVidaValidCustom: centroDeVidaValid,
          selectedCircunscripciones: this.selectedCircunscripcionesControl.value,
          circunscripcionesValid: this.selectedCircunscripcionesControl.valid,
          circunscripcionesValidCustom: circunscripcionesValid,
          canProceedStep2: canProceedStep2
        }, 'InscripcionProcessPage');

        return canProceedStep2;
      case 3:
        // UNIFICADO: Usar servicio centralizado para validación de documentación
        return this.canProceedFromDocumentationStep();
      case 4:
        // Step 4 validation is for the final confirmation before finishing the inscription
        return this.confirmedPersonalDataControl.valid && this.canProceedWithDocumentation();
      default:
        return false;
    }
  }

  // Verificar si se puede finalizar la inscripción
  canFinish(): boolean {
    // CRITICAL FIX: Logging básico SIEMPRE visible con timestamp
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[InscripcionProcess] 🔍 EJECUTANDO canFinish() - ${timestamp}`);

    // CRITICAL FIX: Si estamos en el paso 4, asegurar que termsAccepted esté en true
    // porque el usuario ya pasó por el paso 1 y aceptó los términos
    if (this.currentStep === 4 && this.termsAcceptedControl.value !== true) {
      console.log(`[InscripcionProcess] 🔧 CORRIGIENDO termsAccepted a true en paso 4`);
      this.termsAcceptedControl.setValue(true);
    }

    // Ensure all controls for the final step are valid and documentation check passes
    const formValid = this.inscriptionForm.valid; // This checks all controls
    const personalDataConfirmed = this.confirmedPersonalDataControl.value === true;
    const documentationValid = this.canProceedWithDocumentation();

    // CRITICAL FIX: Logging detallado para debugging del botón "Finalizar"
    const canFinish = formValid && personalDataConfirmed && documentationValid;

    // CRITICAL FIX: Debugging detallado del formulario para identificar campos inválidos
    const invalidControls: any = {};
    Object.keys(this.inscriptionForm.controls).forEach(key => {
      const control = this.inscriptionForm.get(key);
      if (control && control.invalid) {
        invalidControls[key] = {
          value: control.value,
          errors: control.errors,
          status: control.status
        };
      }
    });

    console.log(`[InscripcionProcess] 🔍 DEBUGGING canFinish() - RESULTADOS (${timestamp}):`, {
      formValid,
      personalDataConfirmed,
      documentationValid,
      canFinish,
      currentStep: this.currentStep,
      documentationState: this.documentationState,
      allDocsComplete: this.documentationState?.completenessResult.allDocumentsComplete,
      canProceedWithProvisional: this.documentationState?.completenessResult.canProceedWithProvisional,
      provisionalAccepted: this.documentosCompletosControl.value,
      formControls: {
        confirmedPersonalData: this.confirmedPersonalDataControl.value,
        documentosCompletos: this.documentosCompletosControl.value
      },
      // CRITICAL: Información detallada del formulario
      formStatus: this.inscriptionForm.status,
      formErrors: this.inscriptionForm.errors,
      invalidControls: invalidControls,
      totalControls: Object.keys(this.inscriptionForm.controls).length,
      invalidControlsCount: Object.keys(invalidControls).length
    });

    // The inscription can be finalized if all form controls are valid and the documentation
    // is either fully complete OR the user has accepted provisional inscription terms.
    return canFinish;
  }

  /**
   * MÉTODO UNIFICADO: Verifica si se puede proceder con la documentación actual
   * Usa el servicio centralizado para validación consistente
   * ✅ CRITICAL FIX: Eliminado logging para evitar loops infinitos
   */
  canProceedWithDocumentation(): boolean {
    if (!this.inscriptionDocumentationService) {
      return false;
    }

    const canProceed = this.inscriptionDocumentationService.canProceedWithCurrentState();

    return canProceed;
  }

  /**
   * MÉTODOS UNIFICADOS: Para la vista mejorada del resumen usando servicio centralizado
   */
  getDocumentosCompletados(): number {
    if (!this.documentationState) return 0;

    // ✅ CRITICAL FIX: Retornar solo documentos obligatorios completados
    // El servicio ya calcula correctamente completedCount solo para documentos obligatorios
    return this.documentationState.completenessResult.completedCount;
  }

  getDocumentationProgress(): number {
    if (!this.documentationState) return 0;

    // ✅ CRITICAL FIX: El progreso debe basarse SOLO en documentos obligatorios
    // El servicio ya calcula correctamente completedCount y totalCount solo para documentos obligatorios
    const { completedCount, totalCount, allDocumentsComplete } = this.documentationState.completenessResult;

    // Si todos los documentos obligatorios están completos, mostrar 100%
    if (allDocumentsComplete) {
      return 100;
    }

    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    this.loggingService.debug('[InscripcionProcess] Cálculo de progreso desde documentationState', {
      completedCount,
      totalCount,
      allDocumentsComplete,
      calculatedProgress: progress
    }, 'InscripcionProcessPage');

    return progress;
  }

  // ✅ MÉTODOS AUXILIARES PARA EL DEBUG PANEL
  getDocumentosObligatoriosCount(): number {
    if (!this.documentacionRequerida) return 0;
    return this.documentacionRequerida.filter(doc => doc.required === true).length;
  }

  getDocumentosOpcionalesCount(): number {
    if (!this.documentacionRequerida) return 0;
    return this.documentacionRequerida.filter(doc => doc.required !== true).length;
  }

  getDocumentosObligatoriosCompletadosCount(): number {
    if (!this.documentacionRequerida) return 0;
    return this.documentacionRequerida.filter(doc => doc.required === true && doc.completed === true).length;
  }

  // ✅ MÉTODOS AUXILIARES PARA EVITAR ERRORES DE TEMPLATE
  getCentroDeVidaValue(): string {
    return this.centroDeVidaControl?.value || '';
  }

  getSelectedCircunscripcionesValue(): string {
    const value = this.selectedCircunscripcionesControl?.value;
    return Array.isArray(value) ? value.join(', ') : '';
  }

  // ✅ MÉTODO CRÍTICO: Verificar si realmente todos los documentos obligatorios están completos
  shouldHideProvisionalSection(): boolean {
    if (!this.documentacionRequerida || this.documentacionRequerida.length === 0) {
      return true; // Si no hay documentos, ocultar la sección
    }

    const obligatoryDocs = this.documentacionRequerida.filter(doc => doc.required === true);
    const completedObligatory = obligatoryDocs.filter(doc => doc.completed === true);
    const allObligatoryComplete = obligatoryDocs.length > 0 && completedObligatory.length === obligatoryDocs.length;

    this.loggingService.debug('[InscripcionProcess] shouldHideProvisionalSection', {
      obligatoryDocsCount: obligatoryDocs.length,
      completedObligatoryCount: completedObligatory.length,
      allObligatoryComplete,
      documentationStateAllComplete: this.documentationState?.completenessResult.allDocumentsComplete,
      shouldHide: allObligatoryComplete
    }, 'InscripcionProcessPage');

    // ✅ CORRECCIÓN CRÍTICA: Si todos los documentos obligatorios están completos pero el estado no lo refleja,
    // forzar actualización inmediata
    if (allObligatoryComplete && this.documentationState && !this.documentationState.completenessResult.allDocumentsComplete) {
      this.loggingService.debug('[InscripcionProcess] FORZANDO actualización inmediata - estado inconsistente detectado', {
        calculatedComplete: allObligatoryComplete,
        stateComplete: this.documentationState.completenessResult.allDocumentsComplete
      }, 'InscripcionProcessPage');

      // Forzar actualización del estado
      setTimeout(() => {
        this.actualizarEstadoDocumentos();
        this.cdr.detectChanges();
      }, 0);
    }

    return allObligatoryComplete;
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
   * CRITICAL FIX: Fuerza la actualización del estado de documentación
   * Útil cuando se detecta que los documentos están completos pero el estado no se actualiza
   */
  forceUpdateDocumentationState(): void {
    if (!this.inscriptionDocumentationService) {
      this.loggingService.warn('[InscripcionProcess] No se puede forzar actualización - servicio no disponible', undefined, 'InscripcionProcessPage');
      return;
    }

    // Obtener documentos del usuario actualizados
    const userDocuments = this.documentosUsuario || [];
    const requiredDocuments = this.documentacionRequerida || [];

    this.loggingService.debug('[InscripcionProcess] 🔄 Forzando actualización del estado de documentación', {
      userDocumentsCount: userDocuments.length,
      requiredDocumentsCount: requiredDocuments.length,
      userDocuments: userDocuments.map(doc => ({
        tipoDocumentoId: doc.tipoDocumento?.id,
        nombreArchivo: doc.nombreArchivo,
        estado: doc.estado
      })),
      requiredDocuments: requiredDocuments.map(doc => ({
        title: doc.title,
        tipoDocumentoId: doc.tipoDocumentoId,
        required: doc.required,
        completed: doc.completed
      }))
    }, 'InscripcionProcessPage');

    // Forzar actualización del estado
    this.inscriptionDocumentationService.updateDocumentationState(
      requiredDocuments,
      userDocuments,
      this.documentosCompletosControl.value || false
    );

    this.loggingService.debug('[InscripcionProcess] ✅ Estado de documentación actualizado forzadamente', undefined, 'InscripcionProcessPage');
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
          // Cargar disponibilidad de documentos del concurso
          this.loadContestDocumentAvailability();
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
   * CRITICAL FIX: Determina el paso inicial basado en el estado actual de la inscripción
   * Especialmente importante para inscripciones con documentación pendiente
   */
  private determinarPasoInicialBasadoEnEstado(): void {
    console.log('[InscripcionProcess] 🚀 MÉTODO determinarPasoInicialBasadoEnEstado EJECUTADO', {
      inscriptionId: this.inscriptionId,
      contestId: this.contestId
    });

    if (!this.inscriptionId || !this.contestId) {
      console.error('[InscripcionProcess] ❌ No inscription ID or contest ID available for state determination');
      this.loggingService.error('[InscripcionProcess] No inscription ID or contest ID available for state determination', undefined, 'InscripcionProcessPage');
      return;
    }

    console.log('[InscripcionProcess] ✅ Llamando a getInscriptionDetails con ID:', this.inscriptionId);
    this.loggingService.debug('[InscripcionProcess] Determinando paso inicial basado en estado del backend', {
      inscriptionId: this.inscriptionId,
      contestId: this.contestId
    }, 'InscripcionProcessPage');

    // ✅ SOLUCIÓN: Cargar datos específicos directamente desde el endpoint de detalles
    this.inscriptionService.getInscriptionDetails(this.inscriptionId).pipe(
      takeUntil(this.destroy$),
      tap(inscriptionDetails => {
        this.loggingService.debug('[InscripcionProcess] Detalles de inscripción obtenidos:', inscriptionDetails, 'InscripcionProcessPage');

        // Aplicar datos al formulario
        this.aplicarDatosDeInscripcionAlFormulario(inscriptionDetails);

        // Forzar validación después de cargar datos
        setTimeout(() => {
          this.forceValidationUpdate();
        }, 100);
      }),
      switchMap(inscriptionDetails => {
        // También obtener el estado general de la inscripción
        return this.inscriptionService.getUserInscriptions(0, 100).pipe(
          map(page => page.content.find(ins => ins.id === this.inscriptionId)),
          map(inscription => ({ inscription, inscriptionDetails })),
          catchError(() => of({ inscription: { estado: 'ACTIVE' }, inscriptionDetails }))
        );
      }),
      catchError(error => {
        this.loggingService.error('[InscripcionProcess] Error retrieving inscription details:', error, 'InscripcionProcessPage');
        // Si hay error, cargar estado guardado como fallback
        this.cargarEstadoGuardado();
        return of(null);
      })
    ).subscribe((result: any) => {
      if (result && result.inscription) {
        const inscription = result.inscription;
        this.loggingService.debug('[InscripcionProcess] Current inscription state:', inscription.estado, 'InscripcionProcessPage');

        // Determinar el paso inicial basado en el estado
        switch (inscription.estado) {
          case 'COMPLETED_PENDING_DOCS':
            // NUEVO: Guardar el estado actual para los nuevos métodos
            this.currentInscriptionState = InscripcionState.COMPLETED_PENDING_DOCS;
            // CRITICAL FIX: Respetar navegación directa si existe
            if (this.requestedStepFromUrl && this.requestedStepFromUrl >= 1 && this.requestedStepFromUrl <= 4) {
              this.loggingService.debug('[InscripcionProcess] Navegación directa detectada para COMPLETED_PENDING_DOCS - respetando paso de URL:', {
                requestedStep: this.requestedStepFromUrl,
                inscriptionState: inscription.estado
              }, 'InscripcionProcessPage');

              // Mantener el paso ya establecido desde la URL
              this.updateProgressPercentage();
            } else {
              // Para documentación pendiente, ir directamente al paso 3 (comportamiento por defecto)
              this.loggingService.debug('[InscripcionProcess] Estado COMPLETED_PENDING_DOCS detectado - navegando al paso 3', {
                inscriptionId: this.inscriptionId,
                estado: inscription.estado
              }, 'InscripcionProcessPage');

              this.currentStep = 3;
              this.updateProgressPercentage();

              // Forzar actualización del progreso después de establecer el paso
              setTimeout(() => {
                this.currentStep = 3;
                this.updateProgressPercentage();
                this.cdr.detectChanges();

                // Scroll al paso 3 después de establecerlo
                this.performImmediateScroll();
                this.scrollToTopAfterAnimation();
              }, 100);

              this.notificationService.info('Continuando con la carga de documentación pendiente.');
              this.loggingService.debug('[InscripcionProcess] Directed to step 3 for pending documentation', undefined, 'InscripcionProcessPage');
            }

            // Asegurar que los términos estén marcados como aceptados y datos necesarios
            this.inscriptionForm.patchValue({
              termsAccepted: true,
              confirmedPersonalData: false // Reset confirmation for re-completion
            });

            break;

          case 'ACTIVE':
            // NUEVO: Guardar el estado actual
            this.currentInscriptionState = InscripcionState.ACTIVE;
            // CRITICAL FIX: Para inscripciones activas, respetar navegación directa si existe
            if (this.requestedStepFromUrl && this.requestedStepFromUrl >= 1 && this.requestedStepFromUrl <= 4) {
              this.loggingService.debug('[InscripcionProcess] Navegación directa detectada - respetando paso de URL:', {
                requestedStep: this.requestedStepFromUrl,
                inscriptionState: inscription.estado
              }, 'InscripcionProcessPage');

              // Mantener el paso ya establecido desde la URL
              this.updateProgressPercentage();
            } else {
              // Si no hay navegación directa, cargar el estado guardado normalmente
              this.cargarEstadoGuardado();
            }
            break;

          default:
            // CRITICAL FIX: Para otros estados, también respetar navegación directa si existe
            if (this.requestedStepFromUrl && this.requestedStepFromUrl >= 1 && this.requestedStepFromUrl <= 4) {
              this.loggingService.debug('[InscripcionProcess] Navegación directa detectada para estado:', {
                requestedStep: this.requestedStepFromUrl,
                inscriptionState: inscription.estado
              }, 'InscripcionProcessPage');

              // Mantener el paso ya establecido desde la URL
              this.updateProgressPercentage();
            } else {
              // Si no hay navegación directa, cargar estado guardado
              this.cargarEstadoGuardado();
            }
            this.loggingService.debug(`[InscripcionProcess] Using saved state for inscription status: ${inscription.estado}`, undefined, 'InscripcionProcessPage');
        }

        // ✅ SOLUCIÓN: Forzar validación después de cargar todos los datos
        setTimeout(() => {
          this.forceValidationUpdate();
        }, 1000);
      } else {
        // Si no se encuentra la inscripción, usar estado guardado como fallback
        this.loggingService.warn('[InscripcionProcess] Inscription not found in backend, using saved state as fallback', {
          inscriptionId: this.inscriptionId
        }, 'InscripcionProcessPage');
        this.cargarEstadoGuardado();
      }
    });
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

  /**
   * ✅ SOLUCIÓN: Carga los datos específicos de la inscripción desde el backend
   * Obtiene centro de vida y circunscripciones guardadas en el backend
   */
  private cargarDatosInscripcionDesdeBackend(inscription: any): Observable<any> {
    this.loggingService.debug('[InscripcionProcess] Cargando datos específicos de inscripción desde backend:', {
      inscriptionId: this.inscriptionId,
      inscription: inscription
    }, 'InscripcionProcessPage');

    if (!this.inscriptionId) {
      return of(inscription);
    }

    // ✅ SOLUCIÓN: Usar el servicio para obtener datos específicos de la inscripción
    return this.inscriptionService.getInscriptionDetails(this.inscriptionId).pipe(
      catchError(error => {
        this.loggingService.warn('[InscripcionProcess] Error al cargar detalles de inscripción, usando datos del objeto inscription:', error, 'InscripcionProcessPage');
        // Si falla la llamada específica, usar los datos disponibles en el objeto inscription
        return of(inscription);
      }),
      tap(inscriptionDetails => {
        this.loggingService.debug('[InscripcionProcess] Detalles de inscripción recibidos:', inscriptionDetails, 'InscripcionProcessPage');

        // ✅ SOLUCIÓN: Cargar centro de vida desde los datos de la inscripción
        if (inscriptionDetails.centroDeVida || inscriptionDetails.centro_de_vida || inscriptionDetails.direccion) {
          const centroDeVida = inscriptionDetails.centroDeVida || inscriptionDetails.centro_de_vida || inscriptionDetails.direccion;

          this.centroDeVidaControl.setValue(centroDeVida);
          this.centroDeVidaControl.markAsTouched();
          this.centroDeVidaControl.updateValueAndValidity();

          // Actualizar addressData para consistencia
          this.addressData = {
            formattedAddress: centroDeVida,
            placeId: '',
            coordinates: { lat: 0, lng: 0 },
            components: {}
          };

          this.loggingService.debug('[InscripcionProcess] Centro de vida cargado desde backend:', {
            centroDeVida: centroDeVida,
            controlValid: this.centroDeVidaControl.valid
          }, 'InscripcionProcessPage');
        } else {
          // ✅ FALLBACK: Si no hay centro de vida en el backend, cargar desde perfil
          this.cargarCentroDeVidaDesdePerfilUsuario();
        }

        // ✅ SOLUCIÓN: Cargar circunscripciones desde los datos de la inscripción
        if (inscriptionDetails.circunscripciones || inscriptionDetails.selectedCircunscripciones || inscriptionDetails.preferencias) {
          const circunscripciones = inscriptionDetails.circunscripciones ||
            inscriptionDetails.selectedCircunscripciones ||
            inscriptionDetails.preferencias || [];

          // Convertir a formato esperado si es necesario
          let circunscripcionesFormateadas = [];
          if (Array.isArray(circunscripciones)) {
            circunscripcionesFormateadas = circunscripciones;
          } else if (typeof circunscripciones === 'string') {
            // Si viene como string separado por comas
            circunscripcionesFormateadas = circunscripciones.split(',').map(c => c.trim()).filter(c => c);
          }

          if (circunscripcionesFormateadas.length > 0) {
            this.selectedCircunscripcionesControl.setValue(circunscripcionesFormateadas);
            this.selectedCircunscripcionesControl.markAsTouched();
            this.selectedCircunscripcionesControl.updateValueAndValidity();

            // Actualizar selecciones internas
            this.seleccionesCircunscripciones = convertirFormatoASeleccion(circunscripcionesFormateadas);

            this.loggingService.debug('[InscripcionProcess] Circunscripciones cargadas desde backend:', {
              circunscripcionesOriginales: circunscripciones,
              circunscripcionesFormateadas: circunscripcionesFormateadas,
              seleccionesInternas: this.seleccionesCircunscripciones,
              controlValid: this.selectedCircunscripcionesControl.valid
            }, 'InscripcionProcessPage');
          }
        }

        // ✅ SOLUCIÓN: Marcar términos como aceptados si la inscripción existe
        this.inscriptionForm.patchValue({
          termsAccepted: true
        }, { emitEvent: false });

        this.loggingService.debug('[InscripcionProcess] Datos de inscripción aplicados al formulario:', {
          centroDeVida: this.centroDeVidaControl.value,
          circunscripciones: this.selectedCircunscripcionesControl.value,
          termsAccepted: this.termsAcceptedControl.value
        }, 'InscripcionProcessPage');
      })
    );
  }

  /**
   * ✅ SOLUCIÓN: Aplica los datos de inscripción obtenidos del backend al formulario
   */
  private aplicarDatosDeInscripcionAlFormulario(inscriptionDetails: any): void {
    console.log('[InscripcionProcess] 🎯 APLICANDO DATOS AL FORMULARIO:', inscriptionDetails);

    if (!inscriptionDetails) {
      console.warn('[InscripcionProcess] ⚠️ No hay datos de inscripción para aplicar');
      return;
    }

    this.loggingService.debug('[InscripcionProcess] Aplicando datos de inscripción al formulario:', inscriptionDetails, 'InscripcionProcessPage');

    // Aplicar centro de vida
    if (inscriptionDetails.centroDeVida || inscriptionDetails.centro_de_vida || inscriptionDetails.direccion) {
      const centroDeVida = inscriptionDetails.centroDeVida || inscriptionDetails.centro_de_vida || inscriptionDetails.direccion;

      this.centroDeVidaControl.setValue(centroDeVida);
      this.centroDeVidaControl.markAsTouched();
      this.centroDeVidaControl.updateValueAndValidity();

      // Actualizar addressData para consistencia
      this.addressData = {
        formattedAddress: centroDeVida,
        placeId: '',
        coordinates: { lat: 0, lng: 0 },
        components: {}
      };

      this.loggingService.debug('[InscripcionProcess] Centro de vida aplicado:', {
        centroDeVida: centroDeVida,
        controlValid: this.centroDeVidaControl.valid
      }, 'InscripcionProcessPage');
    }

    // Aplicar circunscripciones
    if (inscriptionDetails.circunscripciones || inscriptionDetails.selectedCircunscripciones || inscriptionDetails.preferencias) {
      const circunscripciones = inscriptionDetails.circunscripciones ||
        inscriptionDetails.selectedCircunscripciones ||
        inscriptionDetails.preferencias || [];

      let circunscripcionesFormateadas = [];
      if (Array.isArray(circunscripciones)) {
        circunscripcionesFormateadas = circunscripciones;
      } else if (typeof circunscripciones === 'string') {
        circunscripcionesFormateadas = circunscripciones.split(',').map(c => c.trim()).filter(c => c);
      }

      if (circunscripcionesFormateadas.length > 0) {
        this.selectedCircunscripcionesControl.setValue(circunscripcionesFormateadas);
        this.selectedCircunscripcionesControl.markAsTouched();
        this.selectedCircunscripcionesControl.updateValueAndValidity();

        // Actualizar selecciones internas
        this.seleccionesCircunscripciones = convertirFormatoASeleccion(circunscripcionesFormateadas);

        this.loggingService.debug('[InscripcionProcess] Circunscripciones aplicadas:', {
          circunscripcionesOriginales: circunscripciones,
          circunscripcionesFormateadas: circunscripcionesFormateadas,
          seleccionesInternas: this.seleccionesCircunscripciones,
          controlValid: this.selectedCircunscripcionesControl.valid
        }, 'InscripcionProcessPage');
      }
    }

    // Marcar términos como aceptados si la inscripción existe
    this.inscriptionForm.patchValue({
      termsAccepted: true
    }, { emitEvent: false });

    this.loggingService.debug('[InscripcionProcess] Datos de inscripción aplicados completamente al formulario', undefined, 'InscripcionProcessPage');
  }

  /**
   * CRITICAL FIX: Carga solo los datos del formulario sin cambiar el paso actual
   * Útil para navegación directa donde queremos mantener el paso de la URL
   */
  private cargarDatosFormulario(): void {
    if (!this.inscriptionId) {
      this.loggingService.debug('[InscripcionProcess] No inscription ID available - no form data to load', undefined, 'InscripcionProcessPage');
      return;
    }

    const savedState = this.inscriptionStateService.getInscriptionState(this.inscriptionId);
    if (savedState && savedState.formData) {
      // Cargar solo los datos del formulario, manteniendo el paso actual
      this.inscriptionForm.patchValue(savedState.formData, { emitEvent: false });

      // CRITICAL FIX: addressData no está en IInscriptionFormState, se reconstruye desde centroDeVida
      if (savedState.formData.centroDeVida) {
        // Reconstruir addressData básico desde la dirección guardada
        this.addressData = {
          formattedAddress: savedState.formData.centroDeVida,
          placeId: '',
          coordinates: { lat: 0, lng: 0 },
          components: {}
        };
      }

      this.loggingService.debug('[InscripcionProcess] Datos del formulario cargados sin cambiar paso:', {
        currentStep: this.currentStep,
        formData: savedState.formData
      }, 'InscripcionProcessPage');
    }

    // Actualizar estado de documentos y otros datos necesarios
    this.actualizarEstadoDocumentos();
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
      // CRITICAL FIX: Respetar navegación directa si existe
      if (this.requestedStepFromUrl && this.requestedStepFromUrl >= 1 && this.requestedStepFromUrl <= 4) {
        this.loggingService.debug('[InscripcionProcess] Navegación directa detectada - manteniendo paso de URL:', {
          requestedStep: this.requestedStepFromUrl,
          savedStep: savedState.currentStep
        }, 'InscripcionProcessPage');
        // No cambiar currentStep, ya fue establecido desde la URL
      } else {
        this.currentStep = Number(savedState.currentStep) || 1;
      }

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

  /**
   * CRITICAL FIX: Cargar datos del formulario sin modificar el paso actual
   * Usado para inscripciones con documentación pendiente
   */
  private cargarDatosFormularioSinPaso(): void {
    if (!this.inscriptionId) {
      this.loggingService.debug('[InscripcionProcess] No inscription ID available for form data loading', undefined, 'InscripcionProcessPage');
      return;
    }

    const savedState = this.inscriptionStateService.getInscriptionState(this.inscriptionId);
    if (savedState && savedState.formData) {
      // Solo cargar datos del formulario, NO el paso actual
      this.inscriptionForm.patchValue({
        termsAccepted: savedState.formData.termsAccepted || false,
        centroDeVida: savedState.formData.centroDeVida || '',
        selectedCircunscripciones: savedState.formData.selectedCircunscripciones || [],
        documentosCompletos: savedState.formData.documentosCompletos || false,
        confirmedPersonalData: savedState.formData.confirmedPersonalData || false
      });

      this.loggingService.debug('[InscripcionProcess] Form data loaded without changing current step', {
        currentStep: this.currentStep,
        formData: savedState.formData
      }, 'InscripcionProcessPage');
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

          // ✅ CORRECCIÓN: Forzar validación del control después de cargar desde perfil
          this.centroDeVidaControl.markAsTouched();
          this.centroDeVidaControl.updateValueAndValidity();

          // ✅ CORRECCIÓN: Actualizar addressData para consistencia
          this.addressData = {
            formattedAddress: profile.direccion,
            placeId: '',
            coordinates: { lat: 0, lng: 0 },
            components: {}
          };

          this.loggingService.debug('[InscripcionProcess] Centro de vida cargado desde perfil:', {
            direccion: profile.direccion,
            controlValid: this.centroDeVidaControl.valid,
            controlValue: this.centroDeVidaControl.value
          }, 'InscripcionProcessPage');

          // ✅ CORRECCIÓN: Forzar detección de cambios para actualizar UI
          this.cdr.detectChanges();
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

    // MEJORA: Actualizar el perfil inmediatamente cuando se selecciona una dirección
    // Esto asegura que el centro de vida se guarde incluso si el usuario no completa la inscripción
    this.actualizarPerfilConCentroDeVida();

    // ✅ SOLUCIÓN: Guardar centro de vida en la inscripción si existe
    if (this.inscriptionId) {
      this.actualizarDatosInscripcionEnBackend();
    }
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
        this.inscriptionService.clearCacheAndRefresh()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
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

  // Actualizar el perfil del usuario con el centro de vida (versión asíncrona)
  actualizarPerfilConCentroDeVidaAsync(): Observable<any> {
    const centroDeVida = this.centroDeVidaControl.value;
    if (!centroDeVida) {
      this.loggingService.warn('[InscripcionProcess] Centro de vida no proporcionado para actualizar el perfil.', undefined, 'InscripcionProcessPage');
      return of(null);
    }

    try {
      let direccionFormateada = centroDeVida.trim();

      if (direccionFormateada.length > 255) {
        direccionFormateada = direccionFormateada.substring(0, 255);
      }

      // Remove problematic characters (keeping common address components like spaces, commas, periods, degrees, hyphens)
      direccionFormateada = direccionFormateada.replace(/[^\w\s.,°º-]/g, '');

      this.loggingService.debug(`[InscripcionProcess] Actualizando perfil con centro de vida: ${direccionFormateada}`, undefined, 'InscripcionProcessPage');

      return this.profileService.getUserProfile().pipe(
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

            // CRITICAL FIX: Manejar CUIT vacío para evitar errores de validación del backend
            // El backend requiere CUIT no vacío, pero algunos usuarios pueden tener CUIT vacío
            if (profile.cuit && profile.cuit.trim() !== '') {
              dataToUpdate.cuit = profile.cuit;
            } else {
              // Si el CUIT está vacío, generar uno temporal válido basado en el DNI
              // Formato: 20 + DNI (8 dígitos) + dígito verificador
              const dni = profile.dni || '12345678';
              const tempCuit = this.generateTempCuit(dni);
              dataToUpdate.cuit = tempCuit;
              this.loggingService.warn(`[InscripcionProcess] CUIT vacío detectado, usando CUIT temporal: ${tempCuit}`, undefined, 'InscripcionProcessPage');
            }

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
          return throwError(() => error); // Propagar el error para que se maneje en finalizarInscripcion
        }),
        tap(response => {
          if (response) {
            this.notificationService.success('Centro de vida actualizado en su perfil.');
          }
        })
      );
    } catch (error) {
      console.error('[InscripcionProcess] Error inesperado al actualizar centro de vida:', error);
      return throwError(() => error);
    }
  }

  // Actualizar el perfil del usuario con el centro de vida (versión legacy para compatibilidad)
  actualizarPerfilConCentroDeVida(): void {
    this.actualizarPerfilConCentroDeVidaAsync().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        // Error ya manejado en la versión async
        return of(null);
      })
    ).subscribe();
  }

  // Manejar el evento de documentos completados desde el componente de documentos embebidos
  onDocumentosCompletados(completados: boolean): void {
    this.loggingService.debug(`[InscripcionProcess] === EVENTO DOCUMENTOS COMPLETADOS ===`, {
      completados,
      documentosCompletosControl: this.documentosCompletosControl.value,
      pasoActual: this.currentStep,
      documentationState: this.documentationState
    }, 'InscripcionProcessPage');

    // Actualizar el estado de documentación usando el servicio centralizado
    this.actualizarEstadoDocumentos();

    // ✅ CORRECCIÓN ADICIONAL: Verificar y forzar actualización si es necesario
    setTimeout(() => {
      this.verificarDocumentosObligatoriosCompletos();

      if (completados) {
        this.loggingService.debug('[InscripcionProcess] Forzando actualización de estado después de completar documentos', {
          documentationState: this.documentationState,
          allDocumentsComplete: this.documentationState?.completenessResult.allDocumentsComplete
        }, 'InscripcionProcessPage');

        // CRITICAL FIX: Eliminar cdr.detectChanges() para evitar bucles infinitos
        // Angular manejará automáticamente la detección de cambios
      }
    }, 200);
  }

  /**
   * NUEVO MÉTODO: Maneja el cambio en la aceptación de inscripción provisional
   * Actualiza el servicio centralizado cuando el usuario cambia el checkbox
   */
  onProvisionalAcceptanceChange(accepted: boolean): void {
    this.loggingService.debug(`[InscripcionProcess] Aceptación provisional cambiada: ${accepted}`, undefined, 'InscripcionProcessPage');

    // CRITICAL FIX: Verificar que el servicio esté disponible antes de actualizar
    if (this.inscriptionDocumentationService) {
      // Actualizar el servicio centralizado
      this.inscriptionDocumentationService.updateProvisionalAcceptance(accepted);

      // ✅ CRITICAL FIX: Actualizar propiedades computadas después del cambio
      this.updateComputedProperties();

      // Log adicional para debugging
      this.loggingService.debug(`[InscripcionProcess] Servicio centralizado actualizado con aceptación provisional: ${accepted}`, {
        canProceed: this.inscriptionDocumentationService.canProceedWithCurrentState(),
        documentationState: this.documentationState
      }, 'InscripcionProcessPage');
    } else {
      this.loggingService.warn('[InscripcionProcess] Servicio de documentación no disponible para actualizar aceptación provisional', undefined, 'InscripcionProcessPage');
    }
  }

  // ✅ MÉTODO AUXILIAR: Verificar si todos los documentos obligatorios están completos
  private verificarDocumentosObligatoriosCompletos(): boolean {
    if (!this.documentacionRequerida || this.documentacionRequerida.length === 0) {
      return true; // Si no hay documentos requeridos, consideramos que están completos
    }

    const documentosObligatorios = this.documentacionRequerida.filter(doc => doc.required === true);
    const documentosObligatoriosCompletos = documentosObligatorios.filter(doc => doc.completed === true);

    const todosCompletos = documentosObligatorios.length > 0 && documentosObligatoriosCompletos.length === documentosObligatorios.length;

    this.loggingService.debug('[InscripcionProcess] Verificación documentos obligatorios', {
      totalObligatorios: documentosObligatorios.length,
      completados: documentosObligatoriosCompletos.length,
      todosCompletos,
      documentosObligatorios: documentosObligatorios.map(doc => ({
        title: doc.title,
        completed: doc.completed,
        required: doc.required
      }))
    }, 'InscripcionProcessPage');

    // ✅ CORRECCIÓN ADICIONAL: Si todos los documentos obligatorios están completos,
    // forzar actualización del estado de documentación
    if (todosCompletos && this.documentationState && !this.documentationState.completenessResult.allDocumentsComplete) {
      this.loggingService.debug('[InscripcionProcess] FORZANDO actualización de estado - documentos obligatorios completos pero estado no actualizado', {
        documentationStateAllComplete: this.documentationState.completenessResult.allDocumentsComplete,
        calculatedAllComplete: todosCompletos
      }, 'InscripcionProcessPage');

      // ✅ CORRECCIÓN CRÍTICA: Forzar actualización manual del estado
      const obligatoryDocs = this.documentacionRequerida.filter(doc => doc.required === true);
      const completedObligatory = obligatoryDocs.filter(doc => doc.completed === true);

      if (completedObligatory.length === obligatoryDocs.length && obligatoryDocs.length > 0) {
        // Forzar actualización del servicio con el estado correcto
        this.inscriptionDocumentationService.updateDocumentationState(
          this.documentacionRequerida,
          this.documentosUsuario || [],
          false // No es provisional porque todos los documentos están completos
        );

        // Marcar el checkbox como completado
        this.documentosCompletosControl.setValue(true, { emitEvent: false });

        this.loggingService.debug('[InscripcionProcess] Estado forzado a completado', {
          obligatoryCount: obligatoryDocs.length,
          completedCount: completedObligatory.length
        }, 'InscripcionProcessPage');
      }
    }

    return todosCompletos;
  }

  // Actualizar el estado de los documentos en el resumen
  actualizarEstadoDocumentos(): void {
    this.loggingService.debug('[InscripcionProcess] === ACTUALIZANDO ESTADO DE DOCUMENTOS ===', {
      pasoActual: this.currentStep,
      inscriptionId: this.inscriptionId,
      documentationState: this.documentationState
    }, 'InscripcionProcessPage');

    forkJoin([
      this.documentosService.getTiposDocumento(),
      this.documentosService.getDocumentosUsuario()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([tiposDocumento, documentosUsuario]) => {
        this.loggingService.debug('[InscripcionProcess] === DATOS RECIBIDOS DEL BACKEND ===', {
          tiposDocumentoCount: tiposDocumento.length,
          documentosUsuarioCount: documentosUsuario.length,
          tiposDocumento: tiposDocumento.map(t => ({ id: t.id, nombre: t.nombre, requerido: t.requerido })),
          documentosUsuario: documentosUsuario.map(d => ({ tipoDocumentoId: d.tipoDocumentoId, nombre: d.tipoDocumento?.nombre }))
        }, 'InscripcionProcessPage');

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

        // ✅ CORRECCIÓN CRÍTICA: Actualizar el estado de completitud ANTES de actualizar el servicio centralizado
        // --- Update `completed` status based on `documentosUsuario` ---
        consolidatedDocs.forEach(requiredDoc => {
          // SIMPLIFICADO: Verificación directa para cada documento individual
          // Ya no necesitamos lógica especial para DNI consolidado porque ahora son cards separadas
          // CRITICAL FIX: Considerar documentos subidos independientemente del estado de aprobación
          const hasDocument = documentosUsuario.some(userDoc =>
            userDoc.tipoDocumento?.id === requiredDoc.tipoDocumentoId
          );
          requiredDoc.completed = hasDocument;

          // Log para debugging
          this.loggingService.debug(`[InscripcionProcess] Documento ${requiredDoc.tipoDocumentoId}: ${hasDocument ? 'SUBIDO' : 'NO SUBIDO'}`, {
            tipoDocumentoId: requiredDoc.tipoDocumentoId,
            userDocuments: documentosUsuario.filter(doc => doc.tipoDocumento?.id === requiredDoc.tipoDocumentoId)
          }, 'InscripcionProcessPage');
        });

        // 🔍 DEBUGGING: Log antes de actualizar el servicio centralizado (con estados actualizados)
        this.loggingService.debug('[InscripcionProcess] === ACTUALIZANDO SERVICIO CENTRALIZADO ===', {
          consolidatedDocsCount: consolidatedDocs.length,
          documentosUsuarioCount: documentosUsuario.length,
          provisionalAccepted: this.documentosCompletosControl.value || false,
          consolidatedDocs: consolidatedDocs.map(doc => ({
            title: doc.title,
            required: doc.required,
            completed: doc.completed,
            tipoDocumentoId: doc.tipoDocumentoId
          }))
        }, 'InscripcionProcessPage');

        // CRITICAL FIX: Asignar documentos del usuario a la propiedad del componente
        this.documentosUsuario = documentosUsuario;

        // ✅ CORRECCIÓN: Actualizar el servicio centralizado con los documentos consolidados Y SUS ESTADOS ACTUALIZADOS
        this.inscriptionDocumentationService.updateDocumentationState(
          consolidatedDocs,
          documentosUsuario,
          this.documentosCompletosControl.value || false
        );

        // ✅ CRITICAL FIX: Solo verificar documentos OBLIGATORIOS para auto-completar
        const obligatoryDocs = consolidatedDocs.filter(doc => doc.required === true);
        const allObligatoryDocsCompleted = obligatoryDocs.every(doc => doc.completed);

        // ✅ CORRECCIÓN CRÍTICA: Gestión automática del checkbox de inscripción provisional
        setTimeout(() => {
          if (allObligatoryDocsCompleted) {
            // Cuando todos los documentos obligatorios están completos:
            // 1. Marcar el checkbox como true (permite continuar)
            // 2. Actualizar el servicio para reflejar que ya no es necesaria la inscripción provisional
            this.documentosCompletosControl.setValue(true, { emitEvent: false });

            this.loggingService.debug('[InscripcionProcess] Todos los documentos obligatorios completados - actualizando estado', {
              allObligatoryDocsCompleted,
              obligatoryDocsCount: obligatoryDocs.length,
              completedObligatoryDocs: obligatoryDocs.filter(doc => doc.completed).length
            }, 'InscripcionProcessPage');

            // ✅ CORRECCIÓN ADICIONAL: Forzar actualización del servicio centralizado con documentos completados
            this.inscriptionDocumentationService.updateDocumentationState(
              consolidatedDocs, // Documentos con estados actualizados
              documentosUsuario,
              false // Ya no es provisional porque todos los documentos están completos
            );

            this.cdr.detectChanges();
          } else if (!this.documentosCompletosControl.value) {
            // Si no todos los documentos están completos y el usuario no ha aceptado inscripción provisional,
            // mantener el estado actual sin forzar cambios
            this.loggingService.debug('[InscripcionProcess] Documentos obligatorios incompletos - manteniendo estado actual', {
              allObligatoryDocsCompleted,
              obligatoryDocsCount: obligatoryDocs.length,
              completedObligatoryDocs: obligatoryDocs.filter(doc => doc.completed).length,
              provisionalAccepted: this.documentosCompletosControl.value
            }, 'InscripcionProcessPage');
          }

          // CRITICAL FIX: Forzar actualización adicional del estado para asegurar sincronización
          this.forceUpdateDocumentationState();

          // CRITICAL FIX: Forzar detección de cambios para actualizar el botón
          this.cdr.detectChanges();
          console.log('[InscripcionProcess] 🔄 Forzando detección de cambios después de actualizar documentación');
        }, 100); // ✅ Aumentar el delay para asegurar que la UI se actualice correctamente

        this.loggingService.debug('[InscripcionProcess] Documentación requerida final (con estado):', consolidatedDocs, 'InscripcionProcessPage');
        this.loggingService.debug(`[InscripcionProcess] Todos los documentos OBLIGATORIOS completos: ${allObligatoryDocsCompleted} (${obligatoryDocs.length} obligatorios de ${consolidatedDocs.length} totales)`, undefined, 'InscripcionProcessPage');

        // ✅ CRITICAL FIX: Actualizar propiedades computadas después de actualizar documentos
        this.updateComputedProperties();
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
    // ✅ UX/UI: Usar archivo sin estilos CSS inline para permitir personalización
    this.http.get('assets/terminos-y-condiciones.html', { responseType: 'text' }).pipe(
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

    // CRITICAL FIX: Esperar a que se complete la actualización del perfil antes de finalizar
    this.actualizarPerfilConCentroDeVidaAsync().pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        // CRITICAL FIX: Usar updateInscriptionStep con COMPLETED para que el backend
        // automáticamente determine el estado correcto y llame a completeInscription()
        const formData = this.inscriptionForm.value;
        const stepRequest: IInscriptionStepRequest = {
          step: InscriptionStep.COMPLETED,
          centroDeVida: formData.centroDeVida,
          selectedCircunscripciones: formData.selectedCircunscripciones,
          acceptedTerms: formData.termsAccepted,
          confirmedPersonalData: formData.confirmedPersonalData
        };

        this.loggingService.info('[InscripcionProcess] Finalizando inscripción con updateInscriptionStep', {
          inscriptionId: this.inscriptionId,
          step: 'COMPLETED',
          centroDeVida: formData.centroDeVida,
          selectedCircunscripciones: formData.selectedCircunscripciones
        }, 'InscripcionProcessPage');

        return this.inscriptionService.updateInscriptionStep(this.inscriptionId!, stepRequest);
      }),
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
          inscriptionId: this.inscriptionId
        }, 'InscripcionProcessPage');

        // Forzar refresh de inscripciones para sincronizar estado
        this.inscriptionService.refreshInscriptions();

        // Delay antes de navegar para permitir sincronización
        setTimeout(() => {
          // CRITICAL FIX: Navegar a postulaciones con parámetro para mostrar la inscripción finalizada
          this.router.navigate(['/dashboard/postulaciones'], {
            queryParams: {
              postulacionId: this.inscriptionId,
              openDetail: 'true',
              refresh: Date.now() // Forzar refresh con timestamp
            }
          });
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
   * Verifica si una circunscripción está seleccionada (para circunscripciones simples)
   */
  isCircunscripcionSelected(circunscripcion: string): boolean {
    const seleccion = this.seleccionesCircunscripciones.find(s => s.circunscripcion === circunscripcion);
    return seleccion?.esCompleta || false;
  }

  /**
   * Verifica si una circunscripción completa está seleccionada (para Segunda Circunscripción)
   */
  isCircunscripcionCompletaSelected(circunscripcion: string): boolean {
    const seleccion = this.seleccionesCircunscripciones.find(s => s.circunscripcion === circunscripcion);
    return seleccion?.esCompleta || false;
  }

  /**
   * Verifica si un departamento específico está seleccionado
   */
  isDepartamentoSelected(circunscripcion: string, departamentoId: string): boolean {
    const seleccion = this.seleccionesCircunscripciones.find(s => s.circunscripcion === circunscripcion);
    return seleccion?.departamentos?.includes(departamentoId) || false;
  }

  /**
   * Maneja el cambio de selección de circunscripción simple (Primera, Tercera, Cuarta)
   */
  onCircunscripcionChange(event: Event, circunscripcion: string): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      // Agregar circunscripción completa
      this.agregarSeleccionCircunscripcion(circunscripcion, true);
    } else {
      // Remover circunscripción
      this.removerSeleccionCircunscripcion(circunscripcion);
    }

    this.actualizarFormularioCircunscripciones();
    this.loggingService.debug(`[InscripcionProcess] Circunscripción ${checkbox.checked ? 'seleccionada' : 'deseleccionada'}: ${circunscripcion}`, undefined, 'InscripcionProcessPage');
  }

  /**
   * Maneja el cambio de selección de circunscripción completa (para Segunda Circunscripción)
   */
  onCircunscripcionCompletaChange(event: Event, circunscripcion: string): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      // Seleccionar toda la circunscripción y limpiar departamentos específicos
      this.agregarSeleccionCircunscripcion(circunscripcion, true);
    } else {
      // Remover selección completa, mantener departamentos si los hay
      const seleccionExistente = this.seleccionesCircunscripciones.find(s => s.circunscripcion === circunscripcion);
      if (seleccionExistente && seleccionExistente.departamentos && seleccionExistente.departamentos.length > 0) {
        seleccionExistente.esCompleta = false;
      } else {
        this.removerSeleccionCircunscripcion(circunscripcion);
      }
    }

    this.actualizarFormularioCircunscripciones();
    this.loggingService.debug(`[InscripcionProcess] Circunscripción completa ${checkbox.checked ? 'seleccionada' : 'deseleccionada'}: ${circunscripcion}`, undefined, 'InscripcionProcessPage');
  }

  /**
   * Maneja el cambio de selección de departamento específico
   */
  onDepartamentoChange(event: Event, circunscripcion: string, departamentoId: string): void {
    const checkbox = event.target as HTMLInputElement;

    let seleccion = this.seleccionesCircunscripciones.find(s => s.circunscripcion === circunscripcion);

    if (!seleccion) {
      seleccion = {
        circunscripcion,
        departamentos: [],
        esCompleta: false
      };
      this.seleccionesCircunscripciones.push(seleccion);
    }

    if (checkbox.checked) {
      // Agregar departamento
      if (!seleccion.departamentos) {
        seleccion.departamentos = [];
      }
      if (!seleccion.departamentos.includes(departamentoId)) {
        seleccion.departamentos.push(departamentoId);
      }
      seleccion.esCompleta = false; // No puede ser completa si se seleccionan departamentos específicos
    } else {
      // Remover departamento
      if (seleccion.departamentos) {
        const index = seleccion.departamentos.indexOf(departamentoId);
        if (index > -1) {
          seleccion.departamentos.splice(index, 1);
        }

        // Si no quedan departamentos, remover la selección completa
        if (seleccion.departamentos.length === 0) {
          this.removerSeleccionCircunscripcion(circunscripcion);
        }
      }
    }

    this.actualizarFormularioCircunscripciones();
    this.loggingService.debug(`[InscripcionProcess] Departamento ${checkbox.checked ? 'seleccionado' : 'deseleccionado'}: ${departamentoId} en ${circunscripcion}`, undefined, 'InscripcionProcessPage');
  }

  /**
   * Agrega una selección de circunscripción
   */
  private agregarSeleccionCircunscripcion(circunscripcion: string, esCompleta: boolean): void {
    const index = this.seleccionesCircunscripciones.findIndex(s => s.circunscripcion === circunscripcion);

    if (index > -1) {
      // Actualizar selección existente
      this.seleccionesCircunscripciones[index].esCompleta = esCompleta;
      if (esCompleta) {
        this.seleccionesCircunscripciones[index].departamentos = [];
      }
    } else {
      // Crear nueva selección
      this.seleccionesCircunscripciones.push({
        circunscripcion,
        esCompleta,
        departamentos: []
      });
    }
  }

  /**
   * Remueve una selección de circunscripción
   */
  private removerSeleccionCircunscripcion(circunscripcion: string): void {
    const index = this.seleccionesCircunscripciones.findIndex(s => s.circunscripcion === circunscripcion);
    if (index > -1) {
      this.seleccionesCircunscripciones.splice(index, 1);
    }
  }

  /**
   * Actualiza el formulario con las selecciones de circunscripciones
   */
  private actualizarFormularioCircunscripciones(): void {
    const valoresFormateados = convertirSeleccionAFormato(this.seleccionesCircunscripciones);
    this.selectedCircunscripcionesControl.setValue(valoresFormateados);

    // Validar selecciones
    const validacion = validarSeleccionCircunscripciones(this.seleccionesCircunscripciones);
    if (!validacion.esValida) {
      this.selectedCircunscripcionesControl.setErrors({ 'seleccionInvalida': validacion.errores });
    } else {
      this.selectedCircunscripcionesControl.setErrors(null);
    }

    // ✅ SOLUCIÓN: Actualizar datos en el backend si existe inscripción
    if (this.inscriptionId) {
      this.actualizarDatosInscripcionEnBackend();
    }
  }

  /**
   * ✅ SOLUCIÓN: Actualiza los datos de la inscripción en el backend
   * Guarda centro de vida y circunscripciones seleccionadas
   */
  private actualizarDatosInscripcionEnBackend(): void {
    if (!this.inscriptionId) {
      return;
    }

    const datosActualizados = {
      centroDeVida: this.centroDeVidaControl.value,
      circunscripciones: this.selectedCircunscripcionesControl.value
    };

    this.loggingService.debug('[InscripcionProcess] Actualizando datos de inscripción en backend:', {
      inscriptionId: this.inscriptionId,
      datos: datosActualizados
    }, 'InscripcionProcessPage');

    // Usar el servicio de inscripción para actualizar los datos
    this.inscriptionService.updateInscriptionData(this.inscriptionId, datosActualizados).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.loggingService.warn('[InscripcionProcess] Error al actualizar datos de inscripción en backend:', error, 'InscripcionProcessPage');
        // No mostrar error al usuario, es una operación en segundo plano
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.loggingService.debug('[InscripcionProcess] Datos de inscripción actualizados exitosamente en backend', undefined, 'InscripcionProcessPage');
      }
    });
  }

  /**
   * Inicializa las selecciones de circunscripciones desde el formulario
   */
  private inicializarSeleccionesCircunscripciones(): void {
    const valoresActuales = this.selectedCircunscripcionesControl.value || [];
    this.seleccionesCircunscripciones = convertirFormatoASeleccion(valoresActuales);

    // ✅ CORRECCIÓN: Forzar validación después de inicializar
    if (valoresActuales.length > 0) {
      this.selectedCircunscripcionesControl.markAsTouched();
      this.selectedCircunscripcionesControl.updateValueAndValidity();
    }

    this.loggingService.debug('[InscripcionProcess] Circunscripciones inicializadas:', {
      valoresActuales,
      seleccionesCircunscripciones: this.seleccionesCircunscripciones,
      controlValid: this.selectedCircunscripcionesControl.valid
    }, 'InscripcionProcessPage');
  }

  /**
   * ✅ SOLUCIÓN: Configura suscripciones para actualización automática de datos
   */
  private configurarSuscripcionesFormulario(): void {
    if (!this.inscriptionId) return;

    // Suscribirse a cambios en centro de vida
    this.centroDeVidaControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(1000), // Esperar 1 segundo después del último cambio
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.trim()) {
        this.loggingService.debug('[InscripcionProcess] Centro de vida cambiado, actualizando backend', { value }, 'InscripcionProcessPage');
        this.actualizarDatosInscripcionEnBackend();
      }
    });

    // Suscribirse a cambios en circunscripciones
    this.selectedCircunscripcionesControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500), // Esperar 500ms después del último cambio
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && Array.isArray(value) && value.length > 0) {
        this.loggingService.debug('[InscripcionProcess] Circunscripciones cambiadas, actualizando backend', { value }, 'InscripcionProcessPage');
        this.actualizarDatosInscripcionEnBackend();
      }
    });
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

    // CONCURRENCY FIX: Prevenir múltiples llamadas simultáneas
    if (this.isCreatingInscription) {
      this.loggingService.debug('[InscripcionProcess] Inscription creation already in progress, ignoring duplicate request', undefined, 'InscripcionProcessPage');
      return;
    }

    this.isCreatingInscription = true;
    this.loggingService.debug('[InscripcionProcess] Creating inscription when advancing to step 2 for contest:', this.contestId, 'InscripcionProcessPage');

    this.inscriptionService.createInscription(this.contestId).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('[InscripcionProcess] Error creating inscription when advancing to step 2:', error);

        // Mostrar errores específicos basados en el tipo de error
        if (error.status === 403) {
          // Período de inscripción cerrado
          const errorMessage = error.error?.message || 'El período de inscripción para este concurso ha finalizado o aún no ha comenzado.';
          this.notificationService.error(errorMessage);
        } else if (error.status === 409) {
          this.notificationService.error('La operación no pudo completarse debido a un conflicto con el estado actual del recurso.');
        } else if (error.status === 500) {
          this.notificationService.error('Error al crear la inscripción. Por favor, intente nuevamente.');
        } else if (error.message && error.message.includes('período de inscripción')) {
          // Error específico de período cerrado desde el servicio
          this.notificationService.error(error.message);
        } else {
          this.notificationService.error('Error: No se recibió un ID de inscripción válido');
        }

        // Redirigir de vuelta a la lista de concursos
        this.router.navigate(['/dashboard/concursos']);
        return of(null);
      })
    ).subscribe({
      next: (response: any) => {
        // CONCURRENCY FIX: Resetear bandera al completar exitosamente
        this.isCreatingInscription = false;

        if (response && response.id) {
          this.inscriptionId = response.id;
          this.loggingService.debug('[InscripcionProcess] Using inscription with ID:', this.inscriptionId, 'InscripcionProcessPage');

          this.showValidationErrors = false;

          // CRITICAL FIX: Avanzar al paso 2 después de crear la inscripción
          this.currentStep = 2;
          this.updateProgressPercentage();
          this.updateUrlWithCurrentStep();
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
      },
      error: () => {
        // CONCURRENCY FIX: Resetear bandera también en caso de error
        this.isCreatingInscription = false;
      }
    });
  }

  /**
   * Obtiene el ID del concurso
   */
  getContestId(): number {
    return this.contestId || 0;
  }

  /**
   * Genera un CUIT temporal válido basado en el DNI
   * Formato: 20 + DNI (8 dígitos) + dígito verificador
   */
  private generateTempCuit(dni: string): string {
    // Asegurar que el DNI tenga 8 dígitos
    const cleanDni = dni.replace(/\D/g, '').padStart(8, '0').substring(0, 8);

    // Usar prefijo 20 (persona física masculina)
    const prefix = '20';
    const cuitWithoutVerifier = prefix + cleanDni;

    // Calcular dígito verificador
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;

    for (let i = 0; i < 10; i++) {
      sum += parseInt(cuitWithoutVerifier[i]) * multipliers[i];
    }

    const remainder = sum % 11;
    let verifier: number;

    if (remainder === 0) {
      verifier = 0;
    } else if (remainder === 1) {
      verifier = 9; // Para personas físicas con prefijo 20
    } else {
      verifier = 11 - remainder;
    }

    return cuitWithoutVerifier + verifier.toString();
  }

  /**
   * ✅ SOLUCIÓN PROBLEMA 17: Implementación del método requerido por CanComponentDeactivate
   * Este método es llamado por el InscriptionDeactivateGuard para determinar si se puede navegar
   * @returns boolean | Promise<boolean> | Observable<boolean>
   */
  canDeactivate(): boolean | Promise<boolean> | Observable<boolean> {
    this.loggingService.debug('[InscripcionProcess] canDeactivate called', {
      inscriptionId: this.inscriptionId,
      currentStep: this.currentStep,
      inscriptionCompleted: this.inscriptionCompleted,
      isInternalNavigation: this.isInternalNavigation
    }, 'InscripcionProcessPage');

    // ✅ El guard maneja toda la lógica de confirmación
    // Este método solo necesita existir para cumplir con la interface
    // La lógica real está en InscriptionDeactivateGuard.canDeactivate()
    return true;
  }

  // ==========================================
  // MÉTODOS PARA DOCUMENTOS DE CONCURSO
  // ==========================================

  /**
   * Carga la disponibilidad de documentos del concurso
   */
  private loadContestDocumentAvailability(): void {
    if (!this.contestId) return;

    this.loadingDocumentAvailability = true;

    this.contestDocumentService.getDocumentAvailability(this.contestId).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingDocumentAvailability = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (availability: ContestDocumentAvailability) => {
        this.contestDocumentAvailability = availability;
        this.loggingService.debug('[InscripcionProcess] Disponibilidad de documentos cargada:', availability, 'InscripcionProcessPage');
      },
      error: (error) => {
        console.error('[InscripcionProcess] Error al cargar disponibilidad de documentos:', error);
        // No mostrar error al usuario, simplemente no mostrar los botones
        this.contestDocumentAvailability = {
          contestId: this.contestId!,
          basesAvailable: false,
          descriptionAvailable: false,
          message: 'Error al verificar disponibilidad'
        };
      }
    });
  }

  /**
   * Abre las bases del concurso en una nueva pestaña
   */
  viewContestBases(): void {
    if (!this.contestId || !this.contestDocumentAvailability?.basesAvailable) {
      this.notificationService.warning('Las bases del concurso no están disponibles en este momento.');
      return;
    }

    this.contestDocumentService.openDocumentInNewTab(this.contestId, ContestDocumentType.BASES);
    this.loggingService.debug('[InscripcionProcess] Abriendo bases del concurso', { contestId: this.contestId }, 'InscripcionProcessPage');
  }

  /**
   * Abre la descripción del puesto en una nueva pestaña
   */
  viewContestDescription(): void {
    if (!this.contestId || !this.contestDocumentAvailability?.descriptionAvailable) {
      this.notificationService.warning('La descripción del puesto no está disponible en este momento.');
      return;
    }

    this.contestDocumentService.openDocumentInNewTab(this.contestId, ContestDocumentType.DESCRIPTION);
    this.loggingService.debug('[InscripcionProcess] Abriendo descripción del puesto', { contestId: this.contestId }, 'InscripcionProcessPage');
  }

  /**
   * Verifica si hay documentos disponibles para mostrar
   */
  get hasAvailableDocuments(): boolean {
    return this.contestDocumentAvailability?.basesAvailable ||
      this.contestDocumentAvailability?.descriptionAvailable ||
      false;
  }

  /**
   * Obtiene el mensaje a mostrar cuando no hay documentos disponibles
   */
  get documentsNotAvailableMessage(): string {
    if (this.loadingDocumentAvailability) {
      return 'Verificando disponibilidad de documentos...';
    }

    if (!this.contestDocumentAvailability) {
      return 'No se pudo verificar la disponibilidad de los documentos.';
    }

    return 'Las bases y condiciones aún no se han publicado. Serán publicadas próximamente.';
  }


  /**
   * NUEVO: Determina si el usuario está actualmente en período de gracia
   * Detecta cuando ya completó la inscripción pero falta documentación
   */
  isInGracePeriod(): boolean {
    return this.currentInscriptionState === InscripcionState.COMPLETED_PENDING_DOCS;
  }

  /**
   * ✅ CORREGIDO: Obtiene mensaje contextual apropiado para el período de regularización
   * Distingue entre inscripción provisional nueva vs período de regularización activo
   */
  getGracePeriodMessage(): { title: string, description: string, isGracePeriod: boolean } {
    if (this.isInGracePeriod()) {
      return {
        title: '🚨 Período de Regularización de Documentación',
        description: 'Usted se encuentra en el período de regularización de documentación (3 días hábiles posteriores al cierre de inscripciones). Debe completar la carga de TODOS los documentos obligatorios antes del vencimiento del plazo para evitar que su inscripción sea rechazada automáticamente.',
        isGracePeriod: true
      };
    } else {
      return {
        title: '⏰ Documentación Pendiente',
        description: 'Si no puede completar toda la documentación ahora, puede proceder con una inscripción provisional. Tendrá 3 días hábiles después del cierre de inscripciones para completar la documentación pendiente.',
        isGracePeriod: false
      };
    }
  }

  /**
   * ✅ CORREGIDO: Determina si el botón "Siguiente" debe estar habilitado
   * En período de regularización, solo permite avanzar si todos los documentos están completos
   */
  canProceedFromDocumentationStep(): boolean {
    if (this.isInGracePeriod()) {
      // En período de regularización, DEBE tener todos los documentos obligatorios completados
      const allDocsComplete = this.allRequiredDocumentsUploaded();

      this.loggingService.debug('[InscripcionProcess] Validación período de regularización:', {
        isInGracePeriod: true,
        allRequiredDocumentsUploaded: allDocsComplete,
        canProceed: allDocsComplete
      }, 'InscripcionProcessPage');

      return allDocsComplete;
    } else {
      // En inscripción normal, puede proceder con documentos completos O inscripción provisional
      const canProceed = this.canProceedWithDocumentation();

      this.loggingService.debug('[InscripcionProcess] Validación inscripción normal:', {
        isInGracePeriod: false,
        canProceedWithDocumentation: canProceed
      }, 'InscripcionProcessPage');

      return canProceed;
    }
  }

  /**
   * NUEVO: Determina si debe mostrar el botón "Guardar y Salir"
   */
  shouldShowSaveAndExitButton(): boolean {
    // Mostrar cuando hay inscriptionId (proceso iniciado) y no está completado
    return !!(this.inscriptionId && this.currentStep >= 2 && this.currentStep < 5 && !this.inscriptionCompleted);
  }

  /**
   * ✅ NUEVO: Determina si el checkbox de conformidad debe estar deshabilitado y pre-marcado
   * Durante el período de regularización, el usuario ya prestó conformidad anteriormente
   */
  isProvisionalCheckboxDisabled(): boolean {
    return this.isInGracePeriod();
  }

  /**
   * ✅ NUEVO: Obtiene el texto explicativo para el checkbox de conformidad
   */
  getProvisionalCheckboxLabel(): string {
    if (this.isInGracePeriod()) {
      return 'Usted prestó conformidad para inscripción provisional al momento de inscribirse';
    } else {
      return 'Acepto proceder con inscripción provisional y completar la documentación durante el período de gracia';
    }
  }

  /**
   * ✅ NUEVO: Inicializa el estado del checkbox según el contexto
   */
  private initializeProvisionalCheckbox(): void {
    if (this.isInGracePeriod()) {
      // En período de regularización, marcar como aceptado y deshabilitar
      this.documentosCompletosControl.setValue(true);
      this.documentosCompletosControl.disable();
    }
  }

  /**
   * ✅ NUEVO: Obtiene mensaje de fecha límite específico para el período de regularización
   */
  getRegularizationDeadlineMessage(): string {
    if (this.isInGracePeriod()) {
      // TODO: Calcular fecha real basada en el cierre de inscripciones + 3 días hábiles
      return 'Fecha límite: miércoles 13/08/2025 23:59';
    }
    return '';
  }

  /**
   * NUEVO: Guarda el progreso actual y regresa al dashboard
   */
  saveAndExit(): void {
    this.guardarEstadoActual();

    if (this.isInGracePeriod()) {
      this.notificationService.info('Su progreso ha sido guardado. Recuerde completar la documentación antes del vencimiento del período de regularización.');
    } else {
      this.notificationService.info('Su progreso ha sido guardado. Puede continuar más tarde desde donde lo dejó.');
    }

    // Marcar como navegación intencional para evitar advertencias del guard
    this.markNavigationType(NavigationType.EXTERNAL_INTENTIONAL, 'save_and_exit');

    // Pequeño delay para que se procese la navegación
    setTimeout(() => {
      this.router.navigate(['/dashboard/concursos']);
    }, 500);
  }

  /**
   * Maneja la validación completa del componente final-step-validation
   */
  onFinalValidationComplete(isValid: boolean): void {
    this.loggingService.debug('[InscripcionProcess] Final validation complete:', { isValid }, 'InscripcionProcessPage');
    
    if (isValid) {
      // Marcar que todos los datos están listos para finalizar
      this.confirmedPersonalDataControl.setValue(true);
      
      // Forzar actualización de propiedades computadas
      this.updateComputedProperties();
      
      // Forzar detección de cambios
      this.cdr.detectChanges();
    }
  }

  /**
   * Maneja las actualizaciones de datos del componente de validación
   */
  onValidationDataUpdated(): void {
    this.loggingService.debug('[InscripcionProcess] Validation data updated - refreshing form data', undefined, 'InscripcionProcessPage');
    
    // Recargar datos de la inscripción desde el backend
    if (this.inscriptionId) {
      this.inscriptionService.getInscriptionDetails(this.inscriptionId).pipe(
        takeUntil(this.destroy$),
        tap(inscriptionDetails => {
          // Aplicar datos actualizados al formulario
          this.aplicarDatosDeInscripcionAlFormulario(inscriptionDetails);
          
          // Forzar validación
          setTimeout(() => {
            this.forceValidationUpdate();
          }, 200);
        }),
        catchError(error => {
          this.loggingService.error('[InscripcionProcess] Error refreshing inscription data after validation update:', error, 'InscripcionProcessPage');
          return of(null);
        })
      ).subscribe();
    }
  }

  /**
   * Maneja cambios en el centro de vida desde el componente de validación
   */
  onCentroDeVidaChanged(centroDeVida: string): void {
    this.loggingService.debug('[InscripcionProcess] Centro de vida changed from validation component:', { centroDeVida }, 'InscripcionProcessPage');
    
    // Actualizar el formulario principal
    this.centroDeVidaControl.setValue(centroDeVida);
    this.centroDeVidaControl.markAsTouched();
    this.centroDeVidaControl.updateValueAndValidity();
    
    // Actualizar addressData para consistencia
    this.addressData = {
      formattedAddress: centroDeVida,
      placeId: '',
      coordinates: { lat: 0, lng: 0 },
      components: {}
    };
    
    // Forzar actualización de propiedades computadas
    this.updateComputedProperties();
    this.cdr.detectChanges();
  }

  /**
   * Maneja cambios en las circunscripciones desde el componente de validación
   */
  onCircunscripcionesChanged(circunscripciones: string[]): void {
    this.loggingService.debug('[InscripcionProcess] Circunscripciones changed from validation component:', { circunscripciones }, 'InscripcionProcessPage');
    
    // Actualizar el formulario principal
    this.selectedCircunscripcionesControl.setValue(circunscripciones);
    this.selectedCircunscripcionesControl.markAsTouched();
    this.selectedCircunscripcionesControl.updateValueAndValidity();
    
    // Actualizar selecciones internas
    this.seleccionesCircunscripciones = convertirFormatoASeleccion(circunscripciones);
    
    // Forzar actualización de propiedades computadas
    this.updateComputedProperties();
    this.cdr.detectChanges();
  }
}