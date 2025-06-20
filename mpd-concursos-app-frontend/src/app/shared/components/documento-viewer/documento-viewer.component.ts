import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, UnifiedDialogRef } from '@shared/services/dialog/unified-dialog.service';
import { CustomButtonComponent } from '../custom-form/custom-button/custom-button.component';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { SafePipe } from '@shared/pipes/safe.pipe';

@Component({
  selector: 'app-documento-viewer',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent, SafePipe],
  template: `
    <div class="documento-viewer">
      <div class="header">
        <h2>Visualizador de documento</h2>
        <app-custom-button
          variant="icon"
          icon="fa-times"
          (buttonClick)="cerrar()">
        </app-custom-button>
      </div>
      <div class="content" *ngIf="documentUrl">
        <iframe [src]="documentUrl | safe" width="100%" height="100%"></iframe>
      </div>
      <div class="loading" *ngIf="!documentUrl">
        <span>Cargando documento...</span>
      </div>
    </div>
  `,
  styles: [`
    .documento-viewer {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .content {
      flex: 1;
      overflow: hidden;
    }

    .content iframe {
      border: none;
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  `]
})
export class DocumentoViewerComponent {
  documentUrl: string | null = null;

  constructor(
    @Inject(DIALOG_DATA) private data: { documentoId: string },
    private documentosService: DocumentosService,
    private dialogRef: UnifiedDialogRef
  ) {
    this.cargarDocumento();
  }

  private async cargarDocumento(): Promise<void> {
    try {
      if (!this.data.documentoId) {
        console.error('No se proporcionó ID de documento');
        return;
      }

      // Usar el servicio para obtener el archivo como blob y crear URL
      this.documentosService.getDocumentoFile(this.data.documentoId).subscribe({
        next: (response) => {
          // Verificar si la respuesta es un Blob directamente
          if (response instanceof Blob) {
            this.documentUrl = URL.createObjectURL(response);
          }
        },
        error: (error) => {
          console.error('Error al cargar el documento:', error);
        }
      });
    } catch (error) {
      console.error('Error al cargar el documento:', error);
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
