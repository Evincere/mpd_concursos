import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../../services/auth/register.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { NewUser } from '../../../services/auth/new-user';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  animations: [
    trigger('messageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  fieldErrors: Map<string, string> = new Map();
  activeErrors: Array<{
    type: 'error' | 'success' | 'warning',
    title: string,
    message: string,
    id: number
  }> = [];
  isLoading = false;
  showMessage = false;
  isSuccess = false;
  responseMessage = '';

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      apellido: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d{1}$/)]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  formatCuit(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Elimina todo excepto números
    if (value.length <= 11) {
      if (value.length > 2) {
        value = value.substring(0, 2) + '-' + value.substring(2);
      }
      if (value.length > 10) {
        value = value.substring(0, 11) + '-' + value.substring(11, 12);
      }
      this.registerForm.patchValue({ cuit: value }, { emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.fieldErrors.clear();
      
      const userData: NewUser = {
        ...this.registerForm.value,
        cuit: this.registerForm.get('cuit')?.value.replace(/-/g, ''),
        roles: new Set<string>(['ROLE_USER'])
      };

      this.registerService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showMessage = true;
          this.isSuccess = true;
          this.responseMessage = 'Registro exitoso! Redirigiendo al login...';

          setTimeout(() => {
            
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 500);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.showMessage = true;
          this.isSuccess = false;
          
          if (error.field === 'general') {
            this.responseMessage = error.message;
          } else {
            console.log(`Campo: ${error.field}, Mensaje: ${error.message}`);
            this.fieldErrors.set(error.field, error.message);
            this.registerForm.get(error.field)?.setErrors({ serverError: true });
            this.responseMessage = `Error: ${error.message}`;
            
            const fieldName = error.field.toLowerCase();
            const inputElement = document.querySelector(`.user-box input[formControlName="${fieldName}"]`);
            
            if (inputElement) {
              console.log(`Elemento de entrada encontrado para el campo: ${fieldName}`);
              const userBox = inputElement.closest('.user-box');
              if (userBox) {
                console.log(`Caja de usuario encontrada para el campo: ${fieldName}`);
                document.querySelectorAll('.user-box').forEach(box => {
                  box.classList.remove('error-highlight');
                });
                
                userBox.classList.add('error-highlight');
                console.log(`Error resaltado para el campo: ${fieldName}`);
                setTimeout(() => {
                  userBox.classList.remove('error-highlight');
                  console.log(`Error desresaltado para el campo: ${fieldName}`);
                }, 5000);
              }
            }
          }

          setTimeout(() => {
            this.showMessage = false;
            console.log('Mensaje de error oculto después de 3 segundos');
          }, 3000);
        }
      });
    }
  }

  passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');
    
    return password && confirmPassword && password.value === confirmPassword.value
      ? null 
      : { 'mismatch': true };
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    // Inicialización del componente
  }

  onInputFocus(event: FocusEvent): void {
    const element = event.target as HTMLElement;
    setTimeout(() => {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 100);
  }

  getFieldError(fieldName: string): string {
    return this.fieldErrors.get(fieldName) || '';
  }

  hasFieldError(fieldName: string): boolean {
    return this.fieldErrors.has(fieldName);
  }

  showError(message: string, field: string) {
    const error = {
      type: 'error' as const,
      title: this.getErrorTitle(field),
      message: message,
      id: Date.now()
    };
    
    this.activeErrors.push(error);
    
    // Remover el mensaje después de 5 segundos
    setTimeout(() => {
      this.activeErrors = this.activeErrors.filter(e => e.id !== error.id);
    }, 5000);
  }

  private getErrorTitle(field: string): string {
    const titles: { [key: string]: string } = {
      email: 'Error en el Email',
      username: 'Error en el Usuario',
      password: 'Error en la Contraseña',
      general: 'Error en el Registro',
      // Agregar más campos según necesites
    };
    return titles[field] || 'Error de Validación';
  }
}
