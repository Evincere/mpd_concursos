import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { RegisterService } from '../../../../core/services/auth/register.service';
import { NewUser } from '../../../../shared/interfaces/auth/new-user.interface';
import { Subscription } from 'rxjs';

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
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  fieldErrors: Map<string, string> = new Map();
  activeErrors: { type: string; title: string; message: string }[] = [];
  isLoading = false;
  showMessage = false;
  isSuccess = false;
  responseMessage = '';
  private subscription = new Subscription();

  // Variable para controlar la visibilidad del modal de términos y condiciones
  showTermsModal = false;
  // Variable para controlar la visibilidad del indicador de scroll
  showScrollIndicator = false;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = fb.nonNullable.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      cuit: ['', [Validators.required, Validators.pattern(/^\d{2}-\d{8}-\d{1}$/)]],
      termsAccepted: [false, Validators.requiredTrue]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Comprobar si el formulario necesita scroll después de una breve espera para permitir el renderizado
    setTimeout(() => this.checkFormOverflow(), 500);

    // Añadir listeners para eventos de scroll y redimensionamiento de ventana
    window.addEventListener('resize', this.checkFormOverflow.bind(this));

    // Mejorar el listener de scroll con un método debounced
    setTimeout(() => {
      const registerBox = document.querySelector('.register-box');
      if (registerBox) {
        registerBox.addEventListener('scroll', () => {
          // Utilizar el método checkFormOverflow para manejar tanto el scroll como el inicio
          this.checkFormOverflow();
        });
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();

    // Eliminar listeners para evitar memory leaks
    window.removeEventListener('resize', this.checkFormOverflow.bind(this));
    const registerBox = document.querySelector('.register-box');
    if (registerBox) {
      registerBox.removeEventListener('scroll', this.checkFormOverflow.bind(this));
    }
  }

  // Método para verificar si el contenido del formulario requiere scroll
  checkFormOverflow(): void {
    const registerBox = document.querySelector('.register-box');
    if (!registerBox) return;

    // Calcular la proporción del contenido visible vs. el contenido total
    const scrollHeight = registerBox.scrollHeight;
    const visibleHeight = registerBox.clientHeight;
    const scrollTop = registerBox.scrollTop;

    // Mostrar el indicador si hay contenido oculto abajo Y el usuario está cerca de la parte superior
    const hasHiddenContent = scrollHeight > visibleHeight + 50; // Añadimos un pequeño margen
    const isNearTop = scrollTop < 100; // Mostrar en la parte superior del formulario

    // Actualizar la visibilidad del indicador: mostrar cuando hay contenido oculto y estamos en la parte superior
    this.showScrollIndicator = hasHiddenContent && isNearTop;
  }

  // Método para hacer scroll al hacer clic en el indicador
  scrollToBottom(): void {
    const registerBox = document.querySelector('.register-box');
    if (registerBox) {
      // Calcular una posición razonable para desplazarse (un tercio del contenido)
      const scrollAmount = Math.min(300, (registerBox.scrollHeight - registerBox.clientHeight) / 2);

      // Usar scrollBy para un desplazamiento relativo más natural
      registerBox.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });

      // Esconder el indicador inmediatamente al hacer clic
      this.showScrollIndicator = false;
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { mismatch: true };
    }

    return null;
  }

  hasFieldError(field: string): boolean {
    return this.fieldErrors.has(field);
  }

  getFieldError(field: string): string {
    return this.fieldErrors.get(field) || '';
  }

  onInputFocus(event: FocusEvent): void {
    const inputElement = event.target as HTMLInputElement;
    const fieldName = inputElement.getAttribute('formcontrolname');
    if (fieldName && this.fieldErrors.has(fieldName)) {
      this.fieldErrors.delete(fieldName);
    }
  }

  formatCuit(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    let formatted = '';
    if (value.length > 0) {
      formatted = value.slice(0, 2);
      if (value.length > 2) {
        formatted += '-' + value.slice(2, 10);
        if (value.length > 10) {
          formatted += '-' + value.slice(10);
        }
      }
    }

    input.value = formatted;
    this.registerForm.get('cuit')?.setValue(formatted);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    // Asegurarnos de que los términos sean marcados como tocados si no están aceptados
    this.ensureTermsFieldTouched();

    if (this.registerForm.invalid) {
      // Marcar todos los campos como tocados para mostrar los errores
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.fieldErrors.clear();
    this.activeErrors = [];

    const formValue = this.registerForm.value;
    const userData: NewUser = {
      username: formValue.username!,
      email: formValue.email!,
      password: formValue.password!,
      confirmPassword: formValue.confirmPassword!,
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      dni: formValue.dni!,
      cuit: formValue.cuit!.replace(/-/g, ''),
      roles: new Set<string>(['ROLE_USER'])
    };

    this.subscription.add(
      this.registerService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.showMessage = true;
          this.isSuccess = true;
          this.responseMessage = 'Registro exitoso! Redirigiendo al login...';

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 500);
        },
        error: (error) => {
          this.isLoading = false;
          this.showMessage = true;
          this.isSuccess = false;

          if (error.error?.fieldErrors) {
            this.handleFieldErrors(error.error.fieldErrors);
            this.responseMessage = 'Error en el registro, verifique los datos ingresados.';
          } else {
            this.responseMessage = error.error?.message || 'Error en el servidor. Intente más tarde.';
            this.activeErrors.push({
              type: 'error',
              title: 'Error',
              message: this.responseMessage
            });
          }

          setTimeout(() => {
            this.showMessage = false;
          }, 3000);
        }
      })
    );
  }

  handleFieldErrors(fieldErrors: any[]): void {
    fieldErrors.forEach(fieldError => {
      this.fieldErrors.set(fieldError.field, fieldError.message);

      this.activeErrors.push({
        type: 'error',
        title: this.getErrorTitle(fieldError.field),
        message: fieldError.message
      });
    });
  }

  getErrorTitle(field: string): string {
    const titles: { [key: string]: string } = {
      username: 'Error en nombre de usuario',
      email: 'Error en correo electrónico',
      password: 'Error en contraseña',
      firstName: 'Error en nombre',
      lastName: 'Error en apellido',
      dni: 'Error en DNI',
      cuit: 'Error en CUIT'
    };

    return titles[field] || 'Error de Validación';
  }

  // Método para mostrar el modal con los términos y condiciones
  openTermsModal(): void {
    this.showTermsModal = true;
  }

  // Método para cerrar el modal
  closeTermsModal(): void {
    this.showTermsModal = false;
  }

  // Método para aceptar los términos y condiciones
  acceptTerms(): void {
    this.registerForm.get('termsAccepted')?.setValue(true);
    this.closeTermsModal();
  }

  // Método para marcar los términos como tocados para mostrar error visual
  ensureTermsFieldTouched(): void {
    const termsControl = this.registerForm.get('termsAccepted');
    if (termsControl && !termsControl.value) {
      termsControl.markAsTouched();

      // Añadir animación visual para llamar la atención
      const termsLabel = document.querySelector('.terms-required');
      if (termsLabel) {
        termsLabel.classList.remove('terms-required');
        setTimeout(() => {
          termsLabel.classList.add('terms-required');
        }, 10);
      }
    }
  }
}
