import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PostulacionesService } from '@core/services/postulaciones/postulaciones.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { PostulacionDetalleComponent } from './postulacion-detalle/postulacion-detalle.component';
import { ContestStatus, PostulationStatus, Postulacion } from '@shared/interfaces/postulacion/postulacion.interface';
import { LoaderComponent } from '@shared/components/loader/loader.component';

@Component({
  selector: 'app-postulaciones',
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    SearchHeaderComponent,
    LoaderComponent,
    PostulacionDetalleComponent
  ]
})
export class PostulacionesComponent implements OnInit {
  displayedColumns: string[] = [
    'concurso',
    'cargo',
    'estado_concurso',
    'fecha_inscripcion',
    'estado_postulacion',
    'documentos',
    'acciones'
  ];
  dataSource: MatTableDataSource<Postulacion>;
  searchForm: FormGroup;
  postulaciones: Postulacion[] = [];
  loading = false;
  error: HttpErrorResponse | null = null;
  pageSize = 10;
  pageIndex = 0;
  postulacionSeleccionada: any = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private postulacionService: PostulacionesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Postulacion>([]);
    this.searchForm = this.fb.group({
      termino: ['']
    });
  }

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarPostulaciones(): void {
    this.loading = true;
    this.postulacionService.getPostulaciones(this.pageIndex, this.pageSize).subscribe({
      next: (response) => {
        this.postulaciones = response.content;
        this.dataSource.data = response.content;
        console.log('Postulaciones cargadas:', this.postulaciones);
        
        // Nuevo log para ver los estados específicamente
        this.postulaciones.forEach((postulacion, index) => {
          console.log(`Postulacion ${index}:`, {
            estado: postulacion.estado, 
            concursoEstado: postulacion.concurso?.estado
          });
        });
        
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar las postulaciones:', error);
        this.snackBar.open('Error al cargar las postulaciones', 'Cerrar', {
          duration: 3000
        });
        this.error = error;
        this.loading = false;
      }
    });
  }

  onSearch(termino: string): void {
    // Implementar lógica de búsqueda
    console.log('Buscando:', termino);
  }

  onFilter(): void {
    // Implementar lógica de filtrado
    console.log('Abriendo filtros');
  }

  limpiarBusqueda(): void {
    this.searchForm.get('termino')?.reset();
    this.cargarPostulaciones();
  }

  getEstadoConcursoLabel(estado?: string | ContestStatus): string {
    if (!estado) return 'Desconocido';

    const labels: Record<string, string> = {
      'OPEN': 'Abierto',
      'CLOSED': 'Cerrado',
      'IN_PROCESS': 'En Proceso',
      'FAILED': 'Fallido',
      'FINISHED': 'Finalizado',
      'DRAFT': 'Borrador',
      'PUBLISHED': 'Publicado',
      'CANCELLED': 'Cancelado'
    };
    return labels[estado] || 'Desconocido';
  }

  getEstadoPostulacionLabel(estado?: PostulationStatus): string {
    if (!estado) return 'Desconocido';

    const labels: Record<PostulationStatus, string> = {
      PENDING: 'Pendiente',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
      CANCELLED: 'Cancelada'
    };
    return labels[estado] || 'Desconocido';
  }

  getEstadoConcursoClass(estado: ContestStatus): string {
    const classes: Record<ContestStatus, string> = {
      OPEN: 'estado-abierto',
      CLOSED: 'estado-cerrado',
      IN_PROCESS: 'estado-en-proceso',
      FAILED: 'estado-fallido',
      FINISHED: 'estado-finalizado'
    };
    return classes[estado] || '';
  }

  getEstadoPostulacionClass(estado: PostulationStatus): string {
    const classes: Record<PostulationStatus, string> = {
      PENDING: 'estado-pendiente',
      ACCEPTED: 'estado-aceptado',
      REJECTED: 'estado-rechazado',
      CANCELLED: 'estado-cancelado'
    };
    return classes[estado] || '';
  }

  verDetalle(postulacion: any, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.postulacionSeleccionada = postulacion;
  }

  cerrarDetalle() {
    this.postulacionSeleccionada = null;
  }

  retryLoad() {
    this.error = null;
    this.loading = true;
    this.cargarPostulaciones();
  }
}
