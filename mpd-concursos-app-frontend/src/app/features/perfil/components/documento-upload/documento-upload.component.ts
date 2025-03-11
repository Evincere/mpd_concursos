import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { TipoDocumento } from '../../../../core/models/documento.model';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-documento-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="documento-upload-dialog">
      <h2 mat-dialog-title>
        <i class="fas fa-file-upload"></i>
        {{ data.tipoDocumentoId ? 'Cargar documento requerido' : 'Cargar nuevo documento' }}
      </h2>
      
      <mat-dialog-content>
        <form [formGroup]="documentoForm" class="documento-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de documento</mat-label>
            <mat-select formControlName="tipoDocumentoId" [disabled]="!!data.tipoDocumentoId">
              <mat-option *ngFor="let tipo of tiposDocumento" [value]="tipo.id">
                {{ tipo.nombre }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="documentoForm.get('tipoDocumentoId')?.hasError('required')">
              Debe seleccionar un tipo de documento
            </mat-error>
          </mat-form-field>
          
          <div class="file-upload-container" 
               [class.has-file]="selectedFile"
               [class.drag-over]="isDragging"
               (dragover)="onDragOver($event)" 
               (dragleave)="onDragLeave($event)" 
               (drop)="onDrop($event)">
            
            <ng-container *ngIf="!selectedFile; else fileSelected">
              <i class="fas fa-cloud-upload-alt upload-icon"></i>
              <p class="upload-text">Arrastra y suelta tu archivo PDF aquí</p>
              <p class="upload-divider">o</p>
              <button type="button" mat-raised-button color="primary" (click)="fileInput.click()">
                <i class="fas fa-file-upload"></i>
                Seleccionar archivo
              </button>
              <p class="upload-hint">Solo se permiten archivos PDF de máximo 5MB</p>
            </ng-container>
            
            <ng-template #fileSelected>
              <div class="selected-file" *ngIf="selectedFile">
                <i class="fas fa-file-pdf file-icon"></i>
                <div class="file-info">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
                <button type="button" mat-icon-button color="warn" (click)="removeFile()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </ng-template>
            
            <input type="file" #fileInput hidden accept="application/pdf" (change)="onFileSelected($event)">
          </div>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Comentarios (opcional)</mat-label>
            <textarea matInput formControlName="comentarios" rows="3"></textarea>
          </mat-form-field>
        </form>
        
        <div *ngIf="isUploading" class="upload-progress">
          <p>Subiendo documento...</p>
          <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
          <p class="progress-text">{{ uploadProgress }}%</p>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button [disabled]="isUploading" (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" 
                [disabled]="!documentoForm.valid || !selectedFile || isUploading"
                (click)="onSubmit()">
          <i class="fas fa-upload"></i>
          Cargar documento
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .documento-upload-dialog {
      padding: 1rem;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color);
      margin-bottom: 1.5rem;
      
      i {
        color: var(--primary-color);
      }
    }
    
    .documento-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .full-width {
      width: 100%;
    }
    
    .file-upload-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      border: 2px dashed rgba(var(--primary-color-rgb), 0.5);
      border-radius: 8px;
      background-color: rgba(var(--surface-color-rgb), 0.3);
      transition: all 0.3s ease;
      min-height: 200px;
      
      &.drag-over {
        border-color: var(--primary-color);
        background-color: rgba(var(--primary-color-rgb), 0.1);
      }
      
      &.has-file {
        border-style: solid;
        padding: 1.5rem;
      }
    }
    
    .upload-icon {
      font-size: 3rem;
      color: rgba(var(--primary-color-rgb), 0.7);
      margin-bottom: 1rem;
    }
    
    .upload-text {
      font-size: 1.1rem;
      color: var(--text-color);
      margin-bottom: 0.5rem;
    }
    
    .upload-divider {
      color: var(--text-secondary);
      margin: 0.5rem 0;
    }
    
    .upload-hint {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 1rem;
    }
    
    .selected-file {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 1rem;
    }
    
    .file-icon {
      font-size: 2.5rem;
      color: #f44336;
    }
    
    .file-info {
      flex: 1;
      
      .file-name {
        font-weight: 500;
        color: var(--text-color);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
      }
      
      .file-size {
        color: var(--text-secondary);
        margin: 0;
        font-size: 0.85rem;
      }
    }
    
    .upload-progress {
      margin-top: 1.5rem;
      
      p {
        margin: 0.5rem 0;
        color: var(--text-color);
      }
      
      .progress-text {
        text-align: center;
        font-weight: 500;
      }
    }
  `]
})
export class DocumentoUploadComponent implements OnInit {
  documentoForm: FormGroup;
  tiposDocumento: TipoDocumento[] = [];
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  
  constructor(
    private fb: FormBuilder,
    private documentosService: DocumentosService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<DocumentoUploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipoDocumentoId?: string }
  ) {
    this.documentoForm = this.fb.group({
      tipoDocumentoId: [data.tipoDocumentoId || '', Validators.required],
      comentarios: ['']
    });
  }
  
  ngOnInit(): void {
    this.cargarTiposDocumento();
  }
  
  cargarTiposDocumento(): void {
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
        this.snackBar.open('Error al cargar los tipos de documento', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }
  
  processFile(file: File): void {
    // Validar que sea un PDF
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Solo se permiten archivos PDF', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      this.snackBar.open('El archivo excede el tamaño máximo de 5MB', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.selectedFile = file;
  }
  
  removeFile(): void {
    this.selectedFile = null;
  }
  
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  }
  
  onSubmit(): void {
    if (this.documentoForm.valid && this.selectedFile) {
      this.isUploading = true;
      
      const formData = new FormData();
      // Asegurarnos de que el archivo se envíe como 'file'
      formData.append('file', this.selectedFile, this.selectedFile.name);
      formData.append('tipoDocumentoId', this.documentoForm.get('tipoDocumentoId')?.value);
      
      const comentarios = this.documentoForm.get('comentarios')?.value;
      if (comentarios) {
        formData.append('comentarios', comentarios);
      }

      // Imprimir el FormData para debug
      console.log('FormData contenido:', {
        file: this.selectedFile.name,
        tipoDocumentoId: this.documentoForm.get('tipoDocumentoId')?.value,
        comentarios: comentarios || 'no proporcionados'
      });

      this.documentosService.uploadDocumento(formData)
        .pipe(
          finalize(() => {
            this.isUploading = false;
            this.uploadProgress = 0;
          })
        )
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this.snackBar.open('Documento cargado exitosamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error al cargar documento:', error);
            this.snackBar.open(
              error.error?.message || 'Error al cargar el documento. Por favor, intente nuevamente.',
              'Cerrar',
              {
                duration: 5000,
                horizontalPosition: 'end',
                verticalPosition: 'top'
              }
            );
          }
        });
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
} 