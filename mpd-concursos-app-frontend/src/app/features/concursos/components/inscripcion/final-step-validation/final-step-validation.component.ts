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
import { NotificationService } from '@shared/services/notification.service';
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
    this.validateInscription();
  }

  private createForm() {
    this.validationForm = this.fb.group({
      centroDeVida: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Escuchar cambios en centro de vida
    this.validationForm.get('centroDeVida')?.valueChanges.subscribe(value => {
      if (value && value.length >= 10) {
        this.centroDeVidaChanged.emit(value);
      }
    });
  }



  validateInscription() {
    this.isLoading = true;

    this.http.get(`/api/inscriptions/validation/${this.inscriptionId}/completeness`)
      .subscribe({
        next: (result: any) => {
          console.log('🔍 [FinalStepValidation] Resultado de validación:', result);
          this.validationResult = result;
          this.isLoading = false;

          // Debug: verificar detección de problemas
          console.log('🔍 [FinalStepValidation] Faltan circunscripciones:', this.hasMissingCircunscripciones());
          console.log('🔍 [FinalStepValidation] Falta centro de vida:', this.hasMissingCentroDeVida());
          console.log('🔍 [FinalStepValidation] Issues:', result.issues);
          console.log('🔍 [FinalStepValidation] Selected circunscripciones:', result.selectedCircunscripciones);

          if (result.complete) {
            // Todo está completo, puede finalizar
            this.validationComplete.emit(true);
          } else {
            // Hay problemas, mostrar formulario de subsanación
            this.showSubsanacionForm = true;
            this.prefillFormWithCurrentData();
          }
        },
        error: (error) => {
          console.error('Error validando inscripción:', error);
          this.isLoading = false;
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

    // Si hay circunscripciones actuales, las pre-selecciona
    if (this.validationResult?.selectedCircunscripciones?.length > 0) {
      // Convertir las circunscripciones del backend al formato interno
      this.seleccionesCircunscripciones = this.convertirCircunscripcionesDelBackend(
        this.validationResult.selectedCircunscripciones
      );
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

  /**
   * Verifica si faltan circunscripciones basándose en los issues
   */
  hasMissingCircunscripciones(): boolean {
    // Verificar si hay un issue específico sobre circunscripciones
    const hasCircunscripcionIssue = this.hasIssueType('circunscripción');
    // Verificar si el array está vacío
    const hasEmptyCircunscripciones = !this.validationResult?.selectedCircunscripciones ||
                                     this.validationResult.selectedCircunscripciones.length === 0;

    console.log('🔍 [FinalStepValidation] hasMissingCircunscripciones:', {
      hasCircunscripcionIssue,
      hasEmptyCircunscripciones,
      selectedCircunscripciones: this.validationResult?.selectedCircunscripciones,
      issues: this.validationResult?.issues
    });

    return hasCircunscripcionIssue || hasEmptyCircunscripciones;
  }

  /**
   * Verifica si falta centro de vida basándose en los issues
   */
  hasMissingCentroDeVida(): boolean {
    // Verificar si hay un issue específico sobre centro de vida
    const hasCentroDeVidaIssue = this.hasIssueType('centro de vida');
    // Verificar si el campo está vacío o nulo
    const hasEmptyCentroDeVida = !this.validationResult?.centroDeVida ||
                                this.validationResult.centroDeVida.trim() === '';

    console.log('🔍 [FinalStepValidation] hasMissingCentroDeVida:', {
      hasCentroDeVidaIssue,
      hasEmptyCentroDeVida,
      centroDeVida: this.validationResult?.centroDeVida,
      issues: this.validationResult?.issues
    });

    return hasCentroDeVidaIssue || hasEmptyCentroDeVida;
  }

  getCircunscripcionesCount(): number {
    return this.seleccionesCircunscripciones.length;
  }

  getSelectedCircunscripciones(): string[] {
    return this.seleccionesCircunscripciones.map(s => s.circunscripcion);
  }

  /**
   * Resetea el formulario a su estado inicial
   */
  resetForm(): void {
    this.validationForm.reset();
    this.seleccionesCircunscripciones = [];
    this.prefillFormWithCurrentData();
  }

  /**
   * Guarda las correcciones realizadas por el usuario
   */
  saveCorrections(): void {
    if (this.validationForm.invalid) {
      this.markFormGroupTouched();
      this.notificationService.warning('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    const corrections: any = {};

    // Agregar centro de vida si fue modificado
    if (this.hasMissingCentroDeVida() && this.validationForm.get('centroDeVida')?.value) {
      corrections.centroDeVida = this.validationForm.get('centroDeVida')?.value;
    }

    // Agregar circunscripciones si fueron seleccionadas
    if (this.hasMissingCircunscripciones() && this.seleccionesCircunscripciones.length > 0) {
      corrections.selectedCircunscripciones = convertirSeleccionAFormato(this.seleccionesCircunscripciones);
    }

    console.log('🔧 [FinalStepValidation] Guardando correcciones:', corrections);

    // Emitir los cambios al componente padre
    if (corrections.centroDeVida) {
      this.centroDeVidaChanged.emit(corrections.centroDeVida);
    }

    if (corrections.selectedCircunscripciones) {
      this.circunscripcionesChanged.emit(corrections.selectedCircunscripciones);
    }

    // Emitir que los datos fueron actualizados
    this.dataUpdated.emit();

    // Mostrar mensaje de éxito
    this.notificationService.success('Correcciones guardadas exitosamente. Los cambios se aplicarán al finalizar la inscripción.');

    // Re-validar después de guardar
    setTimeout(() => {
      this.validateInscription();
    }, 500);
  }

  // ===== MÉTODOS PARA MANEJO DE CIRCUNSCRIPCIONES =====

  /**
   * Verifica si una circunscripción está seleccionada completamente
   */
  isCircunscripcionSelected(circunscripcion: string): boolean {
    return this.seleccionesCircunscripciones.some(s =>
      s.circunscripcion === circunscripcion && s.esCompleta
    );
  }

  /**
   * Verifica si un departamento específico está seleccionado
   */
  isDepartamentoSelected(circunscripcion: string, departamentoId: string): boolean {
    const seleccion = this.seleccionesCircunscripciones.find(s =>
      s.circunscripcion === circunscripcion && !s.esCompleta
    );
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
    this.actualizarValidacionCircunscripciones();
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
      // Remover la selección completa
      this.removerSeleccionCircunscripcion(circunscripcion);
    }
    this.actualizarValidacionCircunscripciones();
  }

  /**
   * Maneja el cambio de selección de departamento específico
   */
  onDepartamentoChange(event: Event, circunscripcion: string, departamentoId: string): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
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
  }

  private removerSeleccionCircunscripcion(circunscripcion: string): void {
    this.seleccionesCircunscripciones = this.seleccionesCircunscripciones.filter(
      s => s.circunscripcion !== circunscripcion
    );
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
  }

  private actualizarValidacionCircunscripciones(): void {
    // Forzar actualización de la validación del formulario
    this.validationForm.updateValueAndValidity();

    // Emitir cambios de circunscripciones al componente padre
    const circunscripcionesFormateadas = convertirSeleccionAFormato(this.seleccionesCircunscripciones);
    this.circunscripcionesChanged.emit(circunscripcionesFormateadas);

    // Emitir actualización de datos
    this.dataUpdated.emit();
  }

  private convertirCircunscripcionesDelBackend(circunscripciones: string[]): SeleccionCircunscripcion[] {
    const seleccionesMap = new Map<string, SeleccionCircunscripcion>();

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

    return Array.from(seleccionesMap.values());
  }
}
