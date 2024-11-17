import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RegisterService } from '../../../services/auth/register.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  registerError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) {
    this.registerForm = this.fb.group<any>({
      username: ['', {
        validators: [Validators.required, Validators.minLength(4)]
      }],
      email: ['', {
        validators: [Validators.required, Validators.email]
      }],
      password: ['', {
        validators: [Validators.required, Validators.minLength(6)]
      }],
      confirmPassword: ['', {
        validators: [Validators.required]
      }],
      nombre: ['', {
        validators: [Validators.required]
      }],
      apellido: ['', {
        validators: [Validators.required]
      }],
      cuit: ['', {
        validators: [Validators.required, Validators.pattern('^(\\d{2}-\\d{8}-\\d{1}|\\d{11})$')]
      }]
    }, {
      validators: RegisterComponent.passwordMatchValidator
    });
  }

  static passwordMatchValidator(g: AbstractControl): ValidationErrors | null {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');
    
    return password && confirmPassword && password.value === confirmPassword.value
      ? null 
      : { 'mismatch': true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.registerError = null;
      this.registerService.register(this.registerForm.value)
        .subscribe({
          next: (response) => {
            console.log('Usuario creado exitosamente', response);
            this.router.navigate(['/login']);
          },
          error: error => {
            if (error.status === 409) {
              this.registerError = 'El usuario o email ya existe';
            } else {
              this.registerError = 'Error al intentar registrar el usuario';
            }
          }
        });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  formatCuit(event: any) {
    let input = event.target.value.replace(/\D/g, ''); 
    let formattedCuit = '';

    if (input.length > 2) {
        formattedCuit += input.slice(0, 2) + '-'; 
        input = input.slice(2);
    }

    if (input.length > 8) {
        formattedCuit += input.slice(0, 8) + '-'; 
        input = input.slice(8);
    }

    formattedCuit += input; 
    event.target.value = formattedCuit;

    this.registerForm.get('cuit')?.setValue(formattedCuit);
  }
}
