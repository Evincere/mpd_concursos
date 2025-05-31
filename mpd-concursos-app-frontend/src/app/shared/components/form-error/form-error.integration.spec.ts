import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormErrorComponent } from './form-error.component';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

/**
 * Componente de prueba para integración con FormErrorComponent
 */
@Component({
  template: `
    <form [formGroup]="testForm">
      <div class="form-field">
        <label for="name">Nombre</label>
        <input id="name" formControlName="name" type="text">
        <app-form-error [control]="testForm.get('name')" [customMessages]="customMessages"></app-form-error>
      </div>
      
      <div class="form-field">
        <label for="email">Email</label>
        <input id="email" formControlName="email" type="email">
        <app-form-error [control]="testForm.get('email')"></app-form-error>
      </div>
      
      <button type="submit">Enviar</button>
    </form>
  `
})
class TestFormComponent {
  testForm: FormGroup;
  customMessages: Record<string, string> = {};
  
  constructor(private fb: FormBuilder) {
    this.testForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }
  
  setCustomMessages(messages: Record<string, string>): void {
    this.customMessages = messages;
  }
  
  markAllAsTouched(): void {
    this.testForm.markAllAsTouched();
  }
  
  markAllAsDirty(): void {
    Object.keys(this.testForm.controls).forEach(key => {
      const control = this.testForm.get(key);
      if (control) {
        control.markAsDirty();
      }
    });
  }
}

describe('FormErrorComponent - Integration', () => {
  let component: TestFormComponent;
  let fixture: ComponentFixture<TestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        FormErrorComponent
      ],
      declarations: [
        TestFormComponent
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should not show errors initially', () => {
    const errorElements = fixture.debugElement.queryAll(By.css('.error-message'));
    expect(errorElements.length).toBe(0);
  });
  
  it('should show required error when field is touched and dirty', () => {
    // Marcar campos como tocados y sucios
    component.markAllAsTouched();
    component.markAllAsDirty();
    fixture.detectChanges();
    
    // Verificar que se muestran los errores
    const errorElements = fixture.debugElement.queryAll(By.css('.error-message'));
    expect(errorElements.length).toBe(2); // Un error por cada campo
    
    // Verificar el mensaje de error del campo nombre
    const nameErrorText = errorElements[0].nativeElement.textContent;
    expect(nameErrorText).toContain('obligatorio');
    
    // Verificar el mensaje de error del campo email
    const emailErrorText = errorElements[1].nativeElement.textContent;
    expect(emailErrorText).toContain('obligatorio');
  });
  
  it('should show custom error messages when provided', () => {
    // Configurar mensajes personalizados
    component.setCustomMessages({
      required: 'Este campo es necesario',
      minlength: 'Debe tener al menos 3 caracteres'
    });
    
    // Marcar campos como tocados y sucios
    component.markAllAsTouched();
    component.markAllAsDirty();
    fixture.detectChanges();
    
    // Verificar que se muestran los mensajes personalizados
    const errorElements = fixture.debugElement.queryAll(By.css('.error-message'));
    const nameErrorText = errorElements[0].nativeElement.textContent;
    expect(nameErrorText).toContain('Este campo es necesario');
  });
  
  it('should show minlength error when name is too short', () => {
    // Establecer un valor demasiado corto
    const nameInput = fixture.debugElement.query(By.css('#name')).nativeElement;
    nameInput.value = 'ab';
    nameInput.dispatchEvent(new Event('input'));
    
    // Marcar campos como tocados y sucios
    component.markAllAsTouched();
    component.markAllAsDirty();
    fixture.detectChanges();
    
    // Verificar que se muestra el error de longitud mínima
    const errorElements = fixture.debugElement.queryAll(By.css('.error-message'));
    const nameErrorTexts = errorElements.map(el => el.nativeElement.textContent);
    
    // Puede haber múltiples errores (required y minlength)
    const hasMinLengthError = nameErrorTexts.some(text => text.includes('3 caracteres'));
    expect(hasMinLengthError).toBe(true);
  });
  
  it('should show email error when email format is invalid', () => {
    // Establecer un email inválido
    const emailInput = fixture.debugElement.query(By.css('#email')).nativeElement;
    emailInput.value = 'invalid-email';
    emailInput.dispatchEvent(new Event('input'));
    
    // Marcar campos como tocados y sucios
    component.markAllAsTouched();
    component.markAllAsDirty();
    fixture.detectChanges();
    
    // Verificar que se muestra el error de email
    const errorElements = fixture.debugElement.queryAll(By.css('.error-message'));
    const emailErrorElement = errorElements.find(el => 
      el.nativeElement.textContent.includes('correo electrónico válido')
    );
    
    expect(emailErrorElement).toBeTruthy();
  });
  
  it('should not show errors when fields are valid', () => {
    // Establecer valores válidos
    const nameInput = fixture.debugElement.query(By.css('#name')).nativeElement;
    nameInput.value = 'Valid Name';
    nameInput.dispatchEvent(new Event('input'));
    
    const emailInput = fixture.debugElement.query(By.css('#email')).nativeElement;
    emailInput.value = 'valid@example.com';
    emailInput.dispatchEvent(new Event('input'));
    
    // Marcar campos como tocados y sucios
    component.markAllAsTouched();
    component.markAllAsDirty();
    fixture.detectChanges();
    
    // Verificar que no se muestran errores
    const errorElements = fixture.debugElement.queryAll(By.css('.error-message'));
    expect(errorElements.length).toBe(0);
  });
});
