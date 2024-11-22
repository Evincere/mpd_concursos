import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  fotoPerfil: string = 'assets/images/default-avatar.png';
  perfilForm!: FormGroup;
  linkedInConectado = false;

  constructor(private fb: FormBuilder) {
    this.initializeForms();
  }

  private initializeForms() {
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      cuit: ['', Validators.required],
      usuario: ['', Validators.required],
      experiencias: this.fb.array([]),
      educacion: this.fb.array([]),
      habilidades: this.fb.array([])
    });
  }

  // Getters para acceder a los FormArrays
  get experiencias() {
    return this.perfilForm.get('experiencias') as FormArray;
  }

  get educacion() {
    return this.perfilForm.get('educacion') as FormArray;
  }

  get habilidades() {
    return this.perfilForm.get('habilidades') as FormArray;
  }

  // Métodos para crear nuevos FormGroups
  private crearExperiencia(): FormGroup {
    return this.fb.group({
      puesto: ['', Validators.required],
      empresa: ['', Validators.required],
      fechaInicio: [null, Validators.required],
      fechaFin: [null],
      descripcion: ['']
    });
  }

  private crearEducacion(): FormGroup {
    return this.fb.group({
      titulo: ['', Validators.required],
      institucion: ['', Validators.required],
      fechaInicio: [null, Validators.required],
      fechaFin: [null],
      descripcion: ['']
    });
  }

  private crearHabilidad(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      nivel: ['', Validators.required]
    });
  }

  // Métodos para agregar elementos
  agregarExperiencia(): void {
    this.experiencias.push(this.crearExperiencia());
  }

  agregarEducacion(): void {
    this.educacion.push(this.crearEducacion());
  }

  agregarHabilidad(): void {
    this.habilidades.push(this.crearHabilidad());
  }

  // Métodos para eliminar elementos
  eliminarExperiencia(index: number): void {
    this.experiencias.removeAt(index);
  }

  eliminarEducacion(index: number): void {
    this.educacion.removeAt(index);
  }

  eliminarHabilidad(index: number): void {
    this.habilidades.removeAt(index);
  }

  ngOnInit(): void {
    // Cargar datos del usuario
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoPerfil = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  abrirSelectorArchivo(): void {
    this.fileInput.nativeElement.click();
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid) {
      console.log('Guardando perfil:', this.perfilForm.value);
    }
  }

  resetForm(): void {
    this.perfilForm.reset();
    // Aquí podrías cargar los datos originales del usuario
  }

  conectarLinkedIn(): void {
    this.linkedInConectado = !this.linkedInConectado;
    // Implementar integración con LinkedIn
  }

  // Método para convertir texto en array de letras
  splitLabel(text: string): { char: string, delay: string }[] {
    return text.split('').map((char, index) => ({
        char,
        delay: `${index * 50}ms`
    }));
  }
} 