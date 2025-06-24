/**
 * Modal para Gestión de Educación
 * 
 * @description Modal especializado que integra EducationFormComponent
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Modelos y servicios
import { EducationEntry, EducationDto, FormMode } from '@core/models/cv';

// Componentes
import { ModalBaseComponent, ModalConfig } from '@shared/components/modal/modal-base/modal-base.component';
import { EducationFormComponent } from '../education-form.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

@Component({
  selector: 'app-education-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalBaseComponent,
    EducationFormComponent,
    CustomButtonComponent
  ],
  templateUrl: './education-modal.component.html',
  styleUrls: ['./education-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EducationModalComponent implements OnInit, OnDestroy {

  // ===== VIEW CHILD =====
  @ViewChild('educationForm') educationFormComponent!: EducationFormComponent;

  // ===== INPUTS =====
  @Input() isOpen = false;
  @Input() education: EducationEntry | null = null;
  @Input() mode: FormMode = 'create';
  @Input() isLoading = false;

  // ===== OUTPUTS =====
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<EducationDto>();
  @Output() delete = new EventEmitter<EducationEntry>();

  // ===== SIGNALS =====
  public readonly modalConfig = signal<ModalConfig>({
    title: '',
    size: 'lg',
    type: 'form',
    closable: true,
    backdrop: true,
    keyboard: true,
    centered: true,
    scrollable: true,
    showHeader: true,
    showFooter: true,
    customClass: 'education-modal'
  });

  public readonly formValid = signal<boolean>(false);
  public readonly formDirty = signal<boolean>(false);

  // ===== COMPUTED SIGNALS =====
  public readonly modalTitle = computed(() => {
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
  });

  public readonly modalSubtitle = computed(() => {
    if (this.mode === 'edit' && this.education) {
      return `${this.education.title} en ${this.education.institution}`;
    }
    if (this.mode === 'create') {
      return 'Completa la información de tu formación académica';
    }
    return '';
  });

  public readonly canSave = computed(() =>
    this.formValid() && !this.isLoading && this.mode !== 'view'
  );

  public readonly canDelete = computed(() =>
    this.mode === 'edit' && this.education && !this.isLoading
  );

  public readonly showDeleteButton = computed(() =>
    this.canDelete() && this.mode === 'edit'
  );

  // ===== SUBJECTS =====
  private readonly destroy$ = new Subject<void>();

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.updateModalConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== EVENT HANDLERS =====

  /**
   * Maneja el cierre del modal
   */
  onClose(): void {
    if (this.formDirty() && this.mode !== 'view') {
      if (!confirm('¿Estás seguro de cerrar? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    this.close.emit();
  }

  /**
   * Maneja el guardado del formulario
   */
  onSave(educationData: EducationDto): void {
    this.save.emit(educationData);
  }

  /**
   * Maneja la eliminación de la educación
   */
  onDelete(): void {
    if (!this.education) return;

    const confirmMessage = `¿Estás seguro de eliminar la educación en ${this.education.institution}?\n\nEsta acción no se puede deshacer.`;

    if (confirm(confirmMessage)) {
      this.delete.emit(this.education);
    }
  }

  /**
   * Maneja los cambios de validación del formulario
   */
  onValidationChange(validation: any): void {
    this.formValid.set(validation.isValid);
  }

  /**
   * Maneja los cambios en el estado dirty del formulario
   */
  onFormDirtyChange(isDirty: boolean): void {
    this.formDirty.set(isDirty);
  }

  /**
   * Resetea el formulario (para uso externo)
   */
  public resetForm(): void {
    if (this.educationFormComponent) {
      this.educationFormComponent.resetForm();
    }
  }

  // ===== PRIVATE METHODS =====

  /**
   * Actualiza la configuración del modal
   */
  private updateModalConfig(): void {
    const currentConfig = this.modalConfig();
    this.modalConfig.set({
      ...currentConfig,
      title: this.modalTitle()
    });
  }
}
