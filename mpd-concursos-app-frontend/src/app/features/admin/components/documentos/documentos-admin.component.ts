import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Componentes customizados (reemplazan Material UI)
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { UnifiedNotificationService } from '@shared/components/unified-notification/unified-notification.service';
import { TipoDocumento, EstadoDocumento } from  '../../../../core/models/documento.model';
import { DocumentosService } from '../../../../core/services/documentos/documentos.service';
import { AdminDocumentosService, DocumentoAdminView, EstadisticasDocumentos, DocumentoFiltros } from '../../../../core/services/admin/admin-documentos.service';
// import { DocumentoViewerDialogComponent } from './documento-viewer-dialog/documento-viewer-dialog.component';

// La interfaz DocumentoAdminView ahora se importa desde el servicio

@Component({
  selector: 'app-documentos-admin',
  templateUrl: './documentos-admin.component.html',
  styleUrls: ['./documentos-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Componentes customizados (reemplazan Material UI)
    CustomCardComponent,
    CustomButtonComponent
  ]
})
export class DocumentosAdminComponent implements OnInit, OnDestroy {
  // Exponer Math para el template
  Math = Math;

  // Datos de la tabla
  documentos: DocumentoAdminView[] = [];
  tiposDocumento: TipoDocumento[] = [];
  estadisticas: EstadisticasDocumentos = {
    totalDocumentos: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    porTipo: {}
  };

  // Filtros
  filtroEstado = '';
  filtroTipoDocumento = '';
  filtroTexto = '';

  // Estado de carga y paginación
  isLoading = false;
  totalDocuments = 0;
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Columnas de la tabla customizada
  columns = [
    { property: 'id', header: 'ID', sortable: true, width: '120px' },
    { property: 'nombreArchivo', header: 'Archivo', sortable: true },
    { property: 'tipoDocumento', header: 'Tipo', sortable: true, width: '150px' },
    { property: 'usuario', header: 'Usuario', sortable: true },
    { property: 'fechaCarga', header: 'Fecha Carga', sortable: true, width: '120px' },
    { property: 'estado', header: 'Estado', sortable: true, width: '120px' },
    { property: 'acciones', header: 'Acciones', width: '150px' }
  ];

  constructor(
    private documentosService: DocumentosService,
    private adminDocumentosService: AdminDocumentosService,
    private notificationService: UnifiedNotificationService,
    private customDialogService: CustomDialogService
  ) {}

