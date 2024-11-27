import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { PostulacionesService } from '../../core/services/postulaciones/postulaciones.service';
import { Postulacion } from '../../shared/interfaces/postulacion/postulacion.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorIntlEs } from '../../shared/providers/paginator-es.provider';

@Component({
  selector: 'app-postulaciones',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    RouterLink,
    MatBadgeModule,
    MatProgressSpinnerModule, 
    MatSnackBarModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlEs }
  ],
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss']
})
export class PostulacionesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  dataSource!: MatTableDataSource<Postulacion>;
  displayedColumns: string[] = ['concurso', 'cargo', 'dependencia', 'fechaPostulacion', 'estado', 'acciones'];
  totalElements: number = 0;
  pageSize: number = 10;
  pageIndex: number = 0;
  isLoading = false;
  error: string | null = null;

  constructor(
    private postulacionesService: PostulacionesService,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Postulacion>([]);
  }

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  cargarPostulaciones(event?: PageEvent): void {
    if (event) {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
    }

    this.isLoading = true;
    this.error = null;

    this.postulacionesService.getPostulaciones(this.pageIndex, this.pageSize)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.content;
          this.totalElements = response.totalElements;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar postulaciones:', error);
          this.isLoading = false;
          this.error = error.message;
          
          if (error.status === 401) {
            // Redirigir al login si el token expiró
            // this.router.navigate(['/login']);
          }
          
          this.snackBar.open(error.message, 'Cerrar', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  verDetalle(id: number): void {
    console.log('Ver detalle de postulación:', id);
  }
}
