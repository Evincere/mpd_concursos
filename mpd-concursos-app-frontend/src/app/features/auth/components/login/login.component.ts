import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
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

    // Suscribirse a cambios en cualquier campo del formulario
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginError) {
        this.loginError = null;
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loginError = null;
      this.authService.handleLogin(this.loginForm.value)
        .subscribe({
          next: () => {
            this.router.navigate(['dashboard']);
          },
          error: error => {
            if (error.status === 404) {
              this.loginError = 'Usuario no registrado';
            } else if (error.status === 401) {
              this.loginError = 'Credenciales incorrectas';
            } else {
              this.loginError = 'Error al intentar iniciar sesión';
            }
            setTimeout(() => {
              this.loginForm.reset();
              this.isFlipped = true;
            }, 2000);
          }
        });
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
