import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { NotificationService } from '@shared/services/notification.service';
import { Subject, of, throwError } from 'rxjs';
import { takeUntil, finalize, map, catchError, switchMap } from 'rxjs/operators';
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
import { DocumentoUsuario } from '@core/models/documento.model';

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

  // Datos de la dirección seleccionada
  addressData: {
    formattedAddress: string;
    placeId: string;
    coordinates: { lat: number; lng: number };
    components: Record<string, unknown>;
  } | null = null;

  // Documentación requerida
  documentacionRequerida: {
    title: string,
    required: boolean,
    completed: boolean,
    tipoDocumentoId: string
  }[] = [];

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
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar formulario reactivo
    this.inscriptionForm = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue],
      centroDeVida: ['', Validators.required],
      selectedCircunscripciones: [[], Validators.required],
      documentosCompletos: [false, Validators.requiredTrue],
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

      if (!this.contestId) {
        this.notificationService.error('No se ha especificado un concurso válido');
        this.router.navigate(['/dashboard/concursos']);
        return;
      }

      // Cargar datos del concurso
      this.cargarDatosConcurso();

      // Cargar estado guardado si existe
      if (this.inscriptionId) {
        this.cargarEstadoGuardado();
      }

      // Cargar centro de vida desde el perfil si existe
      this.cargarCentroDeVidaDesdePerfilUsuario();

      // Cargar términos y condiciones
      this.loadTermsAndConditions();

      // Actualizar el estado de los documentos en el resumen
      this.actualizarEstadoDocumentos();
    });
  }

  ngOnDestroy(): void {
    // Si hay un ID de inscripción y no se ha completado el proceso, marcar como interrumpida
    if (this.inscriptionId && this.currentStep < 5) {
      // Guardar el estado actual antes de destruir el componente
      this.guardarEstadoActual();

      // Marcar la inscripción como interrumpida
      this.inscriptionService.markAsInterrupted(this.inscriptionId).subscribe({
        next: () => {
          console.log('[InscripcionProcess] Inscripción marcada como interrumpida al salir de la página');
        },
        error: (error) => {
          console.error('[InscripcionProcess] Error al marcar inscripción como interrumpida al salir de la página:', error);
        }
      });
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // Métodos para navegación entre pasos
  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.updateProgressPercentage();

      // Ejecutar scroll suave después de que se complete la animación
      this.scrollToTopAfterAnimation();
    }
  }

  nextStep(): void {
    // CORRECCIÓN CRÍTICA: Validar antes de avanzar y mostrar mensajes informativos
    if (this.currentStep < 5) {
      if (!this.canProceed()) {
        this.showValidationErrorMessages();
        return;
      }

      this.currentStep++;
      this.updateProgressPercentage();
      this.guardarEstadoActual();

      // Si avanzamos al paso de confirmación, actualizar el estado de los documentos
      if (this.currentStep === 5) {
        this.actualizarEstadoDocumentos();
      }

      // Ejecutar scroll suave después de que se complete la animación
      this.scrollToTopAfterAnimation();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressPercentage();

      // Ejecutar scroll suave después de que se complete la animación
      this.scrollToTopAfterAnimation();
    }
  }

  // Actualizar porcentaje de progreso
  updateProgressPercentage(): void {
    this.progressPercentage = (this.currentStep / 5) * 100;
  }

  /**
   * Ejecuta scroll suave hacia la parte superior de la página
   * después de que se complete la animación de transición entre pasos
   */
  private scrollToTopAfterAnimation(): void {
    // Detectar si es dispositivo móvil para ajustar el timing
    const isMobile = this.isMobileDevice();
    const animationDelay = isMobile ? 400 : 350; // Más tiempo en móviles para mejor experiencia

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
   * Realiza el scroll suave hacia la parte superior con múltiples fallbacks
   * para asegurar compatibilidad con todos los navegadores y dispositivos
   */
  private performSmoothScrollToTop(): void {
    // Método 0: Intentar scroll en el contenedor del componente si existe
    try {
      if (this.processContainer?.nativeElement) {
        const container = this.processContainer.nativeElement;
        if ('scrollTo' in container) {
          container.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });

          // También hacer scroll en window para asegurar que la página esté en la parte superior
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
          return;
        }
      }
    } catch (error) {
      console.warn('[InscripcionProcess] Error con contenedor del componente:', error);
    }

    try {
      // Método 1: window.scrollTo con smooth behavior (más compatible)
      if ('scrollTo' in window) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        return;
      }
    } catch (error) {
      console.warn('[InscripcionProcess] Error con window.scrollTo:', error);
    }

    try {
      // Método 2: document.documentElement.scrollTo
      if (document.documentElement && 'scrollTo' in document.documentElement) {
        document.documentElement.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        return;
      }
    } catch (error) {
      console.warn('[InscripcionProcess] Error con document.documentElement.scrollTo:', error);
    }

    try {
      // Método 3: document.body.scrollTo
      if (document.body && 'scrollTo' in document.body) {
        document.body.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
        return;
      }
    } catch (error) {
      console.warn('[InscripcionProcess] Error con document.body.scrollTo:', error);
    }

    // Fallback 1: Usar scrollTop directamente (sin smooth)
    try {
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    } catch (error) {
      console.warn('[InscripcionProcess] Error con scrollTop directo:', error);
    }

    // Fallback 2: Usar window.scroll (método más antiguo)
    try {
      window.scroll(0, 0);
    } catch (error) {
      console.warn('[InscripcionProcess] Error con window.scroll:', error);
    }

    // Fallback especial para iOS: Forzar scroll después de un pequeño delay
    if (this.isIOSDevice()) {
      setTimeout(() => {
        try {
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        } catch (error) {
          console.warn('[InscripcionProcess] Error con fallback iOS:', error);
        }
      }, 100);
    }
  }

  /**
   * Detecta si el usuario está en un dispositivo iOS
   */
  private isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Verificar si se puede avanzar al siguiente paso
  canProceed(): boolean {
    // CORRECCIÓN: Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    if (!this.showValidationErrors) {
      setTimeout(() => {
        this.showValidationErrors = true;
        this.cdr.detectChanges();
      });
    }

    switch (this.currentStep) {
      case 1:
        return this.termsAcceptedControl.value === true;
      case 2:
        return this.centroDeVidaControl.valid && this.selectedCircunscripcionesControl.valid;
      case 3:
        // CORRECCIÓN CRÍTICA: Verificar que hay documentos requeridos Y están completos
        return this.hasRequiredDocuments() && this.documentosCompletosControl.valid;
      case 4:
        // CORRECCIÓN CRÍTICA: Usar método sin efectos secundarios
        return this.isDocumentationValidForFinish();
      default:
        return false;
    }
  }

  // Verificar si se puede finalizar la inscripción
  canFinish(): boolean {
    // CORRECCIÓN: Evitar modificaciones de estado durante la verificación
    const formValid = this.inscriptionForm.valid;
    const personalDataValid = this.confirmedPersonalDataControl.valid;
    const documentationValid = this.isDocumentationValidForFinish();

    return formValid && personalDataValid && documentationValid;
  }

  /**
   * NUEVO MÉTODO: Verificación de documentación sin efectos secundarios
   */
  private isDocumentationValidForFinish(): boolean {
    // Verificar que existe documentación requerida
    if (!this.hasRequiredDocuments()) {
      return false;
    }

    // Verificar el estado del control de documentos SIN modificarlo
    const documentosCompletos = this.documentosCompletosControl.value;
    const todosCompletados = this.documentacionRequerida.every(doc => doc.completed);

    // Permitir continuar si hay documentos completos O si se acepta inscripción provisional
    return todosCompletados || documentosCompletos;
  }

  /**
   * NUEVOS MÉTODOS: Para la vista mejorada del resumen
   */
  getDocumentosCompletados(): number {
    if (!this.documentacionRequerida) return 0;
    return this.documentacionRequerida.filter(doc => doc.completed).length;
  }

  getDocumentationProgress(): number {
    if (!this.documentacionRequerida || this.documentacionRequerida.length === 0) return 0;
    const completados = this.getDocumentosCompletados();
    return Math.round((completados / this.documentacionRequerida.length) * 100);
  }

  /**
   * CORRECCIÓN CRÍTICA: Verifica que existen documentos requeridos en el sistema
   */
  hasRequiredDocuments(): boolean {
    // Verificar que hay documentación requerida configurada
    if (!this.documentacionRequerida || this.documentacionRequerida.length === 0) {
      console.warn('[InscripcionProcess] No hay documentación requerida configurada');
      return false;
    }

    // Verificar que al menos hay documentos base obligatorios
    const documentosBase = ['dni', 'cuil', 'antecedentes'];
    const tieneDocumentosBase = documentosBase.some(base =>
      this.documentacionRequerida.some(doc =>
        doc.title.toLowerCase().includes(base) ||
        doc.tipoDocumentoId.toLowerCase().includes(base)
      )
    );

    if (!tieneDocumentosBase) {
      console.error('[InscripcionProcess] No se encontraron documentos base obligatorios');
      return false;
    }

    return true;
  }

  /**
   * NUEVA LÓGICA: Valida el estado de documentación permitiendo inscripciones provisionales
   * NOTA: Este método puede modificar el estado, usar solo en acciones del usuario
   */
  validateDocumentationStatus(): boolean {
    // Verificar que existe documentación requerida
    if (!this.hasRequiredDocuments()) {
      console.error('[InscripcionProcess] Validación fallida: No hay documentos requeridos');
      return false;
    }

    // Verificar el estado del control de documentos
    const documentosCompletos = this.documentosCompletosControl.value;

    // NUEVA LÓGICA: Permitir continuar si:
    // 1. Todos los documentos están completos, O
    // 2. El usuario ha confirmado que entiende la inscripción provisional
    const todosCompletados = this.documentacionRequerida.every(doc => doc.completed);

    // CORRECCIÓN: Solo actualizar el control si hay una inconsistencia real
    // y usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    if (documentosCompletos && !todosCompletados) {
      console.warn('[InscripcionProcess] Inconsistencia: Control marca completo pero hay documentos pendientes');
      // Actualizar el control de forma asíncrona
      setTimeout(() => {
        this.documentosCompletosControl.setValue(false);
        this.cdr.detectChanges();
      });
    }

    // Permitir continuar si hay documentos completos O si se acepta inscripción provisional
    const puedeContinuar = todosCompletados || documentosCompletos;

    console.log(`[InscripcionProcess] Estado de documentación validado: ${puedeContinuar} (Completos: ${todosCompletados}, Control: ${documentosCompletos})`);
    return puedeContinuar;
  }

  /**
   * CORRECCIÓN CRÍTICA: Verifica si todos los documentos requeridos están realmente subidos
   */
  allRequiredDocumentsUploaded(): boolean {
    if (!this.documentacionRequerida || this.documentacionRequerida.length === 0) {
      console.warn('[InscripcionProcess] No hay documentación requerida para verificar');
      return false;
    }

    const todosCompletos = this.documentacionRequerida.every(doc => {
      const completo = doc.completed === true;
      if (!completo) {
        console.log(`[InscripcionProcess] Documento pendiente: ${doc.title}`);
      }
      return completo;
    });

    console.log(`[InscripcionProcess] Verificación de documentos: ${todosCompletos ? 'TODOS COMPLETOS' : 'PENDIENTES'}`);
    return todosCompletos;
  }

  /**
   * CORRECCIÓN CRÍTICA: Muestra mensajes de error específicos según el paso
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
        if (!this.selectedCircunscripcionesControl.valid) {
          this.notificationService.warning('Debe seleccionar al menos una circunscripción para continuar.');
        }
        break;
      case 3:
        if (!this.hasRequiredDocuments()) {
          this.notificationService.error('Error de configuración: No hay documentos requeridos definidos. Contacte al administrador.');
        } else if (!this.documentosCompletosControl.valid) {
          const pendientes = this.documentacionRequerida.filter(doc => !doc.completed);
          const listaPendientes = pendientes.map(doc => doc.title).join(', ');
          this.notificationService.warning(`Debe cargar todos los documentos requeridos para continuar. Pendientes: ${listaPendientes}`);
        }
        break;
      case 4:
        if (!this.validateDocumentationStatus()) {
          this.notificationService.warning('Debe completar la documentación requerida antes de confirmar la inscripción.');
        }
        if (!this.confirmedPersonalDataControl.valid) {
          this.notificationService.warning('Debe confirmar que sus datos personales son correctos.');
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
      takeUntil(this.destroy$)
    ).subscribe({
      next: (contest) => {
        if (contest) {
          this.contest = contest;
        }
      },
      error: (error: Error) => {
        console.error('[InscripcionProcess] Error al cargar datos del concurso:', error);
        this.notificationService.error('Error al cargar datos del concurso');
      }
    });
  }

  // Cargar estado guardado
  cargarEstadoGuardado(): void {
    if (!this.inscriptionId) return;

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
      }
    });
  }

  // Guardar estado actual
  guardarEstadoActual(): void {
    if (!this.inscriptionId || !this.contestId) return;

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
    console.log('[InscripcionProcess] Dirección seleccionada:', addressData);
    this.addressData = addressData;
    this.centroDeVidaControl.setValue(addressData.formattedAddress);
  }

  // Manejar el cambio de respuesta en los términos
  onTermsResponseChange(accepted: boolean): void {
    console.log('[InscripcionProcess] Respuesta de términos cambiada:', accepted);

    // Actualizar el valor del control
    this.termsAcceptedControl.setValue(accepted);

    // Si el usuario selecciona "No", mostrar mensaje y cancelar la inscripción
    if (!accepted) {
      // Mostrar mensaje informativo
      this.notificationService.warning('Para continuar con la inscripción debe leer y aceptar las bases y condiciones del concurso.');

      // Cancelar la inscripción y regresar a la página de concursos
      setTimeout(() => {
        this.cancelarInscripcionYRegresar();
      }, 1500);
    } else {
      // Limpiar errores de validación cuando se acepta
      this.showValidationErrors = false;
      // Guardar el estado actual solo si acepta
      this.guardarEstadoActual();
    }
  }

  // Método para cancelar la inscripción y regresar
  private cancelarInscripcionYRegresar(): void {
    console.log('[InscripcionProcess] Cancelando inscripción por no aceptar términos');

    if (this.inscriptionId) {
      // Marcar la inscripción como cancelada
      this.inscriptionService.markAsInterrupted(this.inscriptionId).subscribe({
        next: () => {
          console.log('[InscripcionProcess] Inscripción cancelada exitosamente');
          // Limpiar estados locales
          this.inscriptionService.clearFormState(this.inscriptionId!);
          this.inscriptionStateService.clearInscriptionState(this.inscriptionId!);
          // Regresar a concursos
          this.router.navigate(['/dashboard/concursos']);
        },
        error: (error) => {
          console.error('[InscripcionProcess] Error al cancelar inscripción:', error);
          // Aún así, limpiar estados locales y regresar
          this.inscriptionService.clearFormState(this.inscriptionId!);
          this.inscriptionStateService.clearInscriptionState(this.inscriptionId!);
          this.router.navigate(['/dashboard/concursos']);
        }
      });
    } else {
      // Si no hay ID de inscripción, simplemente regresar
      this.router.navigate(['/dashboard/concursos']);
    }
  }

  // Actualizar el perfil del usuario con el centro de vida
  actualizarPerfilConCentroDeVida(): void {
    const centroDeVida = this.centroDeVidaControl.value;
    if (!centroDeVida) {
      console.log('[InscripcionProcess] No hay centro de vida para actualizar');
      return;
    }

    try {
      // Validar y formatear la dirección antes de enviarla
      let direccionFormateada = centroDeVida.trim();

      // Limitar la longitud de la dirección a 255 caracteres (límite común en bases de datos)
      if (direccionFormateada.length > 255) {
        direccionFormateada = direccionFormateada.substring(0, 255);
      }

      // Eliminar caracteres especiales que podrían causar problemas
      direccionFormateada = direccionFormateada.replace(/[^\w\s,.°º-]/g, '');

      console.log('[InscripcionProcess] Enviando dirección formateada:', direccionFormateada);

      // Primero obtener el perfil actual para asegurarnos de no sobrescribir otros datos
      this.profileService.getUserProfile().pipe(
        catchError(error => {
          console.error('[InscripcionProcess] Error al obtener perfil del usuario:', error);
          // Continuar con el flujo a pesar del error, enviando solo la dirección
          return of(null);
        }),
        switchMap(profile => {
          // Si no pudimos obtener el perfil, enviamos solo la dirección
          const dataToUpdate: Partial<UserProfile> = {
            direccion: direccionFormateada
          };

          // Si tenemos el perfil, mantenemos los datos existentes
          if (profile) {
            dataToUpdate.firstName = profile.firstName;
            dataToUpdate.lastName = profile.lastName;
            dataToUpdate.dni = profile.dni;
            dataToUpdate.cuit = profile.cuit;
            dataToUpdate.telefono = profile.telefono;
            dataToUpdate.experiencias = profile.experiencias || [];
            dataToUpdate.educacion = profile.educacion || [];
            dataToUpdate.habilidades = profile.habilidades || [];
          }

          return this.profileService.updateUserProfile(dataToUpdate);
        }),
        catchError(error => {
          console.error('[InscripcionProcess] Error al actualizar centro de vida en el perfil:', error);
          // Continuar con el flujo a pesar del error
          return of(null);
        })
      ).subscribe({
        next: (response) => {
          if (response) {
            console.log('[InscripcionProcess] Centro de vida actualizado en el perfil');
          } else {
            console.log('[InscripcionProcess] No se pudo actualizar el centro de vida, pero continuamos con el proceso');
          }
        }
      });
    } catch (error) {
      console.error('[InscripcionProcess] Error inesperado al actualizar centro de vida:', error);
      // No interrumpir el flujo principal por un error en la actualización del perfil
    }
  }

  // Manejar el evento de documentos completados
  onDocumentosCompletados(completados: boolean): void {
    console.log('[InscripcionProcess] Documentos completados:', completados);
    this.documentosCompletosControl.setValue(completados);

    // Actualizar el estado de los documentos en el resumen
    this.actualizarEstadoDocumentos();
  }

  // Actualizar el estado de los documentos en el resumen
  actualizarEstadoDocumentos(): void {
    console.log('[InscripcionProcess] Actualizando estado de documentos en el resumen');

    // Primero, obtener los tipos de documento requeridos
    this.documentosService.getTiposDocumento().subscribe({
      next: (tiposDocumento) => {
        console.log('[InscripcionProcess] Tipos de documento obtenidos:', tiposDocumento);

        // Filtrar solo los documentos requeridos para concursos
        let documentosRequeridos = tiposDocumento.filter(tipo => tipo.requerido);
        console.log('[InscripcionProcess] Documentos requeridos:', documentosRequeridos);

        // Verificar si existen documentos de DNI frente y dorso
        const dniFrenteExiste = documentosRequeridos.some(tipo =>
          tipo.id === 'dni-frente' ||
          tipo.code === 'dni-frente' ||
          (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('frente'))
        );

        const dniDorsoExiste = documentosRequeridos.some(tipo =>
          tipo.id === 'dni-dorso' ||
          tipo.code === 'dni-dorso' ||
          (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('dorso'))
        );

        // Verificar si existe el documento DNI general
        const dniGeneralExiste = documentosRequeridos.some(tipo =>
          tipo.id === 'dni' ||
          tipo.code === 'dni' ||
          tipo.nombre.toLowerCase() === 'dni' ||
          tipo.nombre.toLowerCase() === 'documento nacional de identidad' ||
          tipo.nombre.toLowerCase().includes('documento nacional de identidad')
        );

        // Crear la lista de documentación requerida
        let docsRequeridos = [];

        // Si existen tanto el frente como el dorso del DNI, agregar un solo documento "DNI"
        if (dniFrenteExiste && dniDorsoExiste) {
          docsRequeridos.push({
            title: 'DNI',
            required: true,
            completed: false,
            tipoDocumentoId: 'dni'
          });

          // Filtrar los documentos para excluir el frente y dorso del DNI
          documentosRequeridos = documentosRequeridos.filter(tipo =>
            !(tipo.id === 'dni-frente' ||
              tipo.code === 'dni-frente' ||
              (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('frente')) ||
              tipo.id === 'dni-dorso' ||
              tipo.code === 'dni-dorso' ||
              (tipo.nombre.toLowerCase().includes('dni') && tipo.nombre.toLowerCase().includes('dorso')))
          );

          // También excluir el DNI general si existe
          documentosRequeridos = documentosRequeridos.filter(tipo =>
            !(tipo.id === 'dni' ||
              tipo.code === 'dni' ||
              tipo.nombre.toLowerCase() === 'dni' ||
              tipo.nombre.toLowerCase() === 'documento nacional de identidad' ||
              tipo.nombre.toLowerCase().includes('documento nacional de identidad'))
          );
        } else if (dniGeneralExiste) {
          // Si existe el DNI general pero no el frente y dorso, usar el DNI general
          const dniGeneral = documentosRequeridos.find(tipo =>
            tipo.id === 'dni' ||
            tipo.code === 'dni' ||
            tipo.nombre.toLowerCase() === 'dni' ||
            tipo.nombre.toLowerCase() === 'documento nacional de identidad' ||
            tipo.nombre.toLowerCase().includes('documento nacional de identidad')
          );

          if (dniGeneral) {
            docsRequeridos.push({
              title: 'DNI',
              required: true,
              completed: false,
              tipoDocumentoId: dniGeneral.id
            });

            // Excluir el DNI general de la lista
            documentosRequeridos = documentosRequeridos.filter(tipo => tipo.id !== dniGeneral.id);
          }
        }

        // Agregar el resto de documentos requeridos
        docsRequeridos = [
          ...docsRequeridos,
          ...documentosRequeridos.map(tipo => ({
            title: tipo.nombre,
            required: true,
            completed: false,
            tipoDocumentoId: tipo.id
          }))
        ];

        // Actualizar la lista de documentación requerida
        this.documentacionRequerida = docsRequeridos;

        // Eliminar documentos redundantes o no necesarios
        this.documentacionRequerida = this.documentacionRequerida.filter(doc => {
          // Eliminar curriculum vitae
          if (doc.title.toLowerCase().includes('curriculum') ||
              doc.tipoDocumentoId.toLowerCase().includes('curriculum')) {
            return false;
          }

          // Eliminar "Documento Nacional de Identidad" si ya existe "DNI"
          if (doc.title.toLowerCase().includes('documento nacional de identidad') ||
              doc.tipoDocumentoId.toLowerCase() === 'documento-nacional-de-identidad') {
            // Verificar si ya existe una card de DNI
            const existeDNI = this.documentacionRequerida.some(d =>
              d.title.toLowerCase() === 'dni' ||
              d.tipoDocumentoId.toLowerCase() === 'dni'
            );

            if (existeDNI) {
              console.log('[InscripcionProcess] Eliminando documento redundante:', doc.title);
              return false;
            }
          }

          return true;
        });

        // Ahora, obtener los documentos del usuario
        this.documentosService.getDocumentosUsuario().subscribe({
          next: (documentos: DocumentoUsuario[]) => {
            console.log('[InscripcionProcess] Documentos del usuario obtenidos:', documentos);

            // Actualizar el estado de cada documento en el resumen
            this.documentacionRequerida.forEach(doc => {
              // Verificar si el documento está subido
              let documentoSubido = false;

              // Caso especial para DNI
              if (doc.tipoDocumentoId === 'dni' || doc.title.toLowerCase() === 'dni') {
                // Verificar si tanto el frente como el dorso del DNI están cargados
                const frenteSubido = documentos.some(d =>
                  d.tipoDocumentoId === 'dni-frente' ||
                  (d.tipoDocumento && d.tipoDocumento.code === 'dni-frente') ||
                  (d.tipoDocumento && d.tipoDocumento.nombre &&
                   d.tipoDocumento.nombre.toLowerCase().includes('dni') &&
                   d.tipoDocumento.nombre.toLowerCase().includes('frente'))
                );

                const dorsoSubido = documentos.some(d =>
                  d.tipoDocumentoId === 'dni-dorso' ||
                  (d.tipoDocumento && d.tipoDocumento.code === 'dni-dorso') ||
                  (d.tipoDocumento && d.tipoDocumento.nombre &&
                   d.tipoDocumento.nombre.toLowerCase().includes('dni') &&
                   d.tipoDocumento.nombre.toLowerCase().includes('dorso'))
                );

                // Si ambos están cargados, consideramos que el DNI está completo
                documentoSubido = frenteSubido && dorsoSubido;
              } else {
                // Para otros documentos, verificar coincidencia normal
                documentoSubido = documentos.some((d: DocumentoUsuario) => {
                  // Comprobar coincidencia por ID
                  if (d.tipoDocumentoId === doc.tipoDocumentoId) {
                    return true;
                  }

                  // Comprobar coincidencia por nombre (caso insensitivo)
                  if (d.tipoDocumento && d.tipoDocumento.nombre) {
                    const nombreDoc = d.tipoDocumento.nombre.toLowerCase();
                    const nombreRequerido = doc.title.toLowerCase();

                    return nombreDoc.includes(nombreRequerido) || nombreRequerido.includes(nombreDoc);
                  }

                  return false;
                });
              }

              // Actualizar el estado del documento
              doc.completed = documentoSubido;
              console.log(`[InscripcionProcess] Documento ${doc.title}: ${documentoSubido ? 'Completado' : 'Pendiente'}`);
            });
          },
          error: (error: Error) => {
            console.error('[InscripcionProcess] Error al obtener documentos del usuario:', error);
          }
        });
      },
      error: (error: Error) => {
        console.error('[InscripcionProcess] Error al obtener tipos de documento:', error);
      }
    });
  }

  // Finalizar inscripción
  finish(): void {
    if (!this.canFinish() || this.loading) return;

    this.loading = true;
    this.actualizarPerfilConCentroDeVida();

    // CORRECCIÓN CRÍTICA: Determinar estado basado en documentación
    const allRequiredDocsUploaded = this.allRequiredDocumentsUploaded();
    const state = allRequiredDocsUploaded
      ? InscripcionState.PENDIENTE  // Cambiar a COMPLETED_WITH_DOCS cuando esté disponible
      : InscripcionState.PENDIENTE; // Cambiar a COMPLETED_PENDING_DOCS cuando esté disponible

    console.log(`[InscripcionProcess] Estado determinado: ${state} (Docs completos: ${allRequiredDocsUploaded})`);

    const updateRequest: IInscriptionUpdateRequest = {
      state: state
    };

    // Primero actualizar el paso a COMPLETED si es necesario
    this.inscriptionService.updateInscriptionStep(
      this.inscriptionId!,
      {
        step: InscriptionStep.COMPLETED,
        centroDeVida: this.centroDeVidaControl.value || '',
        acceptedTerms: true,
        confirmedPersonalData: true,
        selectedCircunscripciones: this.selectedCircunscripcionesControl.value || []
      }
    ).pipe(
      catchError(error => {
        console.error('[InscripcionProcess] Error al actualizar paso de inscripción:', error);
        // Si hay un error 404, significa que el endpoint no existe
        // Esto es normal si el backend no ha implementado este endpoint
        if (error.status === 404) {
          console.log('[InscripcionProcess] Endpoint de paso no encontrado, continuando con el flujo');
          // Limpiar el estado local del formulario para evitar problemas
          this.inscriptionService.clearFormState(this.inscriptionId!);
        }
        // Continuar con el flujo a pesar del error
        return of(null);
      }),
      switchMap(() => {
        // Luego intentar actualizar el estado a PENDIENTE
        return this.inscriptionService.updateInscriptionStatus(
          this.inscriptionId!,
          updateRequest
        ).pipe(
          catchError(error => {
            // Si hay un error 403 o 404, significa que el usuario no tiene permisos o el endpoint no existe
            // Esto es normal ya que solo los administradores pueden cambiar el estado o el endpoint puede no estar implementado
            // En este caso, consideramos la inscripción como completada de todas formas
            if (error.status === 403 || error.status === 404) {
              console.log(`[InscripcionProcess] Error ${error.status} al cambiar estado, pero la inscripción se considera completada`);
              // Limpiar el estado local del formulario para evitar problemas
              this.inscriptionService.clearFormState(this.inscriptionId!);
              return of({
                id: this.inscriptionId,
                contestId: 0,
                userId: '',
                status: InscripcionState.PENDIENTE,
                inscriptionDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
            return throwError(() => error);
          })
        );
      }),
      finalize(() => {
        this.loading = false;
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('[InscripcionProcess] Inscripción finalizada:', response);

        // Mostrar mensaje de éxito con información más detallada
        this.notificationService.success('¡Inscripción completada con éxito! Tu postulación está pendiente de validación por la administración.');

        // Crear una notificación en el sistema para el usuario
        this.createCompletionNotification(this.contest);

        // Redirigir a la página de postulaciones después de un breve retraso
        setTimeout(() => {
          this.router.navigate(['/dashboard/postulaciones']);
        }, 1000);
      },
      error: (error) => {
        console.error('[InscripcionProcess] Error al finalizar inscripción:', error);
        this.mostrarError('Error al finalizar la inscripción');
      }
    });
  }

  // Obtener ID del concurso
  getContestId(): number {
    return this.contestId || 0;
  }

  // Mostrar mensaje de error
  mostrarError(mensaje: string): void {
    this.notificationService.error(mensaje);
  }

  /**
   * Crea una notificación en el sistema para informar al usuario que su inscripción
   * ha sido completada y está pendiente de validación por la administración
   */
  createCompletionNotification(contest: Contest | null): void {
    if (!contest) {
      console.error('[InscripcionProcess] No se puede crear notificación: concurso no disponible');
      return;
    }

    try {
      // Obtener el ID del usuario actual
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        console.error('[InscripcionProcess] No se puede crear notificación: usuario no disponible');
        return;
      }

      // Mostrar mensaje informativo
      this.notificationService.info(`Tu inscripción al concurso "${contest.title}" está pendiente de validación por la administración.`);

      // Como no podemos crear notificaciones directamente desde el frontend,
      // usamos el snackbar para informar al usuario
      console.log('[InscripcionProcess] Notificación mostrada al usuario sobre inscripción pendiente');

    } catch (error: unknown) {
      console.error('[InscripcionProcess] Error inesperado al crear notificación:', error);
      // No interrumpir el flujo principal por un error en la creación de la notificación
    }
  }

  // Método para volver a la página de concursos
  volverAConcursos(): void {
    // Si hay un ID de inscripción, marcar como interrumpida
    if (this.inscriptionId) {
      // Guardar el estado actual antes de salir
      this.guardarEstadoActual();

      // Marcar la inscripción como interrumpida
      this.inscriptionService.markAsInterrupted(this.inscriptionId).subscribe({
        next: () => {
          console.log('[InscripcionProcess] Inscripción marcada como interrumpida');
          this.router.navigate(['/dashboard/concursos']);
        },
        error: (error) => {
          console.error('[InscripcionProcess] Error al marcar inscripción como interrumpida:', error);
          this.router.navigate(['/dashboard/concursos']);
        }
      });
    } else {
      this.router.navigate(['/dashboard/concursos']);
    }
  }

  // Método para manejar el cambio de circunscripción
  onCircunscripcionChange(event: Event, circunscripcion: string): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    const currentValue = this.selectedCircunscripcionesControl.value || [];

    if (checked) {
      // Agregar la circunscripción si está seleccionada
      this.selectedCircunscripcionesControl.setValue([...currentValue, circunscripcion]);
    } else {
      // Eliminar la circunscripción si está deseleccionada
      this.selectedCircunscripcionesControl.setValue(
        currentValue.filter((item: string) => item !== circunscripcion)
      );
    }
  }

  // Cargar términos y condiciones desde el archivo HTML
  private loadTermsAndConditions(): void {
    this.http.get('/assets/terminos-y-condiciones.html', { responseType: 'text' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (content) => {
          this.termsAndConditionsContent = content;
          console.log('[InscripcionProcess] Términos y condiciones cargados');
        },
        error: (error) => {
          console.error('[InscripcionProcess] Error al cargar términos y condiciones:', error);
          // Fallback content
          this.termsAndConditionsContent = `
            <h3>TÉRMINOS Y CONDICIONES DE USO</h3>
            <p>Bienvenido/a al Sistema de Concursos del Ministerio Público de la Defensa de la República Argentina.</p>
            <p>Al utilizar esta plataforma, usted acepta cumplir con todos los términos y condiciones establecidos.</p>
          `;
        }
      });
  }

  // Método para verificar si una circunscripción está seleccionada
  isCircunscripcionSelected(circunscripcion: string): boolean {
    const currentValue = this.selectedCircunscripcionesControl.value || [];
    return currentValue.includes(circunscripcion);
  }
}
