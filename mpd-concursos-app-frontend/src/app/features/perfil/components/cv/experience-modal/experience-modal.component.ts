/**
 * Modal para Gestión de Experiencias Laborales
 * 
 * @description Modal especializado que integra ExperienceFormComponent
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Modelos y servicios
import { WorkExperience, WorkExperienceDto, FormMode } from '@core/models/cv';

// Componentes
import { ModalBaseComponent, ModalConfig } from '@shared/components/modal/modal-base/modal-base.component';
import { ExperienceFormComponent } from '../experience-form.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

@Component({
  selector: 'app-experience-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalBaseComponent,
    ExperienceFormComponent,
    CustomButtonComponent
  ],
  templateUrl: './experience-modal.component.html',
  styleUrls: ['./experience-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceModalComponent implements OnInit, OnDestroy {

  // ===== VIEW CHILD =====
  @ViewChild('experienceForm') experienceFormComponent!: ExperienceFormComponent;

  // ===== INPUTS =====
  @Input() isOpen = false;
  @Input() experience: WorkExperience | null = null;
  @Input() mode: FormMode = 'create';
  @Input() isLoading = false;

  // ===== OUTPUTS =====
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<WorkExperienceDto>();
  @Output() delete = new EventEmitter<WorkExperience>();

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
    customClass: 'experience-modal'
  });

  public readonly formValid = signal<boolean>(false);
  public readonly formDirty = signal<boolean>(false);

  // ===== COMPUTED SIGNALS =====
  public readonly modalTitle = computed(() => {
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
  });

  public readonly modalSubtitle = computed(() => {
    if (this.mode === 'edit' && this.experience) {
      return `${this.experience.position} en ${this.experience.company}`;
    }
    if (this.mode === 'create') {
      return 'Completa la información de tu experiencia laboral';
    }
    return '';
  });

  public readonly canSave = computed(() => 
    this.formValid() && !this.isLoading && this.mode !== 'view'
  );

  public readonly canDelete = computed(() => 
    this.mode === 'edit' && this.experience && !this.isLoading
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
  onSave(experienceData: WorkExperienceDto): void {
    this.save.emit(experienceData);
  }

  /**
   * Maneja la eliminación de la experiencia
   */
  onDelete(): void {
    if (!this.experience) return;

    const confirmMessage = `¿Estás seguro de eliminar la experiencia en ${this.experience.company}?\n\nEsta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
      this.delete.emit(this.experience);
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
    if (this.experienceFormComponent) {
      this.experienceFormComponent.resetForm();
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
