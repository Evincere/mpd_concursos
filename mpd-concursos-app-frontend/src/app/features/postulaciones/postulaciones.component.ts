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
import { PostulacionDetalleComponent } from './postulacion-detalle/postulacion-detalle.component';
import { ContestStatus, PostulationStatus, Postulacion } from '@shared/interfaces/postulacion/postulacion.interface';
import { HttpErrorResponse } from '@angular/common/http';

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
  pageSize = 10;
  pageIndex = 0;

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
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error al cargar postulaciones:', error);
        this.snackBar.open('Error al cargar las postulaciones', 'Cerrar', {
          duration: 3000
        });
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

  getEstadoConcursoLabel(status: ContestStatus): string {
    const labels: Record<ContestStatus, string> = {
      OPEN: 'Abierto',
      CLOSED: 'Cerrado',
      IN_PROCESS: 'En Proceso',
      FAILED: 'Fallido',
      FINISHED: 'Finalizado'
    };
    return labels[status] || 'Desconocido';
  }

  getEstadoPostulacionLabel(status: PostulationStatus): string {
    const labels: Record<PostulationStatus, string> = {
      PENDING: 'Pendiente',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada'
    };
    return labels[status] || 'Desconocido';
  }

  getEstadoConcursoClass(status: ContestStatus): string {
    const classes: Record<ContestStatus, string> = {
      OPEN: 'estado-abierto',
      CLOSED: 'estado-cerrado',
      IN_PROCESS: 'estado-en-proceso',
      FAILED: 'estado-fallido',
      FINISHED: 'estado-finalizado'
    };
    return classes[status] || '';
  }

  getEstadoPostulacionClass(status: PostulationStatus): string {
    const classes: Record<PostulationStatus, string> = {
      PENDING: 'estado-pendiente',
      ACCEPTED: 'estado-aceptado',
      REJECTED: 'estado-rechazado'
    };
    return classes[status] || '';
  }
}
