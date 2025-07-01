import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TipoDocumento, EstadoDocumento } from  '../../../../core/models/documento.model';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { AdminDocumentosService, DocumentoAdminView, EstadisticasDocumentos, DocumentoFiltros } from '../../../../core/services/admin/admin-documentos.service';
import { DocumentoViewerDialogComponent } from './documento-viewer-dialog/documento-viewer-dialog.component';

// La interfaz DocumentoAdminView ahora se importa desde el servicio

@Component({
  selector: 'app-documentos-admin',
  templateUrl: './documentos-admin.component.html',
  styleUrls: ['./documentos-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTabsModule,
    MatTooltipModule,
    MatBadgeModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class DocumentosAdminComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'nombreArchivo', 'tipoDocumento', 'usuario', 'fechaCarga', 'estado', 'acciones'];
  dataSource: MatTableDataSource<DocumentoAdminView>;
  tiposDocumento: TipoDocumento[] = [];
  estadisticas: EstadisticasDocumentos = {
    totalDocumentos: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    porTipo: {}
  };
  filtroEstado = '';
  filtroTipoDocumento = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos de ejemplo para desarrollo
  documentos: DocumentoAdminView[] = [
    {
      id: '1',
      tipoDocumentoId: '1',
      tipoDocumento: { id: '1', code: 'DNI', nombre: 'DNI', requerido: true },
      nombreArchivo: 'dni_frente.pdf',
      fechaCarga: new Date(2023, 5, 15),
      estado: EstadoDocumento.PENDIENTE,
      nombreUsuario: 'Juan Pérez',
      emailUsuario: 'juan.perez@example.com'
    },
    {
      id: '2',
      tipoDocumentoId: '2',
      tipoDocumento: { id: '2', code: 'TITULO', nombre: 'Título Universitario', requerido: true },
      nombreArchivo: 'titulo_abogado.pdf',
      fechaCarga: new Date(2023, 5, 14),
      estado: EstadoDocumento.APROBADO,
      validadoPor: 'admin',
      fechaValidacion: new Date(2023, 5, 16),
      nombreUsuario: 'María López',
      emailUsuario: 'maria.lopez@example.com'
    },
    {
      id: '3',
      tipoDocumentoId: '3',
      tipoDocumento: { id: '3', code: 'CERT_PENAL', nombre: 'Certificado de Antecedentes Penales', requerido: true },
      nombreArchivo: 'antecedentes_penales.pdf',
      fechaCarga: new Date(2023, 5, 13),
      estado: EstadoDocumento.RECHAZADO,
      validadoPor: 'admin',
      fechaValidacion: new Date(2023, 5, 17),
      motivoRechazo: 'Documento ilegible',
      nombreUsuario: 'Carlos Gómez',
      emailUsuario: 'carlos.gomez@example.com'
    }
  ];

  constructor(
    private documentosService: DocumentosService,
    private adminDocumentosService: AdminDocumentosService,
    private notificationService: UnifiedNotificationService,
    private dialog: MatDialog
  ) {
    // Inicializar dataSource con datos de ejemplo
    this.dataSource = new MatTableDataSource(this.documentos);
  }

  ngOnInit(): void {
    // Cargar tipos de documento
    this.cargarTiposDocumento();

    // Cargar estadísticas
    this.cargarEstadisticas();

    // Cargar documentos
    this.cargarDocumentos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarTiposDocumento(): void {
    this.documentosService.getTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento = tipos;
      },
      error: (error) => {
        console.error('Error al cargar tipos de documento:', error);
        this.notificationService.error('Error al cargar tipos de documento');
      }
    });
  }

  cargarEstadisticas(): void {
    // En una implementación real, obtendríamos las estadísticas del backend
    // Por ahora, usamos datos de ejemplo
    this.adminDocumentosService.getEstadisticas().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.notificationService.error('Error al cargar estadísticas');

        // Calcular estadísticas localmente con los datos de ejemplo
        this.calcularEstadisticasLocales();
      }
    });
  }

  calcularEstadisticasLocales(): void {
    this.estadisticas.totalDocumentos = this.documentos.length;
    this.estadisticas.pendientes = this.documentos.filter(d => d.estado === EstadoDocumento.PENDIENTE).length;
    this.estadisticas.aprobados = this.documentos.filter(d => d.estado === EstadoDocumento.APROBADO).length;
    this.estadisticas.rechazados = this.documentos.filter(d => d.estado === EstadoDocumento.RECHAZADO).length;

    // Calcular estadísticas por tipo de documento
    const porTipo: Record<string, number> = {};
    this.documentos.forEach(doc => {
      const tipoNombre = doc.tipoDocumento?.nombre || 'Desconocido';
      porTipo[tipoNombre] = (porTipo[tipoNombre] || 0) + 1;
    });
    this.estadisticas.porTipo = porTipo;
  }

  cargarDocumentos(filtros?: DocumentoFiltros): void {
    // En una implementación real, obtendríamos los documentos del backend
    // Por ahora, usamos datos de ejemplo
    this.adminDocumentosService.getDocumentos(filtros).subscribe({
      next: (response) => {
        this.dataSource.data = response.documentos;
      },
      error: (error) => {
        console.error('Error al cargar documentos:', error);
        this.notificationService.error('Error al cargar documentos');

        // Usar datos de ejemplo
        this.dataSource.data = this.documentos;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filtrarPorEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  filtrarPorTipoDocumento(tipoId: string): void {
    this.filtroTipoDocumento = tipoId;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.dataSource.data = this.documentos.filter(doc => {
      let cumpleFiltroEstado = true;
      let cumpleFiltroTipo = true;

      if (this.filtroEstado) {
        cumpleFiltroEstado = doc.estado === this.filtroEstado;
      }

      if (this.filtroTipoDocumento) {
        cumpleFiltroTipo = doc.tipoDocumentoId === this.filtroTipoDocumento;
      }

      return cumpleFiltroEstado && cumpleFiltroTipo;
    });
  }

  verDocumento(documento: DocumentoAdminView): void {
    this.dialog.open(DocumentoViewerDialogComponent, {
      width: '90vw',
      height: '90vh',
      maxWidth: '1400px',
      maxHeight: '900px',
      data: { documento }
    });
  }

  aprobarDocumento(documento: DocumentoAdminView): void {
    if (!documento.id) {
      this.notificationService.error('Error: ID de documento no válido');
      return;
    }

    // En una implementación real, llamaríamos al servicio para aprobar el documento
    this.adminDocumentosService.aprobarDocumento(documento.id).subscribe({
      next: (_documentoActualizado) => {
        // Actualizar el documento en la lista
        const index = this.dataSource.data.findIndex(d => d.id === documento.id);
        if (index !== -1) {
          const documentosActualizados = [...this.dataSource.data];
          documentosActualizados[index] = {
            ...documentosActualizados[index],
            estado: EstadoDocumento.APROBADO,
            fechaValidacion: new Date(),
            validadoPor: 'admin' // En una implementación real, usar el ID del admin actual
          };
          this.dataSource.data = documentosActualizados;
        }

        // Actualizar estadísticas
        this.cargarEstadisticas();

        this.notificationService.success('Documento aprobado correctamente');
      },
      error: (error) => {
        console.error('Error al aprobar documento:', error);
        this.notificationService.error('Error al aprobar documento');

        // Para desarrollo, simulamos la aprobación
        const index = this.documentos.findIndex(d => d.id === documento.id);
        if (index !== -1) {
          this.documentos[index].estado = EstadoDocumento.APROBADO;
          this.documentos[index].fechaValidacion = new Date();
          this.documentos[index].validadoPor = 'admin';
          this.dataSource.data = [...this.documentos];
          this.calcularEstadisticasLocales();
          this.notificationService.success('Documento aprobado correctamente (simulado)');
        }
      }
    });
  }

  rechazarDocumento(documento: DocumentoAdminView): void {
    if (!documento.id) {
      this.notificationService.error('Error: ID de documento no válido');
      return;
    }

    // Abrir diálogo para ingresar motivo de rechazo
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (motivo) {
      // En una implementación real, llamaríamos al servicio para rechazar el documento
      this.adminDocumentosService.rechazarDocumento(documento.id, motivo).subscribe({
        next: (_documentoActualizado) => {
          // Actualizar el documento en la lista
          const index = this.dataSource.data.findIndex(d => d.id === documento.id);
          if (index !== -1) {
            const documentosActualizados = [...this.dataSource.data];
            documentosActualizados[index] = {
              ...documentosActualizados[index],
              estado: EstadoDocumento.RECHAZADO,
              fechaValidacion: new Date(),
              validadoPor: 'admin', // En una implementación real, usar el ID del admin actual
              motivoRechazo: motivo
            };
            this.dataSource.data = documentosActualizados;
          }

          // Actualizar estadísticas
          this.cargarEstadisticas();

          this.notificationService.success('Documento rechazado correctamente');
        },
        error: (error) => {
          console.error('Error al rechazar documento:', error);
          this.notificationService.error('Error al rechazar documento');

          // Para desarrollo, simulamos el rechazo
          const index = this.documentos.findIndex(d => d.id === documento.id);
          if (index !== -1) {
            this.documentos[index].estado = EstadoDocumento.RECHAZADO;
            this.documentos[index].fechaValidacion = new Date();
            this.documentos[index].validadoPor = 'admin';
            this.documentos[index].motivoRechazo = motivo;
            this.dataSource.data = [...this.documentos];
            this.calcularEstadisticasLocales();
            this.notificationService.success('Documento rechazado correctamente (simulado)');
          }
        }
      });
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'estado-pendiente';
      case 'aprobado': return 'estado-aprobado';
      case 'rechazado': return 'estado-rechazado';
      default: return '';
    }
  }
}
