import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Componentes personalizados
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';

@Component({
  selector: 'app-comunicaciones-admin',
  template: `
    <div class="comunicaciones-container">
      <h1>Comunicaciones Masivas</h1>
      <form [formGroup]="comunicacionForm">
        <div class="form-row">
          <label>Asunto</label>
          <input type="text" formControlName="subject" />
        </div>
        <div class="form-row">
          <label>Contenido</label>
          <textarea formControlName="content"></textarea>
        </div>
        <div class="form-row">
          <label>Programar Envío (Opcional)</label>
          <input type="date" formControlName="scheduledTime" />
        </div>
        <div class="form-row">
          <label>
            <input type="checkbox" formControlName="sendToAllUsers" />
            Enviar a todos los usuarios
          </label>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .comunicaciones-container {
      padding: 20px;
    }
    .form-row {
      margin-bottom: 15px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CustomFormModule
  ]
})
export class ComunicacionesAdminComponent {
  comunicacionForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.comunicacionForm = this.fb.group({
      subject: ['', [Validators.required]],
      content: ['', [Validators.required]],
      scheduledTime: [null],
      sendToAllUsers: [false]
    });
  }
}
