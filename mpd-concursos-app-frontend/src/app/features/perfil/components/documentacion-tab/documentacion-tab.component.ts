import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { DocumentoUsuario, TipoDocumento } from '../../../../core/models/documento.model';
import { DocumentoUploadComponent } from '../documento-upload/documento-upload.component';
import { DocumentoViewerComponent } from '../documento-viewer/documento-viewer.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-documentacion-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule
  ],
  template: `
    <div class="documentacion-container">
      <div class="documentacion-header">
        <h3>
          <i class="fas fa-file-alt"></i>
          Documentación
        </h3>
        <button mat-raised-button color="primary" (click)="abrirDialogoCargaDocumento()">
          <i class="fas fa-plus"></i>
          Agregar documento
        </button>
      </div>
      
      <!-- Indicador de progreso -->
      <div class="documentacion-progress">
        <div class="progress-header">
          <span>Estado de tu documentación</span>
          <span class="progress-percentage">{{progresoDocumentacion}}%</span>
        </div>
        <mat-progress-bar 
          [value]="progresoDocumentacion" 
          [color]="progresoDocumentacion < 50 ? 'warn' : progresoDocumentacion < 100 ? 'accent' : 'primary'">
        </mat-progress-bar>
        <div class="progress-info">
          <span *ngIf="progresoDocumentacion < 100">
            <i class="fas fa-info-circle"></i>
            Te faltan {{documentosFaltantes}} documentos para completar tu perfil
          </span>
          <span *ngIf="progresoDocumentacion === 100">
            <i class="fas fa-check-circle"></i>
            ¡Has completado toda la documentación requerida!
          </span>
        </div>
      </div>
      
      <!-- Sección de documentos requeridos -->
      <div class="documentos-requeridos">
        <h4>Documentos requeridos</h4>
        <div class="documentos-grid">
          <div *ngFor="let tipo of documentosRequeridos" class="documento-card" 
               [class.completo]="isDocumentoSubido(tipo.id)">
            <div class="documento-icon">
              <i class="fas fa-file-pdf"></i>
              <div class="estado-badge" *ngIf="isDocumentoSubido(tipo.id)">
                <i class="fas fa-check"></i>
              </div>
            </div>
            <div class="documento-info">
              <h5>{{tipo.nombre}}</h5>
              <p *ngIf="tipo.descripcion">{{tipo.descripcion}}</p>
              <div class="documento-estado">
                <ng-container *ngIf="isDocumentoSubido(tipo.id); else pendiente">
                  <span class="estado-texto aprobado" *ngIf="getEstadoDocumento(tipo.id) === 'aprobado'">
                    <i class="fas fa-check-circle"></i> Aprobado
                  </span>
                  <span class="estado-texto pendiente" *ngIf="getEstadoDocumento(tipo.id) === 'pendiente'">
                    <i class="fas fa-clock"></i> Pendiente de revisión
                  </span>
                  <span class="estado-texto rechazado" *ngIf="getEstadoDocumento(tipo.id) === 'rechazado'">
                    <i class="fas fa-times-circle"></i> Rechazado
                  </span>
                </ng-container>
                <ng-template #pendiente>
                  <span class="estado-texto faltante">
                    <i class="fas fa-exclamation-triangle"></i> Pendiente de carga
                  </span>
                </ng-template>
              </div>
            </div>
            <div class="documento-actions">
              <ng-container *ngIf="isDocumentoSubido(tipo.id); else botonCargar">
                <button mat-icon-button color="primary" matTooltip="Ver documento" 
                        (click)="verDocumento(getDocumentoByTipo(tipo.id))">
                  <i class="fas fa-eye"></i>
                </button>
                <button mat-icon-button color="accent" matTooltip="Reemplazar documento" 
                        (click)="reemplazarDocumento(getDocumentoByTipo(tipo.id))">
                  <i class="fas fa-sync-alt"></i>
                </button>
                <button mat-icon-button color="warn" matTooltip="Eliminar documento" 
                        (click)="eliminarDocumento(getDocumentoByTipo(tipo.id))">
                  <i class="fas fa-trash"></i>
                </button>
              </ng-container>
              <ng-template #botonCargar>
                <button mat-stroked-button color="primary" (click)="cargarDocumentoTipo(tipo.id)">
                  <i class="fas fa-upload"></i>
                  Cargar
                </button>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabla de documentos cargados -->
      <div class="documentos-tabla" *ngIf="documentosUsuario.length > 0">
        <h4>Todos los documentos</h4>
        <table mat-table [dataSource]="documentosUsuario" class="mat-elevation-z2">
          <!-- Tipo Column -->
          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef>Tipo de documento</th>
            <td mat-cell *matCellDef="let documento">
              {{getTipoDocumentoNombre(documento.tipoDocumentoId)}}
            </td>
          </ng-container>
          
          <!-- Nombre Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre del archivo</th>
            <td mat-cell *matCellDef="let documento">{{documento.nombreArchivo}}</td>
          </ng-container>
          
          <!-- Fecha Column -->
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef>Fecha de carga</th>
            <td mat-cell *matCellDef="let documento">{{documento.fechaCarga | date:'dd/MM/yyyy'}}</td>
          </ng-container>
          
          <!-- Estado Column -->
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let documento">
              <span class="estado-badge-tabla" [ngClass]="documento.estado">
                <i class="fas" [ngClass]="getIconForStatus(documento.estado)"></i>
                {{getEstadoTexto(documento.estado)}}
              </span>
            </td>
          </ng-container>
          
          <!-- Acciones Column -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let documento">
              <button mat-icon-button color="primary" matTooltip="Ver documento" 
                      (click)="verDocumento(documento)">
                <i class="fas fa-eye"></i>
              </button>
              <button mat-icon-button color="accent" matTooltip="Reemplazar documento" 
                      (click)="reemplazarDocumento(documento)">
                <i class="fas fa-sync-alt"></i>
              </button>
              <button mat-icon-button color="warn" matTooltip="Eliminar documento" 
                      (click)="eliminarDocumento(documento)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let row; columns: columnas;"></tr>
        </table>
      </div>
      
      <!-- Estado vacío -->
      <div class="empty-state" *ngIf="documentosUsuario.length === 0 && !isLoading">
        <i class="fas fa-folder-open"></i>
        <h4>No has cargado ningún documento aún</h4>
        <p>Comienza cargando los documentos requeridos para completar tu perfil</p>
        <button mat-raised-button color="primary" (click)="abrirDialogoCargaDocumento()">
          <i class="fas fa-upload"></i>
          Cargar documento
        </button>
      </div>
      
      <!-- Loading state -->
      <div class="loading-state" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando documentos...</p>
      </div>
    </div>
  `,
  styles: [`
    .documentacion-container {
      padding: 1.5rem;
    }
    
    .documentacion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      
      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
        
        i {
          color: var(--primary-color);
        }
      }
    }
    
    .documentacion-progress {
      background-color: rgba(var(--surface-color-rgb), 0.5);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid var(--card-border);
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        
        span {
          color: var(--text-color);
          font-weight: 500;
        }
        
        .progress-percentage {
          color: var(--primary-color);
        }
      }
      
      .progress-info {
        margin-top: 0.75rem;
        color: var(--text-secondary);
        font-size: 0.9rem;
        
        i {
          margin-right: 0.5rem;
        }
      }
    }
    
    .documentos-requeridos {
      margin-bottom: 2rem;
      
      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: var(--text-color);
      }
    }
    
    .documentos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .documento-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      background-color: rgba(var(--surface-color-rgb), 0.5);
      border-radius: 8px;
      border: 1px solid var(--card-border);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      
      &.completo {
        border-left: 4px solid var(--primary-color);
      }
    }
    
    .documento-icon {
      position: relative;
      margin-right: 1rem;
      
      i {
        font-size: 2rem;
        color: #f44336;
      }
      
      .estado-badge {
        position: absolute;
        bottom: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        
        i {
          font-size: 0.7rem;
          color: white;
        }
      }
    }
    
    .documento-info {
      flex: 1;
      
      h5 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-color);
      }
      
      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
    }
    
    .documento-estado {
      .estado-texto {
        display: inline-flex;
        align-items: center;
        font-size: 0.85rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        
        i {
          margin-right: 0.25rem;
        }
        
        &.aprobado {
          background-color: rgba(76, 175, 80, 0.15);
          color: #4caf50;
        }
        
        &.pendiente {
          background-color: rgba(255, 152, 0, 0.15);
          color: #ff9800;
        }
        
        &.rechazado {
          background-color: rgba(244, 67, 54, 0.15);
          color: #f44336;
        }
        
        &.faltante {
          background-color: rgba(158, 158, 158, 0.15);
          color: #9e9e9e;
        }
      }
    }
    
    .documento-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .documentos-tabla {
      margin-bottom: 2rem;
      
      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 1rem;
        color: var(--text-color);
      }
      
      table {
        width: 100%;
        background-color: rgba(var(--surface-color-rgb), 0.5);
        
        th {
          color: var(--text-color);
          font-weight: 500;
        }
        
        td {
          color: var(--text-color);
        }
      }
    }
    
    .estado-badge-tabla {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      
      i {
        margin-right: 0.25rem;
      }
      
      &.aprobado {
        background-color: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }
      
      &.pendiente {
        background-color: rgba(255, 152, 0, 0.15);
        color: #ff9800;
      }
      
      &.rechazado {
        background-color: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      
      i {
        font-size: 4rem;
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }
      
      h4 {
        font-size: 1.2rem;
        font-weight: 500;
        margin: 0 0 0.5rem 0;
        color: var(--text-color);
      }
      
      p {
        margin: 0 0 1.5rem 0;
        color: var(--text-secondary);
      }
    }
    
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      
      p {
        margin-top: 1rem;
        color: var(--text-color);
      }
    }
  `]
})
export class DocumentacionTabComponent implements OnInit {
  isLoading = true;
  documentosUsuario: DocumentoUsuario[] = [];
  tiposDocumento: TipoDocumento[] = [];
  documentosRequeridos: TipoDocumento[] = [];
  progresoDocumentacion = 0;
  documentosFaltantes = 0;
  columnas: string[] = ['tipo', 'nombre', 'fecha', 'estado', 'acciones'];
  
