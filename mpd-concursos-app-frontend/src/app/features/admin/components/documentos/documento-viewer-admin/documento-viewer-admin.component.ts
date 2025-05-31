import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { DocumentoUsuario } from '../../../../../core/models/documento.model';
import { MatSnackBarModule, MatSnackBar } from  '@angular/material/snack-bar';

interface Anotacion {
  id: string;
  texto: string;
  posicionX: number;
  posicionY: number;
  autor: string;
  fecha: Date;
}

@Component({
  selector: 'app-documento-viewer-admin',
  templateUrl: './documento-viewer-admin.component.html',
  styleUrls: ['./documento-viewer-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    FormsModule
  ]
})
export class DocumentoViewerAdminComponent implements OnInit, AfterViewInit {
  @Input() documento!: DocumentoUsuario;
  @ViewChild('pdfViewer') pdfViewer!: ElementRef<HTMLDivElement>;
  @ViewChild('anotacionInput') anotacionInput!: ElementRef<HTMLInputElement>;

  documentoUrl = '';
  cargando = true;
  error = false;
  escala = 1;
  rotacion = 0;
  pagina = 1;
  totalPaginas = 1;
  modoAnotacion = false;
  anotacionTexto = '';
  anotaciones: Anotacion[] = [];
  anotacionTemporal: { x: number, y: number } | null = null;

  constructor(
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.documento && this.documento.id) {
      this.cargarDocumento();
      this.cargarAnotaciones();
    }
  }

  ngAfterViewInit(): void {
    if (this.pdfViewer) {
      this.pdfViewer.nativeElement.addEventListener('click', (event) => {
        if (this.modoAnotacion) {
          this.crearAnotacionTemporal(event);
        }
      });
    }
  }

  cargarDocumento(): void {
    this.cargando = true;
    this.error = false;

    // En una implementación real, obtendríamos la URL del documento desde el backend
    // Por ahora, simulamos una URL para desarrollo
    setTimeout(() => {
      this.documentoUrl = 'assets/sample-document.pdf';
      this.cargando = false;
      this.totalPaginas = 5; // Simulado para desarrollo
    }, 1000);
  }

  cargarAnotaciones(): void {
    if (this.documento.id) {
      // Simulamos la carga de anotaciones para desarrollo
      setTimeout(() => {
        this.anotaciones = [
          {
            id: '1',
            texto: 'Anotación de ejemplo',
            posicionX: 20,
            posicionY: 30,
            autor: 'Admin',
            fecha: new Date()
          }
        ];
      }, 1000);
    }
  }

  acercar(): void {
    this.escala = Math.min(this.escala + 0.25, 3);
  }

  alejar(): void {
    this.escala = Math.max(this.escala - 0.25, 0.5);
  }

  rotar(): void {
    this.rotacion = (this.rotacion + 90) % 360;
  }

  paginaAnterior(): void {
    if (this.pagina > 1) {
      this.pagina--;
    }
  }

  paginaSiguiente(): void {
    if (this.pagina < this.totalPaginas) {
      this.pagina++;
    }
  }

  toggleModoAnotacion(): void {
    this.modoAnotacion = !this.modoAnotacion;
    if (!this.modoAnotacion) {
      this.anotacionTemporal = null;
    }
  }

  crearAnotacionTemporal(event: MouseEvent): void {
    const rect = this.pdfViewer.nativeElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.anotacionTemporal = { x, y };

    // Enfocar el input de anotación
    setTimeout(() => {
      if (this.anotacionInput) {
        this.anotacionInput.nativeElement.focus();
      }
    }, 100);
  }

  guardarAnotacion(): void {
    if (this.documento.id && this.anotacionTemporal && this.anotacionTexto.trim()) {
      // Simulamos la creación de una anotación para desarrollo
      const nuevaAnotacion: Anotacion = {
        id: Date.now().toString(), // Generamos un ID único basado en timestamp
        texto: this.anotacionTexto,
        posicionX: this.anotacionTemporal.x,
        posicionY: this.anotacionTemporal.y,
        autor: 'Admin', // En una implementación real, obtener del usuario actual
        fecha: new Date()
      };

      // Añadir la nueva anotación a la lista
      this.anotaciones.push(nuevaAnotacion);

      // Limpiar
      this.anotacionTexto = '';
      this.anotacionTemporal = null;
      this.snackBar.open('Anotación guardada', 'Cerrar', { duration: 3000 });
    }
  }

  cancelarAnotacion(): void {
    this.anotacionTexto = '';
    this.anotacionTemporal = null;
  }

  getAnotacionStyle(anotacion: Anotacion): { left: string; top: string } {
    return {
      left: `${anotacion.posicionX}%`,
      top: `${anotacion.posicionY}%`
    };
  }
}
