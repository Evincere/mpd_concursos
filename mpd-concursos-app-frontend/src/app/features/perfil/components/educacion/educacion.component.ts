import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-educacion',
  templateUrl: './educacion.component.html',
  styleUrls: ['./educacion.component.scss'],
  standalone: true,
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
    private perfilService: ProfileService, // Need to import PerfilService
    private documentService: DocumentService, // Need to import DocumentService
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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

  agregarEducacion() {
    const educacionGroup = this.fb.group({
      id: [null],
      tipo: ['', Validators.required],
      institucion: ['', Validators.required],
      titulo: ['', Validators.required],
      fechaEmision: [null],
      documentoId: [null],
      cargaHoraria: [null, [Validators.min(1)]],
      evaluacionFinal: [false],
      tipoActividad: [null],
      caracter: [null],
      lugarFechaExposicion: [null],
      comentarios: [''],
      fechaInicio: [null],
      fechaFin: [null]
    });

    // Add form group asynchronously to prevent UI blocking
    setTimeout(() => {
      this.educacionArray.push(educacionGroup);
    }, 0);
  }

  agregarEducacionExistente(edu: any) {
    const educacionGroup = this.fb.group({
      id: [edu.id],
      tipo: [edu.tipo, Validators.required],
      institucion: [edu.institucion, Validators.required],
      titulo: [edu.titulo, Validators.required],
      fechaEmision: [edu.fechaEmision],
      documentoId: [edu.documentoId],
      cargaHoraria: [edu.cargaHoraria, [Validators.min(1)]],
      evaluacionFinal: [edu.evaluacionFinal],
      tipoActividad: [edu.tipoActividad],
      caracter: [edu.caracter],
      lugarFechaExposicion: [edu.lugarFechaExposicion],
      comentarios: [edu.comentarios],
      fechaInicio: [edu.fechaInicio],
      fechaFin: [edu.fechaFin]
    });

    // Add existing education asynchronously
    setTimeout(() => {
      this.educacionArray.push(educacionGroup);
    }, 0);
  }

  eliminarEducacion(index: number) {
    // Remove form group asynchronously
    setTimeout(() => {
      this.educacionArray.removeAt(index);
    }, 0);
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