import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  perfilForm: FormGroup;
  experienciaForm: FormGroup;
  educacionForm: FormGroup;
  linkedInConectado = false;

  constructor(private fb: FormBuilder) {
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      cuit: ['', Validators.required],
      usuario: ['', Validators.required]
    });

    this.experienciaForm = this.fb.group({
      puesto: [''],
      empresa: [''],
      fechaInicio: [''],
      fechaFin: [''],
      descripcion: ['']
    });

    this.educacionForm = this.fb.group({
      titulo: [''],
      institucion: [''],
      fechaInicio: [''],
      fechaFin: [''],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    // Cargar datos del usuario
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    // Implementar lógica para subir la imagen
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid) {
      // Implementar guardado
    }
  }

  conectarLinkedIn(): void {
    this.linkedInConectado = !this.linkedInConectado;
    // Implementar integración con LinkedIn
  }

  agregarExperiencia(): void {
    if (this.experienciaForm.valid) {
      // Implementar agregar experiencia
    }
  }

  agregarEducacion(): void {
    if (this.educacionForm.valid) {
      // Implementar agregar educación
    }
  }
} 