import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, FormControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DocumentService } from '../../../../shared/services/document.service';
import { ProfileService } from '@core/services/profile/profile.service';
import { EducacionFormControls } from '@core/interfaces/educacion/EducacionFormControls.interface';

@Component({
  selector: 'app-educacion',
  templateUrl: './educacion.component.html',
  styleUrls: ['./educacion.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})
export class EducacionComponent implements OnInit {
  educacionForm: FormGroup;
  tiposEducacion = [
    { value: 'TITULO', label: 'Título' },
    { value: 'CURSO', label: 'Curso' },
    { value: 'ACTIVIDAD_CIENTIFICA', label: 'Actividad Científica' }
  ];

  tiposActividadCientifica = [
    { value: 'PONENCIA', label: 'Ponencia' },
    { value: 'PUBLICACION', label: 'Publicación' },
    { value: 'INVESTIGACION', label: 'Investigación' }
  ];

  caracteresActividadCientifica = [
    { value: 'EXPOSITOR', label: 'Expositor' },
    { value: 'AUTOR', label: 'Autor' },
    { value: 'COAUTOR', label: 'Coautor' }
  ];

  constructor(
    private fb: FormBuilder,
    private perfilService: ProfileService,
    private documentService: DocumentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.educacionForm = this.fb.group({
      educacion: this.fb.array([])
    });
  }

  ngOnInit() {
    this.cargarEducacion();
  }

  get educacionArray() {
    return this.educacionForm.get('educacion') as FormArray;
  }

  cargarEducacion() {
    this.perfilService.getEducacion().subscribe({
      next: (educacion) => {
        educacion.forEach(edu => {
          this.agregarEducacionExistente(edu);
        });
      },
      error: (error) => {
        console.error('Error al cargar educación:', error);
        this.snackBar.open('Error al cargar la información de educación', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  private createEducacionFormGroup(tipo: string = ''): FormGroup<EducacionFormControls> {
    const basicFields = {
      id: new FormControl<number | null>(null),
      tipo: new FormControl<string>(tipo, { validators: Validators.required, nonNullable: true }),
      institucion: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
      titulo: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
      comentarios: new FormControl<string>('', { nonNullable: true })
    };

    switch (tipo) {
      case 'TITULO':
        return this.fb.group<EducacionFormControls>({
          ...basicFields,
          fechaEmision: new FormControl<Date | null>(null),
          documentoId: new FormControl<number | null>(null)
        });
      case 'CURSO':
        return this.fb.group<EducacionFormControls>({
          ...basicFields,
          cargaHoraria: new FormControl<number | null>(null, [Validators.min(1)]),
          evaluacionFinal: new FormControl<boolean>(false, { nonNullable: true }),
          fechaInicio: new FormControl<Date | null>(null),
          fechaFin: new FormControl<Date | null>(null)
        });
      case 'ACTIVIDAD_CIENTIFICA':
        return this.fb.group<EducacionFormControls>({
          ...basicFields,
          tipoActividad: new FormControl<string | null>(null),
          caracter: new FormControl<string | null>(null),
          lugarFechaExposicion: new FormControl<string | null>(null)
        });
      default:
        return this.fb.group<EducacionFormControls>(basicFields);
    }
  }

  agregarEducacion() {
    const formGroup = this.createEducacionFormGroup();
    
    Promise.resolve().then(() => {
      this.educacionArray.push(formGroup);
      
      const tipoControl = formGroup.controls['tipo'];
      if (tipoControl instanceof FormControl) {
        tipoControl.valueChanges.subscribe((tipo: string | null) => {
          if (!tipo) return;
          
          const index = this.educacionArray.controls.indexOf(formGroup);
          if (index === -1) return;

          Promise.resolve().then(() => {
            const newFormGroup = this.createEducacionFormGroup(tipo);
            Object.keys(formGroup.controls).forEach(key => {
              const control = newFormGroup.get(key);
              const value = formGroup.get(key)?.value;
              if (control && value !== undefined) {
                control.setValue(value, { emitEvent: false });
              }
            });

            this.educacionArray.setControl(index, newFormGroup);
            this.cdr.markForCheck();
          });
        });
      }
    });
  }

  agregarEducacionExistente(edu: any) {
    const formGroup = this.createEducacionFormGroup(edu.tipo);
    
    // Set values for all controls that exist in the form group
    Object.keys(edu).forEach(key => {
      if (formGroup.contains(key)) {
        formGroup.get(key)?.setValue(edu[key], { emitEvent: false });
      }
    });

    // Add the form group to the array
    Promise.resolve().then(() => {
      this.educacionArray.push(formGroup);
      this.cdr.markForCheck();
    });
  }

  trackByFn(index: number, item: any): number {
    return index;
  }

  eliminarEducacion(index: number) {
    // Remove form group asynchronously
    Promise.resolve().then(() => {
      this.educacionArray.removeAt(index);
      this.cdr.detectChanges();
    });
  }

  guardarEducacion() {
    if (this.educacionForm.valid) {
      const educacionData = this.educacionArray.value;
      
      this.perfilService.guardarEducacion(educacionData)
        .pipe(finalize(() => {
          // Handle completion asynchronously
          setTimeout(() => {
            this.snackBar.open('Información de educación guardada exitosamente', 'Cerrar', {
              duration: 3000
            });
          }, 0);
        }))
        .subscribe({
          error: (error: any) => {
            console.error('Error al guardar educación:', error);
            this.snackBar.open('Error al guardar la información de educación', 'Cerrar', {
              duration: 3000
            });
          }
        });
    } else {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
    }
  }

  cargarDocumentoEducacion(index: number) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx';
    fileInput.click();

    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.documentService.uploadDocument(file).subscribe({
          next: (response) => {
            this.educacionArray.at(index).patchValue({
              documentoId: response.id
            });
            this.snackBar.open('Documento cargado con éxito', 'Cerrar', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error al cargar documento:', error);
            this.snackBar.open('Error al cargar el documento', 'Cerrar', {
              duration: 3000
            });
          }
        });
      }
    };
  }

  verDocumentoEducacion(index: number) {
    const documentoId = this.educacionArray.at(index).get('documentoId')?.value;
    if (documentoId) {
      this.documentService.getDocumentUrl(documentoId).subscribe({
        next: (url) => {
          window.open(url, '_blank');
        },
        error: (error) => {
          console.error('Error al obtener URL del documento:', error);
          this.snackBar.open('Error al abrir el documento', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }

  eliminarDocumentoEducacion(index: number) {
    const documentoId = this.educacionArray.at(index).get('documentoId')?.value;
    if (documentoId) {
      this.documentService.deleteDocument(documentoId).subscribe({
        next: () => {
          this.educacionArray.at(index).patchValue({
            documentoId: null
          });
          this.snackBar.open('Documento eliminado con éxito', 'Cerrar', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error al eliminar documento:', error);
          this.snackBar.open('Error al eliminar el documento', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }
}