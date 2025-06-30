/**
 * Modal Wrapper para Formulario de Educación
 * 
 * @description Envuelve el EducationFormComponent en un modal con funcionalidad de documentos
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modelos y tipos
import { EducationEntry, EducationDto, FormMode } from '@core/models/cv';

// Componentes
import { EducationFormComponent } from './education-form.component';

/**
 * Resultado del modal de educación
 */
export interface EducationModalResult {
  action: 'save' | 'cancel';
  data?: EducationDto;
}

@Component({
  selector: 'app-education-modal-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    EducationFormComponent
  ],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>{{ modalTitle }}</h2>
            <p class="modal-subtitle">Completa la información sobre tu educación y adjunta un documento que la respalde</p>
          </div>
          <button type="button" class="close-button" (click)="onClose()" aria-label="Cerrar modal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-content">
          <app-education-form
            [education]="education"
            [mode]="mode"
            [isLoading]="isLoading()"
            (save)="onSave($event)"
            (cancel)="onCancel()">
          </app-education-form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./modal-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducationModalWrapperComponent {

  // ===== INPUTS Y OUTPUTS =====
  @Input() isOpen = false;
  @Input() education: EducationEntry | null = null;
  @Input() mode: FormMode = 'create';

  @Output() result = new EventEmitter<EducationModalResult>();
  @Output() close = new EventEmitter<void>();

  // ===== SIGNALS =====
  public readonly isLoading = signal<boolean>(false);

  // ===== COMPUTED PROPERTIES =====
  get modalTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Agregar Educación';
      case 'edit':
        return 'Editar Educación';
      case 'view':
        return 'Ver Educación';
      default:
        return 'Educación';
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Maneja el guardado desde el formulario
   */
  onSave(data: EducationDto): void {
    this.isLoading.set(true);

    // Simular guardado (en producción sería una llamada al backend)
    setTimeout(() => {
      this.isLoading.set(false);
      
      this.result.emit({
        action: 'save',
        data: data
      });

      this.close.emit();
    }, 1000);
  }

  /**
   * Maneja la cancelación desde el formulario
   */
  onCancel(): void {
    this.result.emit({
      action: 'cancel'
    });

    this.close.emit();
  }

  /**
   * Cierra el modal
   */
  onClose(): void {
    if (this.isLoading()) {
      return; // No permitir cerrar mientras se está guardando
    }

    this.close.emit();
  }

  /**
   * Maneja el clic en el backdrop para cerrar el modal
   */
  onBackdropClick(event: MouseEvent): void {
    // Solo cerrar si el clic fue directamente en el backdrop (no en el contenido del modal)
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