  constructor(
    private documentosService: DocumentosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.cargarDatos();
  }
  
  cargarDatos(): void {
    this.isLoading = true;
    
    // Cargar tipos de documento
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
        this.documentosRequeridos = tipos.filter(t => t.requerido);
        
        // Cargar documentos del usuario
        this.cargarDocumentosUsuario();
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
        this.isLoading = false;
        this.mostrarError('Error al cargar los tipos de documento');
      }
    });
  }
  
  cargarDocumentosUsuario(): void {
    this.documentosService.getDocumentosUsuario()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (documentos) => {
          this.documentosUsuario = documentos;
          this.calcularProgreso();
        },
        error: (error) => {
          console.error('Error al cargar documentos del usuario:', error);
          this.mostrarError('Error al cargar tus documentos');
        }
      });
  }
  
  calcularProgreso(): void {
    if (this.documentosRequeridos.length === 0) {
      this.progresoDocumentacion = 100;
      this.documentosFaltantes = 0;
      return;
    }
    
    const documentosRequeridosCargados = this.documentosRequeridos.filter(tipo => 
      this.documentosUsuario.some(doc => 
        doc.tipoDocumentoId === tipo.id && doc.estado !== 'rechazado'
      )
    ).length;
    
    this.progresoDocumentacion = Math.round(
      (documentosRequeridosCargados / this.documentosRequeridos.length) * 100
    );
    
    this.documentosFaltantes = this.documentosRequeridos.length - documentosRequeridosCargados;
  }
  
  abrirDialogoCargaDocumento(tipoDocumentoId?: string): void {
    const dialogRef = this.dialog.open(DocumentoUploadComponent, {
      width: '600px',
      data: { tipoDocumentoId }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recargar documentos después de una carga exitosa
        this.cargarDocumentosUsuario();
      }
    });
  }
  
  cargarDocumentoTipo(tipoDocumentoId: string): void {
    this.abrirDialogoCargaDocumento(tipoDocumentoId);
  }
  
  verDocumento(documento: DocumentoUsuario): void {
    if (!documento || !documento.id) return;
    
    this.dialog.open(DocumentoViewerComponent, {
      width: '800px',
      height: '80vh',
      data: { documentoId: documento.id }
    });
  }
  
  reemplazarDocumento(documento: DocumentoUsuario): void {
    if (!documento || !documento.id) return;
    
    const dialogRef = this.dialog.open(DocumentoUploadComponent, {
      width: '600px',
      data: { tipoDocumentoId: documento.tipoDocumentoId }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Eliminar el documento anterior y recargar
        this.documentosService.deleteDocumento(documento.id!).subscribe({
          next: () => {
            this.cargarDocumentosUsuario();
          },
          error: (error) => {
            console.error('Error al reemplazar documento:', error);
            // Recargar de todos modos para mostrar el nuevo documento
            this.cargarDocumentosUsuario();
          }
        });
      }
    });
  }
  
  eliminarDocumento(documento: DocumentoUsuario): void {
    if (!documento || !documento.id) return;
    
    if (confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      this.documentosService.deleteDocumento(documento.id).subscribe({
        next: () => {
          this.mostrarExito('Documento eliminado correctamente');
          this.cargarDocumentosUsuario();
        },
        error: (error) => {
          console.error('Error al eliminar documento:', error);
          this.mostrarError('Error al eliminar el documento');
        }
      });
    }
  }
  
  isDocumentoSubido(tipoDocumentoId: string): boolean {
    return this.documentosUsuario.some(doc => doc.tipoDocumentoId === tipoDocumentoId);
  }
  
  getDocumentoByTipo(tipoDocumentoId: string): DocumentoUsuario {
    return this.documentosUsuario.find(doc => doc.tipoDocumentoId === tipoDocumentoId)!;
  }
  
  getEstadoDocumento(tipoDocumentoId: string): string {
    const documento = this.documentosUsuario.find(doc => doc.tipoDocumentoId === tipoDocumentoId);
    return documento ? documento.estado : '';
  }
  
  getTipoDocumentoNombre(tipoDocumentoId: string): string {
    const tipo = this.tiposDocumento.find(t => t.id === tipoDocumentoId);
    return tipo ? tipo.nombre : 'Desconocido';
  }
  
  getIconForStatus(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'fa-check-circle';
      case 'pendiente': return 'fa-clock';
      case 'rechazado': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }
  
  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'Pendiente de revisión';
      case 'rechazado': return 'Rechazado';
      default: return 'Desconocido';
    }
  }
  
  mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
  
  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
} 