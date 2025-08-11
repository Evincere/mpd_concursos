import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
import { NotificationService } from '@shared/services/notification.service';
import { 
  DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION, 
  CIRCUNSCRIPCIONES_JUDICIALES,
  SeleccionCircunscripcion,
  DepartamentoCircunscripcion,
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
    MatCheckboxModule
  ],
  selector: 'app-final-step-validation',
  templateUrl: './final-step-validation.component.html',
  styleUrls: ['./final-step-validation.component.scss']
})
export class FinalStepValidationComponent implements OnInit {

  @Input() inscriptionId!: string;
  @Output() validationComplete = new EventEmitter<boolean>();
  @Output() dataUpdated = new EventEmitter<void>();

  validationForm!: FormGroup;
  validationResult: any = null;
  isLoading = false;
  showSubsanacionForm = false;

  // Datos de circunscripciones
  departamentosSegundaCircunscripcion = DEPARTAMENTOS_SEGUNDA_CIRCUNSCRIPCION;
  seleccionesCircunscripciones: SeleccionCircunscripcion[] = [];
  availableCircunscripciones: string[] = [
    'Primera Circunscripción',
    'Segunda Circunscripción', 
    'Tercera Circunscripción',
    'Cuarta Circunscripción'
  ];

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
      centroDeVida: ['', [Validators.required, Validators.minLength(10)]],
      circunscripciones: this.fb.array(
        this.availableCircunscripciones.map(() => this.fb.control(false))
      )
    });
  }

  get circunscripcionesArray(): FormArray {
    return this.validationForm.get('circunscripciones') as FormArray;
  }

  validateInscription() {
    this.isLoading = true;
    
    this.http.get(`/api/inscriptions/validation/${this.inscriptionId}/completeness`)
      .subscribe({
        next: (result: any) => {
          this.validationResult = result;
          this.isLoading = false;

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

  onSubsanar() {
    if (this.validationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.validationForm.value;

    // Preparar datos para enviar
    const updateData = {
      centroDeVida: formValue.centroDeVida,
      selectedCircunscripciones: convertirSeleccionAFormato(this.seleccionesCircunscripciones)
    };

    // Actualizar datos de la inscripción
    this.updateInscriptionData(updateData);
  }

  private updateInscriptionData(data: any) {
    // Actualizar centro de vida
    this.http.put(`/api/inscriptions/${this.inscriptionId}/centro-vida`, {
      centroDeVida: data.centroDeVida
    }).subscribe({
      next: () => {
        // Actualizar circunscripciones
        this.updateCircunscripciones(data.selectedCircunscripciones);
      },
      error: (error) => {
        console.error('Error actualizando centro de vida:', error);
        this.isLoading = false;
        this.notificationService.error('Error actualizando datos. Intenta nuevamente.');
      }
    });
  }

  private updateCircunscripciones(selectedCircunscripciones: string[]) {
    this.http.put(`/api/inscriptions/${this.inscriptionId}/circunscripciones`, {
      circunscripciones: selectedCircunscripciones
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.notificationService.success('Datos actualizados correctamente');
        
        // Volver a validar
        this.validateInscription();
        this.dataUpdated.emit();
      },
      error: (error) => {
        console.error('Error actualizando circunscripciones:', error);
        this.isLoading = false;
        this.notificationService.error('Error actualizando circunscripciones. Intenta nuevamente.');
      }
    });
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
    return this.seleccionesCircunscripciones.map(s => s.circunscripcion);
  }

  getCircunscripcionDescription(circunscripcion: string): string {
    const descriptions: { [key: string]: string } = {
      'Primera Circunscripción': 'Capital Federal y Gran Buenos Aires',
      'Segunda Circunscripción': 'Interior de Buenos Aires',
      'Tercera Circunscripción': 'Córdoba, Santa Fe, Entre Ríos',
      'Cuarta Circunscripción': 'Resto del país'
    };
    return descriptions[circunscripcion] || '';
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
   * Verifica si una circunscripción está seleccionada (para circunscripciones simples)
   */
  isCircunscripcionSelected(circunscripcion: string): boolean {
    return this.seleccionesCircunscripciones.some(s => 
      s.circunscripcion === circunscripcion && s.esCompleta
    );
  }

  /**
   * Verifica si una circunscripción completa está seleccionada (para Segunda Circunscripción)
   */
  isCircunscripcionCompletaSelected(circunscripcion: string): boolean {
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
  }

  /**
   * Maneja el cambio del centro de vida
   */
  onCentroDeVidaChange(value: string): void {
    this.validationForm.patchValue({ centroDeVida: value });
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