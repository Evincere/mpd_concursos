import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { BsDatepickerModule, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { esLocale } from 'ngx-bootstrap/locale';

defineLocale('es', esLocale);

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
    MatSelectModule,
    ReactiveFormsModule,
    BsDatepickerModule
  ],
  providers: [
    BsLocaleService
  ],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  perfilForm!: FormGroup;
  fechaInicioControl = new FormControl('');
  fechaFinControl = new FormControl('');
  fechaEduInicioControl = new FormControl('');
  fechaEduFinControl = new FormControl('');
  bsConfig = {
    containerClass: 'theme-dark',
    dateInputFormat: 'DD/MM/YYYY',
    showWeekNumbers: false,
    adaptivePosition: true
  };
  fotoPerfil: string = 'assets/images/default-avatar.png';
  linkedInConectado = false;

  constructor(
    private fb: FormBuilder,
    private localeService: BsLocaleService
  ) {
    this.localeService.use('es');
    this.initializeForms();
  }

  ngOnInit(): void {
    // Cargar datos del usuario
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

  // Método para crear un nuevo grupo de experiencia
  createExperienciaFormGroup(): FormGroup {
    return this.fb.group({
      empresa: ['', Validators.required],
      puesto: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['']
    });
  }

  // Método para crear un nuevo grupo de educación
  createEducacionFormGroup(): FormGroup {
    return this.fb.group({
      institucion: ['', Validators.required],
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['']
    });
  }

  // Método para crear un nuevo grupo de habilidad
  createHabilidadFormGroup(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      nivel: ['', Validators.required]
    });
  }

  // Métodos para agregar elementos
  agregarExperiencia(): void {
    this.experiencias.push(this.createExperienciaFormGroup());
  }

  agregarEducacion(): void {
    this.educacion.push(this.createEducacionFormGroup());
  }

  agregarHabilidad(): void {
    this.habilidades.push(this.createHabilidadFormGroup());
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