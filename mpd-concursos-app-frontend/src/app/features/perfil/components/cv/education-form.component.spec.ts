/**
 * Tests Unitarios para EducationFormComponent
 * 
 * @description Tests completos para el componente de formulario de educación
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { EducationFormComponent } from './education-form.component';
import { CvValidationService } from '@core/services/cv/cv-validation.service';
import { CvTransformService } from '@core/services/cv/cv-transform.service';
import { CvNotificationService } from '@core/services/cv/cv-notification.service';
import { EducationEntry, EducationType, EducationStatus } from '@core/models/cv';

describe('EducationFormComponent', () => {
  let component: EducationFormComponent;
  let fixture: ComponentFixture<EducationFormComponent>;
  let mockValidationService: jasmine.SpyObj<CvValidationService>;
  let mockTransformService: jasmine.SpyObj<CvTransformService>;
  let mockNotificationService: jasmine.SpyObj<CvNotificationService>;

  beforeEach(async () => {
    // Crear mocks de los servicios
    const validationServiceSpy = jasmine.createSpyObj('CvValidationService', [
      'validateEducation',
      'validateField'
    ]);
    
    const transformServiceSpy = jasmine.createSpyObj('CvTransformService', [
      'transformEducationForSave',
      'transformEducationForDisplay'
    ]);
    
    const notificationServiceSpy = jasmine.createSpyObj('CvNotificationService', [
      'showSuccess',
      'showError',
      'showWarning'
    ]);

    // Configurar valores por defecto de los mocks
    validationServiceSpy.validateEducation.and.returnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    validationServiceSpy.validateField.and.returnValue({
      isValid: true,
      errors: [],
      warnings: []
    });

    transformServiceSpy.transformEducationForSave.and.returnValue({} as any);
    transformServiceSpy.transformEducationForDisplay.and.returnValue({} as any);

    await TestBed.configureTestingModule({
      imports: [
        EducationFormComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CvValidationService, useValue: validationServiceSpy },
        { provide: CvTransformService, useValue: transformServiceSpy },
        { provide: CvNotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EducationFormComponent);
    component = fixture.componentInstance;
    
    mockValidationService = TestBed.inject(CvValidationService) as jasmine.SpyObj<CvValidationService>;
    mockTransformService = TestBed.inject(CvTransformService) as jasmine.SpyObj<CvTransformService>;
    mockNotificationService = TestBed.inject(CvNotificationService) as jasmine.SpyObj<CvNotificationService>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialización', () => {
    it('should initialize with default form values', () => {
      const form = component.form();
      
      expect(form.get('type')?.value).toBe('');
      expect(form.get('title')?.value).toBe('');
      expect(form.get('institution')?.value).toBe('');
      expect(form.get('status')?.value).toBe('');
    });

    it('should initialize in create mode by default', () => {
      expect(component.mode).toBe('create');
      expect(component.isEditing).toBe(false);
    });

    it('should set form values when education input is provided', () => {
      const mockEducation: EducationEntry = {
        id: '1',
        type: EducationType.UNIVERSITY,
        title: 'Ingeniería en Sistemas',
        institution: 'Universidad Nacional',
        startDate: new Date('2018-03-01'),
        endDate: new Date('2022-12-01'),
        status: EducationStatus.COMPLETED,
        description: 'Carrera de grado',
        isOngoing: false
      };

      component.education = mockEducation;
      component.ngOnInit();

      const form = component.form();
      expect(form.get('title')?.value).toBe('Ingeniería en Sistemas');
      expect(form.get('institution')?.value).toBe('Universidad Nacional');
      expect(form.get('type')?.value).toBe(EducationType.UNIVERSITY);
    });
  });

  describe('Campos dinámicos', () => {
    it('should show university-specific fields when university type is selected', () => {
      const form = component.form();
      form.get('type')?.setValue(EducationType.UNIVERSITY);
      
      const dynamicFields = component.dynamicFields;
      const fieldNames = dynamicFields.map(field => field.name);
      
      expect(fieldNames).toContain('averageGrade');
      expect(fieldNames).toContain('duration');
    });

    it('should show postgraduate-specific fields when postgraduate type is selected', () => {
      const form = component.form();
      form.get('type')?.setValue(EducationType.POSTGRADUATE);
      
      const dynamicFields = component.dynamicFields;
      const fieldNames = dynamicFields.map(field => field.name);
      
      expect(fieldNames).toContain('thesisTitle');
      expect(fieldNames).toContain('advisor');
    });

    it('should show course-specific fields when course type is selected', () => {
      const form = component.form();
      form.get('type')?.setValue(EducationType.COURSE);
      
      const dynamicFields = component.dynamicFields;
      const fieldNames = dynamicFields.map(field => field.name);
      
      expect(fieldNames).toContain('hourlyLoad');
    });

    it('should show scientific activity fields when scientific activity type is selected', () => {
      const form = component.form();
      form.get('type')?.setValue(EducationType.SCIENTIFIC_ACTIVITY);
      
      const dynamicFields = component.dynamicFields;
      const fieldNames = dynamicFields.map(field => field.name);
      
      expect(fieldNames).toContain('activityType');
      expect(fieldNames).toContain('role');
      expect(fieldNames).toContain('topic');
    });
  });

  describe('Validación', () => {
    it('should validate form on changes', () => {
      const form = component.form();
      form.get('title')?.setValue('Test Title');
      
      expect(mockValidationService.validateField).toHaveBeenCalled();
    });

    it('should show validation errors', () => {
      mockValidationService.validateEducation.and.returnValue({
        isValid: false,
        errors: ['El título es obligatorio'],
        warnings: []
      });

      component.validateForm();
      
      expect(component.validationErrors().length).toBe(1);
      expect(component.validationErrors()).toContain('El título es obligatorio');
    });

    it('should show validation warnings', () => {
      mockValidationService.validateEducation.and.returnValue({
        isValid: true,
        errors: [],
        warnings: ['Se recomienda agregar una descripción']
      });

      component.validateForm();
      
      expect(component.validationWarnings().length).toBe(1);
      expect(component.validationWarnings()).toContain('Se recomienda agregar una descripción');
    });

    it('should disable save when form is invalid', () => {
      mockValidationService.validateEducation.and.returnValue({
        isValid: false,
        errors: ['Error de validación'],
        warnings: []
      });

      component.validateForm();
      
      expect(component.canSave()).toBe(false);
    });
  });

  describe('Guardado', () => {
    it('should emit save event with transformed data', () => {
      spyOn(component.save, 'emit');
      
      const mockTransformedData = {
        id: '1',
        type: EducationType.UNIVERSITY,
        title: 'Test Title'
      } as EducationEntry;

      mockTransformService.transformEducationForSave.and.returnValue(mockTransformedData);
      mockValidationService.validateEducation.and.returnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const form = component.form();
      form.get('title')?.setValue('Test Title');
      form.get('type')?.setValue(EducationType.UNIVERSITY);

      component.onSave();

      expect(component.save.emit).toHaveBeenCalledWith(mockTransformedData);
    });

    it('should not save when form is invalid', () => {
      spyOn(component.save, 'emit');
      
      mockValidationService.validateEducation.and.returnValue({
        isValid: false,
        errors: ['Error de validación'],
        warnings: []
      });

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        'Por favor, corrige los errores antes de guardar'
      );
    });

    it('should show loading state during save', () => {
      component.isLoading.set(true);
      
      expect(component.canSave()).toBe(false);
    });
  });

  describe('Cancelación', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');
      
      component.onCancel();
      
      expect(component.cancel.emit).toHaveBeenCalled();
    });

    it('should show confirmation dialog when form is dirty', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(component.cancel, 'emit');
      
      // Hacer el formulario "dirty"
      const form = component.form();
      form.get('title')?.setValue('Some value');
      form.markAsDirty();

      component.onCancel();

      expect(window.confirm).toHaveBeenCalledWith(
        '¿Estás seguro de cancelar? Se perderán los cambios no guardados.'
      );
      expect(component.cancel.emit).not.toHaveBeenCalled();
    });

    it('should cancel when user confirms', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component.cancel, 'emit');
      
      const form = component.form();
      form.get('title')?.setValue('Some value');
      form.markAsDirty();

      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should reset form to initial values', () => {
      const form = component.form();
      
      // Modificar el formulario
      form.get('title')?.setValue('Modified Title');
      form.get('institution')?.setValue('Modified Institution');
      
      component.onReset();
      
      expect(form.get('title')?.value).toBe('');
      expect(form.get('institution')?.value).toBe('');
    });

    it('should reset to education values when in edit mode', () => {
      const mockEducation: EducationEntry = {
        id: '1',
        type: EducationType.UNIVERSITY,
        title: 'Original Title',
        institution: 'Original Institution',
        startDate: new Date(),
        status: EducationStatus.COMPLETED,
        isOngoing: false
      };

      component.education = mockEducation;
      component.mode = 'edit';
      component.ngOnInit();

      const form = component.form();
      form.get('title')?.setValue('Modified Title');
      
      component.onReset();
      
      expect(form.get('title')?.value).toBe('Original Title');
    });
  });

  describe('Estado del formulario', () => {
    it('should detect when form is dirty', () => {
      const form = component.form();
      
      expect(component.isDirty()).toBe(false);
      
      form.get('title')?.setValue('Some value');
      form.markAsDirty();
      
      expect(component.isDirty()).toBe(true);
    });

    it('should detect when form is valid', () => {
      mockValidationService.validateEducation.and.returnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      component.validateForm();
      
      expect(component.isFormValid()).toBe(true);
    });

    it('should enable save when form is valid and not loading', () => {
      mockValidationService.validateEducation.and.returnValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      component.isLoading.set(false);
      component.validateForm();
      
      expect(component.canSave()).toBe(true);
    });
  });

  describe('Opciones de selección', () => {
    it('should provide education type options', () => {
      const options = component.educationTypeOptions;
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.value === EducationType.UNIVERSITY)).toBe(true);
      expect(options.some(opt => opt.value === EducationType.POSTGRADUATE)).toBe(true);
    });

    it('should provide education status options', () => {
      const options = component.educationStatusOptions;
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.value === EducationStatus.COMPLETED)).toBe(true);
      expect(options.some(opt => opt.value === EducationStatus.IN_PROGRESS)).toBe(true);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle validation service errors gracefully', () => {
      mockValidationService.validateEducation.and.throwError('Validation error');
      
      expect(() => component.validateForm()).not.toThrow();
    });

    it('should handle transform service errors gracefully', () => {
      mockTransformService.transformEducationForSave.and.throwError('Transform error');
      
      expect(() => component.onSave()).not.toThrow();
    });
  });

  describe('Accesibilidad', () => {
    it('should have proper form labels', () => {
      const compiled = fixture.nativeElement;
      const labels = compiled.querySelectorAll('label');
      
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should associate labels with form controls', () => {
      const compiled = fixture.nativeElement;
      const inputs = compiled.querySelectorAll('input, select, textarea');
      
      inputs.forEach((input: HTMLElement) => {
        const id = input.getAttribute('id');
        if (id) {
          const label = compiled.querySelector(`label[for="${id}"]`);
          expect(label).toBeTruthy();
        }
      });
    });
  });
});
