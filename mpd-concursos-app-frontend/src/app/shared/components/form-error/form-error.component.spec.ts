import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormErrorComponent } from './form-error.component';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

// Componente de prueba para probar el componente de error de formulario
@Component({
  template: `
    <form [formGroup]="testForm">
      <input formControlName="name">
      <app-form-error [control]="testForm.get('name')" [customMessages]="customMessages"></app-form-error>
    </form>
  `
})
class TestHostComponent {
  testForm: FormGroup;
  customMessages: { [key: string]: string } = {};
  
  constructor(private fb: FormBuilder) {
    this.testForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }
  
  markAsTouched(): void {
    this.testForm.get('name')?.markAsTouched();
  }
  
  markAsDirty(): void {
    this.testForm.get('name')?.markAsDirty();
  }
  
  setValue(value: string): void {
    this.testForm.get('name')?.setValue(value);
  }
  
  setCustomMessages(messages: { [key: string]: string }): void {
    this.customMessages = messages;
  }
}

describe('FormErrorComponent', () => {
  let component: FormErrorComponent;
  let fixture: ComponentFixture<FormErrorComponent>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormErrorComponent],
      declarations: [TestHostComponent]
    }).compileComponents();
    
    // Crear instancia del componente aislado
    fixture = TestBed.createComponent(FormErrorComponent);
    component = fixture.componentInstance;
    
    // Crear instancia del componente host
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  describe('shouldShowErrors', () => {
    it('should return false when control is null', () => {
      component.control = null;
      expect(component.shouldShowErrors()).toBe(false);
    });
    
    it('should return false when control is valid', () => {
      const control = new FormControl('valid value', Validators.required);
      component.control = control;
      expect(component.shouldShowErrors()).toBe(false);
    });
    
    it('should return false when control is invalid but pristine and untouched', () => {
      const control = new FormControl('', Validators.required);
      component.control = control;
      expect(component.shouldShowErrors()).toBe(false);
    });
    
    it('should return true when control is invalid, dirty and touched', () => {
      const control = new FormControl('', Validators.required);
      control.markAsDirty();
      control.markAsTouched();
      component.control = control;
      expect(component.shouldShowErrors()).toBe(true);
    });
    
    it('should return true when control is invalid, pristine but touched and showErrorsWhenPristine is true', () => {
      const control = new FormControl('', Validators.required);
      control.markAsTouched();
      component.control = control;
      component.showErrorsWhenPristine = true;
      expect(component.shouldShowErrors()).toBe(true);
    });
    
    it('should return true when control is invalid, dirty but untouched and showErrorsWhenUntouched is true', () => {
      const control = new FormControl('', Validators.required);
      control.markAsDirty();
      component.control = control;
      component.showErrorsWhenUntouched = true;
      expect(component.shouldShowErrors()).toBe(true);
    });
  });
  
  describe('updateErrorMessages', () => {
    it('should set empty array when control is null', () => {
      component.control = null;
      component.updateErrorMessages();
      expect(component.errorMessages).toEqual([]);
    });
    
    it('should set empty array when control has no errors', () => {
      const control = new FormControl('valid value', Validators.required);
      component.control = control;
      component.updateErrorMessages();
      expect(component.errorMessages).toEqual([]);
    });
    
    it('should use custom messages when provided', () => {
      const control = new FormControl('', Validators.required);
      component.control = control;
      component.customMessages = { required: 'Custom required message' };
      component.updateErrorMessages();
      expect(component.errorMessages).toContain('Custom required message');
    });
    
    it('should use error message from error object when available', () => {
      const control = new FormControl('');
      control.setErrors({ custom: { message: 'Custom error message' } });
      component.control = control;
      component.updateErrorMessages();
      expect(component.errorMessages).toContain('Custom error message');
    });
    
    it('should use default messages for standard validators', () => {
      const control = new FormControl('a', Validators.minLength(3));
      component.control = control;
      component.updateErrorMessages();
      expect(component.errorMessages.length).toBe(1);
      expect(component.errorMessages[0]).toContain('3 caracteres');
    });
  });
  
  describe('integration with host component', () => {
    it('should not show errors initially', () => {
      hostFixture.detectChanges();
      const errorElement = hostFixture.debugElement.query(By.css('.error-message'));
      expect(errorElement).toBeNull();
    });
    
    it('should show required error when field is empty, touched and dirty', () => {
      hostComponent.markAsTouched();
      hostComponent.markAsDirty();
      hostFixture.detectChanges();
      
      const errorElements = hostFixture.debugElement.queryAll(By.css('.error-message'));
      expect(errorElements.length).toBe(1);
      expect(errorElements[0].nativeElement.textContent).toContain('obligatorio');
    });
    
    it('should show minlength error when field is too short', () => {
      hostComponent.setValue('ab');
      hostComponent.markAsTouched();
      hostComponent.markAsDirty();
      hostFixture.detectChanges();
      
      const errorElements = hostFixture.debugElement.queryAll(By.css('.error-message'));
      expect(errorElements.length).toBe(1);
      expect(errorElements[0].nativeElement.textContent).toContain('3 caracteres');
    });
    
    it('should use custom messages when provided', () => {
      hostComponent.setCustomMessages({
        required: 'Campo requerido personalizado',
        minlength: 'Longitud mínima personalizada'
      });
      hostComponent.markAsTouched();
      hostComponent.markAsDirty();
      hostFixture.detectChanges();
      
      const errorElements = hostFixture.debugElement.queryAll(By.css('.error-message'));
      expect(errorElements.length).toBe(1);
      expect(errorElements[0].nativeElement.textContent).toContain('Campo requerido personalizado');
    });
    
    it('should not show errors when field is valid', () => {
      hostComponent.setValue('valid value');
      hostComponent.markAsTouched();
      hostComponent.markAsDirty();
      hostFixture.detectChanges();
      
      const errorElement = hostFixture.debugElement.query(By.css('.error-message'));
      expect(errorElement).toBeNull();
    });
  });
});
