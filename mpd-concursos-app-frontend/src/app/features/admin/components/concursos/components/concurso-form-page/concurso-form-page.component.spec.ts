import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ConcursoFormPageComponent } from './concurso-form-page.component';
import { AdminConcursosService } from '../../../../../../core/services/admin/admin-concursos.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';

describe('ConcursoFormPageComponent', () => {
  let component: ConcursoFormPageComponent;
  let fixture: ComponentFixture<ConcursoFormPageComponent>;
  let mockAdminConcursosService: jasmine.SpyObj<AdminConcursosService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const adminConcursosServiceSpy = jasmine.createSpyObj('AdminConcursosService', [
      'createConcurso'
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'mostrarExito',
      'mostrarError'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        ConcursoFormPageComponent
      ],
      providers: [
        { provide: AdminConcursosService, useValue: adminConcursosServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConcursoFormPageComponent);
    component = fixture.componentInstance;
    mockAdminConcursosService = TestBed.inject(AdminConcursosService) as jasmine.SpyObj<AdminConcursosService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    component.ngOnInit();
    
    expect(component.concursoForm).toBeDefined();
    expect(component.concursoForm.get('title')?.value).toBe('');
    expect(component.concursoForm.get('status')?.value).toBe('DRAFT');
    expect(component.concursoForm.get('startDate')?.value).toBeNull();
    expect(component.concursoForm.get('endDate')?.value).toBeNull();
  });

  it('should load filter options on init', () => {
    component.ngOnInit();
    
    expect(component.departmentOptions.length).toBeGreaterThan(0);
    expect(component.categoryOptions.length).toBeGreaterThan(0);
    expect(component.statusOptions.length).toBeGreaterThan(0);
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    
    // Intentar enviar formulario vacío
    component.onSubmit();
    
    expect(component.concursoForm.invalid).toBeTruthy();
    expect(component.isFieldInvalid('title')).toBeTruthy();
    expect(component.isFieldInvalid('position')).toBeTruthy();
    expect(component.isFieldInvalid('category')).toBeTruthy();
    expect(component.isFieldInvalid('department')).toBeTruthy();
    expect(component.isFieldInvalid('dependencia')).toBeTruthy();
    expect(component.isFieldInvalid('startDate')).toBeTruthy();
    expect(component.isFieldInvalid('endDate')).toBeTruthy();
  });

  it('should create concurso when form is valid', () => {
    const mockConcurso = {
      id: 1,
      title: 'Test Concurso',
      position: 'Test Position',
      category: 'PROFESIONAL',
      department: 'INFORMATICA',
      dependencia: 'Test Dependencia',
      status: 'DRAFT',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    };

    mockAdminConcursosService.createConcurso.and.returnValue(of(mockConcurso as any));
    
    component.ngOnInit();
    
    // Llenar formulario con datos válidos
    component.concursoForm.patchValue({
      title: 'Test Concurso',
      position: 'Test Position',
      category: 'PROFESIONAL',
      department: 'INFORMATICA',
      dependencia: 'Test Dependencia',
      status: 'DRAFT',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    });

    component.onSubmit();

    expect(mockAdminConcursosService.createConcurso).toHaveBeenCalled();
    expect(mockNotificationService.mostrarExito).toHaveBeenCalledWith('Concurso creado correctamente');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/concursos/detalle', 1]);
  });

  it('should handle creation error', () => {
    const errorResponse = { message: 'Error creating contest' };
    mockAdminConcursosService.createConcurso.and.returnValue(throwError(errorResponse));
    
    component.ngOnInit();
    
    // Llenar formulario con datos válidos
    component.concursoForm.patchValue({
      title: 'Test Concurso',
      position: 'Test Position',
      category: 'PROFESIONAL',
      department: 'INFORMATICA',
      dependencia: 'Test Dependencia',
      status: 'DRAFT',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    });

    component.onSubmit();

    expect(mockAdminConcursosService.createConcurso).toHaveBeenCalled();
    expect(mockNotificationService.mostrarError).toHaveBeenCalledWith('Error al crear el concurso');
    expect(component.isSubmitting).toBeFalsy();
  });

  it('should navigate to listado on cancel', () => {
    component.onCancel();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/concursos/listado']);
  });

  it('should return correct field error messages', () => {
    component.ngOnInit();
    
    const titleControl = component.concursoForm.get('title');
    titleControl?.markAsTouched();
    titleControl?.setErrors({ required: true });
    
    expect(component.getFieldError('title')).toBe('Este campo es requerido');
  });

  it('should mark all fields as touched when form is invalid', () => {
    component.ngOnInit();
    
    component.onSubmit();
    
    Object.keys(component.concursoForm.controls).forEach(key => {
      const control = component.concursoForm.get(key);
      expect(control?.touched).toBeTruthy();
    });
  });

  it('should not submit when already submitting', () => {
    component.ngOnInit();
    component.isSubmitting = true;
    
    // Llenar formulario con datos válidos
    component.concursoForm.patchValue({
      title: 'Test Concurso',
      position: 'Test Position',
      category: 'PROFESIONAL',
      department: 'INFORMATICA',
      dependencia: 'Test Dependencia',
      status: 'DRAFT',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    });

    component.onSubmit();

    expect(mockAdminConcursosService.createConcurso).not.toHaveBeenCalled();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