  ngOnInit(): void {
    console.log('DocumentosAdminComponent: Iniciando componente...');

    // Cargar datos mock temporalmente para debugging
    this.cargarDatosMock();

    // TODO: Reactivar cuando se resuelva el problema
    // this.cargarTiposDocumento();
    // this.cargarEstadisticas();
    // this.cargarDocumentos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatosMock(): void {
    console.log('DocumentosAdminComponent: Cargando datos mock...');

    // Mock de tipos de documento
    this.tiposDocumento = [
      { id: '1', code: 'DNI', nombre: 'DNI', requerido: true },
      { id: '2', code: 'TITULO', nombre: 'Título Universitario', requerido: true },
      { id: '3', code: 'ANTECEDENTES', nombre: 'Certificado de Antecedentes', requerido: true }
    ];

    // Mock de estadísticas
    this.estadisticas = {
      totalDocumentos: 25,
      pendientes: 10,
      aprobados: 12,
      rechazados: 3,
      porTipo: {
        'DNI': 8,
        'TITULO': 9,
        'ANTECEDENTES': 8
      }
    };

    // Mock de documentos
    this.documentos = [
      {
        id: '1',
        tipoDocumentoId: '1',
        tipoDocumento: { id: '1', code: 'DNI', nombre: 'DNI', requerido: true },
        nombreArchivo: 'dni_usuario1.pdf',
        fechaCarga: new Date(),
        estado: 'PENDING' as any,
        nombreUsuario: 'Juan Pérez',
        emailUsuario: 'juan.perez@email.com',
        dniUsuario: '12345678'
      },
      {
        id: '2',
        tipoDocumentoId: '2',
        tipoDocumento: { id: '2', code: 'TITULO', nombre: 'Título Universitario', requerido: true },
        nombreArchivo: 'titulo_usuario2.pdf',
        fechaCarga: new Date(),
        estado: 'APPROVED' as any,
        nombreUsuario: 'María García',
        emailUsuario: 'maria.garcia@email.com',
        dniUsuario: '87654321'
      }
    ];

    this.totalDocuments = this.documentos.length;
    this.isLoading = false;

    console.log('DocumentosAdminComponent: Datos mock cargados exitosamente');
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
    this.adminDocumentosService.getEstadisticas().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.notificationService.error('Error al cargar estadísticas');

        // Estadísticas por defecto en caso de error
        this.estadisticas = {
          totalDocumentos: 0,
          pendientes: 0,
          aprobados: 0,
          rechazados: 0,
          porTipo: {}
        };
      }
    });
  }

  cargarDocumentos(filtros?: DocumentoFiltros): void {
    this.isLoading = true;

    const filtrosConPaginacion = {
      ...filtros,
      page: this.currentPage,
      size: this.pageSize,
      sort: 'fechaCarga',
      direction: 'desc' as 'desc'
    };

    this.adminDocumentosService.getDocumentos(filtrosConPaginacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.documentos = response.documentos;
          this.totalDocuments = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar documentos:', error);
          this.notificationService.error('Error al cargar documentos');
          this.documentos = [];
          this.totalDocuments = 0;
          this.isLoading = false;
        }
      });
  }

  // Método para manejar filtros de texto
  onFilterTextChange(value: string): void {
    this.filtroTexto = value;
    this.currentPage = 0; // Resetear a la primera página
    this.aplicarFiltros();
  }

  // Método para manejar cambios de página
  onPageChange(event: { pageIndex: number, pageSize: number }): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.aplicarFiltros();
  }

  // Método para manejar cambios de ordenamiento
  onSortChange(event: any): void {
    // Implementar lógica de ordenamiento si es necesario
    this.aplicarFiltros();
  }

  filtrarPorEstado(estado: string): void {
    // Mapear estados del español al inglés para el backend
    const estadoMapeado = this.mapearEstado(estado);
    this.filtroEstado = estadoMapeado;
    this.aplicarFiltros();
  }

  private mapearEstado(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'PENDING';
      case 'aprobado':
        return 'APPROVED';
      case 'rechazado':
        return 'REJECTED';
      default:
        return estado;
    }
  }

  filtrarPorTipoDocumento(tipoId: string): void {
    this.filtroTipoDocumento = tipoId;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    const filtros: DocumentoFiltros = {
      estado: this.filtroEstado || undefined,
      tipoDocumentoId: this.filtroTipoDocumento || undefined
    };

    this.cargarDocumentos(filtros);
  }

  verDocumento(documento: DocumentoAdminView): void {
    // TODO: Implementar visor de documentos
    console.log('Ver documento:', documento);
    this.notificationService.info('Funcionalidad de visor en desarrollo');

    // Usar el servicio de diálogo customizado
    // this.customDialogService.open(DocumentoViewerDialogComponent, {
    //   size: 'large',
    //   data: { documento }
    // });
  }

  aprobarDocumento(documento: DocumentoAdminView): void {
    if (!documento.id) {
      this.notificationService.error('Error: ID de documento no válido');
      return;
    }

    this.adminDocumentosService.aprobarDocumento(documento.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (_documentoActualizado) => {
          this.notificationService.success('Documento aprobado correctamente');

          // Recargar documentos y estadísticas
          this.cargarDocumentos();
          this.cargarEstadisticas();
        },
        error: (error) => {
          console.error('Error al aprobar documento:', error);
          this.notificationService.error('Error al aprobar documento');
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
    if (motivo && motivo.trim()) {
      this.adminDocumentosService.rechazarDocumento(documento.id, motivo.trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (_documentoActualizado) => {
            this.notificationService.success('Documento rechazado correctamente');

            // Recargar documentos y estadísticas
            this.cargarDocumentos();
            this.cargarEstadisticas();
          },
          error: (error) => {
            console.error('Error al rechazar documento:', error);
            this.notificationService.error('Error al rechazar documento');
          }
        });
    }
  }

  // Método para obtener acciones de la tabla
  getRowActions(documento: DocumentoAdminView): any[] {
    const actions = [
      {
        icon: 'eye',
        label: 'Ver documento',
        color: 'primary',
        action: 'view',
        tooltip: 'Ver documento'
      }
    ];

    // Agregar acciones según el estado
    const estadoStr = documento?.estado?.toString() || '';
    if (estadoStr === 'PENDING' || estadoStr === 'Pending' || estadoStr === 'pendiente') {
      actions.push(
        {
          icon: 'check-circle',
          label: 'Aprobar',
          color: 'success',
          action: 'approve',
          tooltip: 'Aprobar documento'
        },
        {
          icon: 'times',
          label: 'Rechazar',
          color: 'danger',
          action: 'reject',
          tooltip: 'Rechazar documento'
        }
      );
    }

    if (estadoStr === 'REJECTED' || estadoStr === 'Rejected' || estadoStr === 'rechazado') {
      actions.push({
        icon: 'info-circle',
        label: 'Ver motivo',
        color: 'warning',
        action: 'info',
        tooltip: 'Ver motivo de rechazo'
      });
    }

    return actions;
  }

  // Método para manejar acciones de la tabla
  onTableAction(action: string, documento: DocumentoAdminView): void {
    switch (action) {
      case 'view':
        this.verDocumento(documento);
        break;
      case 'approve':
        this.aprobarDocumento(documento);
        break;
      case 'reject':
        this.rechazarDocumento(documento);
        break;
      case 'info':
        // Implementar lógica para mostrar motivo de rechazo
        break;
    }
  }

  getEstadoClass(estado: string | EstadoDocumento | undefined): string {
    const estadoStr = estado?.toString()?.toLowerCase() || '';
    switch (estadoStr) {
      case 'pending':
      case 'pendiente':
        return 'estado-pendiente';
      case 'approved':
      case 'aprobado':
        return 'estado-aprobado';
      case 'rejected':
      case 'rechazado':
        return 'estado-rechazado';
      default:
        return 'estado-desconocido';
    }
  }
}
