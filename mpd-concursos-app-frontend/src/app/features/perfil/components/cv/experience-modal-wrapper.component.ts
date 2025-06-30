/**
 * Modal Wrapper para Formulario de Experiencia Laboral
 * 
 * @description Envuelve el ExperienceFormComponent en un modal con funcionalidad de documentos
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Modelos y tipos
import { WorkExperience, WorkExperienceDto, FormMode } from '@core/models/cv';

// Componentes
import { ExperienceFormComponent } from './experience-form.component';

/**
 * Resultado del modal de experiencia
 */
export interface ExperienceModalResult {
  action: 'save' | 'cancel';
  data?: WorkExperienceDto;
}

@Component({
  selector: 'app-experience-modal-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    ExperienceFormComponent
  ],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>{{ modalTitle }}</h2>
            <p class="modal-subtitle">Completa la información sobre tu experiencia profesional y adjunta un documento que la respalde</p>
          </div>
          <button type="button" class="close-button" (click)="onClose()" aria-label="Cerrar modal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-content">
          <app-experience-form
            [experience]="experience"
            [mode]="mode"
            [isLoading]="isLoading()"
            (save)="onSave($event)"
            (cancel)="onCancel()">
          </app-experience-form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./modal-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceModalWrapperComponent {

  // ===== INPUTS Y OUTPUTS =====
  @Input() isOpen = false;
  @Input() experience: WorkExperience | null = null;
  @Input() mode: FormMode = 'create';

  @Output() result = new EventEmitter<ExperienceModalResult>();
  @Output() close = new EventEmitter<void>();

  // ===== SIGNALS =====
  public readonly isLoading = signal<boolean>(false);

  // ===== COMPUTED PROPERTIES =====
  get modalTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Agregar Experiencia Laboral';
      case 'edit':
        return 'Editar Experiencia Laboral';
      case 'view':
        return 'Ver Experiencia Laboral';
      default:
        return 'Experiencia Laboral';
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Maneja el guardado desde el formulario
   */
  onSave(data: WorkExperienceDto): void {
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
