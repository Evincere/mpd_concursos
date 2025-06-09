import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';

// Componentes personalizados
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomCheckboxComponent } from '@shared/components/custom-form/custom-checkbox/custom-checkbox.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

// Servicios
import { DialogService } from '@shared/services/dialog/dialog.service';
import { NotificationService } from '@shared/services/notification.service';

import { AdminContestDatesService, ContestDateCreateRequest, ContestDateUpdateRequest } from '../../../../../../core/services/admin/admin-contest-dates.service';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-concurso-fechas',
  templateUrl: './concurso-fechas.component.html',
  styleUrls: ['./concurso-fechas.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    CustomCheckboxComponent,
    CustomSpinnerComponent,
    CustomTextareaComponent
  ]
})
export class ConcursoFechasComponent implements OnInit, OnDestroy {
  @Input() contestId!: number | string;
  @Input() fechas: ContestDate[] = [];
  @Output() fechasUpdated = new EventEmitter<void>();

  dateForm: FormGroup;
  isLoading = false;
  isEditing = false;
  editingDateId: number | string | null = null;

  dateTypes: string[] = [];
  dateTypeOptions: { label: string, value: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private fechasService: AdminContestDatesService,
    private dialogService: DialogService,
    private notificationService: NotificationService
  ) {
    this.dateForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      date: [null, [Validators.required]],
      type: ['', [Validators.required]],
      important: [false]
    });
  }

  ngOnInit(): void {
    this.loadDateTypes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDateTypes(): void {
    this.isLoading = true;

    this.fechasService.getDateTypes()
      .pipe(
        takeUntil(this.destroy$),
        timeout(10000),
        catchError((error) => {
          console.error('Error cargando tipos de fechas:', error);
          // Devolver tipos por defecto en caso de error
          return of(['INSCRIPCION_INICIO', 'INSCRIPCION_FIN', 'EVALUACION_INICIO', 'EVALUACION_FIN', 'ENTREVISTA', 'PUBLICACION_RESULTADOS', 'OTRO']);
        })
      )
      .subscribe({
        next: (types: string[]) => {
          this.dateTypes = types;
          this.dateTypeOptions = types.map((type: string) => ({
            label: this.getDateTypeLabel(type),
            value: type
          }));
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error final cargando tipos de fechas:', error);
          // Configurar tipos por defecto
          this.dateTypes = ['INSCRIPCION_INICIO', 'INSCRIPCION_FIN', 'EVALUACION_INICIO', 'EVALUACION_FIN', 'ENTREVISTA', 'PUBLICACION_RESULTADOS', 'OTRO'];
          this.dateTypeOptions = this.dateTypes.map(type => ({
            label: this.getDateTypeLabel(type),
            value: type
          }));
          this.isLoading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.dateForm.invalid) {
      this.markFormGroupTouched(this.dateForm);
      this.notificationService.mostrarError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;

    if (this.isEditing && this.editingDateId) {
      this.updateDate();
    } else {
      this.createDate();
    }
  }

  createDate(): void {
    const formValue = this.dateForm.value;

    const request: ContestDateCreateRequest = {
      contestId: this.contestId,
      title: formValue.title,
      description: formValue.description,
      date: formValue.date,
      type: formValue.type,
      important: formValue.important
    };

    this.fechasService.createContestDate(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resetForm();
          this.fechasUpdated.emit();
          this.notificationService.mostrarExito('Fecha importante creada correctamente');
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error creando fecha importante:', error);
          this.notificationService.mostrarError('Error al crear la fecha importante');
          this.isLoading = false;
        }
      });
  }

  updateDate(): void {
    if (!this.editingDateId) return;

    const formValue = this.dateForm.value;

    const request: ContestDateUpdateRequest = {
      id: this.editingDateId,
      contestId: this.contestId,
      title: formValue.title,
      description: formValue.description,
      date: formValue.date,
      type: formValue.type,
      important: formValue.important
    };

    this.fechasService.updateContestDate(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resetForm();
          this.fechasUpdated.emit();
          this.notificationService.mostrarExito('Fecha importante actualizada correctamente');
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error actualizando fecha importante:', error);
          this.notificationService.mostrarError('Error al actualizar la fecha importante');
          this.isLoading = false;
        }
      });
  }

  editDate(date: ContestDate): void {
    this.isEditing = true;
    this.editingDateId = date.id || null;

    this.dateForm.patchValue({
      title: date.title,
      description: date.description,
      date: date.date ? new Date(date.date) : null,
      type: date.type,
      important: date.important
    });
  }

  deleteDate(date: ContestDate): void {
    this.dialogService.confirm({
      title: 'Eliminar Fecha Importante',
      message: `¿Está seguro que desea eliminar la fecha "${date.title}"?`,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'warn',
      size: 'small'
    }).afterClosed$.subscribe(result => {
      if (result && date.id) {
        this.isLoading = true;
        this.fechasService.deleteContestDate(this.contestId, date.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.fechasUpdated.emit();
              this.notificationService.mostrarExito('Fecha importante eliminada correctamente');
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Error eliminando fecha importante:', error);
              this.notificationService.mostrarError('Error al eliminar la fecha importante');
              this.isLoading = false;
            }
          });
      } else if (result) {
        this.notificationService.mostrarError('No se puede eliminar la fecha porque no tiene un ID válido');
      }
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.dateForm.reset({
      title: '',
      description: '',
      date: null,
      type: '',
      important: false
    });
    this.isEditing = false;
    this.editingDateId = null;
  }

  getDateTypeLabel(type: string | undefined): string {
    if (!type) return 'Desconocido';

    switch (type) {
      case 'INSCRIPCION_INICIO': return 'Inicio de Inscripción';
      case 'INSCRIPCION_FIN': return 'Fin de Inscripción';
      case 'EVALUACION_INICIO': return 'Inicio de Evaluación';
      case 'EVALUACION_FIN': return 'Fin de Evaluación';
      case 'ENTREVISTA': return 'Entrevista';
      case 'PUBLICACION_RESULTADOS': return 'Publicación de Resultados';
      case 'OTRO': return 'Otro';
      default: return type;
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.dateForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        switch (fieldName) {
          case 'title': return 'El título es requerido';
          case 'type': return 'El tipo es requerido';
          case 'date': return 'La fecha es requerida';
          default: return 'Este campo es requerido';
        }
      }
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
