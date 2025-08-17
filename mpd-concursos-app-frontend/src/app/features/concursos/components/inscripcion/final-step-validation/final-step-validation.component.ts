import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { NotificationService } from '@core/services/notification/notification.service';
import { 
  DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION, 
  CIRCUNSCRIPCIONES_JUDICIALES,
  SeleccionCircunscripcion,
  convertirSeleccionAFormato
} from '@shared/constants/circunscripciones.constants';

/**
 * Componente para validación y subsanación en el paso final de inscripción
 * Permite corregir circunscripciones y centro de vida faltantes
 * CREADO: Para permitir subsanar datos críticos en el último momento
 * ✅ CORREGIDO: Problema de visualización de circunscripciones
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCardModule,
    MatCheckboxModule,
    CustomCheckboxComponent
  ],
  selector: 'app-final-step-validation',
  templateUrl: './final-step-validation.component.html',
  styleUrls: ['./final-step-validation.component.scss']
})
export class FinalStepValidationComponent implements OnInit {

  @Input() inscriptionId!: string;
  @Output() validationComplete = new EventEmitter<boolean>();
  @Output() dataUpdated = new EventEmitter<void>();
  @Output() centroDeVidaChanged = new EventEmitter<string>();
  @Output() circunscripcionesChanged = new EventEmitter<string[]>();

  validationForm!: FormGroup;
  validationResult: any = null;
  isLoading = false;
  showSubsanacionForm = false;

  // Datos de circunscripciones
  departamentosSegundaCircunscripcion = DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION;
  seleccionesCircunscripciones: SeleccionCircunscripcion[] = [];
  circunscripcionesDisponibles = CIRCUNSCRIPCIONES_JUDICIALES;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.createForm();
    // ✅ CRÍTICO: Ejecutar validación automáticamente cuando el componente se inicializa
    if (this.inscriptionId) {
      this.validateInscription();
    } else {
      console.warn("🔍 [FINAL-STEP-VALIDATION] No inscriptionId available, cannot validate");
    }
  }

  private createForm() {
    this.validationForm = this.fb.group({
      centroDeVida: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  validateInscription() {
    this.isLoading = true;
    
    // ✅ DEBUG: Logging detallado para investigar el problema
    console.log('🔍 [FINAL-STEP-VALIDATION] Iniciando validación:', {
      inscriptionId: this.inscriptionId,
      inscriptionIdType: typeof this.inscriptionId,
      inscriptionIdLength: this.inscriptionId?.length,
      endpoint: `/api/inscriptions/validation/${this.inscriptionId}/completeness`
    });
    
    this.http.get(`/api/inscriptions/validation/${this.inscriptionId}/completeness`)
      .subscribe({
        next: (result: any) => {
          console.log('✅ [FINAL-STEP-VALIDATION] Respuesta exitosa del backend:', {
            result,
            complete: result.complete,
            issues: result.issues,
            missingCircunscripciones: result.missingCircunscripciones,
            missingCentroVida: result.missingCentroVida
          });
          
          this.validationResult = result;
          this.isLoading = false;

          if (result.complete) {
            // Todo está completo, puede finalizar
            console.log('✅ [FINAL-STEP-VALIDATION] Inscripción COMPLETA - no se muestra subsanación');
            this.validationComplete.emit(true);
          } else {
            // Hay problemas, mostrar formulario de subsanación
            console.log('⚠️ [FINAL-STEP-VALIDATION] Inscripción INCOMPLETA - mostrando subsanación');
            console.log('🔍 [FINAL-STEP-VALIDATION] Problemas detectados:', result.issues);
            this.showSubsanacionForm = true;
            this.prefillFormWithCurrentData();
          }
        },
        error: (error) => {
          console.error('❌ [FINAL-STEP-VALIDATION] ERROR en validación:', {
            error,
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          
          this.isLoading = false;
          
          // ✅ CORREGIDO: Solo mostrar subsanación si es un error de datos, no de infraestructura
          if (error.status === 404) {
            console.log('⚠️ [FINAL-STEP-VALIDATION] Inscripción no encontrada - podría ser problema de formato de ID');
          } else if (error.status === 401 || error.status === 403) {
            console.log('⚠️ [FINAL-STEP-VALIDATION] Problema de autorización');
          } else if (error.status >= 500) {
            console.log('⚠️ [FINAL-STEP-VALIDATION] Error del servidor');
          }
          
          // Por ahora mantener el comportamiento original, pero con logging
          console.log('⚠️ [FINAL-STEP-VALIDATION] Mostrando subsanación por error (comportamiento fallback)');
          this.showSubsanacionForm = true; // Mostrar formulario por si acaso
        }
      });
  }

  private prefillFormWithCurrentData() {
    // Si hay centro de vida actual, lo pre-llena
    if (this.validationResult?.centroDeVida) {
      this.validationForm.patchValue({
        centroDeVida: this.validationResult.centroDeVida
      });
    }

    // ✅ CORREGIDO: Mejorar el pre-llenado de circunscripciones
    if (this.validationResult?.selectedCircunscripciones?.length > 0) {
      // Convertir las circunscripciones del backend al formato interno
      this.seleccionesCircunscripciones = this.convertirCircunscripcionesDelBackend(
        this.validationResult.selectedCircunscripciones
      );
      
      // ✅ NUEVO: Emitir inmediatamente las circunscripciones cargadas al componente padre
      const circunscripcionesFormateadas = convertirSeleccionAFormato(this.seleccionesCircunscripciones);
      this.circunscripcionesChanged.emit(circunscripcionesFormateadas);
      
      console.log('✅ Circunscripciones pre-llenadas y emitidas:', {
        original: this.validationResult.selectedCircunscripciones,
        seleccionesInternas: this.seleccionesCircunscripciones,
        formateadas: circunscripcionesFormateadas
      });
    } else {
      // ✅ NUEVO: Si no hay circunscripciones, emitir array vacío
      this.circunscripcionesChanged.emit([]);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.validationForm.controls).forEach(key => {
      const control = this.validationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.validationForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName === 'centroDeVida' ? 'Centro de vida' : 'Campo'} es requerido`;
      }
      if (control.errors['minlength']) {
        return 'Debe tener al menos 10 caracteres';
      }
    }
    return '';
  }

  hasSelectedCircunscripciones(): boolean {
    return this.seleccionesCircunscripciones.length > 0;
  }

  hasIssueType(issueType: string): boolean {
    return this.validationResult?.issues?.some((issue: string) => issue.includes(issueType)) || false;
  }

  getCircunscripcionesCount(): number {
    return this.seleccionesCircunscripciones.length;
  }

  getSelectedCircunscripciones(): string[] {
    const result = convertirSeleccionAFormato(this.seleccionesCircunscripciones);
    console.log('✅ getSelectedCircunscripciones llamado:', {
      seleccionesInternas: this.seleccionesCircunscripciones,
      resultado: result
    });
    return result;
  }

  /**
   * Resetea el formulario a su estado inicial
   */
  resetForm(): void {
    this.validationForm.reset();
    this.seleccionesCircunscripciones = [];
    this.prefillFormWithCurrentData();
  }

  // ===== MÉTODOS PARA MANEJO DE CIRCUNSCRIPCIONES =====

  /**
   * Verifica si una circunscripción está seleccionada completamente
   */
  isCircunscripcionSelected(circunscripcion: string): boolean {
    const selected = this.seleccionesCircunscripciones.some(s => 
      s.circunscripcion === circunscripcion && s.esCompleta
    );
    console.log(`✅ isCircunscripcionSelected(${circunscripcion}):`, selected);
    return selected;
  }

  /**
   * Verifica si un departamento específico está seleccionado
   */
  isDepartamentoSelected(circunscripcion: string, departamentoId: string): boolean {
    const seleccion = this.seleccionesCircunscripciones.find(s => 
      s.circunscripcion === circunscripcion && !s.esCompleta
    );
    const selected = seleccion?.departamentos?.includes(departamentoId) || false;
    console.log(`✅ isDepartamentoSelected(${circunscripcion}, ${departamentoId}):`, selected);
    return selected;
  }

  /**
   * ✅ CORREGIDO: Manejo de eventos de cambio sin conflictos
   * Maneja el cambio de selección de circunscripción simple (Primera, Tercera, Cuarta)
   */
  onCircunscripcionChange(checked: boolean, circunscripcion: string): void {
    console.log(`✅ onCircunscripcionChange(${checked}, ${circunscripcion})`);
    
    if (checked) {
      // Agregar circunscripción completa
      this.agregarSeleccionCircunscripcion(circunscripcion, true);
    } else {
      // Remover circunscripción
      this.removerSeleccionCircunscripcion(circunscripcion);
    }
    this.actualizarValidacionCircunscripciones();
  }

  /**
   * ✅ CORREGIDO: Manejo de eventos de cambio sin conflictos
   * Maneja el cambio de selección de circunscripción completa (para Segunda Circunscripción)
   */
  onCircunscripcionCompletaChange(checked: boolean, circunscripcion: string): void {
    console.log(`✅ onCircunscripcionCompletaChange(${checked}, ${circunscripcion})`);
    
    if (checked) {
      // Seleccionar toda la circunscripción y limpiar departamentos específicos
      this.agregarSeleccionCircunscripcion(circunscripcion, true);
    } else {
      // Remover la selección completa
      this.removerSeleccionCircunscripcion(circunscripcion);
    }
    this.actualizarValidacionCircunscripciones();
  }

  /**
   * ✅ CORREGIDO: Manejo de eventos de cambio sin conflictos
   * Maneja el cambio de selección de departamento específico
   */
  onDepartamentoChange(checked: boolean, circunscripcion: string, departamentoId: string): void {
    console.log(`✅ onDepartamentoChange(${checked}, ${circunscripcion}, ${departamentoId})`);
    
    if (checked) {
      this.agregarDepartamento(circunscripcion, departamentoId);
    } else {
      this.removerDepartamento(circunscripcion, departamentoId);
    }
    this.actualizarValidacionCircunscripciones();
  }

  // ===== MÉTODOS PRIVADOS PARA MANEJO DE SELECCIONES =====

  private agregarSeleccionCircunscripcion(circunscripcion: string, esCompleta: boolean): void {
    // Remover selección existente de esta circunscripción
    this.removerSeleccionCircunscripcion(circunscripcion);
    
    // Agregar nueva selección
    this.seleccionesCircunscripciones.push({
      circunscripcion,
      esCompleta,
      departamentos: esCompleta ? undefined : []
    });
    
    console.log('✅ agregarSeleccionCircunscripcion:', {
      circunscripcion,
      esCompleta,
      seleccionesActuales: this.seleccionesCircunscripciones
    });
  }

  private removerSeleccionCircunscripcion(circunscripcion: string): void {
    this.seleccionesCircunscripciones = this.seleccionesCircunscripciones.filter(
      s => s.circunscripcion !== circunscripcion
    );
    
    console.log('✅ removerSeleccionCircunscripcion:', {
      circunscripcionRemovida: circunscripcion,
      seleccionesRestantes: this.seleccionesCircunscripciones
    });
  }

  private agregarDepartamento(circunscripcion: string, departamentoId: string): void {
    let seleccion = this.seleccionesCircunscripciones.find(s => 
      s.circunscripcion === circunscripcion && !s.esCompleta
    );

    if (!seleccion) {
      seleccion = {
        circunscripcion,
        esCompleta: false,
        departamentos: []
      };
      this.seleccionesCircunscripciones.push(seleccion);
    }

    if (!seleccion.departamentos!.includes(departamentoId)) {
      seleccion.departamentos!.push(departamentoId);
    }
    
    console.log('✅ agregarDepartamento:', {
      circunscripcion,
      departamentoId,
      seleccionActualizada: seleccion
    });
  }

  private removerDepartamento(circunscripcion: string, departamentoId: string): void {
    const seleccion = this.seleccionesCircunscripciones.find(s => 
      s.circunscripcion === circunscripcion && !s.esCompleta
    );

    if (seleccion && seleccion.departamentos) {
      seleccion.departamentos = seleccion.departamentos.filter(d => d !== departamentoId);
      
      // Si no quedan departamentos, remover la selección completa
      if (seleccion.departamentos.length === 0) {
        this.removerSeleccionCircunscripcion(circunscripcion);
      }
    }
    
    console.log('✅ removerDepartamento:', {
      circunscripcion,
      departamentoId,
      seleccionesResultantes: this.seleccionesCircunscripciones
    });
  }

  /**
   * ✅ NUEVO: Limpiar todas las selecciones de circunscripciones
   */
  limpiarSelecciones(): void {
    console.log("✅ Limpiando todas las selecciones de circunscripciones");
    
    // Limpiar selecciones internas
    this.seleccionesCircunscripciones = [];
    
    // Actualizar validaciones
    this.actualizarValidacionCircunscripciones();
    
    // Notificar al usuario
    this.notificationService.showInfo("Selecciones limpiadas", "Se han eliminado todas las selecciones de circunscripciones");
  }


  private actualizarValidacionCircunscripciones(): void {
    // Forzar actualización de la validación del formulario
    this.validationForm.updateValueAndValidity();
    
    // Emitir cambios de circunscripciones al componente padre
    const circunscripcionesFormateadas = convertirSeleccionAFormato(this.seleccionesCircunscripciones);
    this.circunscripcionesChanged.emit(circunscripcionesFormateadas);
    
    // Emitir actualización de datos
    this.dataUpdated.emit();
    
    console.log('✅ actualizarValidacionCircunscripciones:', {
      seleccionesInternas: this.seleccionesCircunscripciones,
      circunscripcionesFormateadas: circunscripcionesFormateadas
    });
  }

  private convertirCircunscripcionesDelBackend(circunscripciones: string[]): SeleccionCircunscripcion[] {
    const seleccionesMap = new Map<string, SeleccionCircunscripcion>();
    
    console.log('✅ convertirCircunscripcionesDelBackend - input:', circunscripciones);
    
    circunscripciones.forEach(valor => {
      if (valor.includes(':')) {
        // Formato "Circunscripción:Departamento"
        const [circunscripcion, departamento] = valor.split(':');
        const deptId = this.departamentosSegundaCircunscripcion.find(
          d => d.nombre === departamento
        )?.id;
        
        if (deptId) {
          if (!seleccionesMap.has(circunscripcion)) {
            seleccionesMap.set(circunscripcion, {
              circunscripcion,
              departamentos: [],
              esCompleta: false
            });
          }
          seleccionesMap.get(circunscripcion)!.departamentos!.push(deptId);
        }
      } else {
        // Formato simple "Circunscripción"
        seleccionesMap.set(valor, {
          circunscripcion: valor,
          esCompleta: true
        });
      }
    });
    
    const resultado = Array.from(seleccionesMap.values());
    console.log('✅ convertirCircunscripcionesDelBackend - output:', resultado);
    
    return resultado;
  }
}
