import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Modelos y servicios
import { UserProfile } from '@core/models/perfil.model';
import { ExperienceSimple, EducationSimple, EDUCATION_TYPES, EDUCATION_STATUSES } from '@core/models/cv-simple.model';
import { ExperienceSimpleService } from '@core/services/experience-simple.service';
import { EducationSimpleService } from '@core/services/education-simple.service';

// Componentes compartidos
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';
import { CustomTextareaComponent } from '@shared/components/custom-form/custom-textarea/custom-textarea.component';

@Component({
  selector: 'app-cv-simple',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSpinnerComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomDatepickerComponent,
    CustomTextareaComponent
  ],
  templateUrl: './cv-simple.component.html',
  styleUrls: ['./cv-simple.component.scss']
})
export class CvSimpleComponent implements OnInit, OnDestroy {
  
  @Input() userProfile: UserProfile | null = null;
  @Input() isLoading = false;

  // Servicios
  private readonly experienceService = inject(ExperienceSimpleService);
  private readonly educationService = inject(EducationSimpleService);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // Estado
  public experiences = signal<ExperienceSimple[]>([]);
  public education = signal<EducationSimple[]>([]);
  public showExperienceForm = signal(false);
  public showEducationForm = signal(false);
  public editingExperience = signal<ExperienceSimple | null>(null);
  public editingEducation = signal<EducationSimple | null>(null);

  // Formularios
  public experienceForm!: FormGroup;
  public educationForm!: FormGroup;

  // Opciones para selects
  public educationTypes = EDUCATION_TYPES;
  public educationStatuses = EDUCATION_STATUSES;

  ngOnInit(): void {
    this.initializeForms();
    this.loadData();
    this.subscribeToServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INICIALIZACIÓN =====

  private initializeForms(): void {
    this.experienceForm = this.fb.group({
      position: ['', [Validators.required, Validators.minLength(2)]],
      company: ['', [Validators.required, Validators.minLength(2)]],
      startDate: ['', Validators.required],
      endDate: [''],
      description: [''],
      comments: ['']
    });

    this.educationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      institution: ['', [Validators.required, Validators.minLength(2)]],
      type: ['Título Universitario', Validators.required],
      issueDate: [''],
      status: ['En Curso', Validators.required],
      comments: ['']
    });


  }

  private loadData(): void {
    if (!this.userProfile?.id) return;

    const userId = this.userProfile.id.toString();
    
    // Cargar experiencias
    this.experienceService.getExperiencesByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (response.exito && response.data) {
          this.experiences.set(response.data);
        }
      });

    // Cargar educación
    this.educationService.getEducationByUserId(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        if (response.exito && response.data) {
          this.education.set(response.data);
        }
      });
  }

  private subscribeToServices(): void {
    // Suscribirse a cambios en experiencias
    this.experienceService.experiences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(experiences => {
        this.experiences.set(experiences);
      });

    // Suscribirse a cambios en educación
    this.educationService.education$
      .pipe(takeUntil(this.destroy$))
      .subscribe(education => {
        this.education.set(education);
      });
  }

  // ===== EXPERIENCIAS =====

  public showAddExperienceForm(): void {
    this.editingExperience.set(null);
    this.experienceForm.reset();
    this.showExperienceForm.set(true);
  }

  public editExperience(experience: ExperienceSimple): void {
    this.editingExperience.set(experience);
    this.experienceForm.patchValue({
      position: experience.position,
      company: experience.company,
      startDate: this.formatDateForInput(experience.startDate),
      endDate: experience.endDate ? this.formatDateForInput(experience.endDate) : '',
      description: experience.description || '',
      comments: experience.comments || ''
    });
    this.showExperienceForm.set(true);
  }

  public saveExperience(): void {
    if (this.experienceForm.invalid || !this.userProfile?.id) return;

    const formValue = this.experienceForm.value;
    const experienceData: Partial<ExperienceSimple> = {
      position: formValue.position,
      company: formValue.company,
      startDate: new Date(formValue.startDate),
      endDate: formValue.endDate ? new Date(formValue.endDate) : undefined,
      description: formValue.description,
      comments: formValue.comments
    };

    const userId = this.userProfile.id.toString();
    const editingExp = this.editingExperience();

    if (editingExp?.id) {
      // Actualizar
      this.experienceService.updateExperience(editingExp.id, experienceData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          if (response.exito) {
            this.cancelExperienceForm();
          }
        });
    } else {
      // Crear
      this.experienceService.createExperience(userId, experienceData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          if (response.exito) {
            this.cancelExperienceForm();
          }
        });
    }
  }

  public deleteExperience(experience: ExperienceSimple): void {
    if (!experience.id || !confirm('¿Estás seguro de que quieres eliminar esta experiencia?')) return;

    this.experienceService.deleteExperience(experience.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  public cancelExperienceForm(): void {
    this.showExperienceForm.set(false);
    this.editingExperience.set(null);
    this.experienceForm.reset();
  }

  // ===== EDUCACIÓN =====

  public showAddEducationForm(): void {
    this.editingEducation.set(null);
    this.educationForm.reset();
    this.educationForm.patchValue({
      type: 'Título Universitario',
      status: 'En Curso'
    });
    this.showEducationForm.set(true);
  }

  public editEducation(education: EducationSimple): void {
    this.editingEducation.set(education);
    this.educationForm.patchValue({
      title: education.title,
      institution: education.institution,
      type: education.type,
      issueDate: education.issueDate ? this.formatDateForInput(education.issueDate) : '',
      status: education.status,
      comments: education.comments || ''
    });
    this.showEducationForm.set(true);
  }

  public saveEducation(): void {
    if (this.educationForm.invalid || !this.userProfile?.id) return;

    const formValue = this.educationForm.value;
    const educationData: Partial<EducationSimple> = {
      title: formValue.title,
      institution: formValue.institution,
      type: formValue.type,
      issueDate: formValue.issueDate ? new Date(formValue.issueDate) : undefined,
      status: formValue.status,
      comments: formValue.comments
    };

    const userId = this.userProfile.id.toString();
    const editingEdu = this.editingEducation();

    if (editingEdu?.id) {
      // Actualizar
      this.educationService.updateEducation(editingEdu.id, educationData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          if (response.exito) {
            this.cancelEducationForm();
          }
        });
    } else {
      // Crear
      this.educationService.createEducation(userId, educationData)
        .pipe(takeUntil(this.destroy$))
        .subscribe(response => {
          if (response.exito) {
            this.cancelEducationForm();
          }
        });
    }
  }

  public deleteEducation(education: EducationSimple): void {
    if (!education.id || !confirm('¿Estás seguro de que quieres eliminar esta educación?')) return;

    this.educationService.deleteEducation(education.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  public cancelEducationForm(): void {
    this.showEducationForm.set(false);
    this.editingEducation.set(null);
    this.educationForm.reset();
  }

  // ===== UTILIDADES =====

  public formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long'
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  public getEducationTypeLabel(type: string): string {
    const option = this.educationTypes.find(opt => opt.value === type);
    return option?.label || type;
  }

  public getEducationStatusLabel(status: string): string {
    const option = this.educationStatuses.find(opt => opt.value === status);
    return option?.label || status;
  }


}
