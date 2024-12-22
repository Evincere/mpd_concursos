import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../../dashboard/components/header/header.component';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { LoginUser } from '../../../../core/models/login-user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    HeaderComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('loginFormContainer') loginFormContainer!: ElementRef;
  loginForm: FormGroup;
  loginError: string | null = null;
  hide: boolean = true;
  isFlipped: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.loginError = null;
      }
    });
  }

  ngAfterViewInit() {
    if (this.loginFormContainer && this.loginFormContainer.nativeElement) {
      const inputs = this.loginFormContainer.nativeElement.querySelectorAll('.login-input');
      if (inputs) {
        inputs.forEach((input: HTMLInputElement) => {
          input.addEventListener('input', () => {
            setTimeout(() => {
              input.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
              input.style.color = 'white';
            }, 100);
          });
        });
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginError = null;
      const loginData = new LoginUser(
        this.loginForm.get('username')?.value?.trim(),
        this.loginForm.get('password')?.value
      );

      if (!loginData.isValid()) {
        this.loginError = 'Por favor, complete todos los campos correctamente';
        return;
      }

      console.log('[LoginComponent] Enviando datos de login:', { 
        username: loginData.username,
        passwordValid: loginData.password?.length >= 6 
      });
      
      this.authService.handleLogin(loginData)
        .subscribe({
          next: (response) => {
            console.log('[LoginComponent] Login exitoso, redirigiendo...');
            this.router.navigate(['dashboard']);
          },
          error: (error: Error) => {
            console.error('[LoginComponent] Error en login:', error.message);
            this.loginError = error.message || 'Error al intentar iniciar sesión';

            setTimeout(() => {
              this.loginForm.get('password')?.reset();
              this.isFlipped = true;
            }, 3000);
          }
        });
    } else {
      this.loginError = 'Por favor, complete todos los campos correctamente';
      this.isFlipped = true;
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  onCardClick(): void {
    if (!this.isFlipped) {
      this.isFlipped = true;
    }
  }
}